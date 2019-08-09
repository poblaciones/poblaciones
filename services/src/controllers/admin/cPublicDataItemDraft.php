<?php

namespace helena\controllers\admin;

class cPublicDataItemDraft extends cWorksItem
{
	function __construct()
	{
		parent::__construct();
		$this->type = 'P';
		$this->mode = 'D';

	}
}
