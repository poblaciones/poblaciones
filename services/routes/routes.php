<?php
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\HttpKernelInterface;

use helena\classes\App;
use helena\classes\Router;
use helena\classes\Remember;
use helena\classes\Session;

use minga\framework\Performance;
use minga\framework\Headers;
use minga\framework\Profiling;
use minga\framework\Log;
use minga\framework\PhpSession;
use minga\framework\Traffic;
if (PhpSession::GetSessionValue('started', null) === null) {
	PhpSession::SetSessionValue('started', $_SERVER['REQUEST_TIME']);
}
ob_start();

App::$app->before(function(Request $request) {
	Profiling::BeginTimer("Request");

	$add = $_SERVER['REMOTE_ADDR'];
	Traffic::RegisterIP($add);

	Performance::Begin();

	// Se ocupa del recordar credenciales
	if (!Session::IsAuthenticated())
		Remember::CheckCookie();

	Performance::ResolveControllerFromUri();

	Headers::AcceptAnyCOARS();

	$route = $request->getPathInfo();

	if (Router::ProcessPath($route)) {
		$newRequest = Request::create($route, $request->getMethod());
		return App::$app->handle($newRequest, HttpKernelInterface::SUB_REQUEST);
	}
}, 10000);

App::$app->error(
	function ($e) {
		// notices go here with $e of type. $e is instance of \Symfony\Component\Debug\Exception\ContextErrorException
		Log::LogException($e);
	}
);

App::$app->after(function(Request $request, Response $response) {
	$status = $response->getStatusCode();
	if ($status === 200 || $status === 302)
	{
		App::AutoCommit();
	}
	App::EndRequest(true);
	Profiling::EndTimer();
	App::AppendProfilingResults($request, $response);
});

App::$app->options("{anything}", function () {
	$response = new \Symfony\Component\HttpFoundation\JsonResponse(null, 204);
	$response->headers->set('Access-Control-Allow-Headers', 'Authorization,Cache-Control,X-Requested-With,Full-Url');
	return $response;
})->assert("anything", ".*");

require_once('authenticate.php');
require_once('frontend.php');
require_once('common.php');

if (!$isPublic)
{
	require_once('logs.php');

	App::RegisterControllerGet('/users', helena\controllers\backoffice\cBackoffice::class);
	App::RegisterControllerGet('/users/{any}', helena\controllers\backoffice\cBackoffice::class)->assert("any", ".*");

	App::RegisterControllerGet('/admins', helena\controllers\admins\cAdmins::class);
	App::RegisterControllerGet('/admins/{any}', helena\controllers\admins\cAdmins::class)->assert("any", ".*");

	require_once('backoffice/work.php');
	require_once('backoffice/permission.php');
	require_once('backoffice/metric.php');
	require_once('backoffice/dataset.php');
	require_once('backoffice/datasetColumns.php');
	require_once('backoffice/metadata.php');
	require_once('backoffice/georeference.php');
	require_once('backoffice/import.php');
	require_once('backoffice/mock.php');
	require_once('backoffice/test.php');
	require_once('admin/admin.php');
}
require_once('tests.php');
App::$app->get('/phpinfo2', function (Request $request) {
	phpinfo();
	exit();
});
