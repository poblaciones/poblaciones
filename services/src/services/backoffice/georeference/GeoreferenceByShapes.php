<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceByShapes extends GeoreferenceBase
{
	public function Validate($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();

		$shapesField = $this->state->Get('shape');
		$valid = "GeometryIsValid(GeomFromText(FixGeoJson(" . $shapesField . ")))";

		$condition1 = $this->IsNullOrEmptySql($shapesField);
		$condition2 = "RIGHT(FixGeoJson(" . $shapesField . "), 1) != CONVERT(')' USING utf8)";
		$condition3 = "GeomFromText(FixGeoJson(" . $shapesField . ")) IS NULL ";
		$condition4 = $valid . " != 100 ";

		$conditions = array($condition1, $condition2, $condition3);
		$codes = array(self::ERROR_NULL_SHAPE, self::ERROR_OPEN_SHAPE_SYNTAX, self::ERROR_BAD_SHAPE_SYNTAX);
		$ret = $this->ExecuteMultiValidate($codes, $from, $pageSize, $totalRows, $conditions);

		$condition = "(NOT " . $condition1 . " AND NOT " . $condition2 . " AND NOT " . $condition3 . " AND " . $condition4 . ") ";
		$this->ExecuteValidate($valid, $from, $pageSize, $totalRows, $condition);

		Profiling::EndTimer();
		return $ret;
	}

	public function Georeference($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();

		$condition = $this->MatchSql() . " IS NULL";

		$ret = $this->ExecuteValidate(self::ERROR_CENTROID_UNMATCHED, $from, $pageSize, $totalRows, $condition);

		Profiling::EndTimer();
		return $ret;
	}

	public function Update($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();

		$value = $this->MatchSql();

		$hasMoreRows = $this->ExecuteUpdate($from, $pageSize, $totalRows, $value);

		$this->UpdateGeometryColumns($from, $pageSize, $totalRows);

		Profiling::EndTimer();
		return $hasMoreRows;
	}

	private function MatchSql()
	{
		$shapesField = $this->state->Get('shape');

		return "IFNULL(GetGeographyByPoint( " . $this->state->GeographyId() . ",
											GeometryCentroid(GeomFromText(FixGeoJson(" . $shapesField . ")))),
	  								GetGeographyByPoint( " . $this->state->GeographyId() . ",
											POINT(
											ST_X(GeometryCentroid(GeomFromText(FixGeoJson(" . $shapesField . ")))) + 0.001,
											ST_Y(GeometryCentroid(GeomFromText(FixGeoJson(" . $shapesField . "))))
											)
									))";
	}
}

