<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\mcp\McpEndpoint;
use helena\classes\App;
use helena\services\mcp\McpRateLimiter;

// Servidor MCP (conector remoto para el chat de Claude). Todos los métodos HTTP llegan al
// endpoint: el protocolo responde 405 a los que no admite.
// En un host mcp.* el servidor está en la raíz; esta ruta debe registrarse antes que las de '/' del frontend.
if (App::Settings()->Mcp()->Enabled) {
	$mcpHandler = function (Request $request) {
		$endpoint = new McpEndpoint();
		return $endpoint->HandleProtocol($request);
	};
	App::$app->match('/mcp', $mcpHandler);
	App::$app->match('/', $mcpHandler)->host(McpRateLimiter::HOST_PREFIX . '{domain}')->assert('domain', '.+');
}
