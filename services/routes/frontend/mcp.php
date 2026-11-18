<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\mcp\McpEndpoint;
use helena\classes\App;

// Consultas internas del conector MCP: las usa el servidor sin base de datos (McpRemoteGateway).
// ej. http://mapas/services/mcp/summary?indicatorId=8&versionId=12&levelId=62&regionIds=7160
if (App::Settings()->Mcp()->Enabled) {
	App::$app->get('/services/mcp/{operation}', function (Request $request, $operation) {
		$endpoint = new McpEndpoint();
		return $endpoint->HandleInternal($operation);
	})->assert('operation', 'catalog|indicator|boundary|regions|boundaryItems|summary|map|data|records');
}
