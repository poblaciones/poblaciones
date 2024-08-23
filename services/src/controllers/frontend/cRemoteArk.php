<?php

namespace helena\controllers\frontend;


use helena\controllers\common\cPublicController;
use minga\framework\Request;
use helena\classes\App;
use minga\framework\Performance;

class cRemoteArk extends cPublicController
{
	public function Show()
	{
		Performance::SetController('remoteArk', 'get', true);

		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$uri = $dynamicServer->publicUrl . Request::GetRequestURI();
		return App::FlushRemoteFile($uri);
	}
}
