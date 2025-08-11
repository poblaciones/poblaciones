<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\MessageBox;
use minga\framework\PhpSession;
use minga\framework\Request;
use minga\framework\Profiling;
use minga\framework\Str;

use minga\framework\PublicException;
use helena\caches\WorkPermissionsCache;
use helena\services\frontend\SelectedMetricService;
use helena\services\backoffice\publish\PublishDataTables;
use helena\caches\WorkVisiblityCache;
use helena\caches\BoundaryVisiblityCache;



class Session
{
	public static $AccessLink = null;
	public static $NewSession = 0;

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
	public static function StartSession()
	{
		$isStarting = PhpSession::CheckPhpSessionStarted();

		if ($isStarting && !Request::IsGoogle())
			self::$NewSession = 1;
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
	public static function CheckReadonlyForMaintenance()
	{
		if (Context::Settings()->readonlyForMaintenance)
		{
			return self::ReadonlyForMaintenance();
		}
	}

	public static function CheckReadonlyForMaintenanceService()
	{
		if (Context::Settings()->readonlyForMaintenance)
		{
			return self::ReadonlyForMaintenance();
		}
		else
		{
			return null;
		}
	}

	public static function CheckIsWorkPublicOrAccessible($workId)
	{
		Profiling::BeginTimer();
		// Se fija los permisos
		if (self::IsWorkPublicOrAccessible($workId))
			$ret = null;
		else
		{
			if ($app = Session::CheckSessionAlive())
				$ret = $app;
			else
				$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsWorkPublicOrAccessibleByDataset($datasetId)
	{
		Profiling::BeginTimer();
		// Se fija los permisos
		if (self::IsWorkPublicOrAccessibleByDataset($datasetId))
			$ret = null;
		else
		{
			if ($app = Session::CheckSessionAlive())
				$ret = $app;
			else
				$ret = self::NotEnoughPermissions();
		}		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsBoundaryVersionPublicOrAccessible($boundaryId, $boundaryVersionId)
	{
		Profiling::BeginTimer();
		// Se fija los permisos
		if (self::IsBoundaryVersionPublicOrAccessible($boundaryId, $boundaryVersionId))
			$ret = null;
		else {
			$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsBoundaryPublicOrAccessible($boundaryId)
	{
		Profiling::BeginTimer();
		// Se fija los permisos
		if (self::IsBoundaryPublicOrAccessible($boundaryId))
			$ret = null;
		else
		{
			$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId, &$isRestricted = false)
	{
		Profiling::BeginTimer();
		// Se fija los permisos
		if (self::IsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId, $isRestricted))
			$ret = null;
		else
		{
			if ($app = Session::CheckSessionAlive())
				$ret = $app;
			else
				$ret = self::NotEnoughPermissions();
		}
		Profiling::EndTimer();
		return $ret;
	}

	private static function GetWorkPublicOrAccessible($workId)
	{
		Profiling::BeginTimer();
		$res = null;

		if (!WorkVisiblityCache::Cache()->HasData($workId, $res))
		{
			$res = App::Db()->fetchAssoc("SELECT wrk_is_private, wrk_is_indexed, wrk_segmented_crawling, wrk_access_link FROM work WHERE wrk_id = ? LIMIT 1", array($workId));
			WorkVisiblityCache::Cache()->PutData($workId, $res);
		}
		Profiling::EndTimer();
		return $res;
	}

	public static function IsBoundaryPublicOrAccessible($boundaryId)
	{
		Profiling::BeginTimer();
		$res = null;
		$resText = "";
		$key = BoundaryVisiblityCache::CreateKey($boundaryId, '');
		if (!BoundaryVisiblityCache::Cache()->HasData($key, $resText)) {
			$res = App::Db()->fetchScalarInt("SELECT bou_is_private = 0 FROM boundary WHERE bou_id = ? LIMIT 1", array($boundaryId));
			$resText = $res . '';
			BoundaryVisiblityCache::Cache()->PutData($key, $res . '');
		}
		$res = ($resText !== '0' ? true : 0);

		if (!$res)
			$res = self::IsSiteReader();

		Profiling::EndTimer();
		return $res;
	}

	public static function IsBoundaryVersionPublicOrAccessible($boundaryId, $boundaryVersionId)
	{
		Profiling::BeginTimer();
		$res = null;
		$resText = "";
		$key = BoundaryVisiblityCache::CreateKey($boundaryId, $boundaryVersionId);
		if (!BoundaryVisiblityCache::Cache()->HasData($key, $resText))
		{
			$res = App::Db()->fetchScalarInt("SELECT bou_is_private = 0 FROM boundary INNER JOIN boundary_version ON bou_id = bvr_boundary_id WHERE bou_id = ? and bvr_id = ? LIMIT 1", array($boundaryId, $boundaryVersionId));
			$resText = $res . '';
			BoundaryVisiblityCache::Cache()->PutData($key, $res . '');
		}
		$res = ($resText !== '0' ? true: 0);

		if (!$res)
			$res = self::IsSiteReader();

		Profiling::EndTimer();
		return $res;
	}

	public static function IsWorkPublicOrAccessible($workId, &$isRestricted = false)
	{
		Profiling::BeginTimer();
		$res = self::GetWorkPublicOrAccessible($workId);
		if ($res === null)
		{
			$isRestricted = false;
			return self::IsSiteReader();;
		}
		$isRestricted = ($res['wrk_is_private'] || $res['wrk_access_link']);
		if (!$res['wrk_is_private'])
			$ret = self::IsLinkAccessible($res['wrk_access_link']);
		else if (!Session::IsAuthenticated())
			$ret = false;
		else
			$ret = self::IsWorkReaderShardified($workId);

		if (!$ret)
			$ret = self::IsSiteReader();

		Profiling::EndTimer();
		return $ret;
	}

	public static function IsWorkPublicSegmentedCrawled($workId)
	{
		Profiling::BeginTimer();
		$res = self::GetWorkPublicOrAccessible($workId);

		$ret = !$res['wrk_is_private'] && $res['wrk_is_indexed'] && $res['wrk_segmented_crawling'];
		Profiling::EndTimer();
		return $ret;
	}

	private static function IsLinkAccessible($link)
	{
		if (!$link) return true;

		if (self::$AccessLink === null)
		{
			if (array_key_exists('HTTP_ACCESS_LINK', $_SERVER))
				self::$AccessLink = $_SERVER['HTTP_ACCESS_LINK'];
			else
			{
				if (Str::Contains(Request::Referer(), $link))
				{
					self::$AccessLink = $link;
				}
			}
		}
		if (! self::$AccessLink) return false;
		return (self::$AccessLink === $link);
	}

	public static function IsWorkPublicOrAccessibleByDataset($datasetId)
	{
		Profiling::BeginTimer();
		$res = App::Db()->fetchAssoc("SELECT wrk_is_private, wrk_access_link, wrk_id FROM dataset JOIN work ON dat_work_id = wrk_id WHERE dat_id = ? LIMIT 1", array($datasetId));
		if ($res === null)
			$ret = true;
		else if (!$res['wrk_is_private'])
			$ret = self::IsLinkAccessible($res['wrk_access_link']);
		else if (!Session::IsAuthenticated())
			$ret = false;
		else
			$ret = self::IsWorkReaderShardified($res['wrk_id']);

		if (!$ret)
			$ret = self::IsSiteReader();

		Profiling::EndTimer();
		return $ret;
	}

	public static function IsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId, &$isRestricted = false)
	{
		Profiling::BeginTimer();
		$selectedMetricService = new SelectedMetricService();
		$metric = $selectedMetricService->GetSelectedMetric($metricId);
		if ($metric === null)
			return true;
		foreach ($metric->Versions as $version)
			if ($version->Version->Id === $metricVersionId) {
				$ret = self::IsWorkPublicOrAccessible($version->Version->WorkId, $isRestricted);
				Profiling::EndTimer();
				return $ret;
			}
		Profiling::EndTimer();
		return true;
	}

	public static function IsWorkEditor($workId, $canEditIndexed = false)
	{
		$permission = WorkPermissionsCache::GetCurrentUserPermission($workId, $canEditIndexed);
		if ($permission === WorkPermissionsCache::ADMIN ||
				$permission === WorkPermissionsCache::EDIT)
				return true;
		$account = Account::Current();
		return $account->IsSiteEditor();
	}
	public static function IsWorkReaderShardified($workShardifiedId)
	{
		$workId = PublishDataTables::Unshardify($workShardifiedId);
		return self::IsWorkReader($workId);
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
	public static function NotEnoughPermissions()
	{
		$account = Account::Current();
		$url = App::RedirectLoginUrl();
		http_response_code(401);
		MessageBox::ThrowMessage("El usuario ingresado ('" . $account->user . "') no dispone de suficientes permisos para acceder a esta opción
				<br><br>Seleccione continuar para identificarse con otra cuenta.", $url);
	}
	public static function ReadonlyForMaintenance()
	{
		throw new PublicException("Mientras realizamos tareas de mantenimiento en el sitio no es posible realizar operaciones de edición sobre información. Por favor, vuelva a intentar más tarde.");
	}

	private static function ElementNotFound()
	{
		MessageBox::ThrowMessage("El elemento indicado no ha sido encontrado.");
	}
	public static function CheckIsWorkEditor($workId, $canEditIndexed = false)
	{
		Profiling::BeginTimer();
		self::CheckReadonlyForMaintenanceService();

		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		// Se fija los permisos
		else if (self::IsWorkEditor($workId, $canEditIndexed))
			$ret = null;
		else
			$ret = self::NotEnoughPermissions();
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsDatasetEditor($datasetId)
	{
		Profiling::BeginTimer();
		if ($readonly = self::CheckReadonlyForMaintenanceService())
			return $readonly;

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
			$ret = null;
		else
			$ret = self::NotEnoughPermissions();
		Profiling::EndTimer();
		return $ret;
	}

	public static function CheckIsSiteReader()
	{
		Profiling::BeginTimer();
		if ($app = Session::CheckSessionAlive())
			$ret = $app;
		// Se fija los permisos
		else if (self::IsSiteReader())
			$ret = null;
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

