<?php
use helena\classes\App;

use helena\tests as controllers;

App::RegisterControllerGet('/testDb', controllers\cTestDb::class);
App::RegisterControllerGet('/testSerialize', controllers\cTestSerialize::class);
App::RegisterControllerGet('/testEcho', controllers\cTestEcho::class);
App::RegisterControllerGet('/testCsv', controllers\cTestCsv::class);
App::RegisterControllerGet('/testMail', controllers\cTestMail::class);
App::RegisterControllerGet('/testTransaction', controllers\cTestTransaction::class);
App::RegisterControllerGet('/testTransactionOrm', controllers\cTestTransactionOrm::class);
App::RegisterControllerGet('/testPush', controllers\cTestPush::class);
App::RegisterControllerGet('/testPushCreateKey', controllers\cTestPushCreateKey::class);
App::RegisterControllerGet('/testPushStepKey', controllers\cTestPushStepKey::class);
App::RegisterControllerGet('/testSession', controllers\cTestSession::class);

