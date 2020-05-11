<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\Context;
use helena\services\backoffice\publish\PublishDataTables;

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

		$sql = "SELECT	mvw_metric_id myv_metric_id,
										MIN(mvw_metric_caption) myv_metric_caption,
										MAX(mvw_metric_revision) myv_metric_revision,
										MIN(mvw_metric_group_id) myv_metric_group_id,
										GROUP_CONCAT(mvw_work_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_ids,
										GROUP_CONCAT(mvw_work_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_captions,
										GROUP_CONCAT(mvw_work_is_private ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_private,
										GROUP_CONCAT(mvw_work_is_indexed ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_indexed,
										GROUP_CONCAT(mvw_metric_version_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_ids,
										GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_captions,
										GROUP_CONCAT(IFNULL(mvw_partial_coverage, '') ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_partial_coverages
									FROM snapshot_metric_version
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


	public function HasVisibleVersions($metricId)
	{
		Profiling::BeginTimer();
		$metricIdShardified = PublishDataTables::Shardified($metricId);
		$sql = "SELECT COUNT(*)
							FROM snapshot_metric_version
							WHERE mvw_work_is_indexed = 1 AND mvw_work_is_private = 0";
		$ret = App::Db()->fetchScalarInt($sql, array($metricIdShardified));
		Profiling::EndTimer();
		return $ret > 0;
	}

	public function Search($originalQuery, $inBackoffice)
	{
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$specialWordsCondition = $this->calculateSpecialWordsCondition($originalQuery);

		Profiling::BeginTimer();
		$sql = "SELECT mvw_metric_id Id,
										mvw_metric_caption Caption,
										GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') Extra,
										'L' Type,
										MAX(MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`,
										`mvw_variable_value_captions`, `mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (?)) Relevance
										FROM snapshot_metric_version
										WHERE (MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`, `mvw_variable_value_captions`,
										`mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (? IN BOOLEAN MODE) " .
										$specialWordsCondition . "
										) AND mvw_work_is_indexed = 1 AND mvw_work_is_private = 0
										GROUP BY mvw_metric_id, mvw_metric_caption
										ORDER BY Relevance DESC
										LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array($query, $query));
		if ($inBackoffice)
		{
			foreach($ret as &$retItem)
			{
				$retItem['Id'] = PublishDataTables::Unshardify($retItem['Id']);
			}
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function calculateSpecialWordsCondition($originalQuery)
	{
		$specialWords = Context::Settings()->Db()->SpecialWords;
		$matches = Str::TextContainsWordList($specialWords, Str::ReplaceGroup($originalQuery, "'\+-@()[],.;|/", " "));

		if (sizeof($matches) > 0)
		{
			$likeCondition =  " OR (0 ";
			foreach($matches as $match)
			{
				$matchEscaped = Str::Replace($match, "'", "\'");
				$fields = [ 'mvw_metric_caption', 'mvw_caption', 'mvw_metric_caption', 'mvw_variable_captions',
											 'mvw_variable_value_captions', 'mvw_work_caption', 'mvw_work_authors', 'mvw_work_institution' ];
				foreach($fields as $field)
					$likeCondition .=  " OR " . $field . " REGEXP '[[:<:]]" . $matchEscaped . "[[:>:]]' ";
			}
			$likeCondition .= ") ";
		}
		else
			$likeCondition = "";

		return $likeCondition;
	}
}


