<?php

namespace helena\classes;

use helena\classes\App;
use helena\classes\Session;
use helena\entities\backoffice\User;
use minga\framework\PublicException;

/**
 * Maneja la autenticación por API key para los endpoints de automatización.
 *
 * El key se puede enviar de dos formas (en orden de precedencia):
 *   1. Header HTTP:  X-Api-Key: <key>
 *   2. Query string: ?api_key=<key>
 *
 * Ver user_key.sql para el DDL de la tabla requerida.
 */
class AutomationAuth
{
	/**
	 * Autentica la petición actual a partir del API key.
	 * Si falla, lanza PublicException. Si tiene éxito, establece el usuario en sesión
	 * de modo que todos los Session::CheckIs* funcionen normalmente durante el request.
	 *
	 * @throws PublicException si el key falta, es inválido o está inactivo.
	 */
	public static function Authenticate(): void
	{
		$key = self::ExtractKey();
		if ($key === null || $key === '') {
			throw new PublicException('Se requiere autenticación: incluya el API key en el header X-Api-Key.');
		}

		$userId = self::ResolveUserId($key);
		if ($userId === null) {
			throw new PublicException('API key inválida o inactiva.');
		}

		// Cargar el usuario por ORM para obtener el login que ImpersonateUser espera
		$user = App::Orm()->find(User::class, $userId);
		if ($user === null || !$user->getIsActive()) {
			throw new PublicException('El usuario asociado al API key no existe o está inactivo.');
		}

		Session::ImpersonateUser($user->getEmail());

		self::TouchLastUsed($key);
	}

	// -------------------------------------------------------------------------
	// Métodos privados
	// -------------------------------------------------------------------------

	private static function ExtractKey(): ?string
	{
		if (isset($_SERVER['HTTP_X_API_KEY']) && $_SERVER['HTTP_X_API_KEY'] !== '') {
			return $_SERVER['HTTP_X_API_KEY'];
		}
		return $_GET['api_key'] ?? null;
	}

	/**
	 * Retorna el key_user_id asociado al key, o null si no existe/está inactivo.
	 */
	private static function ResolveUserId(string $plainKey): ?int
	{
		$hash = hash('sha256', $plainKey);

		$row = App::Db()->fetchAssoc(
			'SELECT key_user_id FROM user_key WHERE key_hash = ? AND key_active = 1',
			[$hash]
		);
		return $row ? (int) $row['key_user_id'] : null;
	}

	private static function TouchLastUsed(string $plainKey): void
	{
		$hash = hash('sha256', $plainKey);
		App::Db()->update(
			'user_key',
			['key_last_used' => (new \DateTime())->format('Y-m-d H:i:s')],
			['key_hash' => $hash]
		);
	}

	/**
	 * Genera un par [plainKey, hash].
	 * El plainKey debe mostrarse al usuario una sola vez y nunca almacenarse.
	 * El hash es el valor a guardar en key_hash.
	 *
	 * @return array{0: string, 1: string}  [$plainKey, $keyHash]
	 */
	public static function GenerateKey(): array
	{
		$plainKey = bin2hex(random_bytes(32)); // 64 chars hex
		$hash = self::Hash($plainKey);
		return [$plainKey, $hash];
	}

	/**
	 * Calcula el hash de un key en texto plano.
	 * Centralizado para garantizar consistencia del algoritmo.
	 */
	public static function Hash(string $plainKey): string
	{
		return hash('sha256', $plainKey);
	}

	/**
	 * Desactiva un key por su key_id.
	 */
	public static function Deactivate(int $keyId): void
	{
		App::Db()->update(
			'user_key',
			['key_active' => 0],
			['key_id' => $keyId]
		);
	}

	/**
	 * Reactiva un key por su key_id.
	 */
	public static function Activate(int $keyId): void
	{
		App::Db()->update(
			'user_key',
			['key_active' => 1],
			['key_id'     => $keyId]
		);
	}
}
