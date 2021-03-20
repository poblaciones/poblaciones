<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\DatasetItemModel;
use helena\db\frontend\MetricVersionModel;

use helena\db\frontend\SnapshotByDatasetNeighbors;
use helena\classes\Session;
use helena\entities\frontend\metric\NavigationInfo;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;


class InfoWindowService extends BaseService
{

	public function GetLabelInfo($featureId)
	{
		$featureId = floatval($featureId);
		$datasetModel = new DatasetModel();

		$datasetId = intval($featureId / 0x100000000);
		$id = $featureId & 0xFFFFFFFF;
		if (!Session::IsWorkPublicOrAccessibleByDataset($datasetId))
		{
			throw Session::NotEnoughPermissions();
		}
		$info = $datasetModel->GetInfoById($datasetId, $id);

		return $info;
	}

	public function GetLabelInfoDefaultMetric($featureId)
	{
		$featureId = floatval($featureId);

		$datasetId = intval($featureId / 0x100000000);
		$id = $featureId & 0xFFFFFFFF;
		if (!Session::IsWorkPublicOrAccessibleByDataset($datasetId))
		{
			throw Session::NotEnoughPermissions();
		}
		$metricVersionModel = new MetricVersionModel();
		$metricId = $metricVersionModel->GetMetricByDatasetId($datasetId);

		return $metricId;
	}

	public function GetMetricItemInfo($featureId, $metricId, $variableId)
	{
		$featureId = floatval($featureId);
		$datasetModel = new DatasetModel();
		$selectedService = new SelectedMetricService();

		$metric = $selectedService->GetSelectedMetric($metricId, true, true);
		$variable = null;
		$level = $metric->GetLevelAndVariableByVariableId($variableId, $variable);

		$datasetId = $level->Dataset->Id;
		$datasetType = $level->Dataset->Type;

		if (!Session::IsWorkPublicOrAccessibleByDataset($datasetId))
		{
			throw Session::NotEnoughPermissions();
		}
		// Según el tipo de Dataset, el FID puede ser el geographyItemId o el Id en el dataset
		if ($datasetType === 'L' || $datasetType === 'S')
		{
			$id = $featureId & 0xFFFFFFFF;
			$info = $datasetModel->GetInfoById($datasetId, $id);
		}
		else
		{
			$info = $datasetModel->GetInfoByGeographyItemId($datasetId, $featureId);
		}
		return $info;
	}

	public function GetMetricNavigationInfo($metricId, $variableId, $frame, $urbanity, $hiddenValueLabels)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId, true, true);
		$variable = null;
		$level = $metric->GetLevelAndVariableByVariableId($variableId, $variable);

		// Anexa los subsiguientes
		return $this->CalculateNavigationInfo($frame, $level, $variable, $urbanity, $hiddenValueLabels);
	}

	private function CalculateNavigationInfo($frame, $level, $variable, $urbanity, $hiddenValueLabels)
	{
		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);
		$table = new SnapshotByDatasetNeighbors($snapshotTable);

		$geographyId = $level->GeographyId;

		if ($frame->ClippingCircle != NULL)
		{
			$rows = $table->GetMetricVersionNeighborsByCircle($geographyId, $variable, $urbanity, $frame->ClippingCircle, $level->Dataset->Type, $hiddenValueLabels);
		}
		else if ($frame->ClippingRegionIds != NULL)
		{
			$rows = $table->GetMetricVersionNeighborsByRegionIds($geographyId, $variable, $urbanity, $frame->ClippingRegionIds, $frame->ClippingCircle, $level->Dataset->Type, $hiddenValueLabels);
		}
		else
		{
			$rows = $table->GetMetricVersionNeighborsByEnvelope($geographyId, $variable, $urbanity, $frame->Envelope, $level->Dataset->Type, $hiddenValueLabels);
		}
		return $this->CreateInfo($rows, $variable);
	}
	private function CreateInfo($rows, $variable)
	{
		$ret = [];
		$lastCategory = null;
		$currentCount = 1;
		$isSequence = $variable->IsSequence;

		foreach($rows as $row)
		{
			$item = ['FID' => $row['FeatureId'],
								'Coordinate' => new Coordinate($row['Lat'], $row['Lon']),
								'Envelope' => Envelope::FromDb($row['Envelope']) ];
			if ($isSequence)
			{
				$value = $row['ValueId'];
				$item['ValueId'] = $value;
				if ($lastCategory !== $value)
				{
					$lastCategory = $value;
					$currentCount = 1;
				}
				$item['Sequence'] = $row['Sequence'];
			}
			$item['Pos'] = $currentCount;
			$ret[] = $item;
			$currentCount++;
		}
		return $ret;
	}
}

