<?php

namespace helena\services\backoffice\publish;

use helena\caches\DownloadCache;
use helena\caches\DatasetShapesCache;
use helena\caches\FrameMetricsHashCache;
use helena\caches\FabMetricsCache;
use helena\caches\MetricHashesListCache;
use helena\caches\SelectedMetricsMetadataCache;
use helena\caches\MetricGroupsMetadataCache;
use helena\caches\DatasetColumnCache;
use helena\caches\ClippingSummaryCache;
use helena\caches\ClippingCache;
use helena\caches\BackofficeDownloadCache;

use helena\caches\SummaryCache;
use helena\caches\TileDataCache;
use helena\caches\GeographyCache;
use helena\caches\LabelsCache;

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

	// Work
	public function CleanMetadataPdfCache($workId)
	{
		// TODO CleanMetadataPdfCache($row)
	}
	public function CleanFabMetricsCache()
	{
		FabMetricsCache::Cache()->Clear();
	}

	public function CleanGeographyCache()
	{
		GeographyCache::Cache()->Clear();
	}
	public function CleanClippingCache()
	{
		ClippingCache::Cache()->Clear();
		ClippingSummaryCache::Cache()->Clear();
	}
	public function CleanLabelsCache()
	{
		LabelsCache::Cache()->Clear();
	}

	public function CleanAllMetricCaches()
	{
		SummaryCache::Cache()->Clear();
		TileDataCache::Cache()->Clear();
		DatasetColumnCache::Cache()->Clear();
		ClippingSummaryCache::Cache()->Clear();
		BackofficeDownloadCache::Cache()->Clear();
		DatasetShapesCache::Cache()->Clear();
		DownloadCache::Cache()->Clear();
		FabMetricsCache::Cache()->Clear();
		SelectedMetricsMetadataCache::Cache()->Clear();
		FrameMetricsHashCache::Cache()->Clear();
		MetricHashesListCache::Cache()->Clear();
	}
	public function CleanMetricGroupsMetadataCache()
	{
		MetricGroupsMetadataCache::Cache()->Clear();
	}

	// Metric
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
		SelectedMetricsMetadataCache::Cache()->Clear($metricIdShardified);

		FrameMetricsHashCache::Cache()->Clear();
		MetricHashesListCache::Cache()->Clear();
	}
}