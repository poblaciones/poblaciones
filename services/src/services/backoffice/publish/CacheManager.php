<?php

namespace helena\services\backoffice\publish;

use helena\caches\DownloadCache;
use helena\caches\DatasetShapesCache;
use helena\caches\FabMetricsCache;
use helena\caches\SelectedMetricsMetadataCache;
use helena\caches\MetricGroupsMetadataCache;
use helena\caches\MetricProvidersMetadataCache;
use helena\caches\DatasetColumnCache;
use helena\caches\WorkHandlesCache;
use helena\caches\BoundaryCache;
use helena\caches\SelectedBoundaryCache;
use helena\caches\BoundaryVisiblityCache;
use helena\caches\BoundaryDownloadCache;
use helena\caches\BoundarySummaryCache;
use helena\caches\ClippingCache;
use helena\caches\RankingCache;
use helena\caches\BackofficeDownloadCache;
use helena\caches\PdfMetadataCache;
use helena\caches\DictionaryMetadataCache;

use helena\caches\WorkVisiblityCache;

use helena\caches\SummaryCache;
use helena\caches\TileDataCache;
use helena\caches\LayerDataCache;
use helena\caches\GeographyCache;
use helena\caches\LabelsCache;

use helena\db\backoffice\WorkModel;

class CacheManager
{
	// Dataset
	public function ClearDataset($datasetId)
	{
		$this->ClearDatasetMetaData($datasetId);
		$this->ClearDatasetData($datasetId);
	}

	public function ClearDatasetData($datasetId)
	{
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);
		DatasetShapesCache::Cache()->Clear($datasetIdShardified);
	}

	public function ClearDatasetMetaData($datasetId)
	{
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);
		DownloadCache::Cache()->Clear($datasetIdShardified);
	}

	public function CleanPdfMetadata($metadataId)
	{
		$metadataIdShardified = PublishDataTables::Shardified($metadataId);
		PdfMetadataCache::Cache()->Clear($metadataIdShardified);
		DictionaryMetadataCache::Cache()->Clear($metadataIdShardified);
		SelectedBoundaryCache::Cache()->Clear();
	}

	public function CleanFabMetricsCache()
	{
		FabMetricsCache::Cache()->Clear();
		self::CleanMetricProvidersMetadataCache();
	}

	public function CleanWorkHandlesCache($workId)
	{
		WorkHandlesCache::Cache()->Clear($workId);
	}
	public function CleanWorkVisiblityCache($workId)
	{
		$workIdShardified = PublishDataTables::Shardified($workId);
		WorkVisiblityCache::Cache()->Clear($workIdShardified);
	}
	public function CleanGeographyCache()
	{
		GeographyCache::Cache()->Clear();
	}
	public function CleanClippingCache()
	{
		ClippingCache::Cache()->Clear();
		WorkHandlesCache::Cache()->Clear();
	}
	public function CleanLabelsCache()
	{
		LabelsCache::Cache()->Clear();
	}
	public function CleanBoundariesCache()
	{
		$this->CleanBoundariesMetadataCache();
		BoundaryCache::Cache()->Clear();
		BoundaryDownloadCache::Cache()->Clear();
		BoundarySummaryCache::Cache()->Clear();
	}
	public function CleanBoundariesMetadataCache()
	{
		SelectedBoundaryCache::Cache()->Clear();
		BoundaryVisiblityCache::Cache()->Clear();
	}
	public function CleanSelectedMetricCache()
	{
		FabMetricsCache::Cache()->Clear();
		SelectedMetricsMetadataCache::Cache()->Clear();
		self::CleanMetricGroupsMetadataCache();
		self::CleanMetricProvidersMetadataCache();
	}
	public function CleanAllMetricCaches()
	{
		SummaryCache::Cache()->Clear();
		TileDataCache::Cache()->Clear();
		LayerDataCache::Cache()->Clear();
		RankingCache::Cache()->Clear();
		DatasetColumnCache::Cache()->Clear();
		BackofficeDownloadCache::Cache()->Clear();
		DatasetShapesCache::Cache()->Clear();
		DownloadCache::Cache()->Clear();
		FabMetricsCache::Cache()->Clear();
		SelectedMetricsMetadataCache::Cache()->Clear();
	}
	public function CleanMetricGroupsMetadataCache()
	{
		MetricGroupsMetadataCache::Cache()->Clear();
	}
	public function CleanMetricProvidersMetadataCache()
	{
		MetricProvidersMetadataCache::Cache()->Clear();
	}

	// Metric
	public function ClearWorkSelectedMetricMetadata($workId)
	{
		$publicWorkModel = new WorkModel(false);
		$workIdShardified = PublishDataTables::Shardified($workId);
		$metricVersions = PublishDataTables::UnshardifyList($publicWorkModel->GetMetricVersions($workIdShardified),
																																				array('mvr_metric_id'));
		foreach($metricVersions as $row)
		{
			$this->ClearMetricMetadata($row['mvr_metric_id']);
		}
	}
	public function ClearSelectedMetricMetadata($metricId)
	{
		$metricIdShardified = PublishDataTables::Shardified($metricId);
		SelectedMetricsMetadataCache::Cache()->Clear($metricIdShardified);
	}
	public function ClearMetricMetadata($metricId)
	{
		$metricIdShardified = PublishDataTables::Shardified($metricId);
		SummaryCache::Cache()->Clear($metricIdShardified);
		TileDataCache::Cache()->Clear($metricIdShardified);
		LayerDataCache::Cache()->Clear($metricIdShardified);
		RankingCache::Cache()->Clear($metricIdShardified);
		SelectedMetricsMetadataCache::Cache()->Clear($metricIdShardified);
	}
}