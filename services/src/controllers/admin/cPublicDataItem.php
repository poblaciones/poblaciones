<?php

namespace helena\controllers\admin;

class cPublicDataItem extends cWorksItem
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'P';
		$this->mode = 'P';

	}
}
