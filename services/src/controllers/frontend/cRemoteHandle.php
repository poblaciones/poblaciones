<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use helena\classes\App;
use minga\framework\Performance;
use helena\caches\RemoteHandlesCache;

class cRemoteHandle extends cPublicController
{
	public function Show()
	{
		Performance::SetController('remoteHandle', 'get', true);

		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$uri = $dynamicServer->publicUrl . Request::GetRequestURI();

		$cache = RemoteHandlesCache::Cache();
		$key = RemoteHandlesCache::CreateKey($uri);
		return App::FlushRemoteFile($uri, null, $cache, $key);
	}
}
