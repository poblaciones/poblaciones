<?php

namespace helena\services\frontend;

use helena\caches\BasemapLayersCache;
use helena\classes\BasemapLabelsModeEnum;
use helena\classes\BasemapLayerTypeEnum;
use helena\classes\Links;
use helena\db\frontend\BasemapLayerModel;
use helena\db\frontend\MetadataModel;
use helena\entities\frontend\metadata\MetadataInfo;
use helena\services\common\BaseService;
use minga\framework\Profiling;

class BasemapLayerService extends BaseService
{
	// Capas base disponibles, en el orden almacenado. Se sirve desde caché
	// de archivo; se invalida al editar capas, delimitaciones o indicadores
	// (ver CacheManager::CleanBasemapLayersCache).
	public function GetLayers()
	{
		Profiling::BeginTimer();
		$data = null;
		if (BasemapLayersCache::Cache()->HasData(BasemapLayersCache::CONFIGURATION_KEY, $data))
		{
			Profiling::EndTimer();
			return $data;
		}
		$data = $this->BuildLayers();
		BasemapLayersCache::Cache()->PutData(BasemapLayersCache::CONFIGURATION_KEY, $data);
		Profiling::EndTimer();
		return $data;
	}

	private function BuildLayers()
	{
		$model = new BasemapLayerModel();
		$ret = array();
		foreach ($model->GetLayers() as $row)
		{
			$ret[] = $this->BuildLayer($row, $model);
		}
		return $ret;
	}

	private function BuildLayer($row, $model)
	{
		$type = $row['bml_type'];
		$layer = array(
			'Id' => (int)$row['bml_id'],
			'Type' => $type,
			'Caption' => $row['bml_caption'],
			'Separator' => (bool)$row['bml_separator'],
			'Icon' => $row['bml_icon'],
			'RouteTag' => $row['bml_route_tag'],
			'HideOnSatellite' => (bool)$row['bml_hide_on_satellite'],
			'Metadata' => null
		);
		if ($type === BasemapLayerTypeEnum::Metric)
		{
			$this->FillMetricLayer($layer, $row, $model);
		}
		if ($type === BasemapLayerTypeEnum::Boundary)
		{
			$this->FillBoundaryLayer($layer, $row, $model);
		}
		if ($type === BasemapLayerTypeEnum::Raster)
		{
			$this->FillRasterLayer($layer, $row);
		}
		if ($type === BasemapLayerTypeEnum::Labels)
		{
			$layer['Metadata'] = $this->BuildMetadataReference($row['bml_metadata_id'], null, null, null);
		}
		return $layer;
	}

	private function FillMetricLayer(&$layer, $row, $model)
	{
		$metricIds = $this->ParseIds($row['bml_item_ids']);
		$layer['MetricIds'] = $metricIds;
		$layer['DynamicWidth'] = (bool)$row['bml_dynamic_width'];
		$layer['LineWidth'] = $row['bml_line_width'];
		$layer['DashedLine'] = (bool)$row['bml_dashed_line'];
		$layer['Labels'] = $this->LabelsModeToName($row['bml_labels_mode']);
		$layer['Aliases'] = $this->ParseAliases($row['bml_aliases']);

		$ownMetadataId = $row['bml_metadata_id'];
		$workId = null;
		$metadataId = $ownMetadataId;
		if ($ownMetadataId === null && sizeof($metricIds) > 0)
		{
			$work = $model->GetMetricWork($metricIds[0]);
			if ($work !== null)
			{
				$workId = (int)$work['WorkId'];
				$metadataId = $work['MetadataId'];
			}
		}
		$layer['Metadata'] = $this->BuildMetadataReference($metadataId, $workId, null, null);
	}

	private function FillBoundaryLayer(&$layer, $row, $model)
	{
		$boundaryIds = $this->ParseIds($row['bml_item_ids']);
		$layer['BoundaryIds'] = $boundaryIds;
		$boundaryId = null;
		$versionId = null;
		$metadataId = null;
		if (sizeof($boundaryIds) > 0)
		{
			$boundaryId = $boundaryIds[0];
			$version = $model->GetLatestBoundaryVersion($boundaryId);
			if ($version !== null)
			{
				$versionId = (int)$version['VersionId'];
				$metadataId = $version['MetadataId'];
			}
		}
		$layer['Metadata'] = $this->BuildMetadataReference($metadataId, null, $boundaryId, $versionId);
	}

	private function FillRasterLayer(&$layer, $row)
	{
		$layer['Raster'] = array(
			'Url' => $row['bml_raster_url'],
			'Tms' => (bool)$row['bml_raster_tms'],
			'MaxNativeZoom' => $this->NullableInt($row['bml_raster_max_native_zoom']),
			'MaxZoom' => $this->NullableInt($row['bml_raster_max_zoom']),
			'Opacity' => $this->NullableInt($row['bml_raster_opacity'])
		);
		$layer['Metadata'] = $this->BuildMetadataReference($row['bml_metadata_id'], null, null, null);
	}

	// Metadatos de la capa con el formato de MetadataInfo (el que usan los popups de
	// metadatos del mapa) más lo necesario para armar los vínculos: la cartografía dueña
	// (solo cuando el metadata es el de un indicador) y la delimitación con su última
	// versión (solo en delimitaciones). Nulo si la capa no tiene metadatos.
	private function BuildMetadataReference($metadataId, $workId, $boundaryId, $boundaryVersionId)
	{
		if ($metadataId === null)
		{
			return null;
		}
		$metadataModel = new MetadataModel();
		$row = $metadataModel->GetMetadata($metadataId);
		if ($row === null)
		{
			return null;
		}
		$info = new MetadataInfo();
		$info->Fill($row);
		$info->FillFiles($metadataModel->GetMetadataFiles($metadataId));
		$info->FillInstitutions($metadataModel->GetInstitutions($metadataId));
		if ($boundaryId !== null)
		{
			$info->Ark = Links::GetBoundaryArkUrl($boundaryId);
		}
		if ($workId !== null)
		{
			$info->Ark = Links::GetWorkArkUrl($workId);
		}
		$ret = json_decode(json_encode($info), true);
		$ret['WorkId'] = $workId;
		$ret['BoundaryId'] = $boundaryId;
		$ret['BoundaryVersionId'] = $boundaryVersionId;
		return $ret;
	}

	private function ParseIds($csv)
	{
		$ret = array();
		if ($csv === null || trim($csv) === '')
		{
			return $ret;
		}
		foreach (explode(',', $csv) as $id)
		{
			$ret[] = (int)trim($id);
		}
		return $ret;
	}

	private function ParseAliases($json)
	{
		if ($json === null || trim($json) === '')
		{
			return new \stdClass();
		}
		return json_decode($json);
	}

	private function NullableInt($value)
	{
		if ($value === null)
		{
			return null;
		}
		return (int)$value;
	}

	private function LabelsModeToName($mode)
	{
		if ($mode === BasemapLabelsModeEnum::LightColor)
		{
			return 'LightColor';
		}
		if ($mode === BasemapLabelsModeEnum::SameColor)
		{
			return 'SameColor';
		}
		return 'None';
	}
}
