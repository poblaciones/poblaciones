<?php

namespace helena\services\wfs;

use helena\classes\App;

class WfsFeatureWriter
{
	public static function HasPercentage($variable)
	{
		return isset($variable['Normalization']) && $variable['Normalization'] === 'O';
	}

	// Construye y devuelve la respuesta GetFeature para una capa de métricas.
	// $total es la cantidad de entidades que cumplen el filtro, antes de paginar.
	public static function WriteMetricResponse($descriptor, $geomRows, $dataRows, $outputFormat, $total, $hits)
	{
		// Indexa datos por geography_item_id para join O(1)
		$dataByGid = [];
		foreach ($dataRows as $row)
			$dataByGid[(int)$row['geography_item_id']] = $row;

		$localName = WfsTypeName::ForMetricFriendly($descriptor->Tag, $descriptor->VersionName, $descriptor->LevelName);
		$fieldNames = WfsFieldNames::ForVariables($descriptor->Variables);

		$features = [];
		if ($hits == false)
		{
			foreach ($geomRows as $geomRow)
			{
				$gid = (int)$geomRow['geography_item_id'];
				$data = null;
				if (isset($dataByGid[$gid]))
					$data = $dataByGid[$gid];

				$props = [
					WfsFieldNames::ITEM_ID => $gid,
					WfsFieldNames::NAME => self::TextOrEmpty($geomRow, 'name'),
				];
				foreach ($descriptor->Variables as $variable)
					self::AddVariableProperties($props, $variable, $fieldNames[(int)$variable['Id']], $data);

				$features[] = [
					'type' => 'Feature',
					'id' => $localName . '.' . $gid,
					'geometry' => self::MetricGeometry($descriptor, $geomRow, $data),
					'properties' => $props,
				];
			}
		}

		return self::Respond($localName, $features, $total, $hits, $outputFormat);
	}

	public static function WriteBoundaryResponse($localName, $geomRows, $outputFormat, $total, $hits)
	{
		$features = [];
		if ($hits == false)
		{
			foreach ($geomRows as $row)
			{
				$gid = (int)$row['geography_item_id'];
				$features[] = [
					'type' => 'Feature',
					'id' => $localName . '.' . $gid,
					'geometry' => self::PolygonGeometry($row),
					'properties' => [
						WfsFieldNames::ITEM_ID => $gid,
						WfsFieldNames::NAME => self::TextOrEmpty($row, 'name'),
					],
				];
			}
		}
		return self::Respond($localName, $features, $total, $hits, $outputFormat);
	}

	private static function Respond($localName, $features, $total, $hits, $outputFormat)
	{
		if (self::IsJsonFormat($outputFormat))
		{
			return App::Json([
				'type' => 'FeatureCollection',
				'numberMatched' => $total,
				'numberReturned' => count($features),
				'totalFeatures' => $total,
				'features' => $features,
				'crs' => ['type' => 'name', 'properties' => ['name' => WfsConfig::CRS_URN]],
			]);
		}

		$xml = WfsGml::Collection($localName, $features, $total, $hits == false);
		return App::Response($xml, 'application/gml+xml; version=3.2');
	}

	private static function AddVariableProperties(&$props, $variable, $name, $data)
	{
		$vid = (int)$variable['Id'];
		$value = null;
		$total = null;
		$labelId = null;
		if ($data !== null)
		{
			$value = $data["v{$vid}_value"];
			$total = $data["v{$vid}_total"];
			$labelId = $data["v{$vid}_lid"];
		}
		$props[$name] = $value;
		$props[$name . '_total'] = $total;
		$props[$name . '_lid'] = $labelId;

		if (self::HasPercentage($variable))
		{
			$percentage = null;
			if ($data !== null && (float)$total > 0)
				$percentage = round((float)$value / (float)$total * 100, 2);
			$props[$name . '_pct'] = $percentage;
		}
	}

	private static function MetricGeometry($descriptor, $geomRow, $data)
	{
		if ($descriptor->DatasetType === WfsDatasetType::POINTS)
		{
			if ($data === null || $data['lat'] === null || $data['lon'] === null)
				return null;
			return ['type' => 'Point', 'coordinates' => [(float)$data['lon'], (float)$data['lat']]];
		}
		return self::PolygonGeometry($geomRow);
	}

	// Las geometrías de la base ya están en orden GeoJSON [lon, lat].
	// El tipo publicado en DescribeFeatureType es multipolígono: un polígono simple se
	// emite como multipolígono de un solo miembro para que toda la capa tenga un único tipo.
	private static function PolygonGeometry($geomRow)
	{
		if (isset($geomRow['geojson']) == false)
			return null;
		$geometry = json_decode($geomRow['geojson'], true);
		if ($geometry !== null && $geometry['type'] === 'Polygon')
			return ['type' => 'MultiPolygon', 'coordinates' => [$geometry['coordinates']]];
		return $geometry;
	}

	private static function TextOrEmpty($row, $key)
	{
		if (isset($row[$key]))
			return $row[$key];
		return '';
	}

	private static function IsJsonFormat($outputFormat)
	{
		if ($outputFormat === null)
			return false;
		return stripos($outputFormat, 'json') !== false;
	}
}
