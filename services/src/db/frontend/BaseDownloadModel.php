<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use PDO;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\ErrorException;
use helena\classes\GeoJson;

use helena\db\frontend\GeographyModel;

use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

abstract class BaseDownloadModel extends BaseModel
{

	public $prepared = false;
	public $fullQuery = '';
	public $countQuery = '';
	public $fullCols = array();
	public $fullParams = array();
	public $wktIndex = -1;
	public $extraColumns = null;
	private $treeId = 1;

	public function GetCols()
	{
		if($this->prepared == false)
			throw new ErrorException('Query not prepared. Call PrepareFileQuery before.');

		return $this->fullCols;
	}

	public function GetCountRows()
	{
		if($this->prepared == false)
			throw new ErrorException('Query not prepared. Call PrepareFileQuery before.');
		Profiling::BeginTimer();
		$params = $this->fullParams;
		$ret = App::Db()->fetchScalarInt($this->countQuery, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetPagedRows($start, $count)
	{
		if($this->prepared == false)
			throw new ErrorException('Query not prepared. Call PrepareFileQuery before.');
		Profiling::BeginTimer();
		$params = $this->fullParams;

		$limit = ' LIMIT ' . intval($start) . ', ' . intval($count);
		try
		{
			App::Db()->setFetchMode(PDO::FETCH_NUM);
			$ret = App::Db()->fetchAll($this->fullQuery . $limit, $params);
			Profiling::EndTimer();
			return $ret;
		}
		finally
		{
			App::Db()->setFetchMode(PDO::FETCH_ASSOC);
		}
	}

	public function AppendCompareColumns($cols, &$joins, $compareDataset)
	{
		$previousGeoId = $compareDataset['dat_geography_id'];
		$joins .= ' JOIN geography_tuple_item ON gti_geography_item_id = geography_item_id  AND gti_geography_previous_id = ' . $previousGeoId;
		$joins .= ' JOIN geography_item COMPARED_ITEM ON COMPARED_ITEM.gei_id = gti_geography_previous_item_id ';

		$geo = new GeographyModel();
		$compareInfo = $geo->GetGeographyInfo($previousGeoId);
		$compareLabel = 'Códigos de ' . $compareInfo['geography'] . ' (' . $compareInfo['revision'] . ')';

		$cols[] = self::GetCustomCol(
			'COMPARED_ITEM.gei_code', 'codigo_comparacion',
			$compareLabel,
			Format::A,
			9,
			10,
			0, Measurement::Nominal, Alignment::Left
		);

		return $cols;
	}

	public function AppendGeographyTree($cols, &$joins, $geography_id, $matchField, $includeGeographyOtherColumns = false)
	{
		// Árbol plano de Geographies
		$model = new GeographyModel();
		$geographies = $model->GetAllLevels($geography_id);
		$uniqueTreeId = "t" . ($this->treeId++) . "_";

		if ($this->fromDraft)
			$left = " LEFT ";
		else
			$left = "";
		$colsToAdd = [];
		for($lvl = sizeof($geographies) - 1; $lvl >= 0; $lvl--)
		{
			$car = $geographies[$lvl];
			$suffix = sizeof($geographies) - $lvl;
			$table = $uniqueTreeId . 'level' . $suffix;
			$parent = $uniqueTreeId . 'level' . ($suffix - 1);

			$cartoCols = $this->GetGeographyColumns($table, $car);
			if($lvl == sizeof($geographies) - 1)
			{
				$joins .=  $left .' JOIN geography_item '.$table.' ON '.$table.'.gei_id = ' . $matchField. ' ';
				if ($includeGeographyOtherColumns)
					$cartoCols = array_merge($cartoCols, $this->GetGeographyOtherColumns($table, $car['geography']));
			}
			else
				$joins .= $left . ' JOIN geography_item '.$table.' ON '.$table.'.gei_id = '.$parent.'.gei_parent_id ';

			$colsToAdd = array_merge($cartoCols, $colsToAdd);
		}
		$cols = array_merge($cols, $colsToAdd);
		return $cols;
	}
	protected function AppendShapeColumns(array $cols, $preffix = '')
	{
		$cols[] = self::GetCustomCol('_data_table.' . $preffix . 'area_m2 / 1000 / 1000', 'superficie_km2', 'Superficie en km2',
			Format::F, 9, 10, 3, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_Y(_data_table.' . $preffix . 'centroid), ' . GeoJson::PRECISION .')', 'latitud_centroide', 'Latitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_X(_data_table.' . $preffix . 'centroid), ' . GeoJson::PRECISION .')', 'longitud_centroide', 'Longitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		return $cols;
	}

	protected function AppendPolygonColumn($cols, $polygonField, $getPolygonType)
	{
		if ($getPolygonType === 'geojson')
		{
			$fn = '';
			$varName = 'GeoJSON';
		} else
		{
			$fn = 'ST_asWKT';
			$varName = 'WKT';
		}
		$cols[] = self::GetCustomCol($fn . '(' . $polygonField . ')', $varName, 'Geometría en ' . $varName,
			Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		return $cols;
	}

	protected function GetFields(array &$cols)
	{
		$fields = '';
		$i = 0;
		foreach($cols as &$col)
		{
			if($col['id'] === null)
				$fields .= $col['field'].' c'.($i++).',';
			else
				$fields .= $this->EscapeColumn($col['field']).' c'.($i++).',';
		}
		return substr($fields, 0, -1);
	}

	protected function Deduplicate(array $cols)
	{
		$items = $this->GetDuplicates($cols, 'variable');
		foreach($items as $v)
		{
			$i = 0;
			foreach($cols as &$col)
			{
				if(Str::ToLower($col['variable']) == Str::ToLower($v))
				{
					if($i > 0)
						$col['variable'] .= '_'.$i;
					$i++;
				}
			}
		}
		return $cols;
	}

	protected function GetDuplicates(array $arr, $field)
	{
		return array_keys(
			array_filter(
				array_count_values(
					array_map(Str::class . '::ToLower',
						array_column($arr, $field)
				)),
				function($v) { return $v > 1; }
		));
	}


	protected static function GetGeographyColumns($table, $car)
	{
		$cols = array();
		$carto = Str::SpanishSingle(Str::ToLower($car['geography']));

		$cols[] = self::GetCustomCol($table.'.gei_code', $car['field_code'], 'Código de ' . $carto,
			Format::A, 0, $car['field_size'], 0, Measurement::Nominal, Alignment::Left);

		if($car['field_caption'] != null)
		{
			$cols[] = self::GetCustomCol($table.'.gei_caption', $car['field_caption'], 'Nombre de '.$carto,
				Format::A, 0, 100, 0, Measurement::Nominal, Alignment::Left);
		}
		return $cols;
	}

	protected static function GetGeographyOtherColumns($table, $name)
	{
		$cols = array();
		$carto = Str::RemoveAccents($name);

		$cols[] = self::GetCustomCol($table.'.gei_population', $carto.'_poblacion_total', 'Población total',
			Format::F, 9, 10, 0, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol($table.'.gei_households', $carto.'_hogares_total', 'Total de hogares',
			Format::F, 9, 10, 0, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_Y('.$table.'.gei_centroid), ' . GeoJson::PRECISION .')', $carto.'_latitud_centroide', 'Latitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_X('.$table.'.gei_centroid), ' . GeoJson::PRECISION .')', $carto.'_longitud_centroide', 'Longitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol($table.'.gei_area_m2 / 1000 / 1000', $carto.'_superficie_km2', 'Superficie en km2',
			Format::F, 9, 10, 3, Measurement::Scale, Alignment::Right);
		return $cols;
	}

	public static function GetCustomCol($field, $variable, $caption, $format,
		$columnWidth, $fieldWidth, $decimals, $measure, $alignment)
	{
		return array(
			'id' => null,
			'field' => $field,
			'variable' => $variable,
			'caption' => $caption,
			'format' => $format,
			'column_width' => $columnWidth,
			'field_width' => $fieldWidth,
			'decimals' => $decimals,
			'measure' => $measure,
			'align' => $alignment,
		);
	}

}

