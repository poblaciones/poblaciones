<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;

class SnapshotMetricModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = '';
		$this->idField = '';
		$this->captionField = '';
	}

	public function GetMetric($metricId)
	{
		Profiling::BeginTimer();
		$sql = $this->GetMetricViewQuery();
		$item = App::Db()->fetchAssoc($sql, array($metricId));
		Profiling::EndTimer();
		return $item;
	}

	private function GetMetricViewQuery($getAllPublicData = false)
	{
		if ($getAllPublicData)
		{
			$where = "WHERE mvw_work_is_indexed = 1 AND mvw_work_is_private = 0 ";
			$having = "HAVING SUM(case when mvw_work_type = 'P' then 1 else 0 end) > 0 ";
			$orderBy = "ORDER BY myv_metric_group_id, myv_metric_caption ";
		}
		else
		{
			$where = "WHERE mvw_metric_id = ? ";
			$having = "";
			$orderBy = "";
		}

		$sql = "SELECT	MIN(mvw_metric_caption) myv_metric_caption,
										MIN(mvw_metric_id) myv_metric_id,
										MIN(mvw_metric_group_id) myv_metric_group_id,
										GROUP_CONCAT(mvw_work_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_ids,
										GROUP_CONCAT(mvw_work_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_captions,
										GROUP_CONCAT(mvw_work_is_private ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_private,
										GROUP_CONCAT(mvw_work_is_indexed ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_indexed,
										GROUP_CONCAT(mvw_metric_version_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_ids,
										GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_captions,
										GROUP_CONCAT(IFNULL(mvw_partial_coverage, '') ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_partial_coverages
									FROM snapshot_metric_versions
									" . $where . "
									group by mvw_metric_id " .
									$having .
									$orderBy;
		return $sql;
	}

	public function GetFabMetricSnapshot()
	{
		Profiling::BeginTimer();

		$sql = $this->GetMetricViewQuery(true);
		$ret = App::Db()->fetchAll($sql);

		Profiling::EndTimer();
		return $ret;
	}



	public function Search($originalQuery)
	{
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		Profiling::BeginTimer();
		$sql = "SELECT mvw_metric_id id,
										mvw_metric_caption caption,
										GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') extra,
										'L' type,
										MAX(MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`,
										`mvw_variable_value_captions`, `mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (?)) relevance
										FROM snapshot_metric_versions
										WHERE MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`, `mvw_variable_value_captions`,
										`mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (? IN BOOLEAN MODE)
										AND mvw_work_is_indexed = 1 AND mvw_work_is_private = 0
										GROUP BY mvw_metric_id, mvw_metric_caption
										ORDER BY relevance DESC
										LIMIT 0, 10";
		$ret = App::Db()->fetchAll($sql, array($query, $query));
		Profiling::EndTimer();
		return $ret;
	}

	/*
	public function Search($originalQuery)
	{
	"SELECT myv_id, myv_metric_id, myv_caption, myv_work_ids, myv_work_captions, myv_has_public_data,
	myv_version_ids, myv_version_captions, myv_version_partial_coverages,
	myv_variable_captions, myv_metric_group_id
	FROM snapshot_metric JOIN metric_group ON myv_metric_group_id = lgr_id
	WHERE myv_has_public_data ORDER BY lgr_id, myv_caption";

	$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		Profiling::BeginTimer();
		 $sql = "SELECT myv_metric_id id,
			myv_caption caption,
			myv_version_captions extra,
			'L' type,
		 	MATCH (myv_caption, myv_version_captions, myv_variable_captions, myv_variable_value_captions,
			myv_work_captions) AGAINST (?) relevance
		 	FROM snapshot_metric
		 	WHERE MATCH (myv_caption, myv_version_captions, myv_variable_captions,
			myv_variable_value_captions, myv_work_captions) AGAINST (? IN BOOLEAN MODE)
		 	ORDER BY relevance DESC
		 	LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array($query, $query));
		Profiling::EndTimer();
		return $ret;
	}*/

}


