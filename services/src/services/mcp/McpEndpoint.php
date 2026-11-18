<?php

namespace helena\services\mcp;

use helena\classes\App;
use minga\framework\ErrorException;
use minga\framework\Params;
use minga\framework\Performance;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Une el protocolo MCP con el framework. HandleProtocol atiende POST /mcp y elige la pasarela según el
 * servidor: con acceso a la base usa la local, y sin acceso consulta al servidor transaccional.
 * HandleInternal atiende /services/mcp/* en el servidor transaccional, para la pasarela remota.
 */
class McpEndpoint
{
	const SERVER_VERSION = '1.0.0';

	public function HandleProtocol(Request $request): Response
	{
		$server = new McpServer(App::Settings()->Mcp(), $this->CreateGateway(), self::SERVER_VERSION);
		$result = $server->Handle($request->getMethod(), $this->ReadHeaders($request), $request->getContent());
		if ($result->ToolName !== null)
			Performance::AppendControllerSuffix($result->ToolName);
		return new Response($result->Body, $result->Status, $result->Headers);
	}

	private function CreateGateway(): IMcpGateway
	{
		if (App::Settings()->Servers()->IsTransactionServerRequest())
			return new McpLocalGateway();
		return new McpRemoteGateway();
	}

	private function ReadHeaders(Request $request): array
	{
		$headers = [];
		foreach ($request->headers->all() as $name => $values)
		{
			$headers[strtolower($name)] = implode(', ', $values);
		}
		return $headers;
	}

	public function HandleInternal(string $operation): Response
	{
		try
		{
			return App::Json($this->Execute(new McpLocalGateway(), $operation));
		}
		catch (McpToolException $exception)
		{
			return new Response(json_encode(['error' => $exception->getMessage()], JSON_UNESCAPED_UNICODE),
				McpRemoteGateway::STATUS_TOOL_ERROR, ['Content-Type' => 'application/json']);
		}
	}

	private function Execute(IMcpGateway $gateway, string $operation): array
	{
		switch ($operation)
		{
			case 'catalog':
				return $gateway->GetCatalog();
			case 'indicator':
				return $gateway->DescribeIndicator(Params::GetIntMandatory('indicatorId'));
			case 'boundary':
				return $gateway->DescribeBoundary(Params::GetIntMandatory('boundaryId'));
			case 'regions':
				return $gateway->FindRegions(strval(Params::GetMandatory('query')));
			case 'boundaryItems':
				return $gateway->ListBoundaryItems(Params::GetIntMandatory('boundaryId'), Params::GetInt('parentId'),
					Params::Get('query'), Params::GetIntMandatory('limit'), Params::GetIntMandatory('offset'));
			case 'summary':
				return $gateway->GetIndicatorSummary(Params::GetIntMandatory('indicatorId'), Params::GetIntMandatory('versionId'),
					Params::GetIntMandatory('levelId'), Params::GetIntArray('regionIds'), Params::GetInt('partition'));
			case 'map':
				return $gateway->GetMapLink(Params::GetIntMandatory('indicatorId'), Params::GetIntMandatory('versionId'),
					Params::GetIntMandatory('levelId'), Params::GetIntArray('regionIds'), Params::GetInt('partition'));
			case 'data':
				return $gateway->GetIndicatorData(Params::GetIntMandatory('indicatorId'), Params::GetIntMandatory('versionId'),
					Params::GetIntMandatory('levelId'), Params::GetIntArray('regionIds'), Params::GetInt('partition'),
					Params::Get('sortBy'), strval(Params::GetMandatory('order')), Params::GetIntMandatory('limit'),
					Params::GetIntMandatory('offset'));
			case 'records':
				return $gateway->GetDatasetRecords(Params::GetIntMandatory('indicatorId'), Params::GetIntMandatory('versionId'),
					Params::GetIntMandatory('levelId'), Params::GetIntArray('regionIds'), Params::GetInt('partition'),
					Params::GetArray('columns'), Params::GetIntMandatory('limit'), Params::GetIntMandatory('offset'));
		}
		throw new ErrorException('Operación desconocida del conector: ' . $operation);
	}
}
