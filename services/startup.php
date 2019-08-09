<?php

use Symfony\Component\Debug\Debug;
use Silex\Provider\MonologServiceProvider;
use Silex\Provider\WebProfilerServiceProvider;
use Silex\Provider\VarDumperServiceProvider;

use helena\classes\App;
use minga\framework\Context;
use helena\classes\GlobalTimer;
use minga\framework\Profiling;

require_once __DIR__.'/vendor/autoload.php';
GlobalTimer::Start();
Profiling::BeginTimer("Context");

Profiling::BeginTimer("App");
$app = require_once __DIR__.'/src/app.php';
Profiling::EndTimer();

Context::Settings()->applicationName = 'Poblaciones';
Context::Settings()->storagePath = Context::Settings()->rootPath . '/storage';
Context::Settings()->Performance()->PerformancePerUser = true;

$settings = __DIR__.'/config/settings.php';
if (!file_exists($settings)) {
	echo 'Oops! Todavía falta un paso.
				<p>Poder habilitar el ambiente debe crear el archivo de configuración de Poblaciones. En ese archivo se indican los datos de conexión para la base de datos y otras opciones de funcionamiento.
				<p>Consulte la documentación para obtener un ejemplo de su estructura.
				<p>La ubicación esperada es: ' . $settings . '.';
	exit;
}
require_once $settings;

Context::Settings()->Shard()->CheckCurrentIsSet();

$db = App::GetDbConfig();
$db['host'] = Context::Settings()->Db()->Host;
$db['dbname'] = Context::Settings()->Db()->Name;
$db['user'] = Context::Settings()->Db()->User;
$db['password'] = Context::Settings()->Db()->Password;
App::SetDbConfig($db);

if(Context::Settings()->Debug()->debug)
{
	Profiling::BeginTimer("Debug");
	$app['debug'] = true;
	Debug::enable();

	$app['twig.options'] = array('cache' => false);
	require_once __DIR__.'/src/debug.php';

	$app->register(new VarDumperServiceProvider());
	/*$app->register(new MonologServiceProvider(), array(
		'monolog.logfile' => __DIR__.'/var/logs/silex_dev.log',
	));
	unset($app['monolog.listener']);

	$app->register(new WebProfilerServiceProvider(), array(
		'profiler.cache_dir' => __DIR__.'/var/cache/profiler',
	));*/
	Profiling::EndTimer("Debug");
}

date_default_timezone_set('America/Argentina/Buenos_Aires');
