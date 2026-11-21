<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\classes\BasemapLabelsModeEnum;
use helena\classes\BasemapLayerTypeEnum;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\CacheManager;
use helena\services\common\BaseService;
use helena\classes\VersionUpdater;
use minga\framework\Profiling;
use minga\framework\PublicException;

class BasemapLayerService extends BaseService
{
	// Letras que el BasemapRouter ya usa para el tipo de mapa y las etiquetas.
	const RESERVED_ROUTE_TAGS = array('b', 's', 'h', 'c', 'r', 'n');

	public function GetNewBasemapLayer()
	{
		$entity = new entities\BasemapLayer();
		$entity->setType(BasemapLayerTypeEnum::Metric);
		$entity->setSeparator(false);
		$entity->setHideOnSatellite(false);
		$entity->setDynamicWidth(false);
		$entity->setDashedLine(false);
		$entity->setLabelsMode(BasemapLabelsModeEnum::None);
		$entity->setRasterTms(false);
		return $entity;
	}

	public function GetBasemapLayers()
	{
		Profiling::BeginTimer();
		$layers = App::Orm()->findAll(entities\BasemapLayer::class, array('Order' => 'ASC'));
		$this->AddItemsSummary($layers);
		Profiling::EndTimer();
		return $layers;
	}

	// Indicadores publicados para elegir en las capas de tipo indicador. El filtro
	// se aplica sobre el nombre del indicador o el de la cartografía que lo publica.
	public function SearchPublishedMetrics($query)
	{
		Profiling::BeginTimer();
		$like = '%' . $query . '%';
		$sql = "SELECT DISTINCT mtr_id AS Id, mtr_caption AS Caption, met_title AS WorkCaption
					FROM metric
					JOIN metric_version ON mvr_metric_id = mtr_id
					JOIN work ON wrk_id = mvr_work_id
					JOIN metadata ON met_id = wrk_metadata_id
					WHERE mtr_caption LIKE ? OR met_title LIKE ?
					ORDER BY mtr_caption LIMIT 50";
		$ret = App::Db()->fetchAll($sql, array($like, $like));
		Profiling::EndTimer();
		return $ret;
	}

	public function UpdateBasemapLayer($layer, $hasOwnMetadata)
	{
		Profiling::BeginTimer();

		$this->NormalizeFieldsByType($layer);
		$this->Validate($layer);
		$isNew = ($layer->getId() === null);
		if ($isNew)
		{
			$layer->setOrder($this->GetNextOrder());
		}
		// Etiquetas y raster no tienen un origen del que heredar metadatos: siempre los tienen propios.
		$ownMetadataRequired = ($layer->getType() === BasemapLayerTypeEnum::Labels
			|| $layer->getType() === BasemapLayerTypeEnum::Raster);
		$ownMetadataAllowed = ($layer->getType() !== BasemapLayerTypeEnum::Boundary);
		$wantsOwnMetadata = ($ownMetadataRequired || ($ownMetadataAllowed && $hasOwnMetadata));
		$releasedMetadataId = $this->SyncMetadata($layer, $wantsOwnMetadata);

		App::Orm()->Save($layer);
		// El metadata liberado se borra recién ahora: hasta guardar, la capa lo referenciaba.
		if ($releasedMetadataId !== null)
		{
			$metadataService = new MetadataService();
			$metadataService->DeleteMetadataIfNotUsedElsewhere($releasedMetadataId);
		}

		$this->CleanCaches();
		Profiling::EndTimer();
		return array('Id' => $layer->getId(), 'MetadataId' => $this->GetMetadataId($layer));
	}

	public function DeleteBasemapLayer($layer)
	{
		Profiling::BeginTimer();
		$layerId = $layer->getId();
		$metadata = $layer->getMetadata();

		App::Db()->delete('draft_work_basemap_layer', array('wbl_layer_id' => $layerId));
		App::Db()->delete('work_basemap_layer', array('wbl_layer_id' => $layerId));
		App::Orm()->delete($layer);
		if ($metadata !== null)
		{
			$metadataService = new MetadataService();
			$metadataService->DeleteMetadataIfNotUsedElsewhere($metadata->getId());
		}

		$this->CleanCaches();
		Profiling::EndTimer();
		return self::OK;
	}

	public function MoveBasemapLayerUp($layerId)
	{
		return $this->SwapOrder($layerId, true);
	}

	public function MoveBasemapLayerDown($layerId)
	{
		return $this->SwapOrder($layerId, false);
	}

	private function SwapOrder($layerId, $up)
	{
		Profiling::BeginTimer();
		$layer = App::Orm()->find(entities\BasemapLayer::class, $layerId);

		$comparison = '>';
		$direction = 'ASC';
		if ($up)
		{
			$comparison = '<';
			$direction = 'DESC';
		}
		$sql = "SELECT bml_id FROM basemap_layer WHERE bml_order $comparison ? ORDER BY bml_order $direction LIMIT 1";
		$adjacentId = App::Db()->fetchScalarIntNullable($sql, array($layer->getOrder()));
		if ($adjacentId === null)
		{
			Profiling::EndTimer();
			return self::OK;
		}
		$adjacent = App::Orm()->find(entities\BasemapLayer::class, $adjacentId);
		$currentOrder = $layer->getOrder();
		$layer->setOrder($adjacent->getOrder());
		$adjacent->setOrder($currentOrder);
		App::Orm()->Save($layer);
		App::Orm()->Save($adjacent);

		$this->CleanCaches();
		Profiling::EndTimer();
		return self::OK;
	}

	private function GetNextOrder()
	{
		$max = App::Db()->fetchScalarIntNullable("SELECT MAX(bml_order) FROM basemap_layer");
		if ($max === null)
		{
			return 1;
		}
		return $max + 1;
	}

	private function CleanCaches()
	{
		$cacheManager = new CacheManager();
		$cacheManager->CleanBasemapLayersCache();
		VersionUpdater::Increment('FAB_METRICS');
	}

	// Deja en null los campos que no corresponden al tipo, para que un cambio de
	// tipo no arrastre configuración de otro.
	private function NormalizeFieldsByType($layer)
	{
		$type = $layer->getType();
		if ($type !== BasemapLayerTypeEnum::Metric)
		{
			$layer->setDynamicWidth(false);
			$layer->setLineWidth(null);
			$layer->setDashedLine(false);
			$layer->setLabelsMode(null);
			$layer->setAliases(null);
		}
		if ($type !== BasemapLayerTypeEnum::Metric && $type !== BasemapLayerTypeEnum::Boundary)
		{
			$layer->setItemIds(null);
		}
		if ($type !== BasemapLayerTypeEnum::Raster)
		{
			$layer->setRasterUrl(null);
			$layer->setRasterTms(false);
			$layer->setRasterMaxNativeZoom(null);
			$layer->setRasterMaxZoom(null);
			$layer->setRasterOpacity(null);
		}
		if ($type === BasemapLayerTypeEnum::Labels)
		{
			$layer->setRouteTag(null);
		}
		if (trim((string)$layer->getRouteTag()) === '')
		{
			$layer->setRouteTag(null);
		}
		if (trim((string)$layer->getAliases()) === '')
		{
			$layer->setAliases(null);
		}
	}

	private function Validate($layer)
	{
		$type = $layer->getType();
		$validTypes = array(BasemapLayerTypeEnum::Raster, BasemapLayerTypeEnum::Metric,
			BasemapLayerTypeEnum::Boundary, BasemapLayerTypeEnum::Labels);
		if (in_array($type, $validTypes, true) == false)
		{
			throw new PublicException('El tipo de capa no es válido.');
		}
		if (trim((string)$layer->getCaption()) === '')
		{
			throw new PublicException('Debe indicar el nombre de la capa.');
		}
		if ($type === BasemapLayerTypeEnum::Labels)
		{
			$this->ValidateSingleLabelsLayer($layer);
		}
		if ($type === BasemapLayerTypeEnum::Metric)
		{
			$this->ValidateItemIds($layer, 'metric', 'mtr_id', 'indicador');
			$this->ValidateAliases($layer);
		}
		if ($type === BasemapLayerTypeEnum::Boundary)
		{
			$this->ValidateItemIds($layer, 'boundary', 'bou_id', 'delimitación');
			if (sizeof(explode(',', $layer->getItemIds())) !== 1)
			{
				throw new PublicException('Una capa de delimitación toma una única delimitación.');
			}
		}
		if ($type === BasemapLayerTypeEnum::Raster)
		{
			$this->ValidateRaster($layer);
		}
		if ($type !== BasemapLayerTypeEnum::Labels)
		{
			$this->ValidateRouteTag($layer);
		}
	}

	private function ValidateSingleLabelsLayer($layer)
	{
		$sql = "SELECT COUNT(*) FROM basemap_layer WHERE bml_type = ? AND bml_id <> ?";
		$currentId = $layer->getId();
		if ($currentId === null)
		{
			$currentId = 0;
		}
		$others = App::Db()->fetchScalarInt($sql, array(BasemapLayerTypeEnum::Labels, $currentId));
		if ($others > 0)
		{
			throw new PublicException('Ya existe una capa de etiquetas. Solo puede haber una.');
		}
	}

	private function ValidateItemIds($layer, $table, $idColumn, $itemName)
	{
		$csv = trim((string)$layer->getItemIds());
		if ($csv === '')
		{
			throw new PublicException('Debe indicar al menos un ' . $itemName . '.');
		}
		$ids = array();
		foreach (explode(',', $csv) as $part)
		{
			$id = trim($part);
			if (ctype_digit($id) == false)
			{
				throw new PublicException('La lista de identificadores de ' . $itemName . ' no es válida.');
			}
			$ids[] = (int)$id;
		}
		$marks = implode(',', array_fill(0, sizeof($ids), '?'));
		$found = App::Db()->fetchScalarInt("SELECT COUNT(*) FROM $table WHERE $idColumn IN ($marks)", $ids);
		if ($found !== sizeof(array_unique($ids)))
		{
			throw new PublicException('Alguno de los identificadores de ' . $itemName . ' no existe.');
		}
		$layer->setItemIds(implode(',', $ids));
	}

	private function ValidateAliases($layer)
	{
		$aliases = $layer->getAliases();
		if ($aliases === null)
		{
			return;
		}
		$decoded = json_decode($aliases, true);
		if (is_array($decoded) == false)
		{
			throw new PublicException('Los alias deben ser un objeto JSON con el formato {"Texto":"Abreviatura"}.');
		}
	}

	private function ValidateRaster($layer)
	{
		$url = (string)$layer->getRasterUrl();
		if (strpos($url, '{z}') === false || strpos($url, '{x}') === false || strpos($url, '{y}') === false)
		{
			throw new PublicException('La URL del raster debe incluir los marcadores {z}, {x} e {y}.');
		}
		$opacity = $layer->getRasterOpacity();
		if ($opacity !== null && ($opacity < 0 || $opacity > 100))
		{
			throw new PublicException('La opacidad debe estar entre 0 y 100.');
		}
	}

	private function ValidateRouteTag($layer)
	{
		$tag = $layer->getRouteTag();
		if ($tag === null)
		{
			throw new PublicException('Debe indicar la letra de la capa para el vínculo del mapa.');
		}
		if (preg_match('/^[a-z]$/', $tag) !== 1)
		{
			throw new PublicException('La letra del vínculo debe ser una única letra minúscula, de la a a la z.');
		}
		if (in_array($tag, self::RESERVED_ROUTE_TAGS, true))
		{
			throw new PublicException("La letra '$tag' está reservada para el tipo de mapa y las etiquetas.");
		}
		$currentId = $layer->getId();
		if ($currentId === null)
		{
			$currentId = 0;
		}
		$count = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM basemap_layer WHERE bml_route_tag = ? AND bml_id <> ?", array($tag, $currentId));
		if ($count > 0)
		{
			throw new PublicException("La letra '$tag' ya está en uso por otra capa.");
		}
	}

	// Devuelve el id del metadata que quedó sin uso (para borrarlo luego de guardar la capa).
	private function SyncMetadata($layer, $wantsOwnMetadata)
	{
		$existingMetadataId = null;
		if ($layer->getId() !== null)
		{
			$existingMetadataId = App::Db()->fetchScalarIntNullable(
				"SELECT bml_metadata_id FROM basemap_layer WHERE bml_id = ?", array($layer->getId()));
		}
		if ($wantsOwnMetadata)
		{
			if ($existingMetadataId == null)
			{
				$metadataService = new MetadataService();
				$layer->setMetadata($metadataService->CreateMinimalMetadata($layer->getCaption(), null));
				return null;
			}
			$layer->setMetadata(App::Orm()->find(entities\Metadata::class, $existingMetadataId));
			return null;
		}

		if ($existingMetadataId != null)
		{
			$layer->setMetadata(null);
			return $existingMetadataId;
		}
		return null;
	}

	private function GetMetadataId($layer)
	{
		if ($layer->getMetadata() === null)
		{
			return null;
		}
		return $layer->getMetadata()->getId();
	}

	private function AddItemsSummary($layers)
	{
		$metricCaptions = $this->GetCaptionsById("SELECT mtr_id AS Id, mtr_caption AS Caption FROM metric");
		$boundaryCaptions = $this->GetCaptionsById("SELECT bou_id AS Id, bou_caption AS Caption FROM boundary");
		foreach ($layers as $layer)
		{
			$captionsById = null;
			if ($layer->getType() === BasemapLayerTypeEnum::Metric)
			{
				$captionsById = $metricCaptions;
			}
			if ($layer->getType() === BasemapLayerTypeEnum::Boundary)
			{
				$captionsById = $boundaryCaptions;
			}
			$layer->ItemsSummary = $this->BuildSummary($layer->getItemIds(), $captionsById);
		}
	}

	private function BuildSummary($itemIds, $captionsById)
	{
		if ($captionsById === null || $itemIds === null)
		{
			return '';
		}
		$captions = array();
		foreach (explode(',', $itemIds) as $id)
		{
			if (isset($captionsById[(int)$id]))
			{
				$captions[] = $captionsById[(int)$id];
			}
			else
			{
				$captions[] = '#' . $id . ' (inexistente)';
			}
		}
		return implode('; ', $captions);
	}

	private function GetCaptionsById($sql)
	{
		$ret = array();
		foreach (App::Db()->fetchAll($sql) as $row)
		{
			$ret[(int)$row['Id']] = $row['Caption'];
		}
		return $ret;
	}
}
