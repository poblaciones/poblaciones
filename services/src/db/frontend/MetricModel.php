<?php

namespace helena\db\frontend;

use minga\framework\Str;
use minga\framework\Profiling;
use helena\db\frontend\GeographyItemModel;
use helena\classes\App;


class MetricModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'metric';
		$this->idField = 'mtr_id';
		$this->captionField = 'mtr_caption';

	}

	public function GetMetrics($regionId)
	{
		Profiling::BeginTimer();
		$params = array();

		$params[] = (int)$regionId;

		$sql = "SELECT mtr_id AS id,
			mtr_caption AS name,
			GROUP_CONCAT(geo_caption SEPARATOR ', ') AS level,
			GROUP_CONCAT(mvr_caption SEPARATOR ', ') AS year
			FROM metric_version
			JOIN metric ON mtr_id = mvr_metric_id
			JOIN metric_version_level ON mvr_id = mvl_metric_version_id
			JOIN dataset ON mvl_dataset_id = dat_id
			JOIN geography ON geo_id = dat_geography_id
			WHERE EXISTS(
				SELECT 1 FROM snapshot_metric_version_item
				JOIN snapshot_clipping_region_item_geography_item
				ON cgv_geography_item_id = lvi_geography_item_id
				AND cgv_clipping_region_item_id = ?
			)
			GROUP BY mtr_caption, mtr_id, cli_caption";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

}


