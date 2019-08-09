<?php

use helena\classes\App;

require_once __DIR__.'/../startup.php';
require_once __DIR__.'/../routes/routes.php';

App::$app->run();
