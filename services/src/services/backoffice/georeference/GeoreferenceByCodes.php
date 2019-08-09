<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceByCodes extends GeoreferenceBase
{
	public function Validate($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();
		$codeField = $this->state->Get('code');

		$condition = $this->IsNullOrEmptySql($codeField);
		$ret = $this->ExecuteValidate(self::ERROR_NULL_CODE, $from, $pageSize, $totalRows, $condition);
		Profiling::EndTimer();
		return $ret;
	}

	public function Georeference($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();
		$condition = " NOT EXISTS(" . $this->MatchSql() . ")";

		$ret = $this->ExecuteValidate(self::ERROR_CODE_UNMATCHED, $from, $pageSize, $totalRows, $condition);
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
		$codeField = $this->state->Get('code');

		return "SELECT gei_id FROM geography_item WHERE gei_geography_id = " . $this->state->GeographyId()
								. " AND gei_code = " . $codeField;
	}
}

