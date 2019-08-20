<?php
use helena\classes\App;

use helena\controllers\authenticate as controllers;

App::RegisterControllerGetPost('/authenticate/lostPassword', controllers\cLostPassword::class);
App::RegisterControllerGetPost('/authenticate/linkActivation', controllers\cLinkActivation::class);
App::RegisterControllerGetPost('/authenticate/linkLostPassword', controllers\cLinkLostPassword::class);
App::RegisterControllerGetPost('/authenticate/linkInvitation', controllers\cLinkInvitation::class);
App::RegisterControllerGetPost('/authenticate/winLogin', controllers\cWinLogin::class);
App::RegisterControllerGetPost('/authenticate/login', controllers\cLogin::class);
App::RegisterControllerGetPost('/authenticate/logoff', controllers\cLogoff::class);
App::RegisterControllerGetPost('/authenticate/loginAjax', controllers\cLoginAjax::class);
App::RegisterControllerGetPost('/oauthFacebook.do', controllers\cOauthFacebook::class);
App::RegisterControllerGetPost('/oauthGoogle.do', controllers\cOauthGoogle::class);
