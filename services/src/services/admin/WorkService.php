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
	public function UpdateWorkSpaceUsage()
	{
		Profiling::BeginTimer();
		$truncate = "TRUNCATE TABLE work_space_usage";
		App::Db()->exec($truncate);
		$dbName = Context::Settings()->Db()->Name;
		$sql = "INSERT INTO work_space_usage (wdu_work_id,  wdu_draft_attachment_bytes, wdu_draft_data_bytes, wdu_draft_index_bytes, wdu_attachment_bytes, wdu_data_bytes, wdu_index_bytes)
							SELECT wrk_id,
							IFNULL((select sum(fil_size) from draft_metadata
							join draft_metadata_file
							on mfi_metadata_id = met_id
							join draft_file on fil_id = mfi_file_id
							where wrk_metadata_id = met_id), 0) as DraftAttachmentsBytes,
							IFNULL((SELECT SUM(data_length) FROM
								information_schema.TABLES
								JOIN draft_dataset ON dat_table COLLATE utf8_general_ci = table_name
								WHERE table_schema = '" . $dbName . "' AND dat_work_id = wrk_id
							), 0) as DraftTablesSize,
							IFNULL((SELECT SUM(index_length) FROM
								information_schema.TABLES
								JOIN draft_dataset ON dat_table COLLATE utf8_general_ci = table_name
								WHERE table_schema = '" . $dbName . "' AND dat_work_id = wrk_id
							), 0) as DraftIndexesSize,
							IFNULL((select sum(fil_size) from metadata
							join metadata_file
							on mfi_metadata_id = met_id
							join file on fil_id = mfi_file_id
							where wrk_metadata_id = FLOOR(met_id / 100)), 0) as PublicAttachmentBytes,
							IFNULL((SELECT SUM(data_length) FROM
								information_schema.TABLES
								JOIN dataset ON (dat_table COLLATE utf8_general_ci = table_name OR CONCAT(dat_table COLLATE utf8_general_ci, '_snapshot') = table_name )
								WHERE table_schema = '" . $dbName . "' AND FLOOR(dat_work_id/100) =  wrk_id
							), 0) as PublicTablesSize,
							IFNULL((SELECT SUM(index_length) FROM
								information_schema.TABLES
								JOIN dataset ON (dat_table COLLATE utf8_general_ci = table_name OR CONCAT(dat_table COLLATE utf8_general_ci, '_snapshot') = table_name )
								WHERE table_schema = '" . $dbName . "' AND FLOOR(dat_work_id/100) =  wrk_id
							), 0) as PublicIndexesSize
							FROM draft_work";
		App::Db()->exec($sql);
		Profiling::EndTimer();
		return self::OK;
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
		$condition = "wrk_type = '" . substr($filter, 0, 1) . "' ";
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

