<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\WorkModel;

use helena\classes\Session;
use helena\classes\Menu;

abstract class cMultiController extends cController
{
	public $type; // valores posibles: 'P'= publicos, 'R' = investigación.
	public $mode; // valores posibles: 'P'= publicados, 'D' = borradores.

	protected function FromDraft()
	{
		return $this->mode == "D";
	}

	protected function resolveEntity()
	{
		$entity = ($this->type == 'P' ? 'publicData' : 'cartographies');
		if ($this->type == 'D') $entity .= 'Draft';
		return $entity;
	}
}
