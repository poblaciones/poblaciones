<?php

namespace helena\services\admin;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\PublicException;
use minga\framework\Context;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\services\backoffice\publish\PublishSnapshots;
use helena\services\backoffice\publish\PublishDataTables;

class WorkService extends BaseService
{
	public function UpdateWorkIndexing($workId, $value)
	{
		Profiling::BeginTimer();
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsIndexed($value);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($work)
		{
			// Esto sólo es necesario si está publicada
			if ($value && $work->getAccessLink()) {
				throw new PublicException("No se puede indexar una cartografía con visibilidad por enlace.");
			}
			if ($work !== null) {
				$work->setIsIndexed($value);
				App::Orm()->save($work);
			}
		}
		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkVisibility($workId);
		Profiling::EndTimer();
		return self::OK;
	}

	// ---------------------------------------------------------------------------
	// Métodos públicos
	// ---------------------------------------------------------------------------

	public function UpdateWorkSpaceUsage()
	{
		Profiling::BeginTimer();
		App::Db()->exec("TRUNCATE TABLE work_space_usage");
		$this->EnsureTableMetadataCache();
		$this->RecalculateUsage(null, null);
		App::Db()->markTableUpdate('work_space_usage');
		Profiling::EndTimer();
		return self::OK;
	}

	public function UpdateWorkSpaceUsageByWork(int $workId)
	{
		Profiling::BeginTimer();
		$this->EnsureTableMetadataCache();
		$this->RecalculateUsage($workId, null);
		App::Db()->markTableUpdate('work_space_usage');
		Profiling::EndTimer();
		return self::OK;
	}

	public function UpdateWorkSpaceUsageByUser(int $userId)
	{
		Profiling::BeginTimer();
		$this->EnsureTableMetadataCache();
		$this->RecalculateUsage(null, $userId);
		App::Db()->markTableUpdate('work_space_usage');
		Profiling::EndTimer();
		return self::OK;
	}

	public function GetUserTotalUsageBytes(int $userId): int
	{
		$wduFilter = $this->BuildWduFilter(null, $userId);
		$sql = "
        SELECT IFNULL(SUM(
            wdu_draft_attachment_bytes + wdu_draft_data_bytes  + wdu_draft_index_bytes +
            wdu_attachment_bytes       + wdu_data_bytes        + wdu_index_bytes
        ), 0)
        FROM work_space_usage
        WHERE $wduFilter
    ";
		return (int) App::Db()->fetchScalar($sql);
	}

	/**
	 * Crea la tabla temporal con los metadatos de tamaño de tablas de la base de datos.
	 * Usa IF NOT EXISTS para que sea reutilizable dentro de la misma sesión.
	 */
	private function EnsureTableMetadataCache(): void
	{
		$dbName = Context::Settings()->Db()->Name;
		App::Db()->exec(
			"CREATE TEMPORARY TABLE IF NOT EXISTS table_metadata (INDEX(table_name)) AS (
            SELECT data_length,
                   index_length,
                   table_name COLLATE utf8_unicode_ci AS table_name
            FROM   information_schema.TABLES
            WHERE  table_schema = '" . $dbName . "'
        )"
		);
	}

	/**
	 * Recalcula work_space_usage para el subconjunto de works indicado.
	 * Si ambos parámetros son null, opera sobre todos los works (modo full).
	 */
	private function RecalculateUsage(?int $workId, ?int $userId): void
	{
		$workFilter = $this->BuildWorkFilter($workId, $userId);
		$wduFilter = $this->BuildWduFilter($workId, $userId);

		// En modo parcial se eliminan las filas existentes antes de reinsertarlas.
		if ($workId !== null || $userId !== null) {
			App::Db()->exec("DELETE FROM work_space_usage WHERE $wduFilter");
		}

		// INSERT: bytes de adjuntos (borrador y publicados). Data/index quedan en 0
		// y se completan en los UPDATE siguientes.
		App::Db()->exec("
        INSERT INTO work_space_usage (
            wdu_work_id,
            wdu_draft_attachment_bytes, wdu_draft_data_bytes, wdu_draft_index_bytes,
            wdu_attachment_bytes,       wdu_data_bytes,       wdu_index_bytes
        )
        SELECT
            wrk_id,
            IFNULL((
                SELECT SUM(fil_size)
                FROM   draft_metadata
                JOIN   draft_metadata_file ON mfi_metadata_id = met_id
                JOIN   draft_file          ON fil_id = mfi_file_id
                WHERE  wrk_metadata_id = met_id
            ), 0),
            0, 0,
            IFNULL((
                SELECT SUM(fil_size)
                FROM   metadata
                JOIN   metadata_file ON mfi_metadata_id = met_id
                JOIN   file          ON fil_id = mfi_file_id
                WHERE  wrk_metadata_id = FLOOR(met_id / 100)
            ), 0),
            0, 0
        FROM draft_work
        WHERE $workFilter
    ");

		// UPDATE: bytes de tablas de datasets en borrador.
		// table_metadata se lee una sola vez en la subquery agregada para evitar
		// el error de MySQL "Can't reopen table" con tablas temporales.
		App::Db()->exec("
        UPDATE work_space_usage
        LEFT JOIN (
            SELECT dat_work_id,
                   SUM(data_length)  AS total_data,
                   SUM(index_length) AS total_index
            FROM   table_metadata
            JOIN   draft_dataset ON dat_table = table_name
            GROUP  BY dat_work_id
        ) AS agg ON agg.dat_work_id = wdu_work_id
        SET
            wdu_draft_data_bytes  = IFNULL(agg.total_data,  0),
            wdu_draft_index_bytes = IFNULL(agg.total_index, 0)
        WHERE $wduFilter
    ");

		// UPDATE: bytes de tablas de datasets publicados (incluyendo snapshots).
		App::Db()->exec("
        UPDATE work_space_usage
        LEFT JOIN (
            SELECT FLOOR(dat_work_id / 100) AS work_id,
                   SUM(data_length)         AS total_data,
                   SUM(index_length)        AS total_index
            FROM   table_metadata
            JOIN   dataset ON dat_table = table_name
                           OR CONCAT(dat_table, '_snapshot') = table_name
            GROUP  BY FLOOR(dat_work_id / 100)
        ) AS agg ON agg.work_id = wdu_work_id
        SET
            wdu_data_bytes  = IFNULL(agg.total_data,  0),
            wdu_index_bytes = IFNULL(agg.total_index, 0)
        WHERE $wduFilter
    ");
	}


	/**
	 * Genera la cláusula WHERE para filtrar filas de draft_work en el INSERT.
	 */
	private function BuildWorkFilter(?int $workId, ?int $userId): string
	{
		if ($workId !== null) {
			return "wrk_id = " . intval($workId);
		}
		if ($userId !== null) {
			return "EXISTS (
            SELECT 1 FROM draft_work_permission
            WHERE  wkp_work_id = wrk_id
            AND    wkp_user_id = " . intval($userId) . "
        )";
		}
		return "TRUE";
	}

	/**
	 * Genera la cláusula WHERE para filtrar filas de work_space_usage en DELETE y UPDATE.
	 */
	private function BuildWduFilter(?int $workId, ?int $userId): string
	{
		if ($workId !== null) {
			return "wdu_work_id = " . intval($workId);
		}
		if ($userId !== null) {
			return "wdu_work_id IN (
				SELECT wkp_work_id FROM draft_work_permission
				WHERE  wkp_user_id = " . intval($userId) . "
			)";
		}
		return "TRUE";
	}


	public function UpdateWorkSegmentedCrawling($workId, $value)
	{
		Profiling::BeginTimer();
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setSegmentedCrawling($value);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($value && $work->getAccessLink()) {
			throw new PublicException("No se puede indexar una cartografía con visibilidad por enlace.");
		}
		if ($work !== null) {
			$work->setSegmentedCrawling($value);
			App::Orm()->save($work);
		}
		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkSegmentedCrawling($workId);
		Profiling::EndTimer();
		return self::OK;
	}


	public function GetWorksByType($filter, $timeFilterDays = 0)
	{
		if ($filter)
			$condition = " wrk_type = '" . substr($filter, 0, 1) . "' ";
		else
			$condition = " 1=1 ";
		if ($timeFilterDays > 0)
			$condition .= ' AND met_create >= ( CURDATE() - INTERVAL ' . $timeFilterDays. ' DAY ) ';
		// Trae las cartografías
		$list = $this->GetWorks($condition);
		return $list;
	}

	private function GetWorks($condition)
	{
		Profiling::BeginTimer();

		$sql = "SELECT wrk_id Id,
								met_title Caption,
								met_last_online MetadataLastOnline,
								(wrk_metadata_changed OR wrk_dataset_labels_changed OR
								wrk_dataset_data_changed OR wrk_metric_labels_changed OR
								wrk_metric_data_changed) HasChanges
								, wrk_is_private IsPrivate
								, wrk_is_indexed IsIndexed
								, wrk_segmented_crawling SegmentedCrawling
								, wrk_type Type
								, (SELECT GROUP_CONCAT(dat_caption ORDER BY dat_caption SEPARATOR '\n') FROM draft_dataset WHERE dat_work_id = wrk_id) DatasetNames
								, IFNULL(wdu_draft_attachment_bytes, 0) DraftAttachmentBytes
								, IFNULL(wdu_draft_data_bytes, 0) DraftDataBytes
								, IFNULL(wdu_draft_index_bytes, 0) DraftIndexBytes
								, IFNULL(wdu_attachment_bytes, 0) AttachmentBytes
								, IFNULL(wdu_data_bytes, 0) DataBytes
								, IFNULL(wdu_index_bytes, 0) IndexBytes

								, (SELECT COUNT(*) FROM draft_dataset d1 WHERE d1.dat_work_id = wrk_id) DatasetCount
								, (SELECT COUNT(*) FROM draft_dataset d2 WHERE d2.dat_work_id = wrk_id AND dat_geocoded = 1) GeorreferencedCount
								, (SELECT COUNT(*) FROM draft_metric_version_level mvl
																				JOIN draft_dataset d2 ON mvl.mvl_dataset_id = d2.dat_id
																					WHERE d2.dat_work_id = wrk_id) MetricCount
									FROM draft_work
									LEFT JOIN draft_metadata ON wrk_metadata_id = met_id
									LEFT JOIN work_space_usage ON wdu_work_id = wrk_id
								WHERE " . $condition .
						" ORDER BY met_title";
			$ret = App::Db()->fetchAll($sql);
			Arr::IntToBoolean($ret, array('IsPrivate', 'IsIndexed', 'SegmentedCrawling'));
			foreach($ret as &$value)
				$value['TotalSizeBytes'] = $value['DraftAttachmentBytes'] + $value['DraftDataBytes'] +
								$value['DraftIndexBytes'] + $value['AttachmentBytes'] +
								$value['DataBytes'] + $value['IndexBytes'];
			Profiling::EndTimer();
			return $ret;
	}
}

