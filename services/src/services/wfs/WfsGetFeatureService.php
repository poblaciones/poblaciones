<?php

namespace helena\services\wfs;

use helena\classes\GeoJson;
use helena\services\common\BaseService;
use minga\framework\PublicException;

class WfsGetFeatureService extends BaseService
{
	public function GetFeature()
	{
		$requested = WfsRequest::GetTypeNames();
		if ($requested === null || $requested === '')
			throw new PublicException("TYPENAMES es requerido.");

		$typeName = WfsTypeName::ParseRequested($requested);
		$outputFormat = WfsRequest::GetOutputFormat();
		$bbox = WfsRequest::GetBbox();
		$hits = WfsRequest::IsHits();
		$count = WfsRequest::GetInt('count', WfsRequest::GetInt('maxfeatures', 0));
		$startIndex = WfsRequest::GetInt('startindex', 0);

		if ($typeName->Type === WfsTypeName::TYPE_BOUNDARY)
			return $this->HandleBoundary($typeName, $bbox, $outputFormat, $count, $startIndex, $hits);

		return $this->HandleMetric($typeName, $bbox, $outputFormat, $count, $startIndex, $hits);
	}

	private function HandleMetric(WfsTypeName $typeName, $bbox, $outputFormat, $count, $startIndex, $hits)
	{
		$descriptor = WfsLayerDescriptor::FromTypeName($typeName);

		// 1. Garantiza que el caché de datos esté poblado y vigente
		$dataCache = $descriptor->MakeDataCache();
		if (!$dataCache->IsValid($descriptor->Signature)) {
			$ok = $dataCache->Populate($descriptor->MetricId, $descriptor->VersionId, $descriptor->LevelId, $descriptor->Signature);
			if (!$ok)
				throw new PublicException("Error al obtener datos de la métrica {$descriptor->MetricId}.");
		}

		// 2. Obtiene geometrías y datos según tipo
		if ($descriptor->DatasetType === WfsDatasetType::POINTS)
			return $this->HandlePoints($descriptor, $dataCache, $bbox, $outputFormat, $count, $startIndex, $hits);

		return $this->HandlePolygons($descriptor, $dataCache, $bbox, $outputFormat, $count, $startIndex, $hits);
	}

	private function HandlePolygons(WfsLayerDescriptor $descriptor, WfsDataCache $dataCache, $bbox, $outputFormat, $count, $startIndex, $hits)
	{
		$geomCache = $descriptor->MakeGeometryCache();

		if ($descriptor->DatasetType === WfsDatasetType::CENSUS) {
			// Para tipo CENSUS, las geometrías viven en MySQL.
			// Con BBOX: MySQL trae las geometrías que intersectan, SQLite los datos por IN.
			// Sin BBOX: llenamos el caché de geometrías si hace falta, luego join completo.
			if ($bbox !== null) {
				[$minLon, $minLat, $maxLon, $maxLat] = $bbox;
				// No se cachea el resultado parcial: evita un caché por BBOX.
				$features = WfsMysqlGeometry::FetchFeatures($descriptor, $minLat, $maxLat, $minLon, $maxLon);
				$geomRows = $this->FeaturesToGeomRows($features);
				$dataRows = $dataCache->GetRowsByIds(array_column($geomRows, 'geography_item_id'));
			} else {
				if (!$geomCache->IsPopulated()) {
					$features = WfsMysqlGeometry::FetchAllFeatures($descriptor);
					$geomCache->Populate($features);
				}
				$geomRows = $geomCache->GetAll();
				$dataRows = $dataCache->GetAllRows();
			}
		} else {
			// Tipo SHAPES: geometrías viven en el caché SQLite propio (por datasetId)
			// Las geometrías de shapes son estables por datasetId, igual que las censales por geographyId
			if (!$geomCache->IsPopulated()) {
				$features = WfsMysqlGeometry::FetchAllFeatures($descriptor);
				$geomCache->Populate($features);
			}

			if ($bbox !== null) {
				[$minLon, $minLat, $maxLon, $maxLat] = $bbox;
				$geomRows = $geomCache->GetByBbox($minLat, $maxLat, $minLon, $maxLon);
				$ids = array_column($geomRows, 'geography_item_id');
				$dataRows = $dataCache->GetRowsByIds($ids);
			} else {
				$geomRows = $geomCache->GetAll();
				$dataRows = $dataCache->GetAllRows();
			}
		}

		$total = count($geomRows);
		$geomRows = $this->ApplyPagination($geomRows, $count, $startIndex);
		return WfsFeatureWriter::WriteMetricResponse($descriptor, $geomRows, $dataRows, $outputFormat, $total, $hits);
	}

	private function HandlePoints(WfsLayerDescriptor $descriptor, WfsDataCache $dataCache, $bbox, $outputFormat, $count, $startIndex, $hits)
	{
		// Para puntos, lat/lon están en el caché SQLite de datos. No hay geomCache.
		if ($bbox !== null) {
			[$minLon, $minLat, $maxLon, $maxLat] = $bbox;
			$dataRows = $dataCache->GetPointsByBbox($minLat, $maxLat, $minLon, $maxLon);
		} else {
			$dataRows = $dataCache->GetAllRows();
		}

		$total = count($dataRows);
		// Para puntos, geomRows y dataRows son la misma tabla
		$dataRows = $this->ApplyPagination($dataRows, $count, $startIndex);
		return WfsFeatureWriter::WriteMetricResponse($descriptor, $dataRows, $dataRows, $outputFormat, $total, $hits);
	}

	private function HandleBoundary(WfsTypeName $typeName, $bbox, $outputFormat, $count, $startIndex, $hits)
	{
		$cache = new WfsGeometryCache(WfsDatasetType::SHAPES, $typeName->BoundaryVersionId);

		if (!$cache->IsPopulated()) {
			// Siempre trae el conjunto completo para que el caché quede íntegro.
			// Los filtros por BBOX se aplican después desde SQLite.
			$data = WfsRemoteClient::GetBoundaryByEnvelope($typeName->BoundaryVersionId);
			$cache->Populate($data['features']);
		}

		if ($bbox !== null) {
			[$minLon, $minLat, $maxLon, $maxLat] = $bbox;
			$geomRows = $cache->GetByBbox($minLat, $maxLat, $minLon, $maxLon);
		} else {
			$geomRows = $cache->GetAll();
		}

		$total = count($geomRows);
		$geomRows = $this->ApplyPagination($geomRows, $count, $startIndex);
		return WfsFeatureWriter::WriteBoundaryResponse($typeName->LocalName, $geomRows, $outputFormat, $total, $hits);
	}

	// Convierte features de MySQL a filas para WfsFeatureWriter (caso BBOX sin caché)
	private function FeaturesToGeomRows($features)
	{
		$rows = [];
		foreach ($features as $feature) {
			$geometry = GeoJson::LoadBinaryGeometry($feature['value']);
			$rows[] = [
				'geography_item_id' => $feature['FID'],
				'name'              => $feature['Description'] ?? '',
				'wkt'               => $geometry->ToWkt(),
				'geojson'           => $geometry->ToGeoJson(),
			];
		}
		return $rows;
	}

	private function ApplyPagination($rows, $count, $startIndex)
	{
		if ($startIndex > 0)
			$rows = array_slice($rows, $startIndex);
		if ($count > 0)
			$rows = array_slice($rows, 0, $count);
		return $rows;
	}
}
