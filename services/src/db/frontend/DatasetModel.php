<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use Doctrine\DBAL\Connection;
use PDO;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\ErrorException;
use helena\classes\GeoJson;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\db\frontend\GeographyModel;

use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

class DatasetModel extends BaseDownloadModel
{
	public function __construct($fullQuery = '', $countQuery = '', $fullCols = array(), $fullParams = array(), $wktIndex = -1, $extraColumns = null)
	{
		$this->tableName = 'dataset';
		$this->idField = 'dat_id';
		$this->captionField = 'dat_caption';

		$this->fullQuery = $fullQuery;
		$this->countQuery = $countQuery;
		$this->fullCols = $fullCols;
  	$this->fullParams = $fullParams;
		$this->extraColumns = $extraColumns;
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
			d1.dat_images_column_id `images_column_id`,
			(SELECT dco_field FROM ' . $this->draftPreffix() . 'dataset_column WHERE dco_id = d1.dat_images_column_id) images_column_field,
			(SELECT dco_field FROM ' . $this->draftPreffix() . 'dataset_column WHERE dco_id = d1.dat_caption_column_id) caption_column_field,
			d1.dat_geography_id
			FROM ' . $this->draftPreffix() . 'dataset d1
			WHERE d1.dat_id = ? LIMIT 1';
		$ret = App::Db()->fetchAssoc($sql, array((int)$id));
		if ($ret == null)
			throw new PublicException("El dataset no ha sido encontrado.");
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

	public function PrepareFileQuery($datasetId, $clippingItemId, $clippingCircle, $urbanity, $getPolygon)
	{
		Profiling::BeginTimer();
		$params = array();

		$dataset = $this->GetDatasetById($datasetId);

		$where = '';
		$joins = ' ';

		// Filtra por clipping
		if($clippingItemId)
		{
			$joins = ' JOIN snapshot_clipping_region_item_geography_item ON spss1.geography_item_id = cgv_geography_item_id
										AND cgv_clipping_region_item_id IN (' . Str::JoinInts($clippingItemId) . ') ';
		} else if ($clippingCircle)
		{
			$spatialConditions = new SpatialConditions('sna');
			$where = " AND " . $spatialConditions->CreateCircleQuery($clippingCircle, $dataset['type'])->Where;
			$joins .= " JOIN " . SnapshotByDatasetModel::SnapshotTable($dataset['table']) . " ON spss1.Id = sna_id ";
		}

		// Filtra por urbanity
		if ($urbanity)
		{
			$spatialConditions = new SpatialConditions('urba.gei');
			$where .= $spatialConditions->UrbanityCondition($urbanity);
			$joins .= " JOIN geography_item urba ON spss1.geography_item_id = urba.gei_id ";
		}

		$effectiveGeographyId = $dataset['dat_geography_id'];

		$cols = array();

		$this->AppendExtraColumns($cols, $dataset, $joins, $effectiveGeographyId, $getPolygon);

		$cols = array_merge($cols, $this->GetDatasetColumns($dataset['id']));

		$cols = $this->Deduplicate($cols);

		$wherePart = ($where !== '' ? ' WHERE ' . substr($where, 4) : '');

		$query = ' FROM ' . $dataset['table'] . '
										AS spss1 ' . $joins . $wherePart;

		$fullSql = 'SELECT ' . $this->GetFields($cols) . $query;
		$countSql = 'SELECT COUNT(*) ' . $query;

		$this->fullQuery = $fullSql;
		$this->countQuery = $countSql;
		$this->fullParams = $params;
		$this->fullCols = $cols;
		$this->prepared = true;

		Profiling::EndTimer();
	}

	private function AppendExtraColumns(&$cols, $dataset, &$joins, &$effectiveGeographyId, $getPolygon)
	{
		if ($this->extraColumns == 'basic' || $getPolygon != null)
		{
			// agrega los joins para columnas extra y/o para getPolygon:
			$cols = $this->AppendGeographyTree($cols, $joins, $effectiveGeographyId);
			if($dataset['type'] == 'S')
				$cols = $this->AppendShapeColumns($cols);
		}

		if ($this->extraColumns === null)
			// si no le interesan las columnas extra, se asegura de no ponerlas en el select
			$cols = array();
		// se fija si van con polígono
		if ($getPolygon != null)
		{
			$cols = $this->AppendPolygon($cols, $dataset, $getPolygon);
			$this->wktIndex = count($cols) - 1;
		}
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
			$cols[] = self::GetCustomCol($fn . '(spss1.geometry)', $varName, 'Geometría en ' . $varName,
				Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		}
		else
		{
			$cols[] = self::GetCustomCol('(case when level1.gei_geometry_is_null = 1 then null else ' . $fn . '(level1.gei_geometry_r6) end)', $varName, 'Geometría en ' . $varName,
				Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		}
		return $cols;
	}

	private function AppendShapeColumns(array $cols)
	{
		$cols[] = self::GetCustomCol('spss1.area_m2', 'area_m2', 'Área en m2',
			Format::F, 9, 19, 2, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_Y(spss1.centroid), ' . GeoJson::PRECISION .')', 'latitud_centroide', 'Latitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		$cols[] = self::GetCustomCol('ROUND(ST_X(spss1.centroid), ' . GeoJson::PRECISION .')', 'longitud_centroide', 'Longitud del centroide',
			Format::F, 6, 19, 11, Measurement::Scale, Alignment::Right);
		return $cols;
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


}

