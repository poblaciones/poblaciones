<?php

use Symfony\Component\Debug\Debug;
use Silex\Provider\MonologServiceProvider;
use Silex\Provider\WebProfilerServiceProvider;
use Silex\Provider\VarDumperServiceProvider;

use helena\classes\App;
use minga\framework\Context;
use minga\framework\Profiling;

time_elapsed('preautoload');

require_once __DIR__.'/vendor/autoload.php';
time_elapsed('postautoload');
$app = require_once __DIR__.'/src/app.php';
time_elapsed('app-ended');

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
time_elapsed('presettings');
require_once $settings;
time_elapsed('settings');

Context::Settings()->Shard()->CheckCurrentIsSet();

$db = App::GetDbConfig();
$db['host'] = Context::Settings()->Db()->Host;
$db['dbname'] = Context::Settings()->Db()->Name;
$db['user'] = Context::Settings()->Db()->User;
$db['password'] = Context::Settings()->Db()->Password;
App::SetDbConfig($db);
time_elapsed('setdb');

if(Context::Settings()->Debug()->debug)
{
	Profiling::BeginTimer("Debug");
	$app['debug'] = true;
	Debug::enable();
	
	Context::Settings()->Debug()->showErrors = true;

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

function time_elapsed($label = null)
{
    static $last = null;
    static $total = null;
    static $round = 1;

    $now = microtime(true);
		if ($last != null) {
        outwrite($round);
				if ($label) outwrite('. ' . $label);
				outwrite(': Parcial: ' . ($now - $last) * 1000 . ' ms');
				outwrite('. Total: ' . ($now - $total) * 1000 . " ms\n<br>");
				$round++;
		} else $total = $now;

    $last = $now;
}

function outwrite($text = null)
{
   static $out = "\n<br>";
	if ($text !== null)
		$out .= $text;
	else
		echo $out;
}