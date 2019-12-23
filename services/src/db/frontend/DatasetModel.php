<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use Doctrine\DBAL\Connection;
use PDO;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\ErrorException;

use helena\db\frontend\GeographyModel;

use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

class DatasetModel extends BaseModel
{

	public $prepared = false;
	public $fullQuery = '';
	public $countQuery = '';
	public $fullCols = array();
	public $fullParams = array();
	public $wktIndex = -1;
	public $fromDraft = false;

	public function __construct($fullQuery = '', $countQuery = '', $fullCols = array(), $fullParams = array(), $wktIndex = -1)
	{
		$this->tableName = 'dataset';
		$this->idField = 'dat_id';
		$this->captionField = 'dat_caption';

		$this->fullQuery = $fullQuery;
		$this->countQuery = $countQuery;
		$this->fullCols = $fullCols;
	  	$this->fullParams = $fullParams;
		$this->wktIndex = $wktIndex;
		if($fullQuery !== '')
			$this->prepared = true;
	}

	public function GetDatasetById($id)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT
			d1.dat_id id,
			d1.dat_caption caption,
			d1.dat_table `table`,
			d1.dat_type `type`,
			d1.dat_caption_column_id `caption_column_id`,
			(SELECT dco_field FROM ' . $this->draftPreffix() . 'dataset_column WHERE dco_id = d1.dat_caption_column_id) caption_column_field,
			d1.dat_geography_id
			FROM ' . $this->draftPreffix() . 'dataset d1
			WHERE d1.dat_id = ? LIMIT 1';
		$ret = App::Db()->fetchAssoc($sql, array((int)$id));
		if ($ret == null)
			throw new ErrorException("El dataset no ha sido encontrado.");
		Profiling::EndTimer();
		return $ret;
	}

	public function GetColumnLabels($id, array $ids = array())
	{
		if($id === null)
			return array();
		Profiling::BeginTimer();
		$where = '';
		$params = array((int)$id);
		$types = array(PDO::PARAM_INT);
		if(count($ids) > 0)
		{
			$where = ' AND dla_value IN (?)';
			$params[] = $ids;
			$types[] = Connection::PARAM_STR_ARRAY;
		}

		$sql = 'SELECT
			dla_value value,
			dla_caption caption
			FROM ' . $this->draftPreffix() . 'dataset_column_value_label
			WHERE dla_dataset_column_id = ?' . $where . ' ORDER BY dla_order';

		$items = App::Db()->fetchAll($sql, $params, $types);
		$ret = array();
		foreach($items as $item)
			$ret['_' . $item['value']] = $item['caption'];
		Profiling::EndTimer();
		return $ret;
	}
	private function draftPreffix()
	{
		return ($this->fromDraft ? 'draft_' : '');
	}
	public function PrepareFileQuery($datasetId, $clippingItemId, $getPolygon)
	{
		Profiling::BeginTimer();
		$params = array();

		$dataset = $this->GetDatasetById($datasetId);

		$joins = ' ';
		if($clippingItemId != 0)
		{
			$joins = ' JOIN snapshot_clipping_region_item_geography_item ON spss1.geography_item_id = cgv_geography_item_id AND cgv_clipping_region_item_id = ? ';
			$params[] = (int)$clippingItemId;
		}

		$effectiveGeographyId = $dataset['dat_geography_id'];

		$cols = array();
		$cols = $this->AppendGeographyTree($cols, $joins, $effectiveGeographyId);

		if($dataset['type'] == 'S')
			$cols = $this->AppendShapeColumns($cols);

		if ($getPolygon != null)
		{
			$cols = $this->AppendPolygon($cols, $dataset, $getPolygon);
			$this->wktIndex = count($cols) - 1;
		}
		$cols = array_merge($cols, $this->GetDatasetColumns($dataset['id']));

		$cols = $this->Deduplicate($cols);

		$fullSql = 'SELECT ' . $this->GetFields($cols) . ' FROM ' . $this->EscapeTable($dataset['table']) . '
										AS spss1 ' . $joins;
		$countSql = 'SELECT COUNT(*) FROM ' . $this->EscapeTable($dataset['table']) . '
										AS spss1 ' . $joins;
		$this->fullQuery = $fullSql;
		$this->countQuery = $countSql;
		$this->fullParams = $params;
		$this->fullCols = $cols;
		$this->prepared = true;

		Profiling::EndTimer();
	}

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
		//Todos los parámetros de esta consulta son de tipo int.
		$types = array_fill(0, count($params), PDO::PARAM_INT);

		$limit = ' LIMIT ' . intval($start) . ', ' . intval($count);
		try
		{
			App::Db()->setFetchMode(PDO::FETCH_NUM);
			$ret = App::Db()->fetchAll($this->fullQuery . $limit, $params, $types);
			Profiling::EndTimer();
			return $ret;
		}
		finally
		{
			App::Db()->setFetchMode(PDO::FETCH_ASSOC);
		}
	}

	private function AppendGeographyTree($cols, &$joins, $geography_id)
	{
		//Árbol plano de Geographies
		$model = new GeographyModel();
		$geographies = $model->GetAllLevels($geography_id);

		if ($this->fromDraft)
			$left = " LEFT ";
		else
			$left = "";

		for($lvl = sizeof($geographies) - 1; $lvl >= 0; $lvl--)
		{
			$car = $geographies[$lvl];
			$suffix = sizeof($geographies) - $lvl;
			$table = $this->EscapeTable('level' . $suffix );
			$parent = $this->EscapeTable('level' . ($suffix - 1));

			$cartoCols = $this->GetGeographyColumns($table, $car);
			if($lvl == sizeof($geographies) - 1)
			{
				$joins .=  $left .' JOIN geography_item '.$table.' ON '.$table.'.gei_id = spss1.geography_item_id ';
				$cartoCols = array_merge($cartoCols, $this->GetGeographyOtherColumns($table, $car['geography']));
			}
			else
				$joins .= $left . ' JOIN geography_item '.$table.' ON '.$table.'.gei_id = '.$parent.'.gei_parent_id ';

			$cols = array_merge($cartoCols, $cols);
		}
		return $cols;
	}

	private function GetFields(array &$cols)
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

	private function Deduplicate(array $cols)
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

	private function GetDuplicates(array $arr, $field)
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


	private function AppendPolygon($cols, $dataset, $getPolygon)
	{
		if ($getPolygon === 'geojson')
		{
			$fn = '';
			$varName = 'GeoJSON';
		} else
		{
			$fn = 'asWKT';
			$varName = 'WKT';
		}
		if ($dataset['type'] == 'S')
		{
			$cols[] = $this->GetCustomCol($fn . '(spss1.geometry_r6)', $varName, 'Geometría en ' . $varName,
				Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		}
		else
		{
			$cols[] = $this->GetCustomCol('(case when level1.gei_geometry_is_null = 1 then null else ' . $fn . '(level1.gei_geometry_r6) end)', $varName, 'Geometría en ' . $varName,
				Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		}
		return $cols;
	}

	private function AppendShapeColumns(array $cols)
	{
		$cols[] = $this->GetCustomCol('spss1.area_m2', 'area_m2', 'Área en m2',
			Format::F, 9, 19, 2, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol('X(spss1.centroid)', 'latitud_centroide', 'Latitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol('Y(spss1.centroid)', 'longitud_centroide', 'Longitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		return $cols;
	}

	private function GetGeographyColumns($table, $car)
	{
		$cols = array();
		$carto = Str::SpanishSingle(Str::ToLower($car['geography']));

		$cols[] = $this->GetCustomCol($table.'.gei_code', $car['field_code'], 'Código de ' . $carto,
			Format::A, 0, $car['field_size'], 0, Measurement::Nominal, Alignment::Left);

		if($car['field_caption'] != null)
		{
			$cols[] = $this->GetCustomCol($table.'.gei_caption', $car['field_caption'], 'Nombre de '.$carto,
				Format::A, 0, 100, 0, Measurement::Nominal, Alignment::Left);
		}
		return $cols;
	}

	private function GetGeographyOtherColumns($table, $name)
	{
		$cols = array();
		$carto = $this->SanitizeName($name);
		$sufix =  ' ('.$name.')';

		$cols[] = $this->GetCustomCol($table.'.gei_population', $carto.'_poblacion_total', 'Población total'.$sufix,
			Format::F, 9, 10, 0, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol($table.'.gei_households', $carto.'_hogares_total', 'Total de hogares'.$sufix,
			Format::F, 9, 10, 0, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol('X('.$table.'.gei_centroid)', $carto.'_latitud_centroide', 'Latitud del centroide'.$sufix,
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol('Y('.$table.'.gei_centroid)', $carto.'_longitud_centroide', 'Longitud del centroide'.$sufix,
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = $this->GetCustomCol($table.'.gei_area_m2', $carto.'_area_m2', 'Área en m2'.$sufix,
			Format::F, 9, 19, 2, Measurement::Scale, Alignment::Right);
		return $cols;
	}

	private function SanitizeName($name)
	{
		$unwanted = array(' ' => '_', 'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'ç' => 'c',
			'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i', 'ñ' => 'n',
			'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u');
		return strtr(Str::ToLower($name), $unwanted);
	}



	public function GetDatasetColumns($id, $inSummary = false)
	{
		Profiling::BeginTimer();

		$sql = 'SELECT
			dco_id id,
			dco_field field,
			dco_variable variable,
			dco_caption caption,
			dco_format format,
			dco_column_width column_width,
			dco_field_width field_width,
			dco_decimals decimals,
			dco_measure measure,
			dco_alignment align
			FROM ' . $this->draftPreffix() . 'dataset_column
			WHERE ' . ($inSummary ? 'dco_use_in_summary = 1' : 'dco_use_in_export = 1') . '
			AND dco_dataset_id = ?
			ORDER BY dco_order';

		$rows = App::Db()->fetchAll($sql, array((int)$id));

		Profiling::EndTimer();
		return $rows;
	}

	private function GetDatasetColumnLabelsCount($columnId)
	{
		Profiling::BeginTimer();

		$sql = 'SELECT COUNT(*)
			FROM ' . $this->draftPreffix() . 'dataset_column
			WHERE dco_id = ?';

		$ret = (int)App::Db()->fetchColumn($sql, array((int)$columnId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetLatLongColumns($datasetId)
	{
		Profiling::BeginTimer();

		$sql = 'SELECT lat.dco_variable as lat, lng.dco_variable as lon
			FROM ' . $this->draftPreffix() . 'dataset
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column lat ON lat.dco_id = dat_latitude_column_id
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column lng ON lng.dco_id = dat_longitude_column_id
			WHERE dat_id = ?';

		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		Profiling::EndTimer();
		return $ret;
	}

	private function GetCustomCol($field, $variable, $caption, $format,
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

