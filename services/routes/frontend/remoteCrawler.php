<?php

use helena\controllers\frontend as controllers;

use helena\classes\App;

// ARKS
App::RegisterControllerGet('/ark:/{path1}/{path2}', controllers\cRemoteArk::class);
App::RegisterControllerGet('/ark:/{path1}/{path2}/{path3}', controllers\cRemoteArk::class);

// CRAWLER
App::RegisterControllerGet('/sitemap', controllers\cRemoteSitemap::class);
App::RegisterControllerGet('/handle/{path1}', controllers\cRemoteHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}', controllers\cRemoteHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}', controllers\cRemoteHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}', controllers\cRemoteHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}/{path5}', controllers\cRemoteHandle::class);
