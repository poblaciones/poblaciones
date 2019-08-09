<?php

namespace helena\controllers\admin;

class cCartographiesItem extends cWorksItem
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'R';
		$this->mode = 'P';

	}
}
