<?php

namespace helena\classes;

use minga\framework\Params;
use minga\framework\MessageBox;
use minga\framework\PhpSession;
use helena\caches\WorkPermissionsCache;
use minga\framework\Profiling;


class Session
{
	public static function GetCurrentUser()
	{
		$account = Account::Current();
		return $account;
	}

	public static function IsAuthenticated()
	{
		$account = Account::Current();
		return $account->IsEmpty() == false;
	}

	public static function IsMegaUser()
	{
		$account = Account::Current();
		return $account->IsMegaUser();
	}
	public static function IsSiteEditor()
	{
		$account = Account::Current();
		return $account->IsSiteEditor();
	}
	public static function IsSiteReader()
	{
		$account = Account::Current();
		return $account->IsSiteReader();
	}
	public static function IsWorkEditor($workId)
	{
		$permission = WorkPermissionsCache::GetCurrentUserPermission($workId);
		if ($permission === WorkPermissionsCache::ADMIN ||
				$permission === WorkPermissionsCache::EDIT)
				return true;
		$account = Account::Current();
		return $account->IsSiteEditor();
	}

	public static function IsWorkReader($workId)
	{
		$permission = WorkPermissionsCache::GetCurrentUserPermission($workId);
		if ($permission === WorkPermissionsCache::ADMIN ||
				$permission === WorkPermissionsCache::EDIT ||
				$permission === WorkPermissionsCache::VIEW)
				return true;
		$account = Account::Current();
		return $account->IsSiteReader();
	}

	public static function GoProfile()
	{
		return App::Redirect(Links::GetBackofficeUrl());
	}
	public static function CheckIsMegaUser()
	{
		if ($app = Session::CheckSessionAlive())
		{
			return $app;
		}
		// Se fija los permisos
		if (self::IsMegaUser())
			return null;
		else
			return self::NotEnoughPermissions();
	}
	private static function MustLogin()
	{
		$account = Account::Current();
		$url = App::RedirectLoginUrl();
		http_response_code(403);
		MessageBox::ThrowMessage("Para acceder a esta opción debe ingresar con su cuenta de usuario.
				<br><br>Seleccione continuar para identificarse.", $url);
	}
	private static function NotEnoughPermissions()
	{
		$account = Account::Current();
		$url = App::RedirectLoginUrl();
		http_response_code(401);
		MessageBox::ThrowMessage("El usuario ingresado ('" . $account->user . "') no dispone de suficientes permisos para acceder a esta opción
				<br><br>Seleccione continuar para identificarse con otra cuenta.", $url);
	}
	private static function ElementNotFound()
	{
		MessageBox::ThrowMessage("El elemento indicado no ha sido encontrado.");
	}
	public static function CheckIsWorkEditor($workId)
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		// Se fija los permisos
		else if (self::IsWorkEditor($workId))
			$ret = null;
		else
			$ret = self::NotEnoughPermissions();
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsDatasetEditor($datasetId)
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		else
		{
			$workId = self::GetDatasetWorkId($datasetId);
			if ($workId === null)
				$ret = self::ElementNotFound();
			// Se fija los permisos
			else if (self::IsWorkEditor($workId))
				$ret = null;
			else
				$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}

	public static function GetDatasetWorkId($datasetId)
	{
		Profiling::BeginTimer();
		$workId = App::Db()->fetchScalarIntNullable("SELECT dat_work_id FROM draft_dataset WHERE dat_id = ?", array($datasetId));
		Profiling::EndTimer();
		return $workId;
	}
	public static function CheckIsDatasetReader($datasetId)
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		else {
			$workId = self::GetDatasetWorkId($datasetId);
			if ($workId === null)
				$ret = self::ElementNotFound();
			// Se fija los permisos
			else if (self::IsWorkReader($workId))
				$ret = null;
			else
				$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}
	public static function CheckIsWorkReader($workId)
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		// Se fija los permisos
		else if (self::IsWorkReader($workId))
			$ret = null;
		else
			$ret = self::NotEnoughPermissions();
		Profiling::EndTimer();
		return $ret;
	}
	public static function CheckIsSiteEditor()
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		// Se fija los permisos
		else if (self::IsSiteEditor())
			$ret =  null;
		else
			$ret = self::NotEnoughPermissions();
		Profiling::EndTimer();
		return $ret;
	}
	public static function CheckSessionAlive()
	{
		if (!Session::IsAuthenticated())
		{
			return self::MustLogin();
		}
		else
			return null;
	}

	public static function Logoff()
	{
		if (!Session::IsAuthenticated())
			return;
		$account = Account::Current();
		$masterUser = Account::GetMasterUser();
		if ($masterUser != '')
		{
			Account::RevertImpersonate();
		}
		else
		{
			Remember::Remove($account);
			Account::ClearCurrent();
			PhpSession::Destroy();
		}
		// Reinicia si había un administrador por detrás
	}


}

