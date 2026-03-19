<?php

use Symfony\Component\Debug\ErrorHandler;

use helena\classes\SilexApp;
use helena\classes\Callbacks;
use helena\classes\App;

use minga\framework\Context;

time_elapsed('preregister');
ErrorHandler::register();
time_elapsed('ErrorHandler::register');

// Initializa el mingaFramework
Context::InjectSettings(App::Settings());
time_elapsed('injectSettings');
// Setea el manejo de EndRequest
Context::InjectCallbacks(new Callbacks());
time_elapsed('InjectCallbacks');
// toma settings
Context::Settings()->useVendor = true;
Context::Settings()->Initialize(dirname(__DIR__));
time_elapsed('Settings()->Initialize');

time_elapsed('prenewapp');

$app = new SilexApp();
App::$app = $app;
/*
time_elapsed('after routing');

time_elapsed('after doctrine');

$app['path.base'] = dirname(__DIR__);
$app['path.python'] = $app['path.base'].'/py';

$app['twig.path'] = array_merge(Paths::GetMacrosPaths(), Paths::GetTemplatePaths());
$app['twig.options'] = array('cache' => Context::Paths()->GetTwigCache());
$app['twig.form.templates'] = array('bootstrap_3_layout.html.twig');
*/
return $app;

