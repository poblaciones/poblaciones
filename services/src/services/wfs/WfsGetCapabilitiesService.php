<?php

namespace helena\services\wfs;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\PublicException;

class WfsGetCapabilitiesService extends BaseService
{
	public function GetCapabilities()
	{
		$catalog = WfsCatalogCache::GetCatalog();
		if ($catalog === null)
			throw new PublicException("No se pudo obtener el catálogo de métricas.");

		// Reúne todos los metadatos de métricas públicas en batches
		$layerDescs = $this->BuildLayerDescriptors($catalog);

		$xml = $this->BuildXml($layerDescs);
		return App::Response($xml, 'application/xml; charset=UTF-8');
	}

	private function BuildLayerDescriptors($catalog)
	{
		$descriptors = [];

		// Recopila métricas evitando duplicados (el grupo "más consultados" repite métricas de otros grupos).
		// En cada grupo, Items está indexado por proveedor.
		$metricIds   = [];
		$metricsMeta = [];
		$metricsGroup = []; // Id => nombre del grupo para el abstract
		foreach ($catalog['Metrics'] as $group)
		{
			if (strpos($group['Icon'] ?? '', 'fa-star') !== false) continue; // grupo "más consultados", omitir

			$groupName = $group['Name'] ?? '';
			foreach ($group['Items'] ?? [] as $providerMetrics)
			{
				foreach ($providerMetrics as $metric)
				{
					$mid = $metric['Id'];
					if (isset($metricsMeta[$mid])) continue; // deduplicar
					$metricIds[]       = $mid;
					$metricsMeta[$mid] = $metric;
					$metricsGroup[$mid] = $groupName;
				}
			}
		}

		// Determina cuáles necesitan refresh por Signature
		$needFetch = [];
		foreach ($metricIds as $mid)
		{
			$catalogSignature = isset($metricsMeta[$mid]['Signature'])
				? (int)$metricsMeta[$mid]['Signature']
				: null;

			if ($catalogSignature === null)
			{
				if (WfsSelectedMetricCache::GetStoredSignature($mid) === null)
					$needFetch[] = $mid;
			}
			else
			{
				$storedSignature = WfsSelectedMetricCache::GetStoredSignature($mid);
				if ($storedSignature === null || $storedSignature !== $catalogSignature)
					$needFetch[] = $mid;
			}
		}

		if (!empty($needFetch))
			WfsSelectedMetricCache::FetchBatch($needFetch);

		// Construye los descriptores usando Tag si está disponible, o sanitizando el Name
		foreach ($metricIds as $mid)
		{
			$meta = WfsSelectedMetricCache::GetCached($mid);
			if ($meta === null) continue;

			$metricName = $meta['Metric']['Name'] ?? "Métrica {$mid}";
			$metricTag  = $meta['Metric']['Tag'] ?? null;
			$groupName  = $metricsGroup[$mid] ?? '';

			foreach ($meta['Versions'] as $versionData)
			{
				$version = $versionData['Version'];
				if ($version['WorkIsPrivate']) continue;

				foreach ($versionData['Levels'] as $level)
				{
					$typeName = WfsTypeName::ForMetricFriendly($metricTag, $version['Name'], $level['Name']);
					$abstract = $groupName !== ''
						? $groupName . ' - ' . ($level['Dataset']['Name'] ?? '')
						: ($level['Dataset']['Name'] ?? '');

					$descriptors[] = [
						'typeName' => $typeName,
						'title'    => $metricName . ' (' . $version['Name'] . ') - ' . $level['Name'],
						'abstract' => $abstract,
						'minZoom'  => $level['MinZoom'] ?? 0,
						'maxZoom'  => $level['MaxZoom'] ?? 22,
					];
				}
			}
		}

		// Boundaries
		foreach ($catalog['Boundaries'] ?? [] as $group)
		{
			if (($group['Icon'] ?? '') === 'star') continue;
			$groupName = $group['Name'] ?? '';
			foreach ($group['Items'] ?? [] as $boundary)
			{
				foreach ($boundary['Versions'] ?? [] as $version)
				{
					if ($version['WorkIsPrivate']) continue;
					$descriptors[] = [
						'typeName' => WfsTypeName::ForBoundary($boundary['Id'], $version['Id']),
						'title'    => $boundary['Name'] . ' (' . $version['Name'] . ')',
						'abstract' => $groupName !== '' ? $groupName . ' - Delimitación geográfica' : 'Delimitación geográfica',
					];
				}
			}
		}

		return $descriptors;
	}

	private function BuildXml($layers)
	{
		$base = WfsGml::Escape(WfsConfig::GetWfsBaseUrl());
		$pfx  = WfsConfig::NAMESPACE_PREFIX;
		$ns   = WfsGml::Escape(WfsConfig::GetWfsNamespaceUri());
		$xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
		$xml .= '<WFS_Capabilities version="2.0.0"'
			. ' xmlns="http://www.opengis.net/wfs/2.0"'
			. ' xmlns:ows="http://www.opengis.net/ows/1.1"'
			. ' xmlns:xlink="http://www.w3.org/1999/xlink"'
			. ' xmlns:' . $pfx . '="' . $ns . '">' . "\n";

		// Service identification
		$xml .= "<ows:ServiceIdentification>\n"
			. "  <ows:Title>Poblaciones WFS</ows:Title>\n"
			. "  <ows:Abstract>Indicadores sociodemográficos de Argentina</ows:Abstract>\n"
			. "  <ows:ServiceType>WFS</ows:ServiceType>\n"
			. "  <ows:ServiceTypeVersion>2.0.0</ows:ServiceTypeVersion>\n"
			. "  <ows:Fees>NONE</ows:Fees>\n"
			. "  <ows:AccessConstraints>NONE</ows:AccessConstraints>\n"
			. "</ows:ServiceIdentification>\n";

		// Operations metadata
		$xml .= "<ows:OperationsMetadata>\n";
		foreach (['GetCapabilities', 'DescribeFeatureType', 'GetFeature'] as $op)
		{
			$xml .= "  <ows:Operation name=\"{$op}\">\n"
				. "    <ows:DCP><ows:HTTP><ows:Get xlink:href=\"{$base}\"/></ows:HTTP></ows:DCP>\n";
			if ($op === 'GetFeature')
			{
				// GML 3.2 primero y sin DefaultValue: la ausencia de outputFormat significa GML.
				$xml .= "    <ows:Parameter name=\"outputFormat\"><ows:AllowedValues>\n"
					. "      <ows:Value>application/gml+xml; version=3.2</ows:Value>\n"
					. "      <ows:Value>application/json</ows:Value>\n"
					. "    </ows:AllowedValues></ows:Parameter>\n";
			}
			$xml .= "  </ows:Operation>\n";
		}
		$xml .= "  <ows:Constraint name=\"ImplementsTransactionalWFS\"><ows:NoValues/><ows:DefaultValue>FALSE</ows:DefaultValue></ows:Constraint>\n";
		$xml .= "</ows:OperationsMetadata>\n";

		// Feature types
		$xml .= "<FeatureTypeList>\n";
		foreach ($layers as $layer)
		{
			$title    = WfsGml::Escape($layer['title']);
			$abstract = WfsGml::Escape($layer['abstract']);
			$name     = WfsGml::Escape(WfsTypeName::Qualified($layer['typeName']));
			$xml .= "  <FeatureType>\n"
				. "    <Name>{$name}</Name>\n"
				. "    <Title>{$title}</Title>\n"
				. "    <Abstract>{$abstract}</Abstract>\n"
				. "    <DefaultCRS>" . WfsConfig::CRS_URN . "</DefaultCRS>\n"
				. "    <ows:WGS84BoundingBox>\n"
				. "      <ows:LowerCorner>" . WfsConfig::ARG_MIN_LON . " " . WfsConfig::ARG_MIN_LAT . "</ows:LowerCorner>\n"
				. "      <ows:UpperCorner>" . WfsConfig::ARG_MAX_LON . " " . WfsConfig::ARG_MAX_LAT . "</ows:UpperCorner>\n"
				. "    </ows:WGS84BoundingBox>\n"
				. "  </FeatureType>\n";
		}
		$xml .= "</FeatureTypeList>\n";
		$xml .= "</WFS_Capabilities>\n";
		return $xml;
	}
}
