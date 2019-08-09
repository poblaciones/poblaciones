<?php

namespace helena\controllers\admin;

class cPublicData extends cWorks
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'P';
		$this->mode = 'P';
	}
	public function ResolveTitle()
	{
		return "Datos públicos";
	}
}
