<?php

namespace helena\services\mcp;

use helena\classes\settings\McpSettings;

/**
 * Protocolo MCP sobre HTTP (un único endpoint, respuestas JSON, sin sesión).
 * Atiende la revisión 2026-07-28 (sin saludo, con _meta por pedido) y las revisiones
 * 2025-03-26 a 2025-11-25 (con initialize). No depende del framework: recibe el método,
 * los encabezados y el cuerpo, y devuelve estado, encabezados y cuerpo.
 */
class McpServer
{
	const MODERN_VERSIONS = ['2026-07-28'];

	const LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];

	const META_VERSION = 'io.modelcontextprotocol/protocolVersion';

	const META_CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities';

	const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

	const SERVER_NAME = 'poblaciones';

	const TOOLS_TTL_MS = 3600000;

	const ERROR_PARSE = -32700;

	const ERROR_INVALID_REQUEST = -32600;

	const ERROR_METHOD_NOT_FOUND = -32601;

	const ERROR_INVALID_PARAMS = -32602;

	const ERROR_HEADER_MISMATCH = -32020;

	const ERROR_UNSUPPORTED_VERSION = -32022;

	private McpSettings $settings;

	private IMcpGateway $gateway;

	private McpToolCatalog $tools;

	private string $serverVersion;

	private ?string $toolName = null;

	public function __construct(McpSettings $settings, IMcpGateway $gateway, string $serverVersion)
	{
		$this->settings = $settings;
		$this->gateway = $gateway;
		$this->serverVersion = $serverVersion;
		$this->tools = new McpToolCatalog($settings);
	}

	private function GetCapabilities(): array
	{
		return ['tools' => new \stdClass()];
	}

	public function Handle(string $httpMethod, array $headers, string $body): McpHttpResponse
	{
		$this->toolName = null;
		$headers = array_change_key_case($headers, CASE_LOWER);
		if (strtoupper($httpMethod) !== 'POST')
			return new McpHttpResponse(405, null, ['Allow' => 'POST']);
		if (!$this->IsOriginAllowed($headers))
			return $this->BuildError(403, null, self::ERROR_INVALID_REQUEST, 'Origin no permitido.', null);

		$response = null;
		try
		{
			$response = $this->Process($headers, $body);
		}
		catch (McpProtocolException $error)
		{
			$response = $this->BuildError($error->HttpStatus, $error->RequestId, $error->getCode(), $error->getMessage(), $error->Data);
		}
		$response->ToolName = $this->toolName;
		return $response;
	}

	private function IsOriginAllowed(array $headers): bool
	{
		if (!isset($headers['origin']) || $headers['origin'] === '')
			return true;
		return in_array(rtrim($headers['origin'], '/'), $this->settings->AllowedOrigins, true);
	}

	private function Process(array $headers, string $body): McpHttpResponse
	{
		$message = $this->ParseMessage($body);
		$params = [];
		if (isset($message['params']))
			$params = $message['params'];
		if (!array_key_exists('id', $message))
			return new McpHttpResponse(202);

		$isModern = $this->IsModernRequest($message, $params, $headers);
		if ($isModern)
			$this->ValidateModernRequest($message, $params, $headers);
		$result = $this->Dispatch($message, $params, $isModern);
		return $this->BuildResult($message['id'], $result, $isModern);
	}

	private function ParseMessage(string $body): array
	{
		$message = json_decode($body, true);
		if ($message === null)
			throw new McpProtocolException(400, self::ERROR_PARSE, 'El cuerpo no es un JSON válido.');
		if (!is_array($message) || $this->IsList($message))
			throw new McpProtocolException(400, self::ERROR_INVALID_REQUEST, 'El cuerpo debe ser un único mensaje JSON-RPC (no se admiten lotes).');
		if (!isset($message['jsonrpc']) || $message['jsonrpc'] !== '2.0')
			throw new McpProtocolException(400, self::ERROR_INVALID_REQUEST, "Falta jsonrpc con el valor '2.0'.");
		if (!isset($message['method']) || !is_string($message['method']) || $message['method'] === '')
			throw new McpProtocolException(400, self::ERROR_INVALID_REQUEST, 'Falta method.');
		if (array_key_exists('id', $message) && !is_int($message['id']) && !is_string($message['id']))
			throw new McpProtocolException(400, self::ERROR_INVALID_REQUEST, 'El id debe ser un número entero o un texto.');
		if (isset($message['params']) && !is_array($message['params']))
			throw new McpProtocolException(400, self::ERROR_INVALID_REQUEST, 'params debe ser un objeto.', $this->ReadId($message));
		return $message;
	}

	private function ReadId(array $message)
	{
		if (isset($message['id']))
			return $message['id'];
		return null;
	}

	private function IsList(array $value): bool
	{
		if (count($value) === 0)
			return false;
		return array_keys($value) === range(0, count($value) - 1);
	}

	private function IsModernRequest(array $message, array $params, array $headers): bool
	{
		if ($message['method'] === 'initialize')
			return false;
		if (isset($params['_meta']) && is_array($params['_meta']) && array_key_exists(self::META_VERSION, $params['_meta']))
			return true;
		if (!isset($headers['mcp-protocol-version']))
			return false;
		$headerVersion = $headers['mcp-protocol-version'];
		if (in_array($headerVersion, self::LEGACY_VERSIONS, true))
			return false;
		if (in_array($headerVersion, self::MODERN_VERSIONS, true))
			throw new McpProtocolException(400, self::ERROR_INVALID_PARAMS, 'Falta _meta con la versión y las capacidades del cliente.', $message['id']);
		throw $this->UnsupportedVersion($message['id'], $headerVersion);
	}

	private function UnsupportedVersion($requestId, $requested): McpProtocolException
	{
		$data = ['supported' => $this->GetSupportedVersions(), 'requested' => $requested];
		return new McpProtocolException(400, self::ERROR_UNSUPPORTED_VERSION, 'Versión de protocolo no soportada.', $requestId, $data);
	}

	private function GetSupportedVersions(): array
	{
		return array_merge(self::MODERN_VERSIONS, self::LEGACY_VERSIONS);
	}

	private function ValidateModernRequest(array $message, array $params, array $headers): void
	{
		$id = $message['id'];
		$meta = $params['_meta'];
		$version = $meta[self::META_VERSION];
		if (!is_string($version) || !in_array($version, self::MODERN_VERSIONS, true))
			throw $this->UnsupportedVersion($id, $version);
		if (!isset($meta[self::META_CAPABILITIES]) || !is_array($meta[self::META_CAPABILITIES]))
			throw new McpProtocolException(400, self::ERROR_INVALID_PARAMS, 'Falta ' . self::META_CAPABILITIES . ' en _meta.', $id);
		$this->RequireHeader($headers, 'mcp-protocol-version', $version, $id);
		$this->RequireHeader($headers, 'mcp-method', $message['method'], $id);
		if ($message['method'] === 'tools/call')
		{
			$name = '';
			if (isset($params['name']) && is_string($params['name']))
				$name = $params['name'];
			$this->RequireHeader($headers, 'mcp-name', $name, $id);
		}
	}

	private function RequireHeader(array $headers, string $header, string $expected, $requestId): void
	{
		if (!isset($headers[$header]))
			throw new McpProtocolException(400, self::ERROR_HEADER_MISMATCH, 'Falta el encabezado ' . $header . '.', $requestId);
		$value = $this->DecodeHeaderValue($headers[$header]);
		if ($value !== $expected)
			throw new McpProtocolException(400, self::ERROR_HEADER_MISMATCH,
				'El encabezado ' . $header . " ('" . $value . "') no coincide con el cuerpo ('" . $expected . "').", $requestId);
	}

	private function DecodeHeaderValue(string $value): string
	{
		$prefix = '=?base64?';
		$suffix = '?=';
		$isEncoded = strpos($value, $prefix) === 0 && substr($value, -strlen($suffix)) === $suffix;
		if (!$isEncoded)
			return $value;
		$encoded = substr($value, strlen($prefix), strlen($value) - strlen($prefix) - strlen($suffix));
		$decoded = base64_decode($encoded, true);
		if ($decoded === false)
			return $value;
		return $decoded;
	}

	private function Dispatch(array $message, array $params, bool $isModern): array
	{
		$method = $message['method'];
		if ($method === 'initialize')
			return $this->Initialize($params);
		if ($method === 'ping')
			return [];
		if ($method === 'server/discover' && $isModern)
			return $this->Discover();
		if ($method === 'tools/list')
			return $this->ListTools($isModern);
		if ($method === 'tools/call')
			return $this->CallTool($message['id'], $params, $isModern);
		$status = 200;
		if ($isModern)
			$status = 404;
		throw new McpProtocolException($status, self::ERROR_METHOD_NOT_FOUND, 'Método no encontrado: ' . $method, $message['id']);
	}

	private function Initialize(array $params): array
	{
		$negotiated = self::LEGACY_VERSIONS[0];
		if (isset($params['protocolVersion']) && in_array($params['protocolVersion'], self::LEGACY_VERSIONS, true))
			$negotiated = $params['protocolVersion'];
		return [
			'protocolVersion' => $negotiated,
			'capabilities' => $this->GetCapabilities(),
			'serverInfo' => $this->GetServerInfo(),
			'instructions' => McpToolCatalog::GetGuide()
		];
	}

	private function GetServerInfo(): array
	{
		return ['name' => self::SERVER_NAME, 'title' => 'Poblaciones', 'version' => $this->serverVersion];
	}

	private function Discover(): array
	{
		return [
			'supportedVersions' => $this->GetSupportedVersions(),
			'capabilities' => $this->GetCapabilities(),
			'instructions' => McpToolCatalog::GetGuide(),
			'ttlMs' => self::TOOLS_TTL_MS,
			'cacheScope' => 'public'
		];
	}

	private function ListTools(bool $isModern): array
	{
		$result = ['tools' => $this->tools->GetTools()];
		if ($isModern)
		{
			$result['ttlMs'] = self::TOOLS_TTL_MS;
			$result['cacheScope'] = 'public';
		}
		return $result;
	}

	private function CallTool($requestId, array $params, bool $isModern): array
	{
		$status = 200;
		if ($isModern)
			$status = 400;
		if (!isset($params['name']) || !is_string($params['name']))
			throw new McpProtocolException($status, self::ERROR_INVALID_PARAMS, 'Falta el nombre de la herramienta (name).', $requestId);
		$name = $params['name'];
		if (!$this->tools->Exists($name))
			throw new McpProtocolException($status, self::ERROR_INVALID_PARAMS, 'Herramienta desconocida: ' . $name, $requestId);
		$this->toolName = $name;

		$arguments = null;
		if (isset($params['arguments']))
			$arguments = $params['arguments'];
		$text = '';
		$isError = false;
		try
		{
			$text = $this->RunTool($name, $this->tools->NormalizeArguments($name, $arguments));
		}
		catch (McpToolException $error)
		{
			$text = $error->getMessage();
			$isError = true;
		}
		return [
			'content' => [['type' => 'text', 'text' => $this->EnforceLimit($text)]],
			'isError' => $isError
		];
	}

	private function EnforceLimit(string $text): string
	{
		$max = $this->settings->MaxResponseChars;
		if (mb_strlen($text, 'UTF-8') <= $max)
			return $text;
		$notice = "\n[Respuesta recortada por el límite de tamaño.]";
		return mb_substr($text, 0, $max - mb_strlen($notice, 'UTF-8'), 'UTF-8') . $notice;
	}

	private function RunTool(string $name, array $args): string
	{
		if ($name === 'get_catalog')
			return McpDescriptionFormatter::FormatCatalog($this->gateway->GetCatalog());
		if ($name === 'describe_indicator')
			return McpDescriptionFormatter::FormatIndicator($this->gateway->DescribeIndicator($args['indicator_id']));
		if ($name === 'describe_boundary')
			return McpDescriptionFormatter::FormatBoundary($this->gateway->DescribeBoundary($args['boundary_id']));
		if ($name === 'find_regions')
			return McpDescriptionFormatter::FormatRegions($this->gateway->FindRegions($args['query']), $args['query']);
		if ($name === 'list_boundary_items')
			return $this->RunListBoundaryItems($args);
		if ($name === 'get_indicator_summary')
			return $this->RunSummary($args);
		if ($name === 'show_map')
			return $this->RunShowMap($args);
		if ($name === 'get_indicator_data')
			return $this->RunIndicatorData($args);
		return $this->RunDatasetRecords($args);
	}

	private function RunListBoundaryItems(array $args): string
	{
		$query = null;
		if ($args['query'] !== null && $args['query'] !== '')
			$query = $args['query'];
		$result = $this->gateway->ListBoundaryItems($args['boundary_id'], $args['parent_id'], $query, $args['limit'], $args['offset']);
		return McpDescriptionFormatter::FormatBoundaryItems($result);
	}

	private function RunSummary(array $args): string
	{
		$result = $this->gateway->GetIndicatorSummary($args['indicator_id'], $args['version_id'], $args['level_id'],
			$args['region_ids'], $args['partition']);
		return McpDescriptionFormatter::FormatSummary($result);
	}

	private function RunShowMap(array $args): string
	{
		$result = $this->gateway->GetMapLink($args['indicator_id'], $args['version_id'], $args['level_id'],
			$args['region_ids'], $args['partition']);
		return McpDescriptionFormatter::FormatMapLink($result);
	}

	private function RunIndicatorData(array $args): string
	{
		$sortBy = null;
		if ($args['sort_by'] !== null && $args['sort_by'] !== '')
			$sortBy = $args['sort_by'];
		$result = $this->gateway->GetIndicatorData($args['indicator_id'], $args['version_id'], $args['level_id'],
			$args['region_ids'], $args['partition'], $sortBy, $args['order'], $args['limit'], $args['offset']);
		return McpDescriptionFormatter::FormatDataResult($result, $this->settings->MaxResponseChars);
	}

	private function RunDatasetRecords(array $args): string
	{
		$result = $this->gateway->GetDatasetRecords($args['indicator_id'], $args['version_id'], $args['level_id'],
			$args['region_ids'], $args['partition'], $args['columns'], $args['limit'], $args['offset']);
		return McpDescriptionFormatter::FormatDataResult($result, $this->settings->MaxResponseChars);
	}

	private function BuildResult($id, array $result, bool $isModern): McpHttpResponse
	{
		if ($isModern)
		{
			$result['resultType'] = 'complete';
			$result['_meta'] = [self::META_SERVER_INFO => $this->GetServerInfo()];
		}
		else if (count($result) === 0)
		{
			$result = new \stdClass();
		}
		return $this->BuildJson(200, ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result]);
	}

	private function BuildError(int $status, $id, int $code, string $message, $data): McpHttpResponse
	{
		$error = ['code' => $code, 'message' => $message];
		if ($data !== null)
			$error['data'] = $data;
		return $this->BuildJson($status, ['jsonrpc' => '2.0', 'id' => $id, 'error' => $error]);
	}

	private function BuildJson(int $status, array $payload): McpHttpResponse
	{
		$body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
		return new McpHttpResponse($status, $body, ['Content-Type' => 'application/json']);
	}
}
