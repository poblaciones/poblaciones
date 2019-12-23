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


	public function GetVersionLevelsExtraInfo($versionId)
	{
		Profiling::BeginTimer();
		$params = array($versionId);

		$sql = 'SELECT	mvl_id,
										mvl_partial_coverage,
										geography.*,
										dat_id,
										dat_type,
										dat_caption,
										dat_caption_column_id,
										dat_symbol,
										dat_show_info,
										carto_meta.met_wiki
						FROM metric_version_level
										JOIN dataset ON mvl_dataset_id = dat_id
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


