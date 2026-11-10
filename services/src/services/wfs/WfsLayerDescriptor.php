<?php

namespace helena\services\wfs;

use minga\framework\PublicException;

// Resuelve un WfsTypeName en la información completa del nivel:
// levelId, datasetType, geographyId, variables, nombre, etc.
class WfsLayerDescriptor
{
	public $MetricId;
	public $Tag;
	public $VersionId;
	public $LevelId;
	public $LevelName;
	public $DatasetType;   // WfsDatasetType::CENSUS / SHAPES / POINTS
	public $GeographyId;   // solo para tipo CENSUS
	public $DatasetId;     // solo para tipo SHAPES
	public $Variables;     // array de ['Id', 'Name', 'ShortName', 'Normalization', ...]
	public $MetricName;
	public $VersionName;
	public $Signature;
	public $MinZoom;
	public $MaxZoom;

	// Carga la información completa desde GetSelectedMetric para el typeName dado
	public static function FromTypeName(WfsTypeName $typeName)
	{
		if ($typeName->Type !== WfsTypeName::TYPE_METRIC)
			throw new PublicException("FromTypeName solo aplica a capas de métricas.");

		// El typeName amigable tiene MetricTag+VersionSlug+LevelSlug.
		// Hay que buscar en el caché de métricas cuál coincide.
		$descriptor = self::ResolveFromSlugs(
			$typeName->MetricTag,
			$typeName->VersionSlug,
			$typeName->LevelSlug
		);

		if ($descriptor === null)
			throw new PublicException("No se encontró la capa: {$typeName->LocalName}");

		return $descriptor;
	}

	// Busca en todos los selectedMetric cacheados el que coincide con los slugs dados.
	// Si no se encuentra (caché frío), hace un GetCapabilities para poblar el caché y reintenta.
	private static function ResolveFromSlugs($metricTag, $versionSlug, $levelSlug)
	{
		$descriptor = self::SearchInCache($metricTag, $versionSlug, $levelSlug);
		if ($descriptor !== null)
			return $descriptor;

		// Caché frío: fuerza poblar el catálogo completo y reintenta
		(new WfsGetCapabilitiesService())->GetCapabilities();
		return self::SearchInCache($metricTag, $versionSlug, $levelSlug);
	}

	private static function SearchInCache($metricTag, $versionSlug, $levelSlug)
	{
		$cacheDir = WfsConfig::GetSqliteCacheDir();
		foreach (glob($cacheDir . '/meta_*.json') as $path)
		{
			$meta = json_decode(file_get_contents($path), true);
			if ($meta === null) continue;

			$storedTag  = $meta['Metric']['Tag'] ?? null;
			$metricName = $meta['Metric']['Name'] ?? '';
			$candidate  = WfsTypeName::TagSlug($storedTag ?? $metricName);

			if ($candidate !== $metricTag) continue;

			foreach ($meta['Versions'] ?? [] as $versionData)
			{
				$version = $versionData['Version'];
				if (WfsTypeName::Sanitize($version['Name']) !== $versionSlug) continue;

				foreach ($versionData['Levels'] ?? [] as $level)
				{
					if (WfsTypeName::Sanitize($level['Name']) !== $levelSlug) continue;

					// Encontrado — arma el descriptor
					$descriptor = new self();
					$descriptor->MetricId    = (int)$meta['Metric']['Id'];
					$descriptor->VersionId   = (int)$version['Id'];
					$descriptor->LevelId     = (int)$level['Id'];
					$descriptor->Tag		 = $metricTag;
					$descriptor->MetricName  = $metricName;
					$descriptor->VersionName = $version['Name'];
					$descriptor->LevelName   = $level['Name'];
					$descriptor->Signature   = $meta['Metric']['Signature'] ?? 0;
					$descriptor->MinZoom     = $level['MinZoom'] ?? 0;
					$descriptor->MaxZoom     = $level['MaxZoom'] ?? 22;
					$descriptor->GeographyId = $level['GeographyId'];
					$descriptor->Variables   = $level['Variables'];
					$dataset                 = $level['Dataset'];
					$descriptor->DatasetId   = (int)$dataset['Id'];
					$descriptor->DatasetType = self::ResolveDatasetType($dataset);
					return $descriptor;
				}
			}
		}
		return null;
	}

	private static function ResolveDatasetType($dataset)
	{
		$type = $dataset['Type'] ?? 'D';
		switch ($type)
		{
			case WfsDatasetType::POINTS:  return WfsDatasetType::POINTS;
			case WfsDatasetType::SHAPES:  return WfsDatasetType::SHAPES;
			default:                      return WfsDatasetType::CENSUS;
		}
	}

	// Devuelve un WfsDataCache inicializado para este descriptor
	public function MakeDataCache()
	{
		return new WfsDataCache($this->MetricId, $this->LevelId, $this->Variables, $this->DatasetType);
	}

	// Devuelve un WfsGeometryCache inicializado para este descriptor (no aplica a puntos)
	public function MakeGeometryCache()
	{
		$idForCache = $this->GeographyId;
		return new WfsGeometryCache($this->DatasetType, $idForCache);
	}
}
