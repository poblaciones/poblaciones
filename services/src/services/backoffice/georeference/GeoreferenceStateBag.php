<?php

namespace helena\services\backoffice\georeference;

use helena\classes\App;

use helena\classes\StateBag;
use minga\framework\IO;
use minga\framework\Context;
use helena\entities\backoffice as entities;

class GeoreferenceStateBag extends StateBag
{
	public static function Create($datasetId, $type, $geographyId, $fromErrors, $datasetType, $georefenceSegments)
	{
		$ret = new GeoreferenceStateBag();
		$ret->Initialize();

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);

		$ret->SetArray(array(
			'type' => $type,
			'datasetType' => $datasetType,
			'datasetId' => $datasetId,
			'table' => $dataset->getTable(),
			'geographyId' => $geographyId,
			'progressLabel' => 'Georeferenciando',
			'errorsFound' => 0,
			'fromErrors' => $fromErrors,
			'georeferenceSegments' => $georefenceSegments,
			'updateColumn' => 'geography_item_id'
		));
		return $ret;
	}
	public function Geography()
	{
		$geographyId = $this->GeographyId();
		return App::Orm()->find(entities\Geography::class, $geographyId);
	}
	public function Table()
	{
		return $this->state['table'];
	}

	public function IncrementErrors($count = 1)
	{
		$this->state['errorsFound'] += $count;
	}
	public function ErrorsFound()
	{
		return $this->state['errorsFound'];
	}
	public function GeographyId()
	{
		return $this->state['geographyId'];
	}
	public function ErrorsTable()
	{
		return $this->Table() . '_errors';
	}
	public function RetryTable()
	{
		return $this->Table() . '_retry';
	}

	public function FromErrors()
	{
		return $this->state['fromErrors'];
	}
	public function ResetFromErrors()
	{
		$this->state['fromErrors'] = false;
	}
	 public function GetType()
	{
		return $this->state['type'];
	}
	public function GetDatasetType()
	{
		return $this->state['datasetType'];
	}
	public function GetDatasetId()
	{
		return $this->state['datasetId'];
	}
	public function GeoreferenceSegments()
	{
		return $this->state['georeferenceSegments'];
	}
}

