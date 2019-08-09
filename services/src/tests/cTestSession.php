<?php

namespace helena\tests;

use helena\controllers\common\cController;
use minga\framework\PhpSession;

class cTestSession extends cController
{
	public function Show()
	{
		echo ('got:' . PhpSession::GetSessionValue('user'));
		echo ('<br>set: a');
		PhpSession::SetSessionValue('user', 'a');
		exit();

	}
}
