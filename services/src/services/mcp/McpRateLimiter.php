<?php

namespace helena\services\mcp;

use helena\classes\App;
use minga\framework\Context;
use minga\framework\ErrorException;
use minga\framework\IO;
use Symfony\Component\HttpFoundation\Response;

/**
 * Límite global de pedidos por minuto para las rutas del conector. Esas rutas quedan fuera del control de
 * tráfico por IP (Traffic), porque llegan desde unos pocos servidores de Anthropic.
 */
class McpRateLimiter
{
	const PATH_PREFIXES = ['/mcp', '/services/mcp'];

	const HOST_PREFIX = 'mcp.';

	const CONTROLLER_NAME = 'mcp';

	const WINDOW_SECONDS = 60;

	public static function IsMcpPath(string $uri): bool
	{
		$path = $uri;
		$queryPosition = strpos($uri, '?');
		if ($queryPosition !== false)
			$path = substr($uri, 0, $queryPosition);
		foreach (self::PATH_PREFIXES as $prefix)
		{
			if ($path === $prefix || strpos($path, $prefix . '/') === 0)
				return true;
		}
		return false;
	}

	/**
	 * Un servidor con nombre mcp.* se dedica al conector, que atiende en la raíz.
	 */
	public static function IsMcpHost(string $host): bool
	{
		$name = strtolower($host);
		$portPosition = strpos($name, ':');
		if ($portPosition !== false)
			$name = substr($name, 0, $portPosition);
		return strlen($name) > strlen(self::HOST_PREFIX) && strpos($name, self::HOST_PREFIX) === 0;
	}

	public static function IsMcpRequest(string $host, string $uri): bool
	{
		return self::IsMcpHost($host) || self::IsMcpPath($uri);
	}

	/**
	 * Pedido a la raíz de un host mcp.*: el controller de estadísticas es el mismo que en /mcp.
	 */
	public static function IsMcpRoot(string $host, string $uri): bool
	{
		$path = strval(parse_url($uri, PHP_URL_PATH));
		return self::IsMcpHost($host) && rtrim($path, '/') === '';
	}

	/**
	 * Cuenta el pedido. Devuelve null si está dentro del límite, o la respuesta 429 si lo supera.
	 */
	public static function Check(): ?Response
	{
		$maxCalls = App::Settings()->Mcp()->MaxCallsPerMinute;
		$directory = Context::Paths()->GetStorageCaches() . '/mcp';
		IO::EnsureExists($directory);
		$minute = intval(time() / self::WINDOW_SECONDS);
		$count = self::RegisterCall($directory . '/calls.txt', $minute);
		if ($count <= $maxCalls)
			return null;
		return new Response(json_encode(['error' => 'Demasiados pedidos. Reintentar en un minuto.']), 429,
			['Content-Type' => 'application/json', 'Retry-After' => strval(self::WINDOW_SECONDS)]);
	}

	/**
	 * Suma una llamada al contador del minuto indicado y devuelve el total del minuto. El archivo guarda
	 * "minuto:cantidad"; al cambiar de minuto el contador vuelve a uno.
	 */
	public static function RegisterCall(string $file, int $minute): int
	{
		$handle = fopen($file, 'c+');
		if ($handle === false)
			throw new ErrorException('No se pudo abrir el contador de pedidos: ' . $file);
		flock($handle, LOCK_EX);
		$count = self::ParseCount(stream_get_contents($handle), $minute) + 1;
		ftruncate($handle, 0);
		rewind($handle);
		fwrite($handle, $minute . ':' . $count);
		flock($handle, LOCK_UN);
		fclose($handle);
		return $count;
	}

	public static function ParseCount(string $content, int $minute): int
	{
		$parts = explode(':', $content);
		if (count($parts) !== 2 || intval($parts[0]) !== $minute)
			return 0;
		return intval($parts[1]);
	}
}
