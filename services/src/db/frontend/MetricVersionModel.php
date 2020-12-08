<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use minga\framework\Str;
use helena\classes\App;

class MetricVersionModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'metric_version';
		$this->idField = 'mvr_id';
		$this->captionField = 'mvr_caption';
	}

	public function GetMetricByDatasetId($datasetId)
	{
		Profiling::BeginTimer();
		$params = array($datasetId);

		$sql = 'SELECT mvr_metric_id
						FROM metric_version_level
						INNER JOIN metric_version ON mvl_metric_version_id = mvr_id
						WHERE mvl_dataset_id = ? LIMIT 1';
		$ret = App::Db()->fetchScalarInt($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetVersionLevelsExtraInfo($versionId)
	{
		Profiling::BeginTimer();
		$params = array($versionId);

		$sql = 'SELECT	mvl_id,
										mvl_partial_coverage,
										ST_AsText(mvl_extents) mvl_extents,
										geography.*,
										dataset_marker.*,
										dat_id,
										dat_type,
										dat_caption,
										dat_caption_column_id,
										dat_table,
										dat_show_info,
										dat_texture_id,
										carto_meta.met_wiki
						FROM metric_version_level
										JOIN dataset ON mvl_dataset_id = dat_id
										JOIN dataset_marker ON dat_marker_id = dmk_id
										JOIN work ON wrk_id = dat_work_id
										JOIN metadata work_meta ON wrk_metadata_id = work_meta.met_id
										JOIN geography ON geo_id = dat_geography_id
										LEFT JOIN metadata carto_meta ON geo_metadata_id = carto_meta.met_id
										WHERE mvl_metric_version_id = ?
										ORDER BY geo_min_zoom';
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}


