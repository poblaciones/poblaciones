<?php

namespace helena\services\frontend;

use minga\framework\Performance;
use minga\framework\Profiling;
use minga\framework\Arr;

use helena\entities\frontend\clipping\FeaturesInfo;
use helena\classes\App;
use helena\classes\GlobalTimer;

use helena\services\frontend\SelectedMetricService;

use helena\caches\TileDataCache;
use helena\caches\MetricDataCache;
use helena\services\common\BaseService;
use helena\db\frontend\SnapshotBoundaryVersionItemModel;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;

use helena\db\frontend\SnapshotByDatasetTileData;
use helena\db\frontend\SnapshotByDatasetCompareTileData;
use helena\entities\frontend\clipping\TileDataInfo;
use helena\entities\frontend\geometries\Envelope;


class TableService extends BaseService
{
	public function GetRegion($boundaryVersionId, $includedGeographyRelations)
	{
		$ret = $this->CalculateRegion($boundaryVersionId);
		// Trae la descedencia...
		if ($includedGeographyRelations && sizeof($includedGeographyRelations) > 0)
		{
			foreach($includedGeographyRelations as $geographyId)
			{
				$ret['GeographyRelations'][$geographyId] = $this->GetRegionGeographyRelations($boundaryVersionId, $geographyId);
			}

		}
		return $ret;
	}

	public function GetRegionGeographyRelations($boundaryVersionId, $includedGeographyRelations, $includeCodes = false)
	{
		$ret = [];
		foreach ($includedGeographyRelations as $geographyId)
		{
			$relations = $this->CalculateGeographyRelations($boundaryVersionId, $geographyId, $includeCodes);
			$ret[$geographyId] = $relations;
		}
		return $ret;
	}

	private function CalculateGeographyRelations($boundaryVersionId, $geographyId, $includeCodes)
	{
		$table = new SnapshotBoundaryVersionItemModel($boundaryVersionId);
		$table->getGeometries = false;
		$table->getCaption = false;

		if (!$this->GeographyIsChildOfBoundaryVersion($boundaryVersionId, $geographyId)) {
			return [];
		}

		$rows = $table->GetAllRowsJoinWithGeography($geographyId, $includeCodes === false);

		return Arr::FromSortedToKeyedArrays($rows, 'FID', 'GID');
	}
	private function GeographyIsChildOfBoundaryVersion($boundaryVersionId, $geographyId) {
		$matches = App::Db()->fetchScalarInt("
			SELECT COUNT(*) FROM boundary_version_clipping_region
			INNER JOIN clipping_region self ON self.clr_id = bcr_clipping_region_id
			LEFT JOIN clipping_region parent1 ON parent1.clr_parent_id = self.clr_id
			LEFT JOIN clipping_region parent2 ON parent2.clr_parent_id = parent1.clr_id
			LEFT JOIN clipping_region parent3 ON parent3.clr_parent_id = parent2.clr_id
			LEFT JOIN clipping_region parent4 ON parent4.clr_parent_id = parent3.clr_id
			LEFT JOIN clipping_region parent5 ON parent5.clr_parent_id = parent4.clr_id
			INNER JOIN clipping_region_geography ON crg_clipping_region_id
			  IN (self.clr_id, parent1.clr_id, parent2.clr_id, parent3.clr_id , parent4.clr_id, parent5.clr_id)
			WHERE bcr_boundary_version_id = ? AND crg_geography_id = ?;", [$boundaryVersionId, $geographyId]);
		return $matches > 0;
	}

	private function CalculateRegion($boundaryVersionId)
	{
		$table = new SnapshotBoundaryVersionItemModel($boundaryVersionId);
		$table->getGeometries = false;
		$rows = $table->GetAllRows();

		$ret = ['Items' => $rows, 'Id' => (int) $boundaryVersionId, 'GeographyRelations' => []];
		return $ret;
	}

	public function GetMetricData($metricId, $metricVersionId, $levelId)
	{
		return $this->CalculateMetricData($metricId, $metricVersionId, $levelId);
	}

	private function CalculateMetricData($metricId, $metricVersionId, $levelId)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);

		$hasDescriptions = false;
		$hasSymbols = false;

		$urbanity = null;
		$partition = null;

		$table = new SnapshotByDatasetTileData(
			$snapshotTable,
			$level->Dataset->Id, $level->Dataset->Type, $level->Dataset->AreSegments, $level->Variables,
			$urbanity,
			$partition,
			$hasSymbols,
			$hasDescriptions
		);
		$table->getAreas = true;
		$table->getGeometries = false;

		$rows = $table->GetAllRows();

		return $rows;
	}


}

