<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceSegment extends GeoreferenceBase
{
	private $referencer;

	public function __construct($referencer)
	{
		$this->referencer = $referencer;
	}

	public function Validate($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		if ($this->referencer->Validate($from, $pageSize, $totalRows) === false)
		{
			return false;
		}
		else
		{
			$this->setEndFields();
			return $this->referencer->Validate($from, $pageSize, $totalRows);
		}
	}

	public function Georeference($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		if ($this->referencer->Georeference($from, $pageSize, $totalRows) === false)
		{
			return false;
		}
		else
		{
			$this->setEndFields();
			return $this->referencer->Georeference($from, $pageSize, $totalRows);
		}
	}

	public function Update($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		if ($this->referencer->Update($from, $pageSize, $totalRows) === false)
		{
			return false;
		}
		else
		{
			$this->setEndFields();
			return $this->referencer->Update($from, $pageSize, $totalRows);
		}
	}

	private function setStartFields()
	{
		$this->setFields('start', 'geography_item_id');
	}
	private function setEndFields()
	{
		$this->setFields('end', 'geography_item_segment_id');
	}
	private function setFields($preffix, $updateColumn)
	{
		$value = $this->referencer->state->Get($preffix . 'Code');
		$this->referencer->state->Set('code', $value);

		$value = $this->referencer->state->Get($preffix . 'Lat');
		$this->referencer->state->Set('lat', $value);
		$value = $this->referencer->state->Get($preffix . 'Lon');
		$this->referencer->state->Set('lon', $value);

		$this->referencer->state->Set('updateColumn', $updateColumn);
	}
	public function CountRows()
	{
		return $this->referencer->CountRows();
	}
}

