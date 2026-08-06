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
use helena\classes\IntersectionResolver;

class ClippingRegionService extends BaseService
{
	// Pasos del alta con GeoPackage.
	const STEP_VALIDATING = 0;
	const STEP_INSERTING = 1;
	const STEP_END = 2;

	// Pasos del cálculo de intersecciones con Geography.
	const STEP_CALCULATING = 0;
	const STEP_CALCULATE_END = 1;

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

		if ($clippingRegion->getMetadata() === null)
		{
			$metadataService = new MetadataService();
			$metadata = $metadataService->CreateMinimalMetadata($clippingRegion->getCaption(), $clippingRegion->getVersion());
			$clippingRegion->setMetadata($metadata);
			App::Orm()->Save($clippingRegion);
		}

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
		$state->SetTotalSteps(2);
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
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_area_m2, cli_clipping_region_id)
			VALUES (?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), GeometryAreaSphere(ST_GeomFromText(?)), ?)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt, $wkt, $clippingRegionId));
	}

	// Todos los ítems cuelgan directo del mismo ítem país (categoría
	// padre = 'Países'): sin código de fila de por medio.
	private function InsertItemWithFixedParent($clippingRegionId, $parentItemId, $code, $caption, $wkt, $levels)
	{
		$sql = "INSERT INTO clipping_region_item
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_area_m2, cli_clipping_region_id, cli_parent_id)
			VALUES (?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), GeometryAreaSphere(ST_GeomFromText(?)), ?, ?)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt, $wkt, $clippingRegionId, $parentItemId));
	}

	// El padre se resuelve por código dentro de la región padre, ya
	// existente: no es una auto-referencia entre los ítems que se están
	// insertando ahora.
	private function InsertItemWithParent($clippingRegionId, $parentRegionId, $code, $caption, $wkt, $levels, $parentCode)
	{
		$sql = "INSERT INTO clipping_region_item
			(cli_code, cli_caption, cli_geometry, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3, cli_centroid, cli_area_m2, cli_clipping_region_id, cli_parent_id)
			SELECT ?, ?, ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), ST_GeomFromText(?), GeometryCentroid(ST_GeomFromText(?)), GeometryAreaSphere(ST_GeomFromText(?)), ?,
				(SELECT cli_id FROM clipping_region_item WHERE cli_code = ? AND cli_clipping_region_id = ? LIMIT 1)";
		App::Db()->execute($sql, array($code, $caption, $wkt, $levels[0], $levels[1], $wkt, $wkt, $wkt,
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
						geo.geo_caption AS GeographyCaption, geo.geo_revision AS GeographyRevision,
						(SELECT COUNT(DISTINCT cgi_geography_item_id) FROM clipping_region_item_geography_item
						 WHERE cgi_clipping_region_geography_id = crg.crg_id) AS ItemCount
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
				'ItemCount' => $row['ItemCount'],
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

	// Mismo vínculo que se administra desde ClippingRegionGeographyPopup,
	// visto ahora desde el otro lado: al dar de alta o revisar una
	// geografía, conviene poder marcarle de una vez con qué regiones se
	// cruza, sin ir región por región. crg_id no depende de "el lado"
	// desde el que se creó la asociación, así que se reutilizan los
	// mismos CreateClippingRegionGeography/CalculateIntersections y el
	// mismo DeleteClippingRegionGeography para borrar.
	public function GetGeographyClippingRegions($geographyId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT crg.crg_id AS Id, clr.clr_id AS ClippingRegionId, clr.clr_caption AS ClippingRegionCaption,
						clr.clr_version AS ClippingRegionVersion,
						(SELECT COUNT(DISTINCT cgi_geography_item_id) FROM clipping_region_item_geography_item
						 WHERE cgi_clipping_region_geography_id = crg.crg_id) AS ItemCount
					FROM clipping_region_geography crg
					JOIN clipping_region clr ON clr.clr_id = crg.crg_clipping_region_id
					WHERE crg.crg_geography_id = ?
					ORDER BY clr.clr_caption";
		$rows = App::Db()->fetchAll($sql, array($geographyId));
		$ret = array();
		foreach ($rows as $row)
		{
			$ret[] = array(
				'Id' => $row['Id'],
				'ItemCount' => $row['ItemCount'],
				'ClippingRegion' => array('Id' => $row['ClippingRegionId'], 'Caption' => $row['ClippingRegionCaption'], 'Version' => $row['ClippingRegionVersion']),
			);
		}
		Profiling::EndTimer();
		return $ret;
	}

	public function StartCalculateGeographyClippingRegions($geographyId, $clippingRegionIds)
	{
		$pairs = array();
		foreach ($clippingRegionIds as $clippingRegionId)
		{
			$pairs[] = array('clippingRegionId' => $clippingRegionId, 'geographyId' => $geographyId);
		}
		return $this->StartCalculate('geographyId', $geographyId, $pairs);
	}

	public function StepCalculateGeographyClippingRegions($key)
	{
		return $this->StepCalculate($key);
	}

	public function StartCalculateClippingRegionGeography($clippingRegionId, $geographyIds)
	{
		$pairs = array();
		foreach ($geographyIds as $geographyId)
		{
			$pairs[] = array('clippingRegionId' => $clippingRegionId, 'geographyId' => $geographyId);
		}
		return $this->StartCalculate('clippingRegionId', $clippingRegionId, $pairs);
	}

	public function StepCalculateClippingRegionGeography($key)
	{
		return $this->StepCalculate($key);
	}

	// El plan se arma en lotes de a lo sumo BATCH_SIZE ítems, sin importar
	// cuántos tenga cada geografía: si cada paso dependiera de procesar
	// una geografía entera de una sola vez, una con muchos ítems podía
	// Se procesa en lotes de a lo sumo BATCH_SIZE clipping_region_item
	// (departamentos, provincias, etc: siempre pocos, nunca miles) por
	// paso: cada uno del lote se resuelve con una consulta espacial
	// gruesa (filtra candidatos por MBRIntersects contra el índice de
	// snapshot_geography_item) y el cálculo preciso de intersección se
	// delega a Python (ver CalculateIntersectionsBatch), no a MySQL.
	const BATCH_SIZE = 1;

	private function StartCalculate($resultKey, $resultId, $pairs)
	{
		Profiling::BeginTimer();
		$this->ValidateSnapshotUpToDate($pairs);
		$batches = $this->BuildBatchPlan($pairs);

		$state = CalculationStateBag::Create();
		$state->Set('batches', $batches);
		$state->Set('crgIds', array());
		$state->Set('resultKey', $resultKey);
		$state->Set('resultId', $resultId);
		$state->SetTotalSteps(1);
		$state->SetTotalSlices(count($batches));
		$state->SetStep(self::STEP_CALCULATING, 'Calculando intersecciones');
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function BuildBatchPlan($pairs)
	{
		$batches = array();
		foreach ($pairs as $pair)
		{
			$itemCount = App::Db()->fetchScalarInt(
				"SELECT COUNT(*) FROM clipping_region_item WHERE cli_clipping_region_id = ?", array($pair['clippingRegionId']));
			$batchCount = max(1, (int)ceil($itemCount / self::BATCH_SIZE));
			for ($i = 0; $i < $batchCount; $i++)
			{
				$batches[] = array(
					'clippingRegionId' => $pair['clippingRegionId'],
					'geographyId' => $pair['geographyId'],
					'offset' => $i * self::BATCH_SIZE,
				);
			}
		}
		return $batches;
	}

	// El cálculo depende del índice espacial de snapshot_geography_item
	// (ver CalculateIntersectionsBatch): al ser una tabla pre-calculada,
	// puede haber quedado desactualizada si la geografía se editó
	// después de la última regeneración. Se valida acá para dar un error
	// claro en vez de un resultado silenciosamente incompleto.
	private function ValidateSnapshotUpToDate($pairs)
	{
		$geographyIds = array();
		foreach ($pairs as $pair)
		{
			$geographyIds[] = $pair['geographyId'];
		}
		$geographyIds = array_unique($geographyIds);

		foreach ($geographyIds as $geographyId)
		{
			$realCount = App::Db()->fetchScalarInt(
				"SELECT COUNT(*) FROM geography_item WHERE gei_geography_id = ?", array($geographyId));
			$snapshotCount = App::Db()->fetchScalarInt(
				"SELECT COUNT(*) FROM snapshot_geography_item WHERE giw_geography_id = ?", array($geographyId));
			if ($realCount !== $snapshotCount)
			{
				throw new PublicException('El snapshot usado para el cálculo espacial de esta geografía está '
					. 'desactualizado (tiene ' . $snapshotCount . ' ítems, la geografía real tiene ' . $realCount
					. '). Contacte al administrador del sistema para regenerarlo.');
			}
		}
	}

	private function StepCalculate($key)
	{
		$state = new StateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_CALCULATING:
				return $this->CalculateNextBatch($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	private function CalculateNextBatch($state)
	{
		Profiling::BeginTimer();
		$batches = $state->Get('batches');
		$crgIds = $state->Get('crgIds');
		$batch = $batches[$state->Slice()];
		$clippingRegionId = $batch['clippingRegionId'];
		$geographyId = $batch['geographyId'];
		$offset = $batch['offset'];

		// La asociación (crg) se crea una sola vez, en el primer lote de
		// ese par región-geografía: los lotes siguientes ya la reutilizan.
		$pairKey = $clippingRegionId . '-' . $geographyId;
		if (!isset($crgIds[$pairKey]))
		{
			$crgIds[$pairKey] = $this->CreateClippingRegionGeography($clippingRegionId, $geographyId);
			$state->Set('crgIds', $crgIds);
		}
		$crgId = $crgIds[$pairKey];

		$skipped = $this->CalculateIntersectionsBatch($crgId, $clippingRegionId, $geographyId, $offset, self::BATCH_SIZE);
		if ($skipped > 0)
		{
			$state->Set('skipped', $state->Get('skipped', 0) + $skipped);
		}

		$state->NextSlice();
		if ($state->Slice() >= count($batches))
		{
			Profiling::EndTimer();
			return $this->FinishCalculate($state);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function FinishCalculate($state)
	{
		$resultKey = $state->Get('resultKey');
		$resultId = $state->Get('resultId');
		$column = 'crg_geography_id';
		if ($resultKey === 'clippingRegionId')
		{
			$column = 'crg_clipping_region_id';
		}
		$childCount = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM clipping_region_item_geography_item cgi
			 JOIN clipping_region_geography crg ON crg.crg_id = cgi.cgi_clipping_region_geography_id
			 WHERE crg.$column = ?", array($resultId));
		$result = array('ChildCount' => $childCount);
		$totalSkipped = $state->Get('skipped', 0);
		$extraKeys = array();
		if ($totalSkipped > 0)
		{
			$result['ItemsSkipped'] = $totalSkipped;
			$state->Set('errorsFound', $totalSkipped . ' ítem(s) no pudieron calcularse: fallaron al resolver la '
				. 'intersección geométrica, probablemente por la complejidad del polígono.');
			$extraKeys[] = 'errorsFound';
		}
		$state->SetResult($result);
		$state->SetStep(self::STEP_CALCULATE_END, 'Completado exitosamente');
		return $state->ReturnState(true, $extraKeys);
	}

	private function CreateClippingRegionGeography($clippingRegionId, $geographyId)
	{
		App::Db()->insert('clipping_region_geography', array(
			'crg_clipping_region_id' => $clippingRegionId,
			'crg_geography_id' => $geographyId,
		));
		return App::Db()->lastInsertId();
	}

	// $offset/$limit son sobre clipping_region_item (el lado chico: 24
	// provincias, 500 departamentos, nunca miles), no sobre geography_item
	// (que sí puede tener decenas de miles, como los radios). Para cada
	// ítem del lote: primero un filtro grueso en SQL (MBRIntersects
	// contra el índice espacial de snapshot_geography_item, rápido), y
	// luego el cálculo preciso de intersección y % de área se resuelve en
	// Python vía IntersectionResolver (Shapely + pyproj) — MySQL 5.7 no
	// puede calcular ST_Intersection de forma confiable para estos
	// polígonos (falla con 'Inconsistent intersection points' incluso
	// con geometrías válidas, confirmado a mano antes de este diseño).
	private function CalculateIntersectionsBatch($crgId, $clippingRegionId, $geographyId, $offset, $limit)
	{
		$offsetInt = (int)$offset;
		$limitInt = (int)$limit;
		$items = App::Db()->fetchAll(
			"SELECT cli_id, cli_caption, ST_AsText(cli_geometry_r2) AS Wkt FROM clipping_region_item
			 WHERE cli_clipping_region_id = ? ORDER BY cli_id LIMIT $limitInt OFFSET $offsetInt",
			array($clippingRegionId));

		$skipped = 0;
		$rows = array();
		foreach ($items as $item)
		{
			// echo $item['cli_caption'] . "<p>";

			$candidates = $this->GetCandidateItems($geographyId, $item['Wkt']);
			$resolved = IntersectionResolver::Resolve($item['Wkt'], $candidates);
			$skipped += $resolved['skippedCount'];

			foreach ($resolved['items'] as $geographyItemId => $values)
			{
				if ($values['pct'] > 50)
				{
					$rows[] = array($crgId, $item['cli_id'], $geographyItemId, $values['pct']);
				}
			}
		}

		$start = hrtime(true);
		// echo 'Inserts...<p>';

		$this->InsertIntersectionRows($rows);

		$end = hrtime(true);
		// echo ($end - $start) / 1000000000 . " seconds for " . sizeof($rows) ."<p>";   // Seconds
		// exit;
		return $skipped;
	}

	// El filtro por MBRIntersects usa el índice espacial de
	// snapshot_geography_item (solo disponible en MyISAM en MySQL 5.7,
	// ver RegenForGeography): pasar la geometría de referencia como
	// parámetro (no como subquery correlacionada contra otra tabla) es
	// lo que confirmó, a mano, que el optimizador usa el índice.
	private function GetCandidateItems($geographyId, $baseWkt)
	{
		$rows = App::Db()->fetchAll(
			"SELECT gei_id AS Id, ST_AsText(gei_geometry) AS Wkt FROM geography_item
			 WHERE gei_id IN (
				SELECT giw_geography_item_id FROM snapshot_geography_item
				WHERE giw_geography_id = ? AND MBRIntersects(giw_geometry_r6, ST_GeomFromText(?))
			 )", array($geographyId, $baseWkt));
		return $rows;
	}

	private function InsertIntersectionRows($rows)
	{
		if (count($rows) === 0)
		{
			return;
		}

		// Definir el tamaño máximo del bloque
		$chunkSize = 5000;
		// Dividir los registros en bloques de 5000
		$chunks = array_chunk($rows, $chunkSize);

		foreach ($chunks as $chunk)
		{
			$placeholders = array();
			$params = array();

			foreach ($chunk as $row)
			{
				$placeholders[] = '(?, ?, ?, ?)';
				$params[] = $row[0];
				$params[] = $row[1];
				$params[] = $row[2];
				$params[] = $row[3];
			}

			$sql = "INSERT INTO clipping_region_item_geography_item
					(cgi_clipping_region_geography_id, cgi_clipping_region_item_id, cgi_geography_item_id, cgi_intersection_percent)
					VALUES " . implode(', ', $placeholders);

			App::Db()->execute($sql, $params);
		}
	}

	// ---------------------------------------------------------------
	// Consultas paginadas de items, para debug (acción 'Ver ítems' en
	// cualquier grilla con columna de cantidad). Sin más detalle que el
	// necesario para identificar cada fila contra la base: no reemplaza
	// a los popups de edición, es solo una ventana de lectura.
	// ---------------------------------------------------------------

	public function GetClippingRegionItems($clippingRegionId, $offset, $limit)
	{
		Profiling::BeginTimer();
		$total = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM clipping_region_item WHERE cli_clipping_region_id = ?", array($clippingRegionId));
		$limitInt = (int)$limit;
		$offsetInt = (int)$offset;
		$rows = App::Db()->fetchAll(
			"SELECT cli_id AS Id, cli_code AS Code, cli_caption AS Caption
			 FROM clipping_region_item WHERE cli_clipping_region_id = ?
			 ORDER BY cli_id LIMIT $limitInt OFFSET $offsetInt", array($clippingRegionId));
		Profiling::EndTimer();
		return array('Items' => $rows, 'Total' => $total);
	}

	// Mismos ítems que ve tanto ClippingRegionGeographyPopup como
	// GeographyClippingRegionsPopup: el vínculo (crg_id) es el mismo
	// registro sin importar desde qué lado se abrió.
	public function GetClippingRegionGeographyIntersectionItems($crgId, $offset, $limit)
	{
		Profiling::BeginTimer();
		$total = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM clipping_region_item_geography_item WHERE cgi_clipping_region_geography_id = ?", array($crgId));
		$limitInt = (int)$limit;
		$offsetInt = (int)$offset;
		$rows = App::Db()->fetchAll(
			"SELECT gei.gei_id AS Id, gei.gei_code AS Code, gei.gei_caption AS Caption,
					ROUND(cgi.cgi_intersection_percent, 2) AS IntersectionPercent
			 FROM clipping_region_item_geography_item cgi
			 JOIN geography_item gei ON gei.gei_id = cgi.cgi_geography_item_id
			 WHERE cgi.cgi_clipping_region_geography_id = ?
			 ORDER BY gei.gei_code LIMIT $limitInt OFFSET $offsetInt", array($crgId));
		Profiling::EndTimer();
		return array('Items' => $rows, 'Total' => $total);
	}
}
