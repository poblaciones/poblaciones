<?php

namespace helena\tests;

use helena\controllers\common\cController;
use minga\framework\PhpSession;

class cTestEcho extends cController
{
	public function Show()
	{
		echo ('hi');
		exit();
	}
}
