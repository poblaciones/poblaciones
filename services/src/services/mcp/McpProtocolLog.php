<?php

namespace helena\services\mcp;

use minga\framework\ErrorException;

/**
 * Registro opcional de los métodos MCP recibidos (McpSettings::ProtocolLogEnabled), para diagnosticar qué hace el cliente.
 */
class McpProtocolLog
{
	const FILE_NAME = 'protocol.log';

	const MAX_BYTES = 524288;

	public static function BuildLine(int $timestamp, int $status, string $detail): string
	{
		return date('Y-m-d H:i:s', $timestamp) . ' ' . $status . ' ' . $detail . "\n";
	}

	/**
	 * Agrega la línea; si el archivo supera MAX_BYTES empieza uno nuevo, para que el registro no crezca sin límite.
	 */
	public static function Append(string $file, string $line): void
	{
		$flags = FILE_APPEND | LOCK_EX;
		if (file_exists($file) && filesize($file) > self::MAX_BYTES)
			$flags = LOCK_EX;
		if (file_put_contents($file, $line, $flags) === false)
			throw new ErrorException('No se pudo escribir el registro de protocolo: ' . $file);
	}
}
