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

use helena\services\mcp\McpRateLimiter;

// El conector MCP es anónimo y sin estado: no abre sesión.
$requestHost = minga\framework\Request::Host();
$requestUri = minga\framework\Request::GetRequestURI();
$isMcpRequest = McpRateLimiter::IsMcpRequest($requestHost, $requestUri);
$isMcpRoot = McpRateLimiter::IsMcpRoot($requestHost, $requestUri);

if (!$isMcpRequest && PhpSession::GetSessionValue('started', null) === null) {
	Session::StartSession();
	PhpSession::SetSessionValue('started', Params::SafeServer('REQUEST_TIME'));
}
ob_start();

App::$app->before(function(Request $request) use ($isMcpRequest, $isMcpRoot) {
	Profiling::BeginTimer("Request");

	// El conector tiene un límite global propio (más abajo), no el control de tráfico por IP.
	if (!$isMcpRequest) {
		$add = minga\framework\Request::IP();
		if ($add != '')
			Traffic::RegisterIP($add, minga\framework\Request::UserAgent(), minga\framework\Request::GetRequestURI(), Session::IsMegaUser());
	}

	Performance::Begin();

	// Se ocupa del recordar credenciales
	if (App::Settings()->Servers()->IsTransactionServerRequest())
		if (!Session::IsAuthenticated())
			Remember::CheckCookie();

	Performance::ResolveControllerFromUri();
	if ($isMcpRoot)
		Performance::SetController(McpRateLimiter::CONTROLLER_NAME, strtolower(Params::SafeServer('REQUEST_METHOD')), true);

	if ($isMcpRequest) {
		$exceeded = McpRateLimiter::Check();
		if ($exceeded !== null)
			return $exceeded;
	}

	Headers::AcceptAnyCORS();
	$route = $request->getPathInfo();

	if (Router::ProcessPath($route)) {
		$newRequest = Request::create($route, $request->getMethod());
		return App::$app->handle($newRequest, HttpKernelInterface::SUB_REQUEST);
	}
}, 10000);

App::$app->error(function (\Exception $e, Request $request, $code) {

	Headers::SetErrorHeader('error' . $code);

	Log::LogException($e);

	App::Rollback();

	if (App::Debug())
		return;

	$text = "";
	if ($e instanceof \minga\framework\MessageException || $e instanceof \minga\framework\PublicException)
	{
		$text = $e->getPublicMessage();
		return new Response($text);
	} else {
		return new Response($code . '. Se ha producido un error en el servidor.');
	}
});

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
	//$response->headers->set('Access-Control-Allow-Headers', 'Authorization,Cache-Control,X-Requested-With,Full-Url,Session-Id');
	$response->headers->set('Access-Control-Allow-Headers',   'Authorization,Cache-Control,X-Requested-With,Full-Url,Session-Id,Remember-Token,Access-Link,Origin,Content-Type,Accept');
	return $response;
})->assert("anything", ".*");

// El conector MCP va primero: en un host mcp.* atiende la raíz, que también define el frontend.
// No depende de isAPIEnabled: un servidor sin API (cáscara del visor) también lo atiende, consultando al transaccional.
require_once('api/mcp.php');

require_once('authenticate.php');

if (Context::Settings()->Servers()->LoopLocalPort)
{
	require_once('dev.php');
}

require_once('frontend.php');

if (Context::Settings()->isAPIEnabled) {
	require_once('automation/boundary.php');
	require_once('automation/work.php');
	require_once('automation/dataset.php');
	require_once('automation/metric.php');
	require_once('automation/metadata.php');
}

if (Context::Settings()->isAPIEnabled)
{
	require_once('api/mail.php');
	require_once('api/wfs.php');
	require_once('api/clipping.php');
	require_once('api/backup.php');
	require_once('api/deployment.php');
}

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
