<?php

namespace helena\services\packs;

use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Account;
use helena\classes\StateBag;
use minga\framework\Arr;
use minga\framework\PublicException;
use minga\framework\FileBucket;
use helena\classes\readers\GpkgReader;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\backoffice\PermissionsService;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;

class ClippingRegionService extends BaseService
{
	// Pasos del alta con GeoPackage.
	const STEP_VALIDATING = 1;
	const STEP_INSERTING = 2;
	const STEP_END = 3;

	// Pasos del cálculo de intersecciones con Geography.
	const STEP_CALCULATING = 1;
	const STEP_CALCULATE_END = 2;

	public function GetNewClippingRegion()
	{
		$entity = new entities\ClippingRegion();
		// Columnas NOT NULL sin campo editable en el popup de alta: valor
		// por defecto para que el alta no falle por restricción de la
		// base. Country se completa recién al importar
		// (StartImportClippingRegion), con el país vigente en ese momento.
		$entity->setPriority(0);
		$entity->setIndexCode(false);
		$entity->setNoAutocomplete(false);
		$entity->setIsCrawlerIndexer(false);
		$entity->setLabelsMinZoom(0);
		$entity->setLabelsMaxZoom(18);
		return $entity;
	}

	public function GetClippingRegions()
	{
		Profiling::BeginTimer();
		$regions = App::Orm()->findAll(entities\ClippingRegion::class, array('Caption' => 'ASC'));
		$ret = [];
		$this->InsertChildrenOf($regions, $ret, 0, null);
		$this->AddChildCount($ret);
		Profiling::EndTimer();
		return $ret;
	}

	private function AddChildCount(&$regions)
	{
		Profiling::BeginTimer();
		$sql = "SELECT clr_id Id,
								(SELECT COUNT(*) FROM clipping_region_item WHERE cli_clipping_region_id = clr_id) AS Count
								FROM clipping_region";
		$counts = App::Db()->fetchAll($sql);
		foreach ($regions as $region)
		{
			$id = $region->getId();
			$n = Arr::IndexOfByNamedValue($counts, "Id", $id);
			$region->ChildCount = $counts[$n]['Count'];
		}
		Profiling::EndTimer();
		return $regions;
	}

	private function InsertChildrenOf($regions, &$ret, $level, $parentId)
	{
		foreach ($regions as $region)
		{
			$parentObj = $region->getParent();
			if (($parentObj === null && $parentId === null) || ($parentObj !== null && $parentObj->getId() === $parentId))
			{
				$region->Level = $level;
				$ret[] = $region;
				$this->InsertChildrenOf($regions, $ret, $level + 1, $region->getId());
			}
		}
	}

	public function UpdateClippingRegion($clippingRegion)
	{
		Profiling::BeginTimer();
		App::Orm()->Save($clippingRegion);
		$cacheManager = new CacheManager();
		$cacheManager->CleanClippingCache();
		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteClippingRegion($clippingRegion)
	{
		Profiling::BeginTimer();

		$this->DeleteClippingRegionRecursive($clippingRegion);

		$cacheManager = new CacheManager();
		$cacheManager->CleanClippingCache();

		Profiling::EndTimer();
		return self::OK;
	}

	// Primero los descendientes (en profundidad), recién después el nodo:
	// evita dejar ítems huérfanos con cli_parent_id apuntando a un padre
	// ya borrado.
	private function DeleteClippingRegionRecursive($clippingRegion)
	{
		$children = App::Orm()->findManyByProperty(entities\ClippingRegion::class, 'Parent.Id', $clippingRegion->getId());
		foreach ($children as $child)
		{
			$this->DeleteClippingRegionRecursive($child);
		}
		$this->DeleteClippingRegionInternal($clippingRegion);
	}

	private function DeleteClippingRegionInternal($clippingRegion)
	{
		$id = $clippingRegion->getId();
		App::Db()->execute(
			"DELETE cgi FROM clipping_region_item_geography_item cgi
			 JOIN clipping_region_geography crg ON crg.crg_id = cgi.cgi_clipping_region_geography_id
			 WHERE crg.crg_clipping_region_id = ?", array($id));
		App::Db()->delete('clipping_region_geography', array('crg_clipping_region_id' => $id));
		App::Db()->delete('clipping_region_item', array('cli_clipping_region_id' => $id));
		App::Orm()->delete($clippingRegion);
	}

	// ---------------------------------------------------------------
	// Alta con GeoPackage
	// ---------------------------------------------------------------

	// Si el archivo no tiene exactamente una capa vectorial, no hay nada
	// para mapear todavía: se informa el problema en vez de dejar elegir.
	public function VerifyGeoPackage($bucketId)
	{
		Profiling::BeginTimer();
		$bucket = FileBucket::Load($bucketId);
		$reader = new GpkgReader($bucket->path, 'gpkg');
		$layers = $reader->ReadSheetNames();

		if (count($layers) === 0)
		{
			Profiling::EndTimer();
			return array('Error' => 'El archivo no contiene capas de tipo vectorial (features).');
		}
		if (count($layers) > 1)
		{
			Profiling::EndTimer();
			return array('Error' => 'El GeoPackage debe contener una única capa. Se encontraron: ' . implode(', ', $layers) . '.');
		}

		$reader->WriteJson(0);
		$columns = GeoPackageItemsImporter::ReadColumns($bucket->path . '/header.json');
		$labels = array();
		foreach ($columns as $column)
		{
			$labels[] = $column['Label'];
		}

		Profiling::EndTimer();
		return array('Columns' => $labels);
	}

	public function StartImportClippingRegion($clippingRegion, $bucketId, $mapping)
	{
		Profiling::BeginTimer();

		$countryId = App::Settings()->Map()->CurrentCountryId;
		$country = App::Orm()->find(entities\ClippingRegionItem::class, $countryId);
		$clippingRegion->setCountry($country);

		// Sin categoría padre elegida, se asigna la región raíz ('Países':
		// la única con Parent nulo), si ya existe una.
		if ($clippingRegion->getParent() === null)
		{
			$root = $this->GetRootClippingRegion();
			if ($root !== null)
			{
				$clippingRegion->setParent($root);
			}
		}

		// Queda con el nombre de columna tal como lo eligió el usuario
		// (no el nombre interno generado): es lo que se muestra de solo
		// lectura en la edición posterior.
		$clippingRegion->setFieldCodeName($mapping['code']);
		App::Orm()->Save($clippingRegion);

		$parentRegion = $clippingRegion->getParent();
		// Cuando la categoría padre es la raíz ('Países'), no tiene
		// sentido pedir un código de fila para vincular ítems: todos
		// cuelgan directo del mismo ítem país.
		$usesFixedParent = ($parentRegion !== null && $parentRegion->getParent() === null);

		$state = GeoPackageStateBag::Create($bucketId);
		$state->SetTargetId($clippingRegion->getId());
		if ($usesFixedParent)
		{
			$state->SetFixedParentItemId($countryId);
		}
		else if ($parentRegion !== null)
		{
			$state->SetParentId($parentRegion->getId());
		}
		$state->SetMapping($this->ResolveMapping($state->GetHeaderFilename(), $mapping));

		$totalFiles = GeoPackageItemsImporter::CountDataFiles($state->GetFileFolder());
		$state->SetTotalSteps(3);
		$state->SetTotalSlices($totalFiles);
		$state->SetStep(self::STEP_VALIDATING, 'Validando datos');

		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function GetRootClippingRegion()
	{
		$roots = App::Orm()->findManyByProperty(entities\ClippingRegion::class, 'Parent', null);
		if (count($roots) > 0)
		{
			return $roots[0];
		}
		return null;
	}

	// El mapeo que llega del cliente identifica cada columna por su
	// nombre original (lo que el usuario vio y eligió); acá se resuelve a
	// la clave interna (varName) que trae cada fila de data_NNNNN.json.
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
			{
				return $column['VarName'];
			}
		}
		throw new PublicException('No se encontró la columna \'' . $label . '\' (' . $field . ') en el archivo.');
	}

	public function StepImportClippingRegion($key)
	{
		$state = new GeoPackageStateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_VALIDATING:
				return $this->ValidateParentCodes($state);
			case self::STEP_INSERTING:
				return $this->InsertClippingRegionItems($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	// Se corre antes de insertar nada: si algún código de padre del
	// archivo no existe entre los ítems ya cargados de la categoría
	// padre, aborta todo el alta (borra la entidad recién creada, sin
	// ítems todavía) e informa cuáles códigos fallaron. Quien sube el
	// archivo no conoce de memoria los códigos ya cargados, así que dejar
	// ítems huérfanos en silencio es un problema real de calidad de datos.
	private function ValidateParentCodes($state)
	{
		Profiling::BeginTimer();
		$mapping = $state->GetMapping();
		$parentRegionId = $state->GetParentId();

		if ($mapping['parentCode'] === null || $state->GetFixedParentItemId() !== null || $parentRegionId === null)
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
			"SELECT cli_code FROM clipping_region_item WHERE cli_clipping_region_id = ?", array($parentRegionId));
		foreach ($rows as $row)
		{
			$existingCodes[$row['cli_code']] = true;
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
			$this->AbortImport(entities\ClippingRegion::class, $state->GetTargetId());
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

	private function AbortImport($entityClass, $id)
	{
		$entity = App::Orm()->find($entityClass, $id);
		if ($entity !== null)
		{
			App::Orm()->delete($entity);
		}
	}

	private function BuildMissingParentMessage($missing)
	{
		$sample = array_slice($missing, 0, 20);
		$message = count($missing) . ' código(s) de padre del archivo no se encontraron en la categoría padre elegida: '
			. implode(', ', $sample);
		if (count($missing) > 20)
		{
			$message .= ' (y ' . (count($missing) - 20) . ' más)';
		}
		$message .= '. Revise el mapeo de columnas o el archivo antes de volver a intentar.';
		return $message;
	}

	private function InsertClippingRegionItems($state)
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
			return $this->FinishClippingRegionImport($state);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function InsertRows($state, $rows, $varNames)
	{
		$mapping = $state->GetMapping();
		$codeIndex = array_search($mapping['code'], $varNames);
		$captionIndex = $this->FindOptionalIndex($mapping['caption'], $varNames);
		$parentCodeIndex = $this->FindOptionalIndex($mapping['parentCode'], $varNames);
		$wktIndex = array_search('wkt', $varNames);
		$clippingRegionId = $state->GetTargetId();
		$fixedParentItemId = $state->GetFixedParentItemId();
		$parentRegionId = $state->GetParentId();

		foreach ($rows as $row)
		{
			$wkt = $row[$wktIndex];
			// Geometry = original (sin simplificar, más allá de los 0.5m
			// que ya aplica GpkgReader al leer el .gpkg); R1/R2 son
			// simplificaciones progresivas; R3 = la geometría original de
			// nuevo (dos niveles de simplificación alcanzan para
			// ClippingRegion, a diferencia de los 6 de Geography).
			$levels = GeoPackageItemsImporter::SimplifyToTolerances($wkt, array(
				GeoPackageItemsImporter::QUALITY_TOLERANCES_M[3],
				GeoPackageItemsImporter::QUALITY_TOLERANCES_M[4],
			));
			if ($levels === null)
			{
				$state->IncrementSkipped();
			}
			else
			{
				$code = $row[$codeIndex];
				$caption = $code;
				if ($captionIndex !== null)
				{
					$caption = $row[$captionIndex];
				}
				if ($fixedParentItemId !== null)
				{
					$this->InsertItemWithFixedParent($clippingRegionId, $fixedParentItemId, $code, $caption, $wkt, $levels);
				}
				else if ($parentCodeIndex !== null && $parentRegionId !== null)
				{
					$this->InsertItemWithParent($clippingRegionId, $parentRegionId, $code, $caption, $wkt, $levels, $row[$parentCodeIndex]);
				}
				else
				{
					$this->InsertItem($clippingRegionId, $code, $caption, $wkt, $levels);
				}
			}
		}
	}

	private function FindOptionalIndex($mappedLabel, $varNames)
	{
		if ($mappedLabel === null)
		{
			return null;
		}
		return array_search($mappedLabel, $varNames);
	}

	private function InsertItem($clippingRegionId, $code, $caption, $wkt, $levels)
	{
		$sql = "INSERT INTO clipping_region_item
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_clipping_region_id)
			VALUES (?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), ?)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt, $clippingRegionId));
	}

	// Todos los ítems cuelgan directo del mismo ítem país (categoría
	// padre = 'Países'): sin código de fila de por medio.
	private function InsertItemWithFixedParent($clippingRegionId, $parentItemId, $code, $caption, $wkt, $levels)
	{
		$sql = "INSERT INTO clipping_region_item
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_clipping_region_id, cli_parent_id)
			VALUES (?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), ?, ?)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt, $clippingRegionId, $parentItemId));
	}

	// El padre se resuelve por código dentro de la región padre, ya
	// existente: no es una auto-referencia entre los ítems que se están
	// insertando ahora.
	private function InsertItemWithParent($clippingRegionId, $parentRegionId, $code, $caption, $wkt, $levels, $parentCode)
	{
		$sql = "INSERT INTO clipping_region_item
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_clipping_region_id, cli_parent_id)
			SELECT ?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), ?,
				(SELECT cli_id FROM clipping_region_item WHERE cli_code = ? AND cli_clipping_region_id = ? LIMIT 1)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt,
			$clippingRegionId, $parentCode, $parentRegionId));
	}

	private function FinishClippingRegionImport($state)
	{
		Profiling::BeginTimer();
		$clippingRegionId = $state->GetTargetId();
		$clippingRegion = App::Orm()->find(entities\ClippingRegion::class, $clippingRegionId);
		$clippingRegion->ChildCount = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM clipping_region_item WHERE cli_clipping_region_id = ?", array($clippingRegionId));
		$clippingRegion->Level = $this->CalculateLevel($clippingRegion);

		$cacheManager = new CacheManager();
		$cacheManager->CleanClippingCache();

		$extraKeys = array();
		$skipped = $state->GetSkipped();
		if ($skipped > 0)
		{
			$state->Set('errorsFound', $skipped . ' ítem(s) con geometría inválida fueron omitidos.');
			$extraKeys[] = 'errorsFound';
		}
		$state->SetResult(json_decode(App::OrmSerialize($clippingRegion)));
		$state->SetStep(self::STEP_END, 'Completado exitosamente');
		Profiling::EndTimer();
		return $state->ReturnState(true, $extraKeys);
	}

	private function CalculateLevel($clippingRegion)
	{
		$level = 0;
		$current = $clippingRegion->getParent();
		while ($current !== null)
		{
			$level++;
			$current = $current->getParent();
		}
		return $level;
	}

	// ---------------------------------------------------------------
	// Asociación con Geography (intersecciones)
	// ---------------------------------------------------------------

	public function GetClippingRegionGeographies($clippingRegionId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT crg.crg_id AS Id, geo.geo_id AS GeographyId,
						geo.geo_caption AS GeographyCaption, geo.geo_revision AS GeographyRevision
					FROM clipping_region_geography crg
					JOIN geography geo ON geo.geo_id = crg.crg_geography_id
					WHERE crg.crg_clipping_region_id = ?
					ORDER BY geo.geo_caption";
		$rows = App::Db()->fetchAll($sql, array($clippingRegionId));
		$ret = array();
		foreach ($rows as $row)
		{
			$ret[] = array(
				'Id' => $row['Id'],
				'Geography' => array('Id' => $row['GeographyId'], 'Caption' => $row['GeographyCaption'], 'Revision' => $row['GeographyRevision']),
			);
		}
		Profiling::EndTimer();
		return $ret;
	}

	public function DeleteClippingRegionGeography($id)
	{
		Profiling::BeginTimer();
		App::Db()->delete('clipping_region_item_geography_item', array('cgi_clipping_region_geography_id' => $id));
		App::Db()->delete('clipping_region_geography', array('crg_id' => $id));
		Profiling::EndTimer();
		return self::OK;
	}

	public function StartCalculateClippingRegionGeography($clippingRegionId, $geographyIds)
	{
		Profiling::BeginTimer();
		$state = CalculationStateBag::Create();
		$state->Set('geographyIds', $geographyIds);
		$state->SetTotalSteps(1);
		$state->SetTotalSlices(count($geographyIds));
		$state->SetStep(self::STEP_CALCULATING, 'Calculando intersecciones');
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	public function StepCalculateClippingRegionGeography($key)
	{
		$state = new StateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_CALCULATING:
				return $this->CalculateNextGeography($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	private function CalculateNextGeography($state)
	{
		Profiling::BeginTimer();
		$geographyIds = $state->Get('geographyIds');
		$clippingRegionId = $state->Get('clippingRegionId');
		$geographyId = $geographyIds[$state->Slice()];

		$crgId = $this->CreateClippingRegionGeography($clippingRegionId, $geographyId);
		$this->CalculateIntersections($crgId, $clippingRegionId, $geographyId);

		$state->NextSlice();
		if ($state->Slice() >= count($geographyIds))
		{
			$childCount = App::Db()->fetchScalarInt(
				"SELECT COUNT(*) FROM clipping_region_item_geography_item cgi
				 JOIN clipping_region_geography crg ON crg.crg_id = cgi.cgi_clipping_region_geography_id
				 WHERE crg.crg_clipping_region_id = ?", array($clippingRegionId));
			$state->SetResult(array('ChildCount' => $childCount));
			$state->SetStep(self::STEP_CALCULATE_END, 'Completado exitosamente');
			Profiling::EndTimer();
			return $state->ReturnState(true);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function CreateClippingRegionGeography($clippingRegionId, $geographyId)
	{
		App::Db()->insert('clipping_region_geography', array(
			'crg_clipping_region_id' => $clippingRegionId,
			'crg_geography_id' => $geographyId,
		));
		return App::Db()->lastInsertId();
	}

	// GeometryAreaSphere en vez de ST_Area nativo: en MySQL 5.7 las
	// funciones ST_* estándar operan sobre las coordenadas como un plano
	// cartesiano, sin tratamiento geodésico (confirmado con una prueba
	// aparte, ver tools/test-intersect-functions.sql, que también
	// confirmó que ST_Intersects/ST_Intersection sí calculan la
	// geometría real y no una aproximación por bounding box).
	private function CalculateIntersections($crgId, $clippingRegionId, $geographyId)
	{
		$sql = "INSERT INTO clipping_region_item_geography_item
				(cgi_clipping_region_geography_id, cgi_clipping_region_item_id, cgi_geography_item_id, cgi_intersection_percent)
				SELECT ?, cli.cli_id, gei.gei_id,
					GeometryAreaSphere(ST_Intersection(cli.cli_geometry, gei.gei_geometry)) / GeometryAreaSphere(gei.gei_geometry) * 100 AS pct
				FROM clipping_region_item cli
				JOIN geography_item gei
					ON MBRIntersects(cli.cli_geometry, gei.gei_geometry)
				   AND ST_Intersects(cli.cli_geometry, gei.gei_geometry)
				WHERE cli.cli_clipping_region_id = ?
				  AND gei.gei_geography_id = ?
				HAVING pct > 0";
		App::Db()->execute($sql, array($crgId, $clippingRegionId, $geographyId));
	}
}
