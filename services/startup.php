<?php

use Symfony\Component\Debug\Debug;
use Silex\Provider\VarDumperServiceProvider;

use helena\classes\App;
use minga\framework\Str;
use minga\framework\Request;
use minga\framework\Context;
use minga\framework\Profiling;

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

time_elapsed('preautoload');

require_once __DIR__.'/vendor/autoload.php';
time_elapsed('postautoload');
$app = require_once __DIR__.'/src/app.php';
time_elapsed('app-ended');

Context::Settings()->applicationName = 'Poblaciones';
Context::Settings()->storagePath = Context::Settings()->rootPath . '/storage';
Context::Settings()->Performance()->PerformancePerUser = true;

Context::Settings()->Debug()->LoadSessionDebugging();
if (Context::Settings()->Debug()->sessionDebug)
	App::SetSessionDebug(true);

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

App::Settings()->Shard()->CheckCurrentIsSet();

if (!Context::Settings()->allowPHPsession)
{
	ini_set('session.use_cookies', '0');
}

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
	Profiling::EndTimer();
}

date_default_timezone_set('America/Argentina/Buenos_Aires');

// establece seteos de caché iniciales
$uri = Request::GetRequestURI();
if (Str::StartsWith($uri, '/services/frontend/clipping/GetBlockLabels') ||
	Str::StartsWith($uri, '/services/frontend/metrics/GetSummary') ||
	Str::StartsWith($uri, '/services/frontend/geographies/GetGeography') ||
	Str::StartsWith($uri, '/services/frontend/metrics/GetTileData') ||
	Str::StartsWith($uri, '/services/frontend/metrics/GetLayerData') ||
	Str::StartsWith($uri, '/services/frontend/clipping/GetLabels'))
	Context::Settings()->allowPHPSessionCacheResults = true;

time_elapsed('fin de startup');

