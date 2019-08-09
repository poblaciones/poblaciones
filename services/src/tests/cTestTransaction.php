<?php

namespace helena\tests;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use minga\framework\Params;
use minga\framework\ErrorException;


class cTestTransaction extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		$current = App::Db()->fetchScalarInt("select max(id) from aaa");
		echo "Current: " . $current . "<br>";
		$sql = "insert into aaa (n) values (88)";
		App::Db()->exec($sql);
		$current = App::Db()->fetchScalarInt("select max(id) from aaa");
		echo "Current: " . $current . "<br>";
//		throw new ErrorException('failed' . $current);
		return "Done!";
	}
}
