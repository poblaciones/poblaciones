<?php

namespace helena\services\backoffice;


use minga\framework\Profiling;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\common\BaseService;

use helena\services\backoffice\georeference\GeoreferenceStateBag;
use helena\services\backoffice\georeference\GeoreferenceAttributes;
use helena\services\backoffice\georeference\GeoreferenceByLatLon;
use helena\services\backoffice\georeference\GeoreferenceByCodes;
use helena\services\backoffice\georeference\GeoreferenceByShapes;
use helena\services\backoffice\georeference\GeoreferenceWrapSegment;
use helena\services\backoffice\georeference\GeoreferenceWrapLocation;
use minga\framework\PublicException;

class GeoreferenceService extends BaseService
{
	const STEP_BEGIN = 0;
	const STEP_RESETTING = 1;
	const STEP_VALIDATING = 2;
	const STEP_GEOREFERENCING = 3;
	const STEP_UPDATING = 4;
	const STEP_ATTRIBUTES = 5;
	const STEP_END = 6;

	const GEO_LAT_LON = 1;
	const GEO_CODES = 2;
	const GEO_SHAPES = 3;

	const MAX_ROWS = 5000;

	private $start = 0.0;

	private $state;

	function __construct()
	{
			$this->start = microtime(true);
	}

	public function CreateMultiGeoreferenceByLatLong($datasetId, $geographyId, $startLatColumnId, $startLonColumnId,
																						$endLatColumnId, $endLonColumnId, $georeferenceSegments, $reset)
	{
		Profiling::BeginTimer();
		$attributes = array('geographyId' => $geographyId, 'startLatColumnId' => $startLatColumnId, 'startLonColumnId' => $startLonColumnId,
																			'endLatColumnId' => $endLatColumnId, 'endLonColumnId' => $endLonColumnId, 'georeferenceSegments' => $georeferenceSegments);

		$this->PrepareNewState($datasetId, self::GEO_LAT_LON, $geographyId, $geographyId, $reset, 'L', $georeferenceSegments, $attributes);

		$lat = App::Orm()->find(entities\DraftDatasetColumn::class, $startLatColumnId);
		$lon = App::Orm()->find(entities\DraftDatasetColumn::class, $startLonColumnId);
		if ($georeferenceSegments)
		{
			$lat2 = App::Orm()->find(entities\DraftDatasetColumn::class, $endLatColumnId);
			$lon2 = App::Orm()->find(entities\DraftDatasetColumn::class, $endLonColumnId);
			$this->state->Set('startLat', $lat->getField());
			$this->state->Set('startLon', $lon->getField());
			$this->state->Set('endLat', $lat2->getField());
			$this->state->Set('endLon', $lon2->getField());
			$this->ResetGeocoded($lat, $lon, $lat2, $lon2);
		}
		else
		{
			$this->state->Set('lat', $lat->getField());
			$this->state->Set('lon', $lon->getField());
			$this->ResetGeocoded($lat, $lon);
		}
		$ret = $this->InitializeProcess();
		return $ret;
	}

	public function CreateMultiGeoreferenceByCodes($datasetId,
															$startGeographyId, $startCodesColumnId, $endGeographyId,
															$endCodesColumnId, $georeferenceSegments, $reset)
	{
		Profiling::BeginTimer();
		// Crea la estructura para la creación en varios pasos del archivo a descargar
		if ($georeferenceSegments)
		{
			$attributes = array('startGeographyId' => $startGeographyId, 'startCodesColumnId' => $startCodesColumnId,
												'endGeographyId' => $endGeographyId, 'endCodesColumnId' => $endCodesColumnId,
												'georeferenceSegments' => '1');
		}
		else
		{
			$attributes = array('geographyId' => $startGeographyId, 'codesColumnId' => $startCodesColumnId,
												'georeferenceSegments' => '0');
		}

		$this->PrepareNewState($datasetId, self::GEO_CODES, $startGeographyId, $endGeographyId, $reset, 'D', $georeferenceSegments, $attributes);
		// Guarda las columnas
		$codesColumn = App::Orm()->find(entities\DraftDatasetColumn::class, $startCodesColumnId);
		if ($georeferenceSegments)
		{
			$this->state->Set('startCode', $codesColumn->getField());
			$this->state->Set('startGeographyId', $startGeographyId);
			$endCodesColumn = App::Orm()->find(entities\DraftDatasetColumn::class, $endCodesColumnId);
			$this->state->Set('endCode', $endCodesColumn->getField());
			$this->state->Set('endGeographyId', $endGeographyId);
		}
		else
		{
			$this->state->Set('code', $codesColumn->getField());
			$this->state->Set('geographyId', $startGeographyId);
		}
		// Resetea atributos de selección de variables
		$this->ResetGeocoded();

		$ret = $this->InitializeProcess();
		Profiling::EndTimer();
		return $ret;
	}

	public function CreateMultiGeoreferenceByShapes($datasetId, $geographyId, $shapesColumnId, $reset)
	{
		Profiling::BeginTimer();
		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$attributes = array('geographyId' => $geographyId, 'shapesColumnId' => $shapesColumnId);
		$this->PrepareNewState($datasetId, self::GEO_SHAPES, $geographyId, $geographyId, $reset, 'S', false, $attributes);
		$shapesColumn = App::Orm()->find(entities\DraftDatasetColumn::class, $shapesColumnId);
		$this->state->Set('shape', $shapesColumn->getField());
		$this->ResetGeocoded();

		$ret = $this->InitializeProcess();
		Profiling::EndTimer();
		return $ret;
	}

	private function PrepareNewState($datasetId, $type, $geographyId, $geographySegmentId, $reset, $datasetType, $georefenceSegments, $attributes)
	{
		$fromErrors = false;
		if ($reset)
		{
			$step = self::STEP_RESETTING;
		}
		else
		{
			$step = $this->GetStepFromGeorreferenceStatus($datasetId, $fromErrors);
		}
		if (!$georefenceSegments)
			$geographySegmentId = null;
		$this->UpdateGeoreferencingAttributesIfChanged($datasetId, $datasetType, $attributes);
		$caption = $this->GetStepCaption($step);
		$this->state = GeoreferenceStateBag::Create($datasetId, $type, $geographyId, $geographySegmentId, $fromErrors, $datasetType, $georefenceSegments);
		$this->state->SetTotalSteps(self::STEP_END);
		$this->state->SetStep($step, $caption);
		$this->state->Save();
	}

	private function InitializeProcess()
	{
		if ($this->state->FromErrors())
		{
			// Mueve los datos de _errors a _retry, dejando _errors vacía.
			$drop = "DROP TABLE IF EXISTS " . $this->state->RetryTable();
			App::Db()->execDDL($drop);
			$rename = "RENAME TABLE " . $this->state->ErrorsTable() . " TO " . $this->state->RetryTable();
			App::Db()->execDDL($rename);
			$this->EnsureErrorsTableExists();
		}
		$this->state->Save();
		Profiling::EndTimer();
		return $this->state->ReturnState(false);
	}

	public function StepMultiGeoreference($key)
	{
		Profiling::BeginTimer();
		// Carga los estados
		$this->LoadState($key);
		// Avanza
		switch($this->state->Step())
		{
			case self::STEP_RESETTING:
				$done = $this->ResetProcess();
				break;
			case self::STEP_VALIDATING:
				$done = $this->LoopStep("Validate", self::STEP_GEOREFERENCING);
				break;
			case self::STEP_GEOREFERENCING:
				$done = $this->LoopStep("Georeference", self::STEP_UPDATING);
				break;
			case self::STEP_UPDATING:
				$done = $this->LoopStep("Update", self::STEP_ATTRIBUTES);
				break;
			case self::STEP_ATTRIBUTES:
				$this->UpdateGeocodedAndType();
				$done = false;
				break;
			case self::STEP_END:
				$done = true;
				break;
			default:
				throw new PublicException('Paso inválido.');
		}
		$this->state->Save();
		Profiling::EndTimer();
		return $this->state->ReturnState($done);
	}
	private function ResetProcess()
	{
		Profiling::BeginTimer();

		$datasetId = $this->state->GetDatasetId();
		$datasetService = new GeoreferenceAttributes();
		$datasetType = $this->state->GetDatasetType();
		$datasetService->ResetGeoreferencingStatus($datasetId, $datasetType, $this->state->GeoreferenceSegments());
		// Resetea el ommit
		$resetOmmit = "UPDATE " . $this->state->Table() . " SET ommit = 0 WHERE ommit = 1";
		App::Db()->exec($resetOmmit);
		// Crea tabla de errores
		$this->EnsureErrorsTableExists(true);
		// Sigue...
		$step = self::STEP_VALIDATING;
		$caption = $this->GetStepCaption($step);
		$this->state->SetStep($step, $caption);

		Profiling::EndTimer();
		return false;
	}

	private function EnsureErrorsTableExists($dropFirst = false)
	{
		if ($dropFirst)
		{
			$delete = "DROP TABLE IF EXISTS " . $this->state->ErrorsTable();
			App::Db()->execDDL($delete);
		}
		$create = "CREATE TABLE IF NOT EXISTS " . $this->state->ErrorsTable() . " (row_id INT, error_code INT)";
		App::Db()->execDDL($create);
	}

	private function LoopStep($method, $next)
	{
		$slice = $this->state->Slice();
		$referencer = $this->GetGeoreferencer();
		if ($slice == 0)
		{
			$rowCount = $referencer->CountRows();
			$this->state->SetTotalSlices($rowCount);
		}
		$totalRows = $this->state->GetTotalSlices();
		if ($referencer->$method($slice, self::MAX_ROWS, $totalRows) == false)
		{
			$max = $totalRows;
			$nextSlice = min($max, $slice + self::MAX_ROWS);
			$this->state->SetSlice($nextSlice);
			return false;
		}
		else
		{
			$withErrors = $this->state->ErrorsFound() > 0;
			$this->UpdateGeoreferencingStatus($withErrors);
			if ($withErrors)
			{
				return true;
			}
			else
			{
				$caption = $this->GetStepCaption($next);
				$this->state->SetStep($next, $caption);
				$this->state->ResetFromErrors();
				return false;
			}
		}
	}

	private function GetStepCaption($step)
	{
		switch ($step)
		{
			case self::STEP_RESETTING:
				return "Inicializando";
			case self::STEP_VALIDATING:
				return "Validando la información";
			case self::STEP_GEOREFERENCING:
				return "Georeferenciando elementos del dataset";
			case self::STEP_UPDATING:
				return "Actualizando la información";
			case self::STEP_ATTRIBUTES:
				return "Actualizando atributos";
			case self::STEP_END:
				return "Completado";
			default:
				return "Paso no reconocido.";
		}
	}

	private function UpdateGeocodedAndType()
	{
		// Avanza el paso final
		$step = self::STEP_END;
		$caption = $this->GetStepCaption($step);
		$this->state->SetStep($step, $caption);

		// Graba los atributes
		$dat = App::Orm()->find(entities\DraftDataset::class, $this->state->GetDatasetId());

		$dat->setGeoCoded(true);
		$dat->setType($this->GetDatasetType());

		App::Orm()->save($dat);
		// Guarda cantidad de filas totales y omitidas
		$this->SaveRowCounts($dat);
		// Setea el flag el work para la publicación
		DatasetService::DatasetChanged($dat);
	}

	private function SaveRowCounts($dat)
	{
		$sql = "SELECT COUNT(*) c, COUNT(geography_item_id) r, SUM(ommit) o FROM " . $dat->getTable();
		$res = App::Db()->fetchAssoc($sql);
		$service = new GeoreferenceAttributes();
		$service->AppendOmmitedAndTotalRows($dat, $res['o'], $res['r'],  $res['c']);
	}
	private function ResetGeocoded($lat = null, $lon = null, $lat2 = null, $lon2 = null)
	{
		$dat = App::Orm()->find(entities\DraftDataset::class, $this->state->GetDatasetId());

		$dat->setGeography($this->state->Geography());
		$dat->setGeographySegment($this->state->GeographySegment());
		$dat->setGeoCoded(false);

		if ($lat != null)
		{
			$dat->setLatitudeColumn($lat);
			$dat->setLongitudeColumn($lon);
		}
		else
		{
			$dat->setLatitudeColumn(null);
			$dat->setLongitudeColumn(null);
		}
		if ($lat2 != null)
		{
			$dat->setLatitudeColumnSegment($lat2);
			$dat->setLongitudeColumnSegment($lon2);
		}
		else
		{
			$dat->setLatitudeColumnSegment(null);
			$dat->setLongitudeColumnSegment(null);
		}
		App::Orm()->save($dat);
	}

	private function UpdateGeoreferencingStatus($withErrors)
	{
		switch($this->state->Step())
		{
			case self::STEP_VALIDATING:
				$status = ($withErrors ? GeoreferenceAttributes::GEO_STEP_VALIDATION_WITH_ERRORS : GeoreferenceAttributes::GEO_STEP_VALIDATION_PASSED);
				break;
			case self::STEP_GEOREFERENCING:
				$status = ($withErrors ? GeoreferenceAttributes::GEO_STEP_REFERENCING_WITH_ERRORS : GeoreferenceAttributes::GEO_STEP_REFERENCING_PASSED);
				break;
			case self::STEP_UPDATING:
				$status = GeoreferenceAttributes::GEO_STEP_END;
				break;
			default:
				throw new PublicException('Paso inválido.');
		}
		$service = new GeoreferenceAttributes();
		$service->SetGeoreferencingStatus($this->state->GetDatasetId(), $status);
	}
	private function getGeoreferenceStatus($datasetId)
	{
		$dat = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		return $dat->getGeoreferenceStatus();
	}
	private function GetGeoreferencer()
	{
		$ret = $this->GetGeoreferencerByType($this->state->GetType());
		if ($this->state->GeoreferenceSegments())
			return new GeoreferenceWrapSegment($ret);
		else
			return $ret;
	}
	private function GetGeoreferencerByType($type)
	{
		switch($type)
		{
			case self::GEO_LAT_LON:
				return new GeoreferenceByLatLon($this->state);
			case self::GEO_CODES:
				return new GeoreferenceByCodes($this->state);
			case self::GEO_SHAPES:
				return new GeoreferenceByShapes($this->state);
			default:
				throw new PublicException('Tipo de georreferenciación no reconocida');
		}
	}
	private function GetDatasetType()
	{
		switch($this->state->GetType())
		{
			case self::GEO_LAT_LON:
				return 'L';
			case self::GEO_CODES:
				return 'D';
			case self::GEO_SHAPES:
				return 'S';
			default:
				throw new PublicException('Tipo de georreferenciación inválida');
		}
	}
	private function LoadState($key)
	{
		$this->state = new GeoreferenceStateBag();
		$this->state->LoadFromKey($key);
	}

	private function UpdateGeoreferencingAttributesIfChanged($datasetId, $datasetType, $attributes)
	{
		$attributes['datasetType'] = $datasetType;
		$service = new GeoreferenceAttributes();
		return $service->UpdateGeoreferencingAttributesIfChanged($datasetId, $attributes);
	}

	private function GetStepFromGeorreferenceStatus($datasetId, &$fromErrors)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$status = $this->getGeoreferenceStatus($datasetId);
		switch($status)
		{
			case GeoreferenceAttributes::GEO_STEP_START:
				$step = self::STEP_VALIDATING;
				break;
			case GeoreferenceAttributes::GEO_STEP_VALIDATION_WITH_ERRORS:
				$step = self::STEP_VALIDATING;
				$fromErrors = true;
				break;
			case GeoreferenceAttributes::GEO_STEP_VALIDATION_PASSED:
				$step = self::STEP_GEOREFERENCING;
				break;
			case GeoreferenceAttributes::GEO_STEP_REFERENCING_WITH_ERRORS:
				$step = self::STEP_GEOREFERENCING;
				$fromErrors = true;
				break;
			case GeoreferenceAttributes::GEO_STEP_REFERENCING_PASSED:
				$step = self::STEP_UPDATING;
				break;
			default:
				throw new PublicException('La georrefenciación está en un estado inválida. Deberá recomenzar con la misma.');
		}
		return $step;
	}
}

