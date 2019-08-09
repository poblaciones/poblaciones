<?php

namespace helena\services\backoffice\georeference;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;

class GeoreferenceAttributes extends BaseService
{
	// Cuando llega el archivo se baja a disco en un FileBucket,
	// luego se convierte de binario (xlsx, sav o cvs) a json,
	// luego se sube de a bloques (pasos) a la base de datos,
	// luego se borra el FileBucket de disco (la clave FileBucket
	// administra subcarpetas en Temp).
	const GEO_STEP_START = 0;
	const GEO_STEP_VALIDATION_WITH_ERRORS = 1;
	const GEO_STEP_VALIDATION_PASSED = 2;
	const GEO_STEP_REFERENCING_WITH_ERRORS = 3;
	const GEO_STEP_REFERENCING_PASSED = 4;
	const GEO_STEP_END = 0;


	public function ResetGeoreferencingStatus($datasetId, $type)
	{
		$this->SetGeoreferencingStatus($datasetId, self::GEO_STEP_START);
		// Guarda el tipo
		$dat = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$dat->setType($type);
		App::Orm()->save($dat);
	}
	public function SetGeoreferencingStatus($datasetId, $status)
	{
		// actualiza el dat_georeference_status del dataset
		$dat = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$dat->setGeoreferenceStatus($status);
		App::Orm()->save($dat);
	}
	public function AppendOmmitedAndTotalRows($dat, $ommited, $refs, $total)
	{
		$currentValue = $dat->getGeoreferenceAttributes();
		if ($currentValue === null)
		{
			$currentValue = array();
		}
		else
		{
			$currentValue = json_decode($currentValue, true);
		}
		$currentValue['ommited'] = $ommited;
		$currentValue['referencedCount'] = $refs;
		$currentValue['rowCount'] = $total;
		$dat->setGeoreferenceAttributes(json_encode($currentValue));
		App::Orm()->save($dat);
	}
	public function UpdateGeoreferencingAttributesIfChanged($datasetId, $attributes)
	{
		$newValue = json_encode($attributes);
		// actualiza el dat_georeference_attributes del dataset como json si cambió
		$dat = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$currentValue = $dat->getGeoreferenceAttributes();
		if ($newValue != $currentValue)
		{
			$dat->setGeoreferenceAttributes(json_encode($attributes));
			App::Orm()->save($dat);
			return true;
		}
		else
		{
			return false;
		}
	}
}

