<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use helena\classes\App;
use minga\framework\Performance;


class cRemoteHandle extends cPublicController
{
	public function Show()
	{
		Performance::SetController('remoteHandle', 'get', true);

		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$uri = $dynamicServer->publicUrl . Request::GetRequestURI();
		return App::FlushRemoteFile($uri);
	}
}