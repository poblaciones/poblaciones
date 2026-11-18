<?php

namespace helena\services\mcp;

/**
 * Error de protocolo que se responde como error JSON-RPC, con el estado HTTP indicado.
 */
class McpProtocolException extends \Exception
{
	public int $HttpStatus;

	/** @var int|string|null */
	public $RequestId;

	public $Data;

	public function __construct(int $httpStatus, int $jsonRpcCode, string $message, $requestId = null, $data = null)
	{
		parent::__construct($message, $jsonRpcCode);
		$this->HttpStatus = $httpStatus;
		$this->RequestId = $requestId;
		$this->Data = $data;
	}
}
