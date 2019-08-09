<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use minga\framework\Context;
use helena\classes\Account;
use helena\classes\App;

class SnapshotMetricModel
{
	public function RegenMetric($metricId)
	{
		$metricIdShardified = PublishDataTables::Shardified($metricId);

	 	Profiling::BeginTimer();

		$sql = "INSERT INTO snapshot_metric (myv_metric_id, myv_caption, myv_work_ids,
						myv_work_captions, myv_version_ids, myv_version_captions, myv_version_partial_coverages, myv_version_levels,
						myv_variable_captions, myv_variable_value_captions,
						myv_metric_group_id, myv_has_public_data)

						SELECT mtr_id, mtr_caption, GROUP_CONCAT(mvw_work_id ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvw_work_caption ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvr_id ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvw_caption ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(IFNULL(mvw_partial_coverage, '') ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvw_level ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvw_variable_captions ORDER BY mvr_id SEPARATOR '\t'),
							GROUP_CONCAT(mvw_variable_value_captions ORDER BY mvr_id SEPARATOR '\t'),
							mtr_metric_group_id,
							SUM(case when mvw_work_type = 'P' then 1 else 0 end) > 0
						FROM metric_version
						JOIN metric ON mtr_id = mvr_metric_id
						JOIN snapshot_metric_versions ON  mvr_id = mvw_metric_version_id
						WHERE mtr_id = ?
						group by mtr_id";

		App::Db()->exec($sql, array($metricIdShardified));

		Profiling::EndTimer();

	}
	public function ClearMetric($metricId)
	{
		$metricIdShardified = PublishDataTables::Shardified($metricId);

	 	Profiling::BeginTimer();

		$sql = "DELETE FROM snapshot_metric WHERE myv_metric_id = ?";

		App::Db()->exec($sql, array($metricIdShardified));

		Profiling::EndTimer();
	}
}
