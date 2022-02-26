<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\Account;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\Context;
use helena\services\backoffice\publish\PublishDataTables;

class SnapshotSearchMetrics extends BaseModel
{
	public function __construct()
	{
		$this->tableName = '';
		$this->idField = '';
		$this->captionField = '';
	}
	public function SearchMetrics($originalQuery, $inBackoffice, $includeBoundaries, $currentWork)
	{
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$fields = [ 'mvw_metric_caption', 'mvw_caption', 'mvw_metric_caption', 'mvw_variable_captions',
											 'mvw_variable_value_captions', 'mvw_work_caption', 'mvw_work_authors', 'mvw_work_institution' ];
		$specialWordsCondition = self::calculateSpecialWordsCondition($originalQuery, $fields);
		$args = array($query, $query);

		Profiling::BeginTimer();
		if ($currentWork !== null)
			$currentWorkCondition = "mvw_work_id = " . $currentWork . ' OR ';
		else
			$currentWorkCondition = '';

		$sql = "(SELECT mvw_metric_id Id,
										mvw_metric_caption Caption,
										GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') Extra,
										'L' Type,
										MAX(MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`,
										`mvw_variable_value_captions`, `mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (?)) Relevance
										FROM snapshot_metric_version
										WHERE (MATCH (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`, `mvw_variable_value_captions`,
										`mvw_work_caption`, mvw_work_authors, mvw_work_institution) AGAINST (? IN BOOLEAN MODE) " .
										$specialWordsCondition . ") AND (" . $currentWorkCondition . " IsAccessibleWork(?, mvw_work_id, mvw_work_is_indexed, mvw_work_is_private)
										)
										GROUP BY mvw_metric_id, mvw_metric_caption
										LIMIT 0, 10)";

		$userId = Account::Current()->GetUserIdOrNull();
		$args[] = $userId;

		if ($includeBoundaries) {
			$boundariesSpecialWordsCondition = self::calculateSpecialWordsCondition($originalQuery, ['bow_caption', 'bow_group']);
			$boundariesSql = "(SELECT bow_boundary_id Id,
										bow_caption Caption,
										CONCAT('Delimitaciones > ', bow_group) Extra,
										'B' Type,
										MATCH (`bow_caption`, `bow_group`) AGAINST (?) Relevance
										FROM snapshot_boundary
										WHERE MATCH (`bow_caption`, `bow_group`) AGAINST (? IN BOOLEAN MODE) " .
											$boundariesSpecialWordsCondition . " LIMIT 0, 10)";
			$sql .= " UNION ALL " . $boundariesSql;
			$args[] = $query;
			$args[] = $query;
		}
		$sql .= " ORDER BY Relevance DESC";
		$ret = App::Db()->fetchAll($sql, $args);

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

	public static function calculateSpecialWordsCondition($originalQuery, $fields)
	{
		$specialWords = Context::Settings()->Db()->SpecialWords;
		$matches = Str::TextContainsWordList($specialWords, Str::ReplaceGroup($originalQuery, "'\+-@()[],.;|/", " "));

		if (sizeof($matches) > 0)
		{
			$likeCondition =  " OR (0 ";
			foreach($matches as $match)
			{
				$matchEscaped = Str::Replace($match, "'", "\'");
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


