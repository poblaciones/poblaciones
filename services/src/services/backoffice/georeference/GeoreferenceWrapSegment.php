<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceWrapSegment extends GeoreferenceWrapBase
{
	public function __construct($wrapped)
	{
		parent::__construct($wrapped);
	}

	public function Validate($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		$this->wrapped->Validate($from, $pageSize, $totalRows);
		$this->setEndFields();
	  return $this->wrapped->Validate($from, $pageSize, $totalRows);
	}

	public function Georeference($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		$this->wrapped->Georeference($from, $pageSize, $totalRows);
		$this->setEndFields();
		return $this->wrapped->Georeference($from, $pageSize, $totalRows);
	}

	public function Update($from, $pageSize, $totalRows)
	{
		$this->setStartFields();
		$this->wrapped->Update($from, $pageSize, $totalRows);
		$this->setEndFields();
		return $this->wrapped->Update($from, $pageSize, $totalRows);
	}
}

