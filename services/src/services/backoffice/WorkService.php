<?php

namespace helena\services\backoffice;

use minga\framework\Arr;
use helena\classes\App;
use helena\classes\Session;
use helena\services\common\BaseService;
use minga\framework\Context;
use minga\framework\Profiling;
use helena\db\frontend\RevisionsModel;

use helena\entities\backoffice\DraftWork;
use helena\entities\backoffice\structs\WorkInfo;
use helena\entities\backoffice as entities;
use helena\services\backoffice\notifications\NotificationManager;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\PublishSnapshots;
use helena\services\backoffice\publish\CacheManager;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\ErrorException;

class WorkService extends BaseService
{
	public function Create($type, $title = '')
	{
		$work = new entities\DraftWork();
		if ($type === 'P' && Session::IsSiteEditor() === false)
			throw new ErrorException('Not enough permissions.');

		$work->setType($type);
		$work->setImageType('N');
		$work->setUnfinished(false);
		$work->setMetadataChanged(false);
		$work->setDatasetLabelsChanged(false);
		$work->setDatasetDataChanged(false);
		$work->setMetricLabelsChanged(false);
		$work->setMetricDataChanged(false);
		$work->setIsIndexed(false);
		$work->setIsPrivate(false);
		$work->setShard(Context::Settings()->Shard()->CurrentShard);

		// Crea startup
		$startup  = $this->CreateStartup();
		$work->setStartup($startup);
		// Crea metadatos
		$metadata = $this->CreateMetadata($type, $title);
		$work->setMetadata($metadata);
		// Graba work
		App::Orm()->Save($work);
		// Agrega permisos
		$this->AddDefaultPermission($work);

		// Manda un mensaje administrativo avisando del nuevo elemento
		$nm = new NotificationManager();
		$nm->NotifyCreate($work);

		return $work;
	}

	private function CreateStartup()
	{
		$startup = new entities\DraftWorkStartup();
		$startup->setType('D');
		$startup->setClippingRegionItemSelected(true);
		App::Orm()->Save($startup);
		return $startup;
	}

	private function CreateMetadata($type, $title)
	{
		$metadata = new entities\DraftMetadata();
		$metadata->setType($type);
		$metadata->setTitle($title);
		$metadata->setAbstract('');
		$metadata->setStatus('B');
		$metadata->setAuthors('');
		$metadata->setCoverageCaption('');
		$licence = '{"licenseType":1,"licenseOpen":"always","licenseCommercial":1,"licenseVersion":"4.0\/deed.es"}';
		$metadata->setLicense($licence);
		$metadata->setLanguage('es; Español');
		$metadata->setCreate(new \DateTime());
		$metadata->setUpdate(new \DateTime());

		// Crea uno a uno entre contacto y metadata
		$contact = new entities\DraftContact();
		App::Orm()->Save($contact);
		$metadata->setContact($contact);
		App::Orm()->Save($metadata);
		return $metadata;
	}
	private function AddDefaultPermission($work)
	{
		$userService = new UserService();
		$permissionDefault = new entities\DraftWorkPermission();
		$permissionDefault->setUser($userService->GetCurrentUser());
		$permissionDefault->setPermission('A');
		$permissionDefault->setWork($work);
		App::Orm()->Save($permissionDefault);
	}

	public function GetWorkInfo($workId)
	{
		Profiling::BeginTimer();
		$workInfo = new WorkInfo();
		$workInfo->Work = App::Orm()->find(DraftWork::class, $workId);
		if ($workInfo->Work === null)
			throw new ErrorException('El elemento no existe en la base de datos.');
		$permissions = new PermissionsService();
		$workInfo->Permissions = $permissions->GetPermissions($workId);
		$workInfo->Datasets = $this->GetDatasets($workId);
		$workInfo->Sources = $this->GetSources($workId);
		$workInfo->Files = $this->GetFiles($workId);
		$this->CompleteInstitution($workInfo->Work->getMetadata()->getInstitution());
		$workInfo->StartupExtraInfo = $this->GetStartupExtraInfo($workId);
		Profiling::EndTimer();
		return $workInfo;
	}

	public function GetStartupExtraInfo($workId)
	{
		Profiling::BeginTimer();
		$revisions = new RevisionsModel();
		$lookupVersion = $revisions->GetLookupRevision();
		$extraInfo = $this->GetWorkStartupClippingRegionExtra($workId);
		Profiling::EndTimer();
		return [ 'LookupVersion' => $lookupVersion, 'RegionExtraInfo' => $extraInfo['extra'], 'RegionCaption' => $extraInfo['caption']];
	}

	private function GetWorkStartupClippingRegionExtra($workId)
	{
		Profiling::BeginTimer();

		$sql = "SELECT clc_caption caption, Replace(clc_full_parent, '\t', ' > ') extra FROM draft_work JOIN draft_work_startup ON wrk_startup_id = wst_id
							JOIN snapshot_lookup_clipping_region_item ON wst_clipping_region_item_id = clc_clipping_region_item_id AND wst_clipping_region_item_id IS NOT NULL
								WHERE wrk_id = ?
								LIMIT 1";
		$row = App::Db()->fetchAssoc($sql, array($workId));
		if ($row === null)
			$ret = ['extra' => null, 'caption' => null];
		else
			$ret = $row;
		Profiling::EndTimer();
		return $ret;
	}

	public function RequestReview($workId)
	{
		// Manda un mensaje administrativo avisando del pedido
		$nm = new NotificationManager();
		$nm->NotifyRequestReview($workId);
		return self::OK;
	}
	public function UpdateStartup($workId, $startup)
	{
		App::Orm()->save($startup);
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}
	public function UpdateWorkVisibility($workId, $value, $link = null)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsPrivate($value);
		$draftWork->setAccessLink($link);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($work !== null) {
			$work->setIsPrivate($value);
			$work->setAccessLink($link);
			App::Orm()->save($work);
		}
		$caches = new CacheManager();
		$caches->CleanPdfMetadata($draftWork->getMetadata()->getId());
		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkVisibility($workId);
		return self::OK;
	}

	private function GetDatasets($workId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findManyByQuery("SELECT d FROM e:DraftDataset d JOIN d.Work w WHERE w.Id = :p1", array($workId));
		Profiling::EndTimer();
		return $ret;
	}

	private function GetSources($workId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findManyByQuery("SELECT src FROM e:DraftSource src WHERE src.Id IN (SELECT s.Id FROM e:DraftMetadataSource ms JOIN ms.Source s
																				JOIN ms.Metadata m JOIN e:DraftWork w WITH w.Metadata = m WHERE w.Id = :p1)", array($workId));

		$services = new SourceService();
		$services->fixSources($ret);
		$this->CompleteSources($ret);
		return $ret;
	}

	public function CompleteInstitution($institution)
	{
		if ($institution === null) return;
		Profiling::BeginTimer();

		$userId = Session::GetCurrentUser()->GetUserId();
		if (Session::IsMegaUser())
		{
			$editable = true;
		} else if ($institution->getIsGlobal())
		{
			$editable = Session::IsSiteEditor();
		}
		else
		{
				// Es editable si tiene control sobre todas las obras en las
				// que es utilizado el institution
				$sql = "SELECT (SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
													JOIN draft_metadata ON wrk_metadata_id = met_id
												  LEFT JOIN draft_metadata_source ON msc_metadata_id = met_id
												  LEFT JOIN draft_source ON msc_source_id = src_id
													WHERE src_institution_id = ? OR met_institution_id = ?) AS used,
												(SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
													JOIN draft_metadata ON wrk_metadata_id = met_id
												  LEFT JOIN draft_metadata_source ON msc_metadata_id = met_id
													LEFT JOIN draft_source ON msc_source_id = src_id
													JOIN draft_work_permission ON wkp_work_id = wrk_id
													WHERE src_institution_id = ? OR met_institution_id = ?
													AND wkp_user_id = ? AND wkp_permission IN ('E', 'A')) AS editor";
				$institutionId = $institution->getId();
				$params = array($institutionId, $institutionId, $institutionId, $institutionId, $userId);
				$res = App::Db()->fetchAssoc($sql, $params);
				$editable = ($res['used'] === $res['editor']);
		}
		$institution->setIsEditableByCurrentUser($editable);
		Profiling::EndTimer();
	}

	private function CompleteSources($sources)
	{
		if ($sources === null) return;
		Profiling::BeginTimer();

		foreach($sources as $source)
		{
			$this->CompleteSource($source);
		}
		Profiling::EndTimer();
	}

	public function CompleteSource($source)
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		if (Session::IsMegaUser())
		{
			$editable = true;
		} else if ($source->getIsGlobal())
		{
			$editable = Session::IsSiteEditor();
		}
		else
		{
			// Es editable si tiene control sobre todas las obras en las
			// que es utilizado el source
			$sql = "SELECT (SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
												JOIN draft_metadata ON wrk_metadata_id = met_id
												JOIN draft_metadata_source ON msc_metadata_id = met_id
												WHERE msc_source_id = ?) AS used,
											(SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
												JOIN draft_metadata ON wrk_metadata_id = met_id
												JOIN draft_metadata_source ON msc_metadata_id = met_id
												JOIN draft_work_permission ON wkp_work_id = wrk_id
												WHERE msc_source_id = ? AND wkp_user_id = ?
												AND wkp_permission IN ('E', 'A')) AS editor";
			$params = array($source->getId(), $source->getId(), $userId);
			$res = App::Db()->fetchAssoc($sql, $params);
			$editable = ($res['used'] === $res['editor']);
		}
		$source->setIsEditableByCurrentUser($editable);
		$this->CompleteInstitution($source->getInstitution());
	}
	private function GetFiles($workId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findManyByQuery("SELECT f FROM e:DraftMetadataFile f JOIN f.Metadata m JOIN e:DraftWork w WITH w.Metadata = m WHERE w.Id = :p1 ORDER BY f.Order", array($workId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorksByType($filter, $timeFilterDays = 0)
	{
		$condition = "wrk_type = '" . substr($filter, 0, 1) . "' ";
		if ($timeFilterDays > 0)
			$condition .= ' AND met_create >= ( CURDATE() - INTERVAL ' . $timeFilterDays. ' DAY ) ';
		// Trae las cartografías
		$list = $this->GetWorks($condition);
		return $list;
	}

	public function GetCurrentUserWorks()
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		// Si no es usuario público, trae todas las cartografías públicas
		if (Session::IsSiteReader())
		{
			$condition = "wrk_type = 'P' OR ";
		}
		else
		{
			$condition = "";
		}
		// Trae las cartografías del usuario
		$list = $this->GetWorks($condition . " wrk_id IN (SELECT wkp_work_id FROM draft_work_permission WHERE wkp_user_id = " . $userId . ")");
		return $list;
	}
	private function GetWorks($condition)
	{
		Profiling::BeginTimer();

		$userId = Session::GetCurrentUser()->GetUserId();
		$sql = "SELECT wrk_id Id,
								met_title Caption,
								met_last_online MetadataLastOnline,
								(wrk_metadata_changed OR wrk_dataset_labels_changed OR
								wrk_dataset_data_changed OR wrk_metric_labels_changed OR
								wrk_metric_data_changed) HasChanges
								, wrk_is_private IsPrivate
								, wrk_is_indexed IsIndexed
								, wrk_type Type
								, wrk_unfinished Unfinished
								, (SELECT MIN(wkp_permission) FROM draft_work_permission WHERE wkp_work_id = wrk_id AND wkp_user_id = ?) privileges
								, (SELECT COUNT(*) FROM draft_dataset d1 WHERE d1.dat_work_id = wrk_id) DatasetCount
								, (SELECT COUNT(*) FROM draft_dataset d2 WHERE d2.dat_work_id = wrk_id AND dat_geocoded = 1) GeorreferencedCount
								, (SELECT COUNT(*) FROM draft_metric_version_level mvl
																				JOIN draft_dataset d2 ON mvl.mvl_dataset_id = d2.dat_id
																					WHERE d2.dat_work_id = wrk_id) MetricCount
															FROM draft_work
											LEFT JOIN draft_metadata ON wrk_metadata_id = met_id WHERE " . $condition .
						" ORDER BY met_title";
			$ret = App::Db()->fetchAll($sql, array($userId));
			Arr::IntToBoolean($ret, array('IsPrivate', 'IsIndexed'));
			Profiling::EndTimer();
			return $ret;
	}

}
