<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\classes\StateBag;
use minga\framework\Arr;
use minga\framework\PublicException;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;
use helena\classes\IntersectionResolver;

class GeographyTupleService extends BaseService
{
	const STEP_FIRST_PASS = 0;
	const STEP_SECOND_PASS = 1;
	const STEP_END = 2;

	public function GetNewGeographyTuple()
	{
		$entity = new entities\GeographyTuple();
		return $entity;
	}

	public function GetGeographyTuples()
	{
		Profiling::BeginTimer();
		$tuples = App::Orm()->findAll(entities\GeographyTuple::class);
		$this->AddChildCount($tuples);
		Profiling::EndTimer();
		return $tuples;
	}

	private function AddChildCount(&$tuples)
	{
		Profiling::BeginTimer();
		$sql = "SELECT gti_geography_tuple_id AS Id, COUNT(*) AS Count
					FROM geography_tuple_item GROUP BY gti_geography_tuple_id";
		$counts = App::Db()->fetchAll($sql);
		foreach ($tuples as $tuple)
		{
			$id = $tuple->getId();
			$n = Arr::IndexOfByNamedValue($counts, 'Id', $id);
			if ($n !== -1)
			{
				$tuple->ChildCount = $counts[$n]['Count'];
			}
			else
			{
				$tuple->ChildCount = 0;
			}
		}
		Profiling::EndTimer();
	}

	// gtu_metadata_id es NOT NULL en la base: a diferencia de Boundary,
	// ClippingRegion y Geography (donde el metadata es opcional y se
	// agrega después con su propia acción de grilla), acá hace falta
	// desde el alta. Se crea automáticamente con datos mínimos, editables
	// después con la misma acción de 'Metadatos' que el resto del ABM.
	public function UpdateGeographyTuple($tuple)
	{
		Profiling::BeginTimer();
		if ($tuple->getMetadata() === null)
		{
			$title = $tuple->getGeography()->getCaption() . ' - equivalencia con revisión anterior';
			$tuple->setMetadata($this->CreateMetadata($title));
		}
		App::Orm()->Save($tuple);
		Profiling::EndTimer();
		return self::OK;
	}

	// Mismos valores iniciales que WorkService::CreateMetadata, con
	// met_type = 'C' (metadata sin un Work asociado, confirmado contra
	// MetadataService::GetMetadataInfo) y sin Contact (nullable acá, a
	// diferencia de DraftMetadata). met_id no es autonumérico (a
	// diferencia de las tablas draft_*): hay que resolverlo a mano antes
	// de guardar, con el mismo mecanismo que ya usa el resto del sistema
	// para esta tabla (MetadataService::EnsureId, que busca el máximo
	// múltiplo de 100 y usa el siguiente).
	private function CreateMetadata($title)
	{
		$metadata = new entities\Metadata();
		$metadata->setTitle($title);
		$metadata->setAbstract('');
		$metadata->setStatus('B');
		$metadata->setAuthors('');
		$metadata->setCoverageCaption('');
		$metadata->setLicense('{"licenseType":1,"licenseOpen":"always","licenseCommercial":1,"licenseVersion":"4.0/deed.es"}');
		$metadata->setType('C');
		$metadata->setLanguage('es; Español');
		$metadata->setCreate(new \DateTime());
		$metadata->setUpdate(new \DateTime());
		$metadataService = new MetadataService();
		$metadataService->EnsureId(entities\Metadata::class, $metadata);
		App::Orm()->Save($metadata);
		return $metadata;
	}

	public function DeleteGeographyTuple($tuple)
	{
		Profiling::BeginTimer();
		App::Db()->delete('geography_tuple_item', array('gti_geography_tuple_id' => $tuple->getId()));
		App::Orm()->delete($tuple);
		Profiling::EndTimer();
		return self::OK;
	}

	// ---------------------------------------------------------------
	// Cálculo de equivalencias (dos pasadas)
	// ---------------------------------------------------------------

	// El plan se procesa en lotes de a lo sumo BATCH_SIZE ítems: si cada
	// paso dependiera de procesar toda la geografía de una sola vez, una
	// con muchos ítems podía hacer que ese paso tardara varios minutos y
	// venciera el timeout del servidor web.
	const BATCH_SIZE = 100;

	// Se puede correr las veces que haga falta sobre la misma tupla (no
	// depende de un archivo, solo de geometrías que ya existen en el
	// sistema): cada corrida borra los ítems calculados previamente.
	public function StartCalculateGeographyTuple($tupleId)
	{
		Profiling::BeginTimer();
		$tuple = App::Orm()->find(entities\GeographyTuple::class, $tupleId);
		$hasLower = ($tuple->getPreviousLowerGeography() !== null);

		$geographyIds = array($tuple->getGeography()->getId(), $tuple->getPreviousGeography()->getId());
		if ($hasLower)
		{
			$geographyIds[] = $tuple->getPreviousLowerGeography()->getId();
		}
		$this->ValidateSnapshotUpToDate($geographyIds);

		$itemCount = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM geography_item WHERE gei_geography_id = ?", array($tuple->getGeography()->getId()));
		$batchCount = max(1, (int)ceil($itemCount / self::BATCH_SIZE));

		$state = CalculationStateBag::Create();
		$state->Set('tupleId', $tupleId);
		$state->Set('hasLower', $hasLower);
		$state->Set('batchCount', $batchCount);
		App::Db()->delete('geography_tuple_item', array('gti_geography_tuple_id' => $tupleId));

		$totalSteps = 1;
		if ($hasLower)
		{
			$totalSteps = 2;
		}
		$state->SetTotalSteps($totalSteps);
		$state->SetTotalSlices($batchCount);
		$state->SetStep(self::STEP_FIRST_PASS, 'Calculando equivalencias');
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	// El cálculo depende del índice espacial de snapshot_geography_item:
	// al ser una tabla pre-calculada, puede haber quedado desactualizada
	// si alguna de las geografías se editó después de la última
	// regeneración. Se valida acá para dar un error claro en vez de un
	// resultado silenciosamente incompleto.
	private function ValidateSnapshotUpToDate($geographyIds)
	{
		$uniqueIds = array_unique($geographyIds);
		foreach ($uniqueIds as $geographyId)
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

	public function StepCalculateGeographyTuple($key)
	{
		$state = new StateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_FIRST_PASS:
				return $this->RunFirstPass($state);
			case self::STEP_SECOND_PASS:
				return $this->RunSecondPass($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	private function RunFirstPass($state)
	{
		Profiling::BeginTimer();
		$tuple = App::Orm()->find(entities\GeographyTuple::class, $state->Get('tupleId'));
		$hasLower = $state->Get('hasLower');
		$offset = $state->Slice() * self::BATCH_SIZE;

		$skipped = $this->CalculateFirstPassBatch($tuple, $hasLower, $offset, self::BATCH_SIZE);
		if ($skipped > 0)
		{
			$state->Set('skipped', $state->Get('skipped', 0) + $skipped);
		}

		$state->NextSlice();
		if ($state->Slice() >= $state->Get('batchCount'))
		{
			if ($hasLower)
			{
				$state->SetStep(self::STEP_SECOND_PASS, 'Calculando respaldo de nivel más detallado');
				Profiling::EndTimer();
				return $state->ReturnState(false);
			}
			Profiling::EndTimer();
			return $this->FinishCalculation($state, $tuple);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function RunSecondPass($state)
	{
		Profiling::BeginTimer();
		$tuple = App::Orm()->find(entities\GeographyTuple::class, $state->Get('tupleId'));
		$offset = $state->Slice() * self::BATCH_SIZE;

		$skipped = $this->CalculateSecondPassBatch($tuple, $offset, self::BATCH_SIZE);
		if ($skipped > 0)
		{
			$state->Set('skipped', $state->Get('skipped', 0) + $skipped);
		}

		$state->NextSlice();
		if ($state->Slice() >= $state->Get('batchCount'))
		{
			Profiling::EndTimer();
			return $this->FinishCalculation($state, $tuple);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function FinishCalculation($state, $tuple)
	{
		$childCount = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM geography_tuple_item WHERE gti_geography_tuple_id = ?", array($tuple->getId()));
		$result = array('ChildCount' => $childCount);
		$extraKeys = array();
		$totalSkipped = $state->Get('skipped', 0);
		if ($totalSkipped > 0)
		{
			$result['ItemsSkipped'] = $totalSkipped;
			$state->Set('errorsFound', $totalSkipped . ' ítem(s) no pudieron calcularse: fallaron al resolver la '
				. 'intersección geométrica, probablemente por la complejidad del polígono.');
			$extraKeys[] = 'errorsFound';
		}
		$state->SetResult($result);
		$state->SetStep(self::STEP_END, 'Completado exitosamente');
		return $state->ReturnState(true, $extraKeys);
	}

	// Para cada ítem de la geografía actual, busca en la geografía
	// anterior equivalente el que cubre más del 50% de su área. Como
	// PreviousGeography es una partición sin superposición, matemáticamente
	// a lo sumo un ítem puede cumplir esa condición: no hace falta elegir
	// "el primero" entre varios candidatos. is_partial se calcula solo si
	// hay un nivel de respaldo definido (PreviousLowerGeography): sin
	// respaldo, un match parcial es el resultado final igual, así que no
	// tiene sentido marcarlo distinto. El cálculo preciso de intersección
	// y % de área se delega a Python vía IntersectionResolver (Shapely +
	// pyproj), no a MySQL: ver el comentario equivalente en
	// ClippingRegionService::CalculateIntersectionsBatch.
	//
	// El % que importa acá es 'pctOfBase' (cuánto del ítem actual cubre
	// el candidato anterior), al revés que en ClippingRegionService: por
	// eso $item (actual) es la base pasada a Resolve(), y los candidatos
	// son los de PreviousGeography.
	private function CalculateFirstPassBatch($tuple, $hasLower, $offset, $limit)
	{
		$offsetInt = (int)$offset;
		$limitInt = (int)$limit;
		$items = App::Db()->fetchAll(
			"SELECT gei_id, ST_AsText(gei_geometry) AS Wkt FROM geography_item
			 WHERE gei_geography_id = ? ORDER BY gei_id LIMIT $limitInt OFFSET $offsetInt",
			array($tuple->getGeography()->getId()));

		$skipped = 0;
		$rows = array();
		foreach ($items as $item)
		{
			$candidates = $this->GetCandidateItems($tuple->getPreviousGeography()->getId(), $item['Wkt']);
			$resolved = IntersectionResolver::Resolve($item['Wkt'], $candidates);
			$skipped += $resolved['skippedCount'];

			foreach ($resolved['items'] as $previousItemId => $values)
			{
				if ($values['pctOfBase'] > 50)
				{
					$isPartial = 0;
					if ($hasLower && ($values['pctOfBase'] < 95 || $values['pct'] < 95))
					{
						$isPartial = 1;
					}
					$rows[] = array($tuple->getId(), $item['gei_id'], $tuple->getPreviousGeography()->getId(), $previousItemId, $isPartial);
					// PreviousGeography es una partición sin superposición:
					// matemáticamente a lo sumo un candidato puede superar
					// el 50% del área de la base, así que no hace falta
					// seguir revisando el resto para este ítem.
					break;
				}
			}
		}

		$this->InsertTupleItemRows($rows);
		return $skipped;
	}

	// El filtro por MBRIntersects usa el índice espacial de
	// snapshot_geography_item (solo disponible en MyISAM en MySQL 5.7,
	// ver SnapshotGeographiesModel::RegenForGeography): pasar la
	// geometría de referencia como parámetro (no como subquery
	// correlacionada) es lo que confirmó, a mano, que el optimizador usa
	// el índice.
	private function GetCandidateItems($geographyId, $baseWkt)
	{
		return App::Db()->fetchAll(
			"SELECT gei_id AS Id, ST_AsText(gei_geometry) AS Wkt FROM geography_item
			 WHERE gei_id IN (
				SELECT giw_geography_item_id FROM snapshotp_geography_item
				WHERE giw_geography_id = ? AND MBRIntersects(giw_geometry_r6, ST_GeomFromText(?))
			 )", array($geographyId, $baseWkt));
	}

	private function InsertTupleItemRows($rows)
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
				$placeholders[] = '(?, ?, ?, ?, ?)';
				$params[] = $row[0];
				$params[] = $row[1];
				$params[] = $row[2];
				$params[] = $row[3];
				$params[] = $row[4];
			}

			$sql = "INSERT INTO geography_tuple_item
					(gti_geography_tuple_id, gti_geography_item_id, gti_geography_previous_id, gti_geography_previous_item_id, gti_is_partial)
					VALUES " . implode(', ', $placeholders);

			App::Db()->execute($sql, $params);
		}
	}

	// Solo para los ítems que, tras la primera pasada, no tengan ya una
	// correspondencia completa (sin match, o con match parcial): busca en
	// el nivel de respaldo, más detallado, cualquier ítem que cubra más
	// del 50% de SU PROPIA área (no de la del ítem actual: acá sí puede
	// haber varios matches por ítem, a diferencia de la primera pasada,
	// así que se insertan todos los que cumplan). Por eso acá el % que
	// importa es 'pct' (respecto al candidato), no 'pctOfBase'.
	private function CalculateSecondPassBatch($tuple, $offset, $limit)
	{
		$offsetInt = (int)$offset;
		$limitInt = (int)$limit;
		$items = App::Db()->fetchAll(
			"SELECT gei_id, ST_AsText(gei_geometry) AS Wkt FROM geography_item
			 WHERE gei_geography_id = ? ORDER BY gei_id LIMIT $limitInt OFFSET $offsetInt",
			array($tuple->getGeography()->getId()));

		$skipped = 0;
		$rows = array();
		foreach ($items as $item)
		{
			$hasFullMatch = App::Db()->fetchScalarIntNullable(
				"SELECT 1 FROM geography_tuple_item WHERE gti_geography_tuple_id = ?
				 AND gti_geography_item_id = ? AND gti_is_partial = 0", array($tuple->getId(), $item['gei_id']));
			if ($hasFullMatch === null)
			{
				$candidates = $this->GetCandidateItems($tuple->getPreviousLowerGeography()->getId(), $item['Wkt']);
				$resolved = IntersectionResolver::Resolve($item['Wkt'], $candidates);
				$skipped += $resolved['skippedCount'];

				foreach ($resolved['items'] as $lowerItemId => $values)
				{
					if ($values['pct'] > 50)
					{
						$rows[] = array($tuple->getId(), $item['gei_id'], $tuple->getPreviousLowerGeography()->getId(), $lowerItemId, 0);
					}
				}
			}
		}

		$this->InsertTupleItemRows($rows);
		return $skipped;
	}

	// Para la acción 'Ver ítems' (debug) sobre la columna 'Ítems
	// calculados' del listado.
	public function GetGeographyTupleCalculatedItems($tupleId, $offset, $limit)
	{
		Profiling::BeginTimer();
		$total = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM geography_tuple_item WHERE gti_geography_tuple_id = ?", array($tupleId));
		$limitInt = (int)$limit;
		$offsetInt = (int)$offset;
		$rows = App::Db()->fetchAll(
			"SELECT gti.gti_id AS Id, cur.gei_code AS Code, cur.gei_caption AS Caption,
					prev.gei_code AS PreviousCode, prev.gei_caption AS PreviousCaption, gti.gti_is_partial AS IsPartial
			 FROM geography_tuple_item gti
			 JOIN geography_item cur ON cur.gei_id = gti.gti_geography_item_id
			 JOIN geography_item prev ON prev.gei_id = gti.gti_geography_previous_item_id
			 WHERE gti.gti_geography_tuple_id = ?
			 ORDER BY gti.gti_id LIMIT $limitInt OFFSET $offsetInt", array($tupleId));
		Profiling::EndTimer();
		return array('Items' => $rows, 'Total' => $total);
	}
}
