<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\InstitutionModel;

use helena\classes\Session;
use helena\classes\Menu;
use Symfony\Component\HttpFoundation\Request;

class cSourcesItemDraft extends cSourcesItem
{
	function __construct()
	{
		parent::__construct();
		$this->mode = 'D';
	}
}
