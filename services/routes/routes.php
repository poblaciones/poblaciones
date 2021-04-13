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
use minga\framework\Context;
use minga\framework\Params;
use minga\framework\Profiling;
use minga\framework\Log;
use minga\framework\PhpSession;
use minga\framework\Traffic;
if (PhpSession::GetSessionValue('started', null) === null) {
	Session::StartSession();
	PhpSession::SetSessionValue('started', Params::SafeServer('REQUEST_TIME'));
}
ob_start();

App::$app->before(function(Request $request) {
	Profiling::BeginTimer("Request");

	$add = Params::SafeServer('REMOTE_ADDR');
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

if (Context::Settings()->Servers()->LoopLocalPort)
{
	require_once('dev.php');
}

require_once('frontend.php');
require_once('common.php');


if (isset($isPublic) == false || $isPublic == false)
{
	require_once('logs.php');
	require_once('backoffice.php');
}
require_once('tests.php');
App::$app->get('/phpinfo2', function (Request $request) {
	phpinfo();
	exit();
});
