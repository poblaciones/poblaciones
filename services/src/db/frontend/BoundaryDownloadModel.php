<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use Doctrine\DBAL\Connection;
use PDO;
use helena\classes\App;
use minga\framework\PublicException;

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

	public function PrepareFileQuery($boundaryId, $getPolygon)
	{
		Profiling::BeginTimer();
		$params = array();

		$boundaryModel = new BoundaryModel();
		$boundary = $boundaryModel->GetBoundaryById($boundaryId);

		$joins = ' ';

		$geographyId = $boundary['bou_geography_id'];

		$cols = $this->GetBoundaryColumns();

		$this->AppendExtraColumns($cols, $joins, $geographyId, $getPolygon);

		$cols = $this->Deduplicate($cols);

		$wherePart = ' WHERE biw_boundary_id = ?';
		$params[] = $boundaryId;

		$query = ' FROM snapshot_boundary_item AS _data_table ' . $joins . $wherePart;

		$fullSql = 'SELECT ' . $this->GetFields($cols) . $query;
		$countSql = 'SELECT COUNT(*) ' . $query;

		$this->fullQuery = $fullSql;
		$this->countQuery = $countSql;
		$this->fullParams = $params;
		$this->fullCols = $cols;
		$this->prepared = true;

		Profiling::EndTimer();
	}

	private function GetBoundaryColumns()
	{
		$cols = [];
		$cols[] = self::GetCustomCol('_data_table.biw_code', 'codigo', 'Código',
			Format::A, 0, 20, 0, Measurement::Nominal, Alignment::Left);
		$cols[] = self::GetCustomCol('_data_table.biw_caption', 'nombre', 'Nombre',
			Format::A, 0, 100, 0, Measurement::Nominal, Alignment::Left);
		return $cols;
	}

	private function AppendExtraColumns(&$cols, &$joins, $geographyId, $getPolygonType)
	{
		// agrega los joins para columnas extra y/o para getPolygon:
		if ($geographyId)
		{
			$matchField = '(SELECT cgv_geography_item_id FROM snapshot_clipping_region_item_geography_item WHERE cgv_clipping_region_item_id = biw_clipping_region_item_id
														AND cgv_geography_id = ' .  $geographyId . ' LIMIT 1)';
			$cols = $this->AppendGeographyTree($cols, $joins, $geographyId, $matchField);
		}

		$cols = $this->AppendShapeColumns($cols, 'biw_');
		// se fija si van con polígono
		if ($getPolygonType != null)
		{
			$polygonField = 'biw_geometry_r1';

			$cols = $this->AppendPolygon($cols, $polygonField, $getPolygonType);
			$this->wktIndex = count($cols) - 1;
		}
	}




}

