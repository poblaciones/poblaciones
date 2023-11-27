<?php
use helena\classes\App;

use helena\controllers\authenticate as controllers;

App::RegisterControllerGet('/cr', controllers\cCredentials::class);
App::RegisterControllerGet('/cr/{any}', controllers\cCredentials::class)->assert("any", ".*");

App::RegisterControllerGetPost('/authenticate/lostPassword', controllers\cLostPassword::class);
App::RegisterControllerGetPost('/authenticate/linkActivation', controllers\cLinkActivation::class);
App::RegisterControllerGetPost('/authenticate/linkLostPassword', controllers\cLinkLostPassword::class);
App::RegisterControllerGetPost('/authenticate/linkInvitation', controllers\cLinkInvitation::class);
App::RegisterControllerGetPost('/authenticate/winLogin', controllers\cWinLogin::class);
App::RegisterControllerGetPost('/authenticate/login', controllers\cLogin::class);
App::RegisterControllerGetPost('/authenticate/logoff', controllers\cLogoff::class);
App::RegisterControllerGetPost('/authenticate/loginAjax', controllers\cLoginAjax::class);
App::RegisterControllerGetPost('/authenticate/register', controllers\cRegister::class);
App::RegisterControllerGetPost('/oauthFacebook', controllers\cOauthFacebook::class);
App::RegisterControllerGetPost('/login', controllers\cLogin::class);
App::RegisterControllerGetPost('/login.do', controllers\cLogin::class);
App::RegisterControllerGetPost('/oauthGoogle', controllers\cOauthGoogle::class);
