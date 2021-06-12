<?php

namespace helena\db\backoffice;

use helena\classes\App;
use helena\classes\Account;
use helena\services\backoffice\publish\PublishDataTables;
use minga\framework\Date;
use minga\framework\Context;
use minga\framework\Profiling;
use helena\services\backoffice\publish\RevokeSnapshots;

class WorkModel extends BaseModel
{
	public static $posibleStatus = array('C' => 'Completo', 'P' => 'Parcial', 'B' => 'Borrador');

	public function __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('work', $fromDraft);
		$this->idField = 'wrk_id';
		$this->captionField = '';
		$this->fromDraft = $fromDraft;
	}

	public function GetDatasets($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT * FROM " . $this->resolveTableName('dataset') . "
							WHERE dat_work_id = ?";
		$ret = App::Db()->fetchAll($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}


	public function GetDataset($datasetId)
	{
		Profiling::BeginTimer();
		$params = array($datasetId);

		$sql = "SELECT d.*, geography.*,
							caption.dco_field AS dat_caption_field,
							longitude.dco_field AS dat_longitude_field,
							latitude.dco_field AS dat_latitude_field,
							longitudeSegment.dco_field AS dat_longitude_field_segment,
							latitudeSegment.dco_field AS dat_latitude_field_segment,
							marker.dco_field AS dmk_content_field,
							dmk_type,
							dmk_source
							FROM " . $this->resolveTableName('dataset') . " d
							LEFT JOIN dataset_column latitude ON latitude.dco_id = dat_latitude_column_id
							LEFT JOIN dataset_column longitude ON longitude.dco_id = dat_longitude_column_id
							LEFT JOIN dataset_column latitudeSegment ON latitudeSegment.dco_id = dat_latitude_column_segment_id
							LEFT JOIN dataset_column longitudeSegment ON longitudeSegment.dco_id = dat_longitude_column_segment_id
							LEFT JOIN dataset_column caption ON caption.dco_id = dat_caption_column_id
							JOIN dataset_marker ON dmk_id = dat_marker_id
							LEFT JOIN dataset_column marker ON marker.dco_id = dmk_content_column_id

						 LEFT JOIN geography ON geo_id = dat_geography_id
							WHERE dat_id = ?";
		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetWork($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT * FROM " . $this->resolveTableName('work')
							. " WHERE wrk_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetInstitutionsByWork($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId, $workId);

		$sql = "SELECT DISTINCT institution_id FROM (
						SELECT met_institution_id AS institution_id FROM " . $this->resolveTableName('work') . ", " . $this->resolveTableName('metadata')
							. " WHERE wrk_metadata_id = met_id AND wrk_id = ? AND met_institution_id IS NOT NULL
							UNION
						SELECT src_institution_id AS institution_id FROM " . $this->resolveTableName('work') .
							" JOIN " . $this->resolveTableName('metadata') . " ON wrk_metadata_id = met_id
							  JOIN " . $this->resolveTableName('metadata_source') . " ON msc_metadata_id = met_id
							  JOIN " . $this->resolveTableName('source') . " ON src_id = msc_source_id
							  WHERE wrk_id = ? AND src_institution_id IS NOT NULL) as Q";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorkAndMetadataIdsByInstitution($institutionId)
	{
		Profiling::BeginTimer();
		$params = array($institutionId, $institutionId);

		$sql = "SELECT wrk_id, met_id FROM " . $this->resolveTableName('work') . ", " . $this->resolveTableName('metadata')
							. " WHERE wrk_metadata_id = met_id AND met_institution_id = ?
							UNION
						SELECT DISTINCT wrk_id, met_id FROM " . $this->resolveTableName('work') .
							" JOIN " . $this->resolveTableName('metadata') . " ON wrk_metadata_id = met_id
							  JOIN " . $this->resolveTableName('metadata_source') . " ON msc_metadata_id = met_id
							  JOIN " . $this->resolveTableName('source') . " ON src_id = msc_source_id
							  WHERE src_institution_id = ?";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricVersions($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT metricVersion.*
							FROM " . $this->resolveTableName('metric_version') . " metricVersion
							WHERE mvr_work_id = ?";

		$ret = App::Db()->fetchAll($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function RevokeWork($workId)
	{
		// Pasos de revoke.
		echo '<br>Preparándose para purgar una obra missing...';
		echo '<br>STEP_DELETE_DEFINITIONS:';
					$publisher = new PublishDataTables();
					$publisher->DeleteWorkTables($workId, true);
		echo '<br>STEP_DELETE_DATASETS:';
					$publisher = new PublishDataTables();
					$publisher->DeleteDatasetsTables($workId);
		echo '<br>STEP_DELETE_SNAPSHOTS_DATASETS:';
					$manager = new RevokeSnapshots($workId);
					$manager->DeleteAllWorkDatasets();
		echo '<br>STEP_DELETE_SNAPSHOTS_METRICS:';
					$manager = new RevokeSnapshots($workId);
					$manager->DeleteAllWorkMetricVersions();
		echo '<br>done';
	}

	private function LoadStatus(&$ret)
	{
		if ($ret == null) return;
		$status = self::$posibleStatus;
		foreach($ret as &$item)
		{
			$item['status'] = '';
			foreach($status as $st => $val)
			{
				if ($item['met_status'] == $st)
					$item['status'] = $val;
			}
		}
	}
}
