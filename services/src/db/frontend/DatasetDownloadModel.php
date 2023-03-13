<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use Doctrine\DBAL\Connection;
use PDO;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\ErrorException;
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
		if(count($ids) > 0)
		{
			$where = ' AND dla_value IN (?)';
			$params[] = $ids;
		}

		$sql = 'SELECT
			dla_value value,
			dla_caption caption
			FROM ' . $this->draftPreffix() . 'dataset_column_value_label
			WHERE dla_dataset_column_id = ?' . $where . ' ORDER BY dla_order';

		$items = App::Db()->fetchAll($sql, $params);
		$ret = array();
		foreach($items as $item)
			$ret['_' . $item['value']] = $item['caption'];
		Profiling::EndTimer();
		return $ret;
	}

	public function PrepareFileQuery($datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $getPolygon)
	{
		Profiling::BeginTimer();
		$params = array();

		$datasetModel = new DatasetModel();
		$dataset = $datasetModel->GetDatasetById($datasetId, $this->fromDraft);
		$requiresSna = false;
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
			$where = " AND " . $spatialConditions->CreateCircleQuery($clippingCircle, $dataset['dat_type'])->Where;
			$requiresSna = true;
		}

		// Filtra por urbanity
		if ($urbanity)
		{
			$spatialConditions = new SpatialConditions('urba.gei');
			$where .= $spatialConditions->UrbanityCondition($urbanity);
			$joins .= " JOIN geography_item urba ON _data_table.geography_item_id = urba.gei_id ";
		}

		// Filtra por partition
		if ($dataset['partition_column_field'])
		{
			if ($partition === null)
			{
				if ($dataset['dat_partition_mandatory'] && !$this->fromDraft)
					throw new ErrorException("Debe indicarse un valor de particionado.");
			}
			else
			{
				$where .= 'AND ' . $dataset['partition_column_field'] . ' = ' . intval($partition);
			}
		}

		// Agrega columnas del dataset
		$cols = $datasetModel->GetDatasetColumns($dataset['id'], false, $this->fromDraft);

		// Agrega columnas extra
		$effectiveGeographyId = $dataset['dat_geography_id'];
		$geoColumns = $this->CreateExtraColumns($dataset, $joins, $effectiveGeographyId, 'geography_item_id', $getPolygon);

		if ($dataset['dat_are_segments'])
		{
			$effectiveGeographyId = $dataset['dat_geography_segment_id'];
			$endSegmentColumns = $this->CreateExtraColumns($dataset, $joins, $effectiveGeographyId, 'geography_item_segment_id', false);

			$this->AppendSuffixes($geoColumns, 'inicio', '(inicio de segmento)');
			$this->AppendSuffixes($endSegmentColumns, 'fin', '(fin de segmento)');

			$geoColumns = array_merge($geoColumns, $endSegmentColumns);
		}
		$cols = array_merge($cols, $geoColumns);

		if ($getPolygon)
			$this->AppendPolygon($cols, $dataset, $getPolygon, $requiresSna);

		// Arma el query
		$cols = $this->Deduplicate($cols);
		$wherePart = ($where !== '' ? ' WHERE ' . substr($where, 4) : '');
		if ($requiresSna)
			$joins .= " JOIN " . SnapshotByDatasetModel::SnapshotTable($dataset['table']) . " ON _data_table.Id = sna_id ";

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

	private function AppendSuffixes(&$cols, $nameSuffix, $captionSuffix)
	{
		foreach($cols as &$col)
		{
			$col['variable'] .= '_' . $nameSuffix;
			$col['caption'] .= ' ' . $captionSuffix;
		}
	}

	private function CreateExtraColumns($dataset, &$joins, &$effectiveGeographyId, $matchField, $getPolygonType)
	{
		$cols = [];
		if ($this->extraColumns == 'basic' || ($getPolygonType != null &&
			$this->extraColumns !== null))
		{
			// agrega los joins para columnas extra y/o para getPolygon:
			$fullMatchField = '_data_table.' . $matchField;
			$includeGeographyOtherColumns = $dataset['dat_type'] == 'D';
			$cols = $this->AppendGeographyTree($cols, $joins, $effectiveGeographyId, $fullMatchField, $includeGeographyOtherColumns);

			if($dataset['dat_type'] == 'S')
				$cols = $this->AppendShapeColumns($cols);
		}
		return $cols;
	}

	private function AppendPolygon(&$cols, $dataset, $getPolygonType, &$requiresSna)
	{
		if($dataset['dat_are_segments'])
		{
			$requiresSna = true;
			$polygonField = 'sna_segment';
		}
		else if ($dataset['dat_type'] == 'S')
			$polygonField = '(_data_table.geometry)';
		else
			$polygonField = 't1_level1.gei_geometry_r6';

		$cols = $this->AppendPolygonColumn($cols, $polygonField, $getPolygonType);
		$this->wktIndex = count($cols) - 1;
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

	public function GetExtraStateInfo($datasetId)
	{
		Profiling::BeginTimer();

		$sql = 'SELECT lat.dco_variable as lat,
										lng.dco_variable as lon,
										latSegment.dco_variable as latSegment,
										lngSegment.dco_variable as lonSegment,
										dat_are_segments as areSegments
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

