<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\classes\settings\McpSettings;
use helena\services\mcp\McpHttpResponse;
use helena\services\mcp\McpServer;

class McpServerTest extends TestCase
{
	private FakeMcpGateway $gateway;

	private McpSettings $settings;

	private McpServer $server;

	public function setUp(): void
	{
		$this->gateway = new FakeMcpGateway();
		$this->settings = new McpSettings();
		$this->server = new McpServer($this->settings, $this->gateway, '1.0.0');
	}

	private function ModernMeta(): array
	{
		return [
			'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
			'io.modelcontextprotocol/clientInfo' => ['name' => 'Prueba', 'version' => '1'],
			'io.modelcontextprotocol/clientCapabilities' => new \stdClass()
		];
	}

	private function ModernHeaders(string $method, ?string $name = null): array
	{
		$headers = ['Content-Type' => 'application/json', 'MCP-Protocol-Version' => '2026-07-28', 'Mcp-Method' => $method];
		if ($name !== null)
			$headers['Mcp-Name'] = $name;
		return $headers;
	}

	private function Send(array $headers, array $message, string $httpMethod = 'POST'): McpHttpResponse
	{
		return $this->server->Handle($httpMethod, $headers, json_encode($message));
	}

	private function CallModern(string $method, array $params = [], ?string $name = null): McpHttpResponse
	{
		$params['_meta'] = $this->ModernMeta();
		return $this->Send($this->ModernHeaders($method, $name), ['jsonrpc' => '2.0', 'id' => 1, 'method' => $method, 'params' => $params]);
	}

	private function CallLegacy(string $method, array $params = [], array $headers = []): McpHttpResponse
	{
		return $this->Send($headers, ['jsonrpc' => '2.0', 'id' => 7, 'method' => $method, 'params' => $params]);
	}

	private function Decode(McpHttpResponse $response): array
	{
		return json_decode($response->Body, true);
	}

	private function ToolText(McpHttpResponse $response): string
	{
		return $this->Decode($response)['result']['content'][0]['text'];
	}

	public function testOnlyToolsAreDeclared()
	{
		$initialize = $this->Decode($this->CallLegacy('initialize', ['protocolVersion' => '2025-11-25']))['result'];
		$this->assertSame(['tools'], array_keys($initialize['capabilities']));
		$discover = $this->Decode($this->CallModern('server/discover'))['result'];
		$this->assertSame(['tools'], array_keys($discover['capabilities']));
		$tools = $this->Decode($this->CallLegacy('tools/list'))['result']['tools'];
		foreach ($tools as $tool)
		{
			$this->assertSame(['name', 'title', 'description', 'inputSchema', 'annotations'], array_keys($tool));
		}
	}

	public function testShowMapReturnsTheLinkAsText()
	{
		$result = $this->Decode($this->CallLegacy('tools/call', ['name' => 'show_map',
			'arguments' => ['indicator_id' => 12, 'version_id' => 40, 'level_id' => 300, 'region_ids' => [1012]]]))['result'];
		$text = $result['content'][0]['text'];
		$this->assertSame(['content', 'isError'], array_keys($result));
		$this->assertSame([12, 40, 300, [1012], null], $this->gateway->LastCall['arguments']);
		$this->assertStringContainsString('# Mapa: Mortalidad infantil · 2022 · Departamentos', $text);
		$this->assertStringContainsString('Mapa: https://mapa.test/map/55/#/l=12', $text);
		$this->assertStringContainsString('Regiones: Catamarca', $text);
		$this->assertStringNotContainsString('id 1012', $text);
		$this->assertStringNotContainsString('incrustado', $text);
		$this->assertStringNotContainsString('se muestra en la conversación', $text);
	}

	public function testDataResultsCarryNoStructuredContent()
	{
		$result = $this->Decode($this->CallLegacy('tools/call', ['name' => 'get_indicator_summary',
			'arguments' => ['indicator_id' => 12, 'version_id' => 40, 'level_id' => 300, 'region_ids' => [1012]]]))['result'];
		$this->assertArrayNotHasKey('structuredContent', $result);
	}

	public function testGetAndDeleteAreNotAllowed()
	{
		$response = $this->server->Handle('GET', [], '');
		$this->assertSame(405, $response->Status);
		$this->assertSame('POST', $response->Headers['Allow']);
		$this->assertSame(405, $this->server->Handle('DELETE', [], '')->Status);
	}

	public function testOriginNotAllowedIsRejected()
	{
		$response = $this->CallLegacy('ping', [], ['Origin' => 'https://sitio-ajeno.test']);
		$this->assertSame(403, $response->Status);
	}

	public function testOriginAllowedOrMissingIsAccepted()
	{
		$this->assertSame(200, $this->CallLegacy('ping', [], ['Origin' => 'https://claude.ai'])->Status);
		$this->assertSame(200, $this->CallLegacy('ping')->Status);
	}

	public function testInvalidJsonIsParseError()
	{
		$response = $this->server->Handle('POST', [], '{no es json');
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32700, $this->Decode($response)['error']['code']);
	}

	public function testBatchIsRejected()
	{
		$response = $this->server->Handle('POST', [], '[{"jsonrpc":"2.0","id":1,"method":"ping"}]');
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32600, $this->Decode($response)['error']['code']);
	}

	public function testMissingMethodIsInvalidRequest()
	{
		$response = $this->server->Handle('POST', [], '{"jsonrpc":"2.0","id":1}');
		$this->assertSame(-32600, $this->Decode($response)['error']['code']);
	}

	public function testNotificationIsAcceptedWithoutBody()
	{
		$response = $this->server->Handle('POST', [], '{"jsonrpc":"2.0","method":"notifications/initialized"}');
		$this->assertSame(202, $response->Status);
		$this->assertNull($response->Body);
	}

	public function testLegacyInitializeNegotiatesRequestedVersion()
	{
		$response = $this->CallLegacy('initialize', ['protocolVersion' => '2025-06-18', 'capabilities' => new \stdClass(),
			'clientInfo' => ['name' => 'Claude', 'version' => '1']]);
		$result = $this->Decode($response)['result'];
		$this->assertSame(200, $response->Status);
		$this->assertSame('2025-06-18', $result['protocolVersion']);
		$this->assertArrayHasKey('tools', $result['capabilities']);
		$this->assertSame('poblaciones', $result['serverInfo']['name']);
		$this->assertStringContainsString('get_catalog', $result['instructions']);
		$this->assertArrayNotHasKey('resultType', $result);
	}

	public function testLegacyInitializeFallsBackToLatestLegacyVersion()
	{
		$result = $this->Decode($this->CallLegacy('initialize', ['protocolVersion' => '1999-01-01']))['result'];
		$this->assertSame('2025-11-25', $result['protocolVersion']);
	}

	public function testLegacyToolsListWithHeaderAndWithout()
	{
		foreach ([['MCP-Protocol-Version' => '2025-06-18'], []] as $headers)
		{
			$result = $this->Decode($this->CallLegacy('tools/list', [], $headers))['result'];
			$this->assertCount(9, $result['tools']);
			$this->assertArrayNotHasKey('ttlMs', $result);
			$this->assertArrayNotHasKey('resultType', $result);
		}
	}

	public function testLegacyPingReturnsEmptyObject()
	{
		$response = $this->CallLegacy('ping');
		$this->assertStringContainsString('"result":{}', $response->Body);
	}

	public function testLegacyUnknownMethodIsJsonRpcErrorWithStatus200()
	{
		$response = $this->CallLegacy('resources/list');
		$this->assertSame(200, $response->Status);
		$this->assertSame(-32601, $this->Decode($response)['error']['code']);
	}

	public function testUnsupportedVersionHeaderWithoutMeta()
	{
		$response = $this->CallLegacy('tools/list', [], ['MCP-Protocol-Version' => '1900-01-01']);
		$error = $this->Decode($response)['error'];
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32022, $error['code']);
		$this->assertSame('1900-01-01', $error['data']['requested']);
		$this->assertContains('2026-07-28', $error['data']['supported']);
		$this->assertContains('2025-11-25', $error['data']['supported']);
	}

	public function testModernVersionHeaderWithoutMetaIsInvalidParams()
	{
		$response = $this->CallLegacy('tools/list', [], ['MCP-Protocol-Version' => '2026-07-28']);
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32602, $this->Decode($response)['error']['code']);
	}

	public function testModernDiscover()
	{
		$response = $this->CallModern('server/discover');
		$result = $this->Decode($response)['result'];
		$this->assertSame(200, $response->Status);
		$this->assertSame('complete', $result['resultType']);
		$this->assertContains('2026-07-28', $result['supportedVersions']);
		$this->assertArrayHasKey('tools', $result['capabilities']);
		$this->assertSame('poblaciones', $result['_meta']['io.modelcontextprotocol/serverInfo']['name']);
		$this->assertStringContainsString('get_catalog', $result['instructions']);
	}

	public function testModernToolsListIsCacheable()
	{
		$result = $this->Decode($this->CallModern('tools/list'))['result'];
		$this->assertCount(9, $result['tools']);
		$this->assertSame('complete', $result['resultType']);
		$this->assertSame('public', $result['cacheScope']);
		$this->assertGreaterThan(0, $result['ttlMs']);
	}

	public function testModernRequestRequiresProtocolVersionHeader()
	{
		$headers = $this->ModernHeaders('tools/list');
		unset($headers['MCP-Protocol-Version']);
		$response = $this->Send($headers, ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list', 'params' => ['_meta' => $this->ModernMeta()]]);
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32020, $this->Decode($response)['error']['code']);
	}

	public function testModernHeaderMethodMustMatchBody()
	{
		$headers = $this->ModernHeaders('tools/list');
		$response = $this->Send($headers, ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'server/discover', 'params' => ['_meta' => $this->ModernMeta()]]);
		$this->assertSame(-32020, $this->Decode($response)['error']['code']);
	}

	public function testModernUnsupportedVersionInMeta()
	{
		$meta = $this->ModernMeta();
		$meta['io.modelcontextprotocol/protocolVersion'] = '2030-01-01';
		$response = $this->Send($this->ModernHeaders('tools/list'),
			['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list', 'params' => ['_meta' => $meta]]);
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32022, $this->Decode($response)['error']['code']);
	}

	public function testModernRequiresClientCapabilities()
	{
		$meta = $this->ModernMeta();
		unset($meta['io.modelcontextprotocol/clientCapabilities']);
		$response = $this->Send($this->ModernHeaders('tools/list'),
			['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list', 'params' => ['_meta' => $meta]]);
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32602, $this->Decode($response)['error']['code']);
	}

	public function testModernUnknownMethodIsNotFound()
	{
		$response = $this->CallModern('resources/list');
		$this->assertSame(404, $response->Status);
		$this->assertSame(-32601, $this->Decode($response)['error']['code']);
	}

	public function testModernToolCallRequiresMatchingName()
	{
		$response = $this->CallModern('tools/call', ['name' => 'get_catalog', 'arguments' => new \stdClass()], 'describe_indicator');
		$this->assertSame(400, $response->Status);
		$this->assertSame(-32020, $this->Decode($response)['error']['code']);
	}

	public function testModernToolCallAcceptsBase64EncodedName()
	{
		$encoded = '=?base64?' . base64_encode('get_catalog') . '?=';
		$response = $this->CallModern('tools/call', ['name' => 'get_catalog', 'arguments' => new \stdClass()], $encoded);
		$this->assertSame(200, $response->Status);
	}

	public function testToolCallReturnsTextAndRegistersToolName()
	{
		$response = $this->CallModern('tools/call', ['name' => 'get_catalog', 'arguments' => new \stdClass()], 'get_catalog');
		$result = $this->Decode($response)['result'];
		$this->assertSame('get_catalog', $response->ToolName);
		$this->assertFalse($result['isError']);
		$this->assertSame('complete', $result['resultType']);
		$this->assertSame('text', $result['content'][0]['type']);
		$this->assertStringContainsString('Mortalidad infantil', $result['content'][0]['text']);
	}

	public function testLegacyToolCallPassesNormalizedArguments()
	{
		$response = $this->CallLegacy('tools/call', ['name' => 'get_indicator_data',
			'arguments' => ['indicator_id' => 12, 'version_id' => 40, 'level_id' => '300', 'region_ids' => [1012], 'sort_by' => '7', 'order' => 'desc']]);
		$this->assertSame([12, 40, 300, [1012], null, '7', 'desc', 200, 0], $this->gateway->LastCall['arguments']);
		$this->assertStringContainsString("codigo,nombre,tasa\n10007,Ambato,8.2\n10014,\"Ancasti, sector norte\",\n", $this->ToolText($response));
	}

	public function testDatasetRecordsToolUsesColumns()
	{
		$this->CallLegacy('tools/call', ['name' => 'get_dataset_records',
			'arguments' => ['indicator_id' => 12, 'version_id' => 40, 'level_id' => 300, 'columns' => ['nombre'], 'limit' => 50, 'offset' => 100]]);
		$this->assertSame([12, 40, 300, [], null, ['nombre'], 50, 100], $this->gateway->LastCall['arguments']);
	}

	public function testSummaryToolText()
	{
		$text = $this->ToolText($this->CallLegacy('tools/call', ['name' => 'get_indicator_summary',
			'arguments' => ['indicator_id' => 12, 'version_id' => 40, 'level_id' => 300, 'region_ids' => [1012]]]));
		$this->assertStringContainsString('Metadatos (PDF): https://mapa.test/services/metadata/GetWorkMetadataPdf?w=55', $text);
		$this->assertStringContainsString('Resultado: 8.2', $text);
		$this->assertStringContainsString('| Urbano | 30 | 3 | 10 | 75 % |', $text);
	}

	public function testUnknownToolIsInvalidParams()
	{
		$response = $this->CallLegacy('tools/call', ['name' => 'borrar_todo']);
		$this->assertSame(-32602, $this->Decode($response)['error']['code']);
	}

	public function testInvalidArgumentsAreToolErrorsNotProtocolErrors()
	{
		$response = $this->CallLegacy('tools/call', ['name' => 'describe_indicator', 'arguments' => new \stdClass()]);
		$result = $this->Decode($response)['result'];
		$this->assertTrue($result['isError']);
		$this->assertStringContainsString('indicator_id', $result['content'][0]['text']);
	}

	public function testGatewayToolErrorBecomesIsErrorResult()
	{
		$this->gateway->FailWith = 'El indicador no existe.';
		$result = $this->Decode($this->CallLegacy('tools/call', ['name' => 'describe_indicator', 'arguments' => ['indicator_id' => 999]]))['result'];
		$this->assertTrue($result['isError']);
		$this->assertSame('El indicador no existe.', $result['content'][0]['text']);
	}

	public function testOversizedTextIsCut()
	{
		$this->settings->MaxResponseChars = 300;
		$text = $this->ToolText($this->CallLegacy('tools/call', ['name' => 'get_catalog']));
		$this->assertLessThanOrEqual(300, mb_strlen($text, 'UTF-8'));
		$this->assertStringContainsString('recortada', $text);
	}

	public function testResponsesAreJsonWithUnescapedAccents()
	{
		$response = $this->CallLegacy('tools/call', ['name' => 'describe_boundary', 'arguments' => ['boundary_id' => 3]]);
		$this->assertSame('application/json', $response->Headers['Content-Type']);
		$this->assertStringContainsString('530 ítems', $response->Body);
	}
}
