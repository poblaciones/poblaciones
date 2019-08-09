<?php

namespace helena\controllers\admin;

class cCartographiesDraft extends cWorks
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'R';
		$this->mode = 'D';
	}
	public function ResolveTitle()
	{
		return "Borradores de cartografías";
	}
}
