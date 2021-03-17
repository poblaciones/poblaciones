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

class BoundaryDownloadModel extends BaseDownloadModel
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
	private function draftPreffix()
	{
		return ($this->fromDraft ? 'draft_' : '');
	}
	public function PrepareFileQuery($boundaryId, $getPolygon)
	{
		Profiling::BeginTimer();
		$params = array();

		$boundary = $this->GetBoundaryById($boundaryId);

		$where = '';
		$joins = ' ';

		$effectiveGeographyId = $dataset['bou_geography_id'];

		$cols = array();

		DatasetModel::GetCustomCol();

		(SUBSELECT geography_item_id)
		$this->AppendExtraColumns($cols, $joins, $effectiveGeographyId, $getPolygon);


		$cols = array_merge($cols, $this->GetBoundaryColumns());
		biw_caption
		biw_code

		$cols = $this->Deduplicate($cols);

		$wherePart = ($where !== '' ? ' WHERE ' . substr($where, 4) : '');

		$query = ' FROM snapshot_boundary_item AS spss1 ' . $joins . $wherePart;

		$fullSql = 'SELECT ' . $this->GetFields($cols) . $query;
		$countSql = 'SELECT COUNT(*) ' . $query;

		$this->fullQuery = $fullSql;
		$this->countQuery = $countSql;
		$this->fullParams = $params;
		$this->fullCols = $cols;
		$this->prepared = true;

		Profiling::EndTimer();
	}

	private function AppendPolygon($cols, $getPolygon)
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

		$cols[] = $this->GetCustomCol($fn . '(spss1.geometry)', $varName, 'Geometría en ' . $varName,
				Format::A, 10, null, 0, Measurement::Nominal, Alignment::Left);
		return $cols;
	}

	private function AppendExtraColumns(&$cols, &$joins, &$effectiveGeographyId, $getPolygon)
	{
		// agrega los joins para columnas extra y/o para getPolygon:
		$cols = $this->AppendGeographyTree($cols, $joins, $effectiveGeographyId);

		// se fija si van con polígono
		if ($getPolygon != null)
		{
			$cols = $this->AppendPolygon($cols, $getPolygon);
			$this->wktIndex = count($cols) - 1;
		}
	}




}

