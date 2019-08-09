<?php

namespace helena\services\backoffice;

use minga\framework\TemplateMessage;
use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Session;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;
use minga\framework\ErrorException;
use helena\db\frontend\UserModel;

class PermissionsService extends BaseService
{
	public function GetPermissions($workId)
	{
		Profiling::BeginTimer();
		$records = App::Orm()->findManyByProperty(entities\DraftWorkPermission::class, "Work", $workId);
		Profiling::EndTimer();
		return $records;
	}
	public function GetPermissionsByUser($userId)
	{
		Profiling::BeginTimer();
		$records = App::Orm()->findManyByProperty(entities\DraftWorkPermission::class, "User", $userId);
		Profiling::EndTimer();
		return $records;
	}
	public function AssignPermission($workId, $userEmail, $permission)
	{
		Profiling::BeginTimer();
		// Si hay algo idéntico, sale
		$clean = "DELETE draft_work_permission FROM draft_work_permission JOIN user ON wkp_user_id = usr_id WHERE wkp_work_id = ? AND usr_email = ? AND wkp_permission = ?";
		App::Db()->exec($clean, array($workId, $userEmail, $permission));
		// 1. Crea el permiso
		$newPermission = new entities\DraftWorkPermission();
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$newPermission->setWork($work);

		$userService = new UserService();
		$user = $userService->GetOrCreate($userEmail);
		$newPermission->setUser($user);
		$newPermission->setPermission($permission);
		App::Orm()->save($newPermission);
		WorkPermissionsCache::Clear($workId);

		// 2. Manda el mail notificando
		$this->NotifyPermission($work, $userEmail, $permission);

		Profiling::EndTimer();
		return $newPermission;
	}
	public static function GetRoleLabel($permission)
	{
		switch($permission)
		{
			case 'V':
				return 'para consultar';
			case 'E':
				return 'para editar';
			case 'A':
				return 'para administrar';
			default:
				throw new ErrorException('Tipo de permiso no reconocida.');
		}
	}
	public static function GetTypeLabel($work)
	{
		switch($work->getType())
		{
			case 'P':
				return 'los datos públicos';
			case 'R':
				return 'la cartografía';
			case 'M':
				return 'el mapeo';
			default:
				throw new ErrorException('Tipo de obra no reconocida.');
		}
	}
	public function NotifyPermission($work, $userEmail, $permission)
	{
		$verb = self::GetRoleLabel($permission);
		$typeLabel = self::GetTypeLabel($work);
		$fullName = $work->getMetadata()->getTitle();
		// crea el linkaction para enviar el mail...
		$userModel = new UserModel();
		$target = App::AbsoluteUrl('/users/');
		$message = 'Para utilizar los permisos ' . $verb . ' ' . $typeLabel . ' <b>' . $fullName . '</b> debe poder identificarse en el sitio.';

		// Si no existe en la base, lo crea.
		$current = $userModel->GetUserByEmail($userEmail);
		if ($current === null)
			$userModel->CreateUser($userEmail);
		// Crea el token-link
		$token = $userModel->CreateUserLink('P', $userEmail, $target, $message);
		// Genera la url
		$url = App::AbsoluteUrl('/authenticate/linkInvitation?username=' . urlencode($userEmail) . '&id=' . $token);

		// Manda email....
		$message = new TemplateMessage();
		$message->title = "Acceso " . $verb .  " en " . $fullName;
		$message->to = $userEmail;
		$message->AddViewAction($url, 'Acceder', 'Acceder a ' .  $typeLabel);
		$message->SetValue('type_label',  $typeLabel);
		$message->SetValue('full_name',  $fullName);

		$message->SetValue('level',  $verb);
		$message->SetValue('link_url',  $url);

		$message->Send('permissionNotification.html.twig');
	}
	public function RemovePermission($workId, $permissionId)
	{
		Profiling::BeginTimer();
		$delete = "DELETE FROM draft_work_permission WHERE wkp_work_id = ? AND wkp_id = ?";
		App::Db()->exec($delete, array($workId, $permissionId));
		WorkPermissionsCache::Clear($workId);
		Profiling::EndTimer();
		return self::OK;
	}

	public function GetMetricsCanEditForDataset($datasetId)
	{
		Profiling::BeginTimer();
		// Trae el nivel de permisos que tiene el usuario actual sobre las obras de los metric vinculados
		// al dataset actual
		$userId = Session::GetCurrentUser()->GetUserId();
		$sql = "SELECT mtr_id, wrk_id, wrk_type, (SELECT COUNT(*) FROM draft_work_permission WHERE
							wkp_work_id = wrk_id AND wkp_user_id = ? AND (wkp_permission = 'E' OR wkp_permission = 'A') > 0) can_edit
							FROM draft_metric_version_level original_mvl
							JOIN draft_metric_version orignal_mv ON original_mvl.mvl_metric_version_id = orignal_mv.mvr_id
							JOIN draft_metric ON orignal_mv.mvr_metric_id = mtr_id
							JOIN draft_metric_version all_mv ON all_mv.mvr_metric_id = mtr_id
							JOIN draft_metric_version_level all_mvl ON all_mvl.mvl_metric_version_id = all_mv.mvr_id
							JOIN draft_dataset all_dat ON all_mvl.mvl_dataset_id = all_dat.dat_id
							JOIN draft_work all_work ON all_dat.dat_work_id = all_work.wrk_id
							WHERE original_mvl.mvl_dataset_id = ?";
		$rows = App::Db()->fetchAll($sql, array($userId, $datasetId));
		$ret = array();
		// Marca todo como permitido, para luego impugnar
		foreach($rows as $row)
			$ret[$row['mtr_id']] = true;
		// Busca casos negativos para impugnar
		foreach($rows as $row)
		{
			if (Session::IsMegaUser() === false && $row['can_edit'] === 0)
			{
				// No es administrador y no tiene permiso asignado en la base. Se fija
				// si tiene permiso para editar datos públicos y lo son.
				if (Session::IsSiteEditor() === false || $row['wkr_type'] !== 'P')
				{
					$ret[$row['mtr_id']] = false;
				}
			}
		}

		Profiling::EndTimer();
		return $ret;
	}
}

