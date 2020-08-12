<?php

namespace helena\services\backoffice\georeference;

use helena\classes\App;
use minga\framework\Profiling;
use helena\entities\backoffice as entities;

abstract class GeoreferenceBase
{
	protected $state;
	// *** REPLICAR ERRORES NUEVOS EN LA FUNCIÓN DE MYSQL 'GeoreferenceErrorCode' ***
	// La latitud o la longitud tiene valores vacíos.
	const ERROR_NULL_COORDINATE_VALUE = 9;
	// La latitud o la longitud no están en un rango válido (-90 a 90 y -180 a 180).
	const ERROR_INVALID_COORDINATE_VALUE = 1;
	// La coordenada indicada no se encuentra dentro de ningún elemento de la geografía seleccionada.
	const ERROR_COORDINATE_UNMATCHED = 2;
	// El valor para el código no puede ser nulo
	const ERROR_NULL_CODE = 3;
	// El valor para el código no fue encontrado en la geografía indicada.
	const ERROR_CODE_UNMATCHED = 4;
	// El valor para el polígono no puede ser nulo
	const ERROR_NULL_SHAPE = 5;
	// El valor indicado en la columna del polígono no es un texto WKT o GeoJson correcto.
	const ERROR_BAD_SHAPE_SYNTAX = 6;
	// El polígono reconocido no es una geometría válida.
	const ERROR_INVALID_GEOMETRY = 7;
	// El centroide del polígono indicado no se encuentra dentro de ningún elemento de la geografía seleccionada.
	const ERROR_CENTROID_UNMATCHED = 8;
	// La latitud o la longitud contienen valores vacíos.
	const ERROR_EMPTY_LAT_LON = 9;
	// La geometría no tiene signos de cierre. Es posible que se encuentre incompleta.
	const ERROR_OPEN_SHAPE_SYNTAX = 10;

	// De validez de polígonos

	// El perímetro exterior del polígono no posee puntos.
	const ERROR_EMPTY = 101;
	// El perímetro exterior del polígono no está cerrado. El último punto debe coincidir con el primero.
	const ERROR_OPEN_PATH = 102;
	// El perímetro exterior del polígono debe tener sus puntos ordenados en el sentido de las agujas del reloj (clockwise).
	const ERROR_CLOCKWISE_REQUIRED = 103;
	// El perímetro exterior del polígono se intersecta consigo mismo.
	const ERROR_SELF_INTERSECT = 104;

	// Uno de los huecos del polígono no posee puntos.
	const ERROR_INNER_EMPTY = 105;
	// Uno de los huecos del polígono no está cerrado. El último punto debe coincidir con el primero.
	const ERROR_INNER_OPEN_PATH = 106;
	// Los huecos del polígono deben tener sus puntos ordenados en el sentido contrario a las agujas del reloj (counter-clockwise).
	const ERROR_INNER_COUNTER_CLOCKWISE_REQUIRED = 107;
	// Uno de los huecos del polígono se intersecta consigo mismo.
	const ERROR_INNER_SELF_INTERSECT = 108;

	// Un hueco del polígono excede los límites de su perímetro.
	const ERROR_INNER_CROSSES_OUTER = 109;
	// Los polígonos de un polígono múltiple no pueden superponerse.
	const ERROR_POLYGONS_CROSS = 110;
	// Los huecos de un polígono no pueden superponerse.
	const ERROR_INNERS_CROSS = 111;
	// El polígono múltiple no contiene polígonos.
	const ERROR_MULTIPOLYGON_EMPTY = 120;

	function __construct($state)
	{
		$this->state = $state;
	}

	public function CountRows()
	{
		// Se fija si hace el join con errors
		if ($this->state->FromErrors())
			$tableAndCondition = $this->state->RetryTable();
		else
			$tableAndCondition = $this->state->Table() . " WHERE ommit = 0";
		$count = App::Db()->fetchScalarInt("SELECT COUNT(*) FROM " . $tableAndCondition);
		return $count;
	}
	protected function ExecuteMultiValidate($codes, $from, $pageSize, $totalRows, $conditions)
	{
		$conditionSql = "";
		$codesSql = "";
		for($n = 0; $n < sizeof($codes); $n++)
		{
			$codesSql .= " WHEN " . $conditions[$n] . " THEN " . $codes[$n];
			$conditionSql .= ($n != 0 ? " OR " : "") . "(" . $conditions[$n] . ")";
		}
		$codesSql = "CASE " . $codesSql . " END";
		return $this->ExecuteValidate($codesSql, $from, $pageSize, $totalRows, $conditionSql);
	}
	protected function ExecuteValidate($errorCode, $from, $pageSize, $totalRows, $condition)
	{
		Profiling::BeginTimer();

		$table = $this->state->Table();

		$fromWhere = " FROM " . $table;

		// Se fija si hace el join con errors
		if ($this->state->FromErrors())
			$fromWhere .= ", " . $this->state->RetryTable() . " WHERE id = row_id ";
		else
			$fromWhere .= " WHERE ommit = 0 ";

		// agrega la condición recibida
		$fromWhere .= ' LIMIT ' . $from . ', ' . $pageSize . ' ';

		$sql = "INSERT INTO " . $this->state->ErrorsTable() . " (row_id, error_code) " .
							" SELECT id, " . $errorCode . " FROM (SELECT * " . $fromWhere . ") as t WHERE " . $condition;
		/*
{
echo $errorCode;
echo '<br>';
	echo $sql;
echo '<br>----------------------------------------';
//	throw new \Exception('stopped 2');
}*/
		$rows = App::Db()->exec($sql);
		$this->state->IncrementErrors($rows);

		return $from + $pageSize >= $totalRows;
	}
	protected function IsNullOrEmptySql($field)
	{
		return '(' . $field . " IS NULL OR CONCAT('', " . $field . ") = '') ";
	}
	protected function ExecuteUpdate($from, $pageSize, $totalRows, $value)
	{
		Profiling::BeginTimer();

		$table = $this->state->Table();
		$limit = ' LIMIT ' . $from . ', ' . $pageSize . ' ';
		$sql = "UPDATE " . $table . " SET geography_item_id = (" . $value .
				") WHERE id IN (SELECT id FROM (SELECT id FROM " . $table . " WHERE ommit = 0 " . $limit . ") tmp)";
		App::Db()->exec($sql);

		Profiling::EndTimer();

		return $from + $pageSize >= $totalRows;
	}

	protected function UpdateGeometryColumns($from, $pageSize, $totalRows)
	{
		Profiling::BeginTimer();

		$table = $this->state->Table();
		$shapesField = $this->state->Get('shape');

		$limit = ' LIMIT ' . $from . ', ' . $pageSize . ' ';
		$sql = "UPDATE " . $table . " SET geometry = GeomFromText(GeoJsonOrWktToWkt(" . $shapesField . ")) WHERE
									id IN (SELECT id FROM (SELECT id FROM " . $table . " WHERE ommit = 0 " . $limit . ") tmp)";

		App::Db()->exec($sql);

		$sql = "UPDATE " . $table . " SET centroid = GeometryCentroid(geometry), area_m2 = GeometryAreaSphere(geometry) WHERE
								id IN (SELECT id FROM (SELECT id FROM " . $table . " WHERE ommit = 0 " . $limit . ") tmp)";

		App::Db()->exec($sql);

		Profiling::EndTimer();

		return $from + $pageSize >= $totalRows;
	}

}