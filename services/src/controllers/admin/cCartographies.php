<?php

namespace helena\controllers\admin;

class cCartographies extends cWorks
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'R';
		$this->mode = 'P';
	}

	public function ResolveTitle()
	{
		return "Cartografías";
	}
}
