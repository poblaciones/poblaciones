<?php

use Silex\Application;
use Silex\Provider\AssetServiceProvider;
use Silex\Provider\CsrfServiceProvider;
use Silex\Provider\DoctrineServiceProvider;
use Silex\Provider\FormServiceProvider;
use Silex\Provider\HttpFragmentServiceProvider;
use Silex\Provider\LocaleServiceProvider;
use Silex\Provider\RoutingServiceProvider;
use Silex\Provider\ServiceControllerServiceProvider;
use Silex\Provider\TwigServiceProvider;
use Silex\Provider\ValidatorServiceProvider;
use Symfony\Component\Debug\ErrorHandler;

use helena\classes\Paths;
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

$app = new Application();
App::$app = $app;
$app->register(new AssetServiceProvider());
$app->register(new CsrfServiceProvider());
$app->register(new FormServiceProvider());
$app->register(new ValidatorServiceProvider());
$app->register(new HttpFragmentServiceProvider());
$app->register(new LocaleServiceProvider());
$app->register(new RoutingServiceProvider());
time_elapsed('after routing');

$app->register(new ServiceControllerServiceProvider());
$app->register(new TwigServiceProvider());
$app->register(new DoctrineServiceProvider(), array(
	 'db.options' => array(
		 'driver' => 'mysqli',
		 'charset' => 'utf8',
	)
));
time_elapsed('after doctrine');

// configure your app for the production environment
$app['path.base'] = dirname(__DIR__);
$app['path.python'] = $app['path.base'].'/py';

$app['twig.path'] = array_merge(Paths::GetMacrosPaths(), Paths::GetTemplatePaths());
$app['twig.options'] = array('cache' => Context::Paths()->GetTwigCache());
$app['twig.form.templates'] = array('bootstrap_3_layout.html.twig');

return $app;

