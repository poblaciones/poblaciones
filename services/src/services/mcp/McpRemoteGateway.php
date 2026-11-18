<?php

namespace helena\services\mcp;

use helena\classes\App;
use minga\framework\ErrorException;
use minga\framework\IO;
use minga\framework\WebConnection;

/**
 * Pasarela para el servidor sin acceso a la base: consulta los endpoints /services/mcp/* del servidor
 * transaccional, que usan la pasarela local.
 */
class McpRemoteGateway implements IMcpGateway
{
	const PATH = '/services/mcp/';

	const STATUS_TOOL_ERROR = 422;

	public function GetCatalog(): array
	{
		return $this->Get('catalog', []);
	}

	public function DescribeIndicator(int $indicatorId): array
	{
		return $this->Get('indicator', ['indicatorId' => $indicatorId]);
	}

	public function DescribeBoundary(int $boundaryId): array
	{
		return $this->Get('boundary', ['boundaryId' => $boundaryId]);
	}

	public function FindRegions(string $query): array
	{
		return $this->Get('regions', ['query' => $query]);
	}

	public function ListBoundaryItems(int $boundaryId, ?int $parentId, ?string $query, int $limit, int $offset): array
	{
		return $this->Get('boundaryItems', ['boundaryId' => $boundaryId, 'parentId' => $parentId, 'query' => $query,
			'limit' => $limit, 'offset' => $offset]);
	}

	public function GetIndicatorSummary(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		return $this->Get('summary', ['indicatorId' => $indicatorId, 'versionId' => $versionId, 'levelId' => $levelId,
			'regionIds' => implode(',', $regionIds), 'partition' => $partition]);
	}

	public function GetMapLink(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		return $this->Get('map', ['indicatorId' => $indicatorId, 'versionId' => $versionId, 'levelId' => $levelId,
			'regionIds' => implode(',', $regionIds), 'partition' => $partition]);
	}

	public function GetIndicatorData(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		?string $sortBy, string $order, int $limit, int $offset): array
	{
		return $this->Get('data', ['indicatorId' => $indicatorId, 'versionId' => $versionId, 'levelId' => $levelId,
			'regionIds' => implode(',', $regionIds), 'partition' => $partition, 'sortBy' => $sortBy, 'order' => $order,
			'limit' => $limit, 'offset' => $offset]);
	}

	public function GetDatasetRecords(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		array $columns, int $limit, int $offset): array
	{
		return $this->Get('records', ['indicatorId' => $indicatorId, 'versionId' => $versionId, 'levelId' => $levelId,
			'regionIds' => implode(',', $regionIds), 'partition' => $partition, 'columns' => implode(',', $columns),
			'limit' => $limit, 'offset' => $offset]);
	}

	private function Get(string $operation, array $arguments): array
	{
		$server = App::Settings()->Servers()->GetTransactionServer();
		$url = rtrim($server->publicUrl, '/') . self::PATH . $operation;

		$connection = new WebConnection();
		$connection->Initialize();
		$connection->SetFollowRedirects(false);
		$connection->SetHeader('INTERNAL', '1');
		$response = $connection->Get($url, '', 0, $this->RemoveNulls($arguments));
		$connection->Finalize();

		$content = IO::ReadAllText($response->file);
		IO::Delete($response->file);
		if ($response->httpCode === self::STATUS_TOOL_ERROR)
			throw new McpToolException($this->ReadErrorMessage($content, $url));
		if ($response->httpCode !== 200)
			throw new ErrorException('McpRemoteGateway: error HTTP ' . $response->httpCode . ' al consultar ' . $url);
		return $this->DecodeJson($content, $url);
	}

	private function RemoveNulls(array $arguments): array
	{
		$present = [];
		foreach ($arguments as $name => $value)
		{
			if ($value !== null)
				$present[$name] = $value;
		}
		return $present;
	}

	private function ReadErrorMessage(string $content, string $url): string
	{
		$decoded = $this->DecodeJson($content, $url);
		if (!isset($decoded['error']))
			throw new ErrorException('McpRemoteGateway: respuesta 422 sin mensaje de error de ' . $url);
		return strval($decoded['error']);
	}

	private function DecodeJson(string $content, string $url): array
	{
		$decoded = json_decode($content, true);
		if (!is_array($decoded))
			throw new ErrorException('McpRemoteGateway: respuesta que no es JSON de ' . $url);
		return $decoded;
	}
}
