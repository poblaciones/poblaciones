<?php

namespace helena\services\packs;

use helena\classes\App;
use minga\framework\PublicException;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;

class GeographyService extends BaseService
{
	// Pasos del alta con GeoPackage.
	const STEP_VALIDATING = 1;
	const STEP_INSERTING = 2;
	const STEP_END = 3;

	public function GetNewGeography()
	{
		$entity = new entities\Geography();
		// Columnas NOT NULL sin campo editable en el popup de alta: valor
		// por defecto para que el alta no falle por restricción de la
		// base. Country se completa recién al importar (igual que en
		// ClippingRegion), con el país vigente en ese momento. AreaAvgM2 y
		// FieldCodeSize se recalculan con su valor real al terminar el
		// import (ver FinishGeographyImport): sin este default, el primer
		// guardado (antes de tener ítems) fallaba por violar la
		// restricción NOT NULL de la base.
		$entity->setMaxZoom(18);
		$entity->setUseForClipping(true);
		$entity->setIsTrackingLevel(false);
		$entity->setAreaAvgM2(0.0);
		$entity->setFieldCodeSize(0);
		return $entity;
	}

	// Listado plano con Level, mismo contrato que ClippingRegion. A
	// diferencia de ClippingRegion, Geography.Parent no es (todavía) una
	// relación gestionada por el mecanismo genérico de Reconnect en las
	// rutas existentes de este sistema: acá sí lo es (ver la corrección en
	// Geography.php), así que Parent llega resuelto directo desde Doctrine.
	public function GetGeographies()
	{
		Profiling::BeginTimer();
		$geographies = App::Orm()->findAll(entities\Geography::class, array('Caption' => 'ASC'));
		$ret = [];
		$roots = array();
		foreach ($geographies as $geography)
		{
			if ($geography->getParent() === null)
			{
				$roots[] = $geography;
			}
		}
		// Los de nivel 0 (relevamientos) se muestran en orden descendente
		// por su descripción (el más reciente primero, típicamente).
		usort($roots, function ($a, $b) { return strcmp($b->getCaption(), $a->getCaption()); });
		foreach ($roots as $root)
		{
			$this->InsertChildrenOf($geographies, $ret, 0, $root->getId(), $root);
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function InsertChildrenOf($geographies, &$ret, $level, $currentId, $current)
	{
		$current->Level = $level;
		$ret[] = $current;
		foreach ($geographies as $geography)
		{
			$parentObj = $geography->getParent();
			if ($parentObj !== null && $parentObj->getId() === $currentId)
			{
				$this->InsertChildrenOf($geographies, $ret, $level + 1, $geography->getId(), $geography);
			}
		}
	}

	// Igual criterio que ControlsToValues() del WinForms: el propio nivel
	// recalcula su MinZoom en base al padre, y sus hijos directos
	// recalculan el suyo en base al MaxZoom que se acaba de guardar.
	public function UpdateGeography($geography)
	{
		Profiling::BeginTimer();

		$this->ApplyMinZoom($geography);
		App::Orm()->Save($geography);
		$this->UpdateChildrenMinZoom($geography);

		$cacheManager = new CacheManager();
		$cacheManager->CleanGeographyCache();

		Profiling::EndTimer();
		return self::OK;
	}

	private function ApplyMinZoom($geography)
	{
		$parent = $geography->getParent();
		$geography->setMinZoom($parent !== null ? $parent->getMaxZoom() + 1 : 0);
	}

	private function UpdateChildrenMinZoom($geography)
	{
		$children = App::Orm()->findManyByProperty(entities\Geography::class, 'Parent.Id', $geography->getId());
		foreach ($children as $child)
		{
			$child->setMinZoom($geography->getMaxZoom() + 1);
			App::Orm()->Save($child);
		}
	}

	public function DeleteGeography($geography)
	{
		Profiling::BeginTimer();

		$this->DeleteGeographyRecursive($geography);

		$cacheManager = new CacheManager();
		$cacheManager->CleanGeographyCache();

		Profiling::EndTimer();
		return self::OK;
	}

	private function DeleteGeographyRecursive($geography)
	{
		$children = App::Orm()->findManyByProperty(entities\Geography::class, 'Parent.Id', $geography->getId());
		foreach ($children as $child)
		{
			$this->DeleteGeographyRecursive($child);
		}
		$this->DeleteGeographyInternal($geography);
	}

	private function DeleteGeographyInternal($geography)
	{
		$id = $geography->getId();
		App::Db()->execute(
			"DELETE cgi FROM clipping_region_item_geography_item cgi
			 JOIN clipping_region_geography crg ON crg.crg_id = cgi.cgi_clipping_region_geography_id
			 WHERE crg.crg_geography_id = ?", array($id));
		App::Db()->delete('clipping_region_geography', array('crg_geography_id' => $id));
		App::Db()->delete('geography_item', array('gei_geography_id' => $id));
		App::Orm()->delete($geography);
	}

	// ---------------------------------------------------------------
	// Alta con GeoPackage
	// ---------------------------------------------------------------

	public function StartImportGeography($geography, $bucketId, $mapping)
	{
		Profiling::BeginTimer();

		$countryId = App::Settings()->Map()->CurrentCountryId;
		$country = App::Orm()->find(entities\ClippingRegionItem::class, $countryId);
		$geography->setCountry($country);
		$this->ApplyMinZoom($geography);

		// FieldCodeName/FieldCaptionName/FieldUrbanityName quedan con el
		// nombre de columna tal como lo eligió el usuario: es lo que se
		// muestra de solo lectura en la edición posterior.
		$geography->setFieldCodeName($mapping['code']);
		$geography->setFieldCaptionName($mapping['caption']);
		$geography->setFieldUrbanityName($mapping['urbanity']);
		App::Orm()->Save($geography);

		$parent = $geography->getParent();

		$state = GeoPackageStateBag::Create($bucketId);
		$state->SetTargetId($geography->getId());
		if ($parent !== null)
		{
			$state->SetParentId($parent->getId());
		}
		$state->SetMapping($this->ResolveMapping($state->GetHeaderFilename(), $mapping));

		$totalFiles = GeoPackageItemsImporter::CountDataFiles($state->GetFileFolder());
		$state->SetTotalSteps(3);
		$state->SetTotalSlices($totalFiles);
		$state->SetStep(self::STEP_VALIDATING, 'Validando datos');

		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	// El mapeo que llega del cliente usa el nombre de columna original
	// (lo que el usuario vio y eligió); acá se resuelve a la clave interna
	// (varName) que trae cada fila de data_NNNNN.json.
	private function ResolveMapping($headerFilename, $mapping)
	{
		$columns = GeoPackageItemsImporter::ReadColumns($headerFilename);
		$ret = array();
		foreach ($mapping as $field => $label)
		{
			if ($label === null)
			{
				$ret[$field] = null;
			}
			else
			{
				$ret[$field] = $this->FindVarNameByLabel($columns, $label, $field);
			}
		}
		return $ret;
	}

	private function FindVarNameByLabel($columns, $label, $field)
	{
		foreach ($columns as $column)
		{
			if ($column['Label'] === $label)
				return $column['VarName'];
		}
		throw new PublicException('No se encontró la columna \'' . $label . '\' (' . $field . ') en el archivo.');
	}

	public function StepImportGeography($key)
	{
		$state = new GeoPackageStateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_VALIDATING:
				return $this->ValidateParentCodes($state);
			case self::STEP_INSERTING:
				return $this->InsertGeographyItems($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	// Se corre antes de insertar nada: si algún código de padre del
	// archivo no existe entre los ítems ya cargados de la geografía
	// padre, aborta todo el alta (borra la entidad recién creada, sin
	// ítems todavía) e informa cuáles códigos fallaron. Mismo criterio
	// que ClippingRegionService::ValidateParentCodes.
	private function ValidateParentCodes($state)
	{
		Profiling::BeginTimer();
		$mapping = $state->GetMapping();
		$parentGeographyId = $state->GetParentId();

		if ($mapping['parentCode'] === null || $parentGeographyId === null)
		{
			$state->SetStep(self::STEP_INSERTING, 'Insertando ítems');
			Profiling::EndTimer();
			return $state->ReturnState(false);
		}

		$varNames = GeoPackageItemsImporter::ReadVarNames($state->GetHeaderFilename());
		$parentCodeIndex = array_search($mapping['parentCode'], $varNames);
		$codesInFile = $this->CollectDistinctCodes($state, $parentCodeIndex);

		$existingCodes = array();
		$rows = App::Db()->fetchAll(
			"SELECT gei_code FROM geography_item WHERE gei_geography_id = ?", array($parentGeographyId));
		foreach ($rows as $row)
		{
			$existingCodes[$row['gei_code']] = true;
		}

		$missing = array();
		foreach ($codesInFile as $code => $unused)
		{
			if (!isset($existingCodes[$code]))
			{
				$missing[] = $code;
			}
		}

		if (count($missing) > 0)
		{
			$this->AbortImport($state->GetTargetId());
			throw new PublicException($this->BuildMissingParentMessage($missing));
		}

		$state->SetStep(self::STEP_INSERTING, 'Insertando ítems');
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function CollectDistinctCodes($state, $columnIndex)
	{
		$ret = array();
		$totalFiles = $state->GetTotalSlices();
		for ($n = 0; $n < $totalFiles; $n++)
		{
			$file = GeoPackageItemsImporter::GetDataFile($state->GetFileFolder(), $n);
			$rows = GeoPackageItemsImporter::ReadDataFile($file);
			foreach ($rows as $row)
			{
				$ret[$row[$columnIndex]] = true;
			}
		}
		return $ret;
	}

	private function AbortImport($id)
	{
		$entity = App::Orm()->find(entities\Geography::class, $id);
		if ($entity !== null)
		{
			App::Orm()->delete($entity);
		}
	}

	private function BuildMissingParentMessage($missing)
	{
		$sample = array_slice($missing, 0, 20);
		$message = count($missing) . ' código(s) de padre del archivo no se encontraron en la geografía padre elegida: '
			. implode(', ', $sample);
		if (count($missing) > 20)
		{
			$message .= ' (y ' . (count($missing) - 20) . ' más)';
		}
		$message .= '. Revise el mapeo de columnas o el archivo antes de volver a intentar.';
		return $message;
	}

	private function InsertGeographyItems($state)
	{
		Profiling::BeginTimer();
		$totalFiles = $state->GetTotalSlices();
		if ($totalFiles > 0)
		{
			$file = GeoPackageItemsImporter::GetDataFile($state->GetFileFolder(), $state->Slice());
			$rows = GeoPackageItemsImporter::ReadDataFile($file);
			$varNames = GeoPackageItemsImporter::ReadVarNames($state->GetHeaderFilename());
			$this->InsertRows($state, $rows, $varNames);
			$state->NextSlice();
		}
		if ($state->Slice() >= $totalFiles)
		{
			Profiling::EndTimer();
			return $this->FinishGeographyImport($state);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function InsertRows($state, $rows, $varNames)
	{
		$mapping = $state->GetMapping();
		$codeIndex = array_search($mapping['code'], $varNames);
		$captionIndex = ($mapping['caption'] !== null ? array_search($mapping['caption'], $varNames) : null);
		$parentCodeIndex = ($mapping['parentCode'] !== null ? array_search($mapping['parentCode'], $varNames) : null);
		$populationIndex = array_search($mapping['population'], $varNames);
		$householdsIndex = array_search($mapping['households'], $varNames);
		$childrenIndex = array_search($mapping['children'], $varNames);
		$urbanityIndex = ($mapping['urbanity'] !== null ? array_search($mapping['urbanity'], $varNames) : null);
		$wktIndex = array_search('wkt', $varNames);
		$geographyId = $state->GetTargetId();
		$parentGeographyId = $state->GetParentId();

		foreach ($rows as $row)
		{
			$wkt = $row[$wktIndex];
			// Geometry = original (sin simplificar, más allá de los 0.5m
			// que ya aplica GpkgReader); R1..R6 son 6 simplificaciones
			// progresivas (mismo criterio que Simplifications.FillSimplifiedGeometries
			// del WinForms: R1 más simplificado, R6 casi sin simplificar).
			// Ver la nota sobre calibración en
			// GeoPackageItemsImporter::QUALITY_TOLERANCES_M.
			$levels = GeoPackageItemsImporter::SimplifyToTolerances($wkt, GeoPackageItemsImporter::QUALITY_TOLERANCES_M);
			if ($levels === null)
			{
				$state->IncrementSkipped();
			}
			else
			{
				$code = $row[$codeIndex];
				$caption = ($captionIndex !== null ? $row[$captionIndex] : $code);
				$population = intval($row[$populationIndex]);
				$households = intval($row[$householdsIndex]);
				$children = intval($row[$childrenIndex]);
				$urbanity = $this->ResolveUrbanity($urbanityIndex !== null ? $row[$urbanityIndex] : null);

				if ($parentCodeIndex !== null && $parentGeographyId !== null)
				{
					$this->InsertItemWithParent($geographyId, $parentGeographyId, $code, $caption, $wkt, $levels,
						$population, $households, $children, $urbanity, $row[$parentCodeIndex]);
				}
				else
				{
					$this->InsertItem($geographyId, $code, $caption, $wkt, $levels,
						$population, $households, $children, $urbanity);
				}
			}
		}
	}

	// Mapeo confirmado contra la entidad concreta del WinForms
	// (GeographyItem.cs): 0 Rural, 1 Rural disperso, 2 Urbano,
	// 3 Urbano disperso; sin columna mapeada, 'N' (ninguno).
	private function ResolveUrbanity($rawValue)
	{
		if ($rawValue === null || $rawValue === '')
			return 'N';
		switch (intval($rawValue))
		{
			case 0: return 'R';
			case 1: return 'L';
			case 2: return 'U';
			case 3: return 'D';
			default: return 'N';
		}
	}

	private function InsertItem($geographyId, $code, $caption, $wkt, $levels, $population, $households, $children, $urbanity)
	{
		$sql = "INSERT INTO geography_item
			(gei_code, gei_caption, gei_geometry, gei_geometry_is_null, gei_centroid, gei_area_m2,
			 gei_population, gei_households, gei_children, gei_urbanity,
			 gei_geometry_r1, gei_geometry_r2, gei_geometry_r3, gei_geometry_r4, gei_geometry_r5, gei_geometry_r6,
			 gei_geography_id)
			VALUES (?, ?, ST_GeomFromText(?), 0, GeometryCentroid(ST_GeomFromText(?)), GeometryAreaSphere(ST_GeomFromText(?)),
			 ?, ?, ?, ?,
			 ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?),
			 ?)";
		App::Db()->execute($sql, array(
			$code, $caption, $wkt, $wkt, $wkt,
			$population, $households, $children, $urbanity,
			$levels[0], $levels[1], $levels[2], $levels[3], $levels[4], $levels[5],
			$geographyId));
	}

	// El padre se resuelve por código dentro de la geografía padre, ya
	// existente (no es una auto-referencia entre los ítems que se están
	// insertando ahora): mismo criterio que GeographySave.cs.
	private function InsertItemWithParent($geographyId, $parentGeographyId, $code, $caption, $wkt, $levels,
		$population, $households, $children, $urbanity, $parentCode)
	{
		$sql = "INSERT INTO geography_item
			(gei_code, gei_caption, gei_geometry, gei_geometry_is_null, gei_centroid, gei_area_m2,
			 gei_population, gei_households, gei_children, gei_urbanity,
			 gei_geometry_r1, gei_geometry_r2, gei_geometry_r3, gei_geometry_r4, gei_geometry_r5, gei_geometry_r6,
			 gei_geography_id, gei_parent_id)
			SELECT ?, ?, ST_GeomFromText(?), 0, GeometryCentroid(ST_GeomFromText(?)), GeometryAreaSphere(ST_GeomFromText(?)),
			 ?, ?, ?, ?,
			 ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?),
			 ?, (SELECT gei_id FROM geography_item WHERE gei_code = ? AND gei_geography_id = ? LIMIT 1)";
		App::Db()->execute($sql, array(
			$code, $caption, $wkt, $wkt, $wkt,
			$population, $households, $children, $urbanity,
			$levels[0], $levels[1], $levels[2], $levels[3], $levels[4], $levels[5],
			$geographyId, $parentCode, $parentGeographyId));
	}

	private function FinishGeographyImport($state)
	{
		Profiling::BeginTimer();
		$geographyId = $state->GetTargetId();

		App::Db()->execute(
			"UPDATE geography SET geo_area_avg_m2 = (SELECT AVG(gei_area_m2) FROM geography_item WHERE gei_geography_id = ?)
			 WHERE geo_id = ?", array($geographyId, $geographyId));
		App::Db()->execute(
			"UPDATE geography SET geo_field_code_size = (SELECT MAX(CHAR_LENGTH(gei_code)) FROM geography_item WHERE gei_geography_id = ?)
			 WHERE geo_id = ?", array($geographyId, $geographyId));

		$geography = App::Orm()->find(entities\Geography::class, $geographyId);
		$geography->Level = $this->CalculateLevel($geography);

		$cacheManager = new CacheManager();
		$cacheManager->CleanGeographyCache();

		$extraKeys = array();
		$skipped = $state->GetSkipped();
		if ($skipped > 0)
		{
			$state->Set('errorsFound', $skipped . ' ítem(s) con geometría inválida fueron omitidos.');
			$extraKeys[] = 'errorsFound';
		}
		$state->SetResult(json_decode(App::OrmSerialize($geography)));
		$state->SetStep(self::STEP_END, 'Completado exitosamente');
		Profiling::EndTimer();
		return $state->ReturnState(true, $extraKeys);
	}

	private function CalculateLevel($geography)
	{
		$level = 0;
		$current = $geography->getParent();
		while ($current !== null)
		{
			$level++;
			$current = $current->getParent();
		}
		return $level;
	}
}
