<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceByLatLon extends GeoreferenceBase
{
	public function Validate($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();

		$latField = $this->state->Get('lat');
		$lonField = $this->state->Get('lon');

		$condition1 = "(" . $this->IsNullOrEmptySql($latField)  . " OR " . $this->IsNullOrEmptySql($lonField) . ")";
		$condition2 = "(" . $latField ." < -90 OR ". $latField ." > 90 OR "
												. $lonField ." < -180 OR ". $lonField ." > 180)";

		$conditions = array($condition1, $condition2);
		$codes = array(self::ERROR_NULL_COORDINATE_VALUE, self::ERROR_INVALID_COORDINATE_VALUE);

		$ret = $this->ExecuteMultiValidate($codes, $from, $pageSize, $totalRows, $conditions);
		Profiling::EndTimer();
		return $ret;
	}

	public function Georeference($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();
		$condition = $this->MatchSql() . " IS NULL";

		$ret = $this->ExecuteValidate(self::ERROR_COORDINATE_UNMATCHED, $from, $pageSize, $totalRows, $condition);

		Profiling::EndTimer();
		return $ret;
	}

	public function Update($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();
		$value = $this->MatchSql();

		$ret = $this->ExecuteUpdate($from, $pageSize, $totalRows, $value);

		Profiling::EndTimer();
		return $ret;
	}

	private function MatchSql()
	{
		$latField = $this->state->Get('lat');
		$lonField = $this->state->Get('lon');

		return "GetGeographyByPoint( " . $this->state->GeographyId() . ", POINT(" . $lonField . ", " . $latField . "))";
	}
}

