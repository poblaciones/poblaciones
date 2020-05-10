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

//$shapesField = $this->state->Get('shape');
//    $select = "id, GeomFromText(" . $shapesField . ") g";
//    $rows = $this->QueryColumns($select, $from, $pageSize);

//    // Los trae, calcula el área y si el geometry es válido.
//    foreach($data as $rows)
//    {
//      $id = $row['g'];
//      $data = unpack("@4/a*", $row['g']);
//      $geometry = \geoPHP::load($data, 'wkb');
//      // Valida
//      if ($geometry->isValid() == false)
//        $area = null;
//      else
//      {
//        // Simplifica
//        $r1 = ;
//        $r2 = ;
//        $r3 = ;
//        $r4 = ;
//        $r5 = ;
//        $r6 = ;
//        // Proyecta para area

//        // Calcula area

//      }
//      // Inserta geometry, g1, g2, g3, g4, g5, g6 area y centroide

//    }
//    $condition = " area IS NULL ";

//    // Luego valida los valores de area
//    return $this->ExecuteValidate(self::ERROR_INVALID_GEOMETRY, $from, $pageSize, $condition);
//  }

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

		return "GetGeographyByPoint( " . $this->state->GeographyId() . ", ST_CENTROID(GeomFromText(FixGeoJson(" . $shapesField . "))))";
	}
}

