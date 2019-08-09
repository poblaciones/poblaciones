<?php

namespace helena\controllers\admin;

class cPublicDataDraft extends cWorks
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'P';
		$this->mode = 'D';
	}

	public function ResolveTitle()
	{
		return "Borradores de datos públicos";
	}
}
