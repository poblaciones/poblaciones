<?php

use helena\controllers\frontend as controllers;

use helena\classes\App;

// ARKS
App::RegisterControllerGet('/ark:/{path1}/{path2}', controllers\cArk::class);
App::RegisterControllerGet('/ark:/{path1}/{path2}/{path3}', controllers\cArk::class);

// CRAWLER
App::RegisterControllerGet('/sitemap', controllers\cSitemap::class);
App::RegisterControllerGet('/handle/{path1}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}/{path5}', controllers\cHandle::class);
