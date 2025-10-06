<?php

namespace helena\services\backoffice;

use minga\framework\Str;
use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\Profiling;
use helena\services\common\BaseService;
use helena\classes\Session;


class MetadataService extends BaseService
{

	public function ResolveMetadata($workId, $metadataId)
	{
		if ($workId)
		{
			$work = App::Orm()->find($this->ApplyDraft(entities\DraftWork::class), $workId);
			return $work->getMetadata();
		}
		else
		{
			return App::Orm()->find($this->ApplyDraft(entities\DraftMetadata::class), $metadataId);
		}
	}

	public function UpdateMetadata($workId, $metadata)
	{
		if ($workId)
			$this->UpdateInstitutionGlobalFlag($workId);

		App::Orm()->Save($metadata);

		if ($workId)
			WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	private function UpdateInstitutionGlobalFlag($workId)
	{
		$work = App::Orm()->find($this->ApplyDraft(entities\DraftWork::class), $workId);
		$isGlobal = $work->getType() === 'P';
		$metadataId = $work->getMetadata()->getId();

		$institutionRelations = App::Orm()->findManyByProperty($this->ApplyDraft(entities\DraftMetadataInstitution::class), "Metadata.Id", $metadataId);

		foreach($institutionRelations as $relation)
		{
			$ins = $relation->getInstitution();
			if ($ins !== null)
			{
				if ($isGlobal && $ins->getIsGlobal() == false)
				{
					$ins->setIsGlobal(true);
					App::Orm()->Save($ins);
				}
			}
		}
	}

	public function GetSources($metadataId)
	{
		Profiling::BeginTimer();

		$retRelations = App::Orm()->findManyByQuery("SELECT ms FROM e:" . $this->ApplyDraft("DraftMetadataSource") . " ms
						JOIN ms.Metadata m WHERE m.Id = :p1 ORDER BY ms.Order", array($metadataId));
		$ret = [];
		foreach ($retRelations as $relation)
			$ret[] = $relation->getSource();

		$services = new SourceService();
		$services->fixSources($ret);
		$this->CompleteSources($ret);
		return $ret;
	}

	public function GetInstitutions($metadataId)
	{
		Profiling::BeginTimer();

		$retRelations = App::Orm()->findManyByQuery("SELECT mi FROM e:" . $this->ApplyDraft("DraftMetadataInstitution") . " mi JOIN mi.Institution i
											JOIN mi.Metadata m WHERE m.Id = :p1 ORDER BY mi.Order", array($metadataId));
		$ret = [];
		foreach ($retRelations as $relation)
			$ret[] = $relation->getInstitution(); foreach ($ret as $institution)
			$this->CompleteInstitution($institution);

		return $ret;
	}

	public function CompleteInstitution($institution)
	{
		if ($institution === null)
			return;
		Profiling::BeginTimer();

		$userId = Session::GetCurrentUser()->GetUserId();
		if (Session::IsMegaUser()) {
			$editable = true;
		} else if ($institution->getIsGlobal()) {
			$editable = Session::IsSiteEditor();
		} else {
			// Es editable si tiene control sobre todas las obras en las
			// que es utilizado el institution
			$sql = "SELECT (SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
													JOIN draft_metadata ON wrk_metadata_id = met_id
													JOIN draft_metadata_institution ON min_metadata_id = met_id
												  LEFT JOIN draft_metadata_source ON msc_metadata_id = met_id
												  LEFT JOIN draft_source ON msc_source_id = src_id
													WHERE src_institution_id = ? OR min_institution_id = ?) AS used,
							(SELECT COUNT(DISTINCT(wrk_id)) FROM draft_work
								JOIN draft_metadata ON wrk_metadata_id = met_id
								JOIN draft_metadata_institution ON min_metadata_id = met_id
								LEFT JOIN draft_metadata_source ON msc_metadata_id = met_id
								LEFT JOIN draft_source ON msc_source_id = src_id
								JOIN draft_work_permission ON wkp_work_id = wrk_id
								WHERE src_institution_id = ? OR min_institution_id = ?
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
		if ($sources === null)
			return;
		Profiling::BeginTimer();

		foreach ($sources as $source) {
			$this->CompleteSource($source);
		}
		Profiling::EndTimer();
	}

	public function CompleteSource($source)
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		if (Session::IsMegaUser()) {
			$editable = true;
		} else if ($source->getIsGlobal()) {
			$editable = Session::IsSiteEditor();
		} else {
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

	public function GetFiles($metadataId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findManyByQuery("SELECT f FROM e:" . $this->ApplyDraft("DraftMetadataFile") . " f JOIN f.Metadata m WHERE m.Id = :p1 ORDER BY f.Order", array($metadataId));
		Profiling::EndTimer();
		return $ret;
	}

}

