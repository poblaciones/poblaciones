<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use Doctrine\DBAL\Connection;
use PDO;
use helena\classes\App;
use minga\framework\Str;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;

class DatasetDownloadModel extends BaseDownloadModel
{
	public $fromDraft = false;


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

		$datasetModel = new DatasetModel();
		$dataset = $datasetModel->GetDatasetById($datasetId, $this->fromDraft);

		$where = '';
		$joins = ' ';

		// Filtra por clipping
		if($clippingItemId)
		{
			$joins = ' JOIN snapshot_clipping_region_item_geography_item ON _data_table.geography_item_id = cgv_geography_item_id
										AND cgv_clipping_region_item_id IN (' . Str::JoinInts($clippingItemId) . ') ';
		} else if ($clippingCircle)
		{
			$spatialConditions = new SpatialConditions('sna');
			$where = " AND " . $spatialConditions->CreateCircleQuery($clippingCircle, $dataset['type'])->Where;
			$joins .= " JOIN " . SnapshotByDatasetModel::SnapshotTable($dataset['table']) . " ON _data_table.Id = sna_id ";
		}

		// Filtra por urbanity
		if ($urbanity)
		{
			$spatialConditions = new SpatialConditions('urba.gei');
			$where .= $spatialConditions->UrbanityCondition($urbanity);
			$joins .= " JOIN geography_item urba ON _data_table.geography_item_id = urba.gei_id ";
		}

		$effectiveGeographyId = $dataset['dat_geography_id'];

		$cols = $datasetModel->GetDatasetColumns($dataset['id'], false, $this->fromDraft);

		$this->AppendExtraColumns($cols, $dataset, $joins, $effectiveGeographyId, $getPolygon);

		$cols = $this->Deduplicate($cols);
		$wherePart = ($where !== '' ? ' WHERE ' . substr($where, 4) : '');

		$query = ' FROM ' . $dataset['table'] . '
										AS _data_table ' . $joins . $wherePart;

		$fullSql = 'SELECT ' . $this->GetFields($cols) . $query;
		$countSql = 'SELECT COUNT(*) ' . $query;

		$this->fullQuery = $fullSql;
		$this->countQuery = $countSql;
		$this->fullParams = $params;
		$this->fullCols = $cols;
		$this->prepared = true;

		Profiling::EndTimer();
	}

	private function AppendExtraColumns(&$cols, $dataset, &$joins, &$effectiveGeographyId, $getPolygonType)
	{
		if ($this->extraColumns == 'basic' || ($getPolygonType != null &&
			$this->extraColumns !== null))
		{
			// agrega los joins para columnas extra y/o para getPolygon:
			$matchField = '_data_table.geography_item_id';
			$includeGeographyOtherColumns = $dataset['type'] == 'D';
			$cols = $this->AppendGeographyTree($cols, $joins, $effectiveGeographyId, $matchField, $includeGeographyOtherColumns);
			if($dataset['type'] == 'S')
				$cols = $this->AppendShapeColumns($cols);
		}

		// se fija si van con polígono
		if ($getPolygonType != null)
		{
			if ($dataset['type'] == 'S')
				$polygonField = '(_data_table.geometry)';
			else
				$polygonField = 'level1.gei_geometry_r6';

			$cols = $this->AppendPolygon($cols, $polygonField, $getPolygonType);
			$this->wktIndex = count($cols) - 1;
		}
	}


	protected function draftPreffix()
	{
		return ($this->fromDraft ? 'draft_' : '');
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

		$sql = 'SELECT lat.dco_variable as lat, lng.dco_variable as lon,
										latSegment.dco_variable as latSegment, lngSegment.dco_variable as lonSegment
			FROM ' . $this->draftPreffix() . 'dataset
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column lat ON lat.dco_id = dat_latitude_column_id
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column lng ON lng.dco_id = dat_longitude_column_id
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column latSegment ON latSegment.dco_id = dat_latitude_column_segment_id
			LEFT JOIN ' . $this->draftPreffix() . 'dataset_column lngSegment ON lngSegment.dco_id = dat_longitude_column_segment_id
			WHERE dat_id = ?';

		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		Profiling::EndTimer();
		return $ret;
	}


}

