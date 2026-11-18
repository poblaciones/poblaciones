<?php

namespace helena\services\mcp;

class McpHttpResponse
{
	public int $Status;

	public ?string $Body;

	public array $Headers;

	/** Nombre de la herramienta invocada, para el registro de uso. */
	public ?string $ToolName = null;

	public function __construct(int $status, ?string $body = null, array $headers = [])
	{
		$this->Status = $status;
		$this->Body = $body;
		$this->Headers = $headers;
	}
}
