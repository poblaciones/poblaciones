<?php

namespace helena\classes;

use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;
use minga\framework\Context;
use minga\framework\Cookies;
use minga\framework\Date;
use minga\framework\Str;
use minga\framework\Log;


class Remember
{
	const ValidRenew = 30; // en días
	const ValidCreate = 365;
	const CookieName = 'remember';
	const SectionName = 'Remember';

	public static function SetRemember($account)
	{
		self::CleanExpiredSections($account);

		$token = random_bytes(32);
		self::SetAccount($account, $token);
		self::SetCookie($account->user, $token);
	}

	public static function Remove($account)
	{
		$token = self::GetTokenFromCookie($account);
		if($token == '')
			return self::RemoveAndFail();

		$section = self::GetSectionByToken($account, $token);
		self::RemoveAndFail($account, $section);
	}

	public static function CheckCookie()
	{
		$cookie = Cookies::GetCookie(self::CookieName);
		//Si no hay cookie...
		if($cookie == '')
			return false;

		//Si está mal formada...
		$parts = explode('|', $cookie);
		if(count($parts) != 2)
			return self::RemoveAndFail();

		//Si tiene contenido inválido...
		$user = self::DecryptUser($parts[0]);
		if($user == '')
			return self::RemoveAndFail();

		//Si no hay cuenta para el usuario...
		$account = new Account();
		$account->user = $user;
		if($account->IsActive() == false)
			return self::RemoveAndFail();

		//Si no hay token local...
		$token = hash('sha256', base64_decode($parts[1]));
		$section = self::GetSectionByToken($account, $token);
		if($section == null)
			return self::RemoveAndFail();

		//Si no está vencida desde que entró la última vez...
		$update = Date::FormattedDate(strtotime($section['ses_last_login']));
		if(Date::DateNotPast($update, self::ValidRenew) == false)
			return self::RemoveAndFail($account, $section);

		//Si no está vencida desde creación...
		$create = Date::FormattedDate(strtotime($section['ses_create']));
		if(Date::DateNotPast($create, self::ValidCreate) == false)
			return self::RemoveAndFail($account, $section);

		//Es válido, puede loguear...
		Cookies::RenewCookie(self::CookieName, self::ValidRenew);
		self::RenewLogin($account, $section);
		$account->Begin();
		self::CleanExpiredSections($account);
		return true;
	}

	private static function RenewLogin($account, $section)
	{
		try
		{
			$sql = "UPDATE user_session SET ses_last_login = NOW() WHERE ses_user_id = ? AND ses_id = ?";
			App::Db()->exec($sql, array($account->userId, $section['ses_id']));
		}
		catch(\Exception $e)
		{
			Log::HandleSilentException($e);
		}
	}
	private static function RemoveAndFail($account = null, $section = null)
	{
		if($account != null && $section != null)
		{
			$sql = "DELETE FROM user_session WHERE ses_user_id = ? AND ses_id = ?";
			App::Db()->exec($sql, array($account->userId, $section['ses_id']));
		}
		if($account != null)
			self::CleanExpiredSections($account);

		Cookies::DeleteCookie(self::CookieName);
		return false;
	}


	private static function GetTokenFromCookie($account)
	{
		$cookie = Cookies::GetCookie(self::CookieName);
		if($cookie == '')
			return '';

		$parts = explode('|', $cookie);
		if(count($parts) != 2)
			return '';

		$user = self::DecryptUser($parts[0]);
		if(hash_equals($account->user, $user) == false)
			return '';

		return hash('sha256', base64_decode($parts[1]));
	}


	private static function DecryptUser($enc)
	{
		try
		{
			$key = Key::loadFromAsciiSafeString(Context::Settings()->Keys()->GetRememberKey());
			return Crypto::decrypt(base64_decode($enc), $key, true);
		}
		catch(\Exception $ex)
		{
			Log::HandleSilentException($ex);
			return '';
		}
	}

	private static function GetSectionByToken($account, $token)
	{
		$uncommitedStart = "SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
		$uncommitedEnd = "SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; ";
		App::Db()->execRead($uncommitedStart);

		$sql = "SELECT * FROM user_session WHERE ses_user_id = ? AND ses_token = ?;";
		$ret = App::Db()->fetchAssoc($sql, array($account->userId, $token));

		App::Db()->execRead($uncommitedEnd);
		return $ret;
	}

	private static function SetCookie($user, $token)
	{
		$key = Key::loadFromAsciiSafeString(Context::Settings()->Keys()->GetRememberKey());
		$enc = Crypto::encrypt($user, $key, true);

		$value = base64_encode($enc) . '|' . base64_encode($token);
		Cookies::SetCookie(self::CookieName, $value, self::ValidRenew);
	}


	private static function SetAccount($account, $token)
	{
		self::SaveRememberSection($account, hash('sha256', $token));
	}

	private static function SaveRememberSection($account, $token)
	{
		$date = Date::FormattedArNow();
		$insert = "INSERT INTO user_session (ses_user_id, ses_token, ses_create,
					ses_last_login, ses_last_ip, ses_user_agent) values (?, ?, now(), now(), ?, ?)";

		$ip = (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
		$agent = (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '');

		App::Db()->exec($insert, array($account->userId, $token, $ip, $agent));
	}
	private static function CleanExpiredSections($account)
	{
		// Hace el delete de las antiguas
		$sql = "DELETE FROM user_session WHERE ses_user_id = ? AND
								(DATE_ADD(ses_create, INTERVAL " .  self::ValidCreate . " DAY) < NOW() OR
								DATE_ADD(ses_last_login, INTERVAL " . self::ValidRenew . " DAY) < NOW() )";
		App::Db()->exec($sql, array($account->userId));
	}

	private static function GetNextSectionName($sections)
	{
		$sections = self::GetRememberSections($sections);
		if(count($sections) == 0)
			return self::SectionName . '_1';

		$last = explode('_', end($sections));
		if(count($last) != 2)
			return self::SectionName . '_1';

		$number = (int)$last[1] + 1;

		return self::SectionName . '_' . $number;
	}

	private static function GetRememberSections($sections)
	{
		$ret = array();
		foreach($sections as $section)
		{
			if(Str::StartsWith($section, self::SectionName . '_'))
				$ret[] = $section;
		}
		natsort($ret);
		return $ret;
	}
}
