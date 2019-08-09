<?php

namespace helena\services\backoffice\publish;

use helena\classes\StateBag;

class WorkStateBag extends StateBag
{
	public static function Create($workId)
	{
		$ret = new WorkStateBag();
		$ret->Initialize();
		$ret->Set('workId', $workId);
		return $ret;
	}
}