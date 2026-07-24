<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\classes\StateBag;
use minga\framework\Arr;
use minga\framework\PublicException;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;

class GeographyTupleService extends BaseService
{
	const STEP_FIRST_PASS = 1;
	const STEP_SECOND_PASS = 2;
	const STEP_END = 3;

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
	// diferencia de DraftMetadata).
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

	// Se puede correr las veces que haga falta sobre la misma tupla (no
	// depende de un archivo, solo de geometrías que ya existen en el
	// sistema): cada corrida borra los ítems calculados previamente.
	public function StartCalculateGeographyTuple($tupleId)
	{
		Profiling::BeginTimer();
		$state = new StateBag();
		$state->Initialize();
		$state->Set('tupleId', $tupleId);
		$state->SetTotalSteps(2);
		App::Db()->delete('geography_tuple_item', array('gti_geography_tuple_id' => $tupleId));
		$state->SetStep(self::STEP_FIRST_PASS, 'Calculando equivalencias');
		Profiling::EndTimer();
		return $state->ReturnState(false);
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
		$hasLower = ($tuple->getPreviousLowerGeography() !== null);

		$this->CalculateFirstPass($tuple, $hasLower);

		if ($hasLower)
		{
			$state->SetStep(self::STEP_SECOND_PASS, 'Calculando respaldo de nivel más detallado');
			Profiling::EndTimer();
			return $state->ReturnState(false);
		}
		Profiling::EndTimer();
		return $this->FinishCalculation($state, $tuple);
	}

	private function RunSecondPass($state)
	{
		Profiling::BeginTimer();
		$tuple = App::Orm()->find(entities\GeographyTuple::class, $state->Get('tupleId'));

		$this->CalculateSecondPass($tuple);

		Profiling::EndTimer();
		return $this->FinishCalculation($state, $tuple);
	}

	private function FinishCalculation($state, $tuple)
	{
		$childCount = App::Db()->fetchScalarInt(
			"SELECT COUNT(*) FROM geography_tuple_item WHERE gti_geography_tuple_id = ?", array($tuple->getId()));
		$state->SetResult(array('ChildCount' => $childCount));
		$state->SetStep(self::STEP_END, 'Completado exitosamente');
		return $state->ReturnState(true);
	}

	// Para cada ítem de la geografía actual, busca en la geografía
	// anterior equivalente el que cubre más del 50% de su área. Como
	// PreviousGeography es una partición sin superposición, matemáticamente
	// a lo sumo un ítem puede cumplir esa condición: no hace falta elegir
	// "el primero" entre varios candidatos. is_partial se calcula solo si
	// hay un nivel de respaldo definido (PreviousLowerGeography): sin
	// respaldo, un match parcial es el resultado final igual, así que no
	// tiene sentido marcarlo distinto.
	private function CalculateFirstPass($tuple, $hasLower)
	{
		$partialExpression = '0';
		if ($hasLower)
		{
			$partialExpression = '(t.percent_of_current < 95 OR t.percent_of_previous < 95)';
		}
		$sql = "INSERT INTO geography_tuple_item
				(gti_geography_tuple_id, gti_geography_item_id, gti_geography_previous_id, gti_geography_previous_item_id, gti_is_partial)
				SELECT ?, t.cur_id, ?, t.prev_id, $partialExpression
				FROM (
					SELECT cur.gei_id AS cur_id, prev.gei_id AS prev_id,
						GeometryAreaSphere(ST_Intersection(cur.gei_geometry, prev.gei_geometry)) / GeometryAreaSphere(cur.gei_geometry) * 100 AS percent_of_current,
						GeometryAreaSphere(ST_Intersection(cur.gei_geometry, prev.gei_geometry)) / GeometryAreaSphere(prev.gei_geometry) * 100 AS percent_of_previous
					FROM geography_item cur
					JOIN geography_item prev
						ON MBRIntersects(cur.gei_geometry, prev.gei_geometry)
					   AND ST_Intersects(cur.gei_geometry, prev.gei_geometry)
					WHERE cur.gei_geography_id = ?
					  AND prev.gei_geography_id = ?
				) t
				WHERE t.percent_of_current > 50";
		App::Db()->execute($sql, array(
			$tuple->getId(),
			$tuple->getPreviousGeography()->getId(),
			$tuple->getGeography()->getId(),
			$tuple->getPreviousGeography()->getId(),
		));
	}

	// Solo para los ítems que, tras la primera pasada, no tengan ya una
	// correspondencia completa (sin match, o con match parcial): busca en
	// el nivel de respaldo, más detallado, cualquier ítem que cubra más
	// del 50% de SU PROPIA área (no de la del ítem actual: acá sí puede
	// haber varios matches por ítem, a diferencia de la primera pasada,
	// así que se insertan todos los que cumplan).
	private function CalculateSecondPass($tuple)
	{
		$sql = "INSERT INTO geography_tuple_item
				(gti_geography_tuple_id, gti_geography_item_id, gti_geography_previous_id, gti_geography_previous_item_id, gti_is_partial)
				SELECT ?, cur.gei_id, ?, lower.gei_id, 0
				FROM geography_item cur
				JOIN geography_item lower
					ON MBRIntersects(cur.gei_geometry, lower.gei_geometry)
				   AND ST_Intersects(cur.gei_geometry, lower.gei_geometry)
				WHERE cur.gei_geography_id = ?
				  AND lower.gei_geography_id = ?
				  AND GeometryAreaSphere(ST_Intersection(cur.gei_geometry, lower.gei_geometry)) / GeometryAreaSphere(lower.gei_geometry) * 100 > 50
				  AND NOT EXISTS (
						SELECT 1 FROM geography_tuple_item gti
						WHERE gti.gti_geography_tuple_id = ?
						  AND gti.gti_geography_item_id = cur.gei_id
						  AND gti.gti_is_partial = 0
				  )";
		App::Db()->execute($sql, array(
			$tuple->getId(),
			$tuple->getPreviousLowerGeography()->getId(),
			$tuple->getGeography()->getId(),
			$tuple->getPreviousLowerGeography()->getId(),
			$tuple->getId(),
		));
	}
}
