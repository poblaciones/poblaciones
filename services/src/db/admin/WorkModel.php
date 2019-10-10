<?php

namespace helena\db\admin;

use helena\entities\admin\Work;
use helena\entities\admin\WorkPermission;

use helena\classes\App;
use helena\classes\Account;
use helena\services\backoffice\publish\PublishDataTables;
use minga\framework\Date;
use minga\framework\Context;
use minga\framework\Profiling;
use helena\services\backoffice\publish\RevokeSnapshots;

class WorkModel extends BaseModel
{
	public static $posibleStatus = array('C' => 'Completo', 'P' => 'Parcial', 'B' => 'Borrador');

	public function __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('work', $fromDraft);
		$this->idField = 'wrk_id';
		$this->captionField = '';
		$this->fromDraft = $fromDraft;
	}

	public function GetDatasets($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT * FROM " . $this->resolveTableName('dataset') . "
							WHERE dat_work_id = ?";
		$ret = App::Db()->fetchAll($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}


	public function GetWork($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT * FROM " . $this->resolveTableName('work')
							. " WHERE wrk_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricVersions($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT metricVersion.*
							FROM " . $this->resolveTableName('metric_version') . " metricVersion
							WHERE mvr_work_id = ?";

		$ret = App::Db()->fetchAll($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetObjectForEdit($workId)
	{
		if ($workId == null)
			return new Work();

		$data = $this->GetForEdit($workId);
		$ret = new Work();
		$field = $ret->FillMetadata($data);
		return $ret;
	}
	public function Save($work)
	{
		$contactModel = new ContactModel($this->fromDraft);
		$sourceModel = new SourceModel($this->fromDraft);
		$institutionModel = new InstitutionModel($this->fromDraft);
		$metadataModel = new MetadataModel($this->fromDraft);
		$workPermissionModel = new WorkPermissionModel();

		if ($work->Metadata->Contact->Person != null)
			$work->Metadata->ContactId = $contactModel->DbSave($work->Metadata->Contact);
		if ($work->Metadata->Institution->Name != null)
			$work->Metadata->InstitutionId = $institutionModel->DbSave($work->Metadata->Institution);

		if ($work->Metadata->Source != null)
		{
			if ($work->Metadata->Source->Contact != null &&
					$work->Metadata->Source->Contact->Person != null)
				$work->Metadata->Source->ContactId = $contactModel->DbSave($work->Metadata->Source->Contact);

			if ($work->Metadata->Source->Institution != null &&
					$work->Metadata->Source->Institution->Name != null)
				$work->Metadata->Source->InstitutionId = $institutionModel->DbSave($work->Metadata->Source->Institution);

			if ($work->Metadata->Source->Caption != null)
				$work->Metadata->SourceId = $sourceModel->DbSave($work->Metadata->Source);
		}
		$workPermission = null;
		$isNew = !$work->MetadataId;

		if ($isNew)
		{
			$work->Metadata->Create = Date::DbArNow();
			$work->Metadata->Shard = Context::Settings()->Shard()->CurrentShard;
		}
		$work->Metadata->Update = Date::DbArNow();

		$work->MetadataId = $metadataModel->DbSave($work->Metadata);
		$workId = $this->DbSave($work);
		$work->Metadata->Url = '/'. $workId;
		$metadataModel->DbSave($work->Metadata);
		if ($isNew && $this->fromDraft)
		{
			$workPermission = new WorkPermission();
			$workPermission->UserId = Account::Current()->GetUserId();
			$workPermission->Permission = 'A';
			$workPermission->WorkId = $workId;
			$workPermissionModel->DbSave($workPermission);
		}
	}

	private function GetForEdit($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT  work.*,
										metadata.*,
										i1.*,
										c1.*
						 FROM " . $this->resolveTableName('work') . " work
						JOIN " . $this->resolveTableName('metadata') . " metadata
						LEFT JOIN " . $this->resolveTableName('institution') . " i1 on met_institution_id = i1.ins_id
						LEFT JOIN " . $this->resolveTableName('contact') . " c1 on met_contact_id = c1.con_id
						WHERE wrk_metadata_id = met_id AND wrk_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function RevokeWork($workId)
	{
		// Pasos de revoke.
		echo '<br>Preparándose para purgar una obra missing...';
		echo '<br>STEP_DELETE_DEFINITIONS:';
					$publisher = new PublishDataTables();
					$publisher->DeleteWorkTables($workId, true);
		echo '<br>STEP_DELETE_DATASETS:';
					$publisher = new PublishDataTables();
					$publisher->DeleteDatasetsTables($workId);
		echo '<br>STEP_DELETE_SNAPSHOTS_DATASETS:';
					$manager = new RevokeSnapshots();
					$manager->DeleteWorkDatasets($workId, true);
		echo '<br>STEP_DELETE_SNAPSHOTS_METRICS:';
					$manager = new RevokeSnapshots();
					$manager->DeleteWorkMetricVersions($workId, true);
		echo '<br>done';
	}
	public function GetList($type, $onlyCurrentUser = false)
	{
		Profiling::BeginTimer();
		$params = array($type);
		$userFilter = '';

		if ($this->fromDraft)
		{
			$userSelect = "(SELECT GROUP_CONCAT(CONCAT(usr_firstname, ' ', usr_lastname)) FROM draft_work_permission, user where usr_id = wkp_user_id and wkp_work_id = wrk_id) as user, ";
			if ($onlyCurrentUser)
			{
				$userFilter = " AND wrk_id in (SELECT wkp_work_id FROM draft_work_permission WHERE wkp_user_id = ?)";
				$account = Account::Current();
				$params[] = $account->GetUserId();
			}
		}
		else
		{
			$userSelect = "wrk_published_by user, ";
			if ($onlyCurrentUser)
			{
				$userFilter = ' AND wrk_published_by = ?';
				$account = Account::Current();
				$params[] = $account->user;
			}
		}
		if (!$this->fromDraft)
		{
			$isGhost = ', (0 = (SELECT COUNT(*) FROM draft_work d
											WHERE d.wrk_id = FLOOR(work.wrk_id / 100))) as draftCopyMissing ';
		}
		else
		{
			$isGhost = ', 0 as draftCopyMissing ';
		}
		$sql = "SELECT wrk_id as id, met_title as title, wrk_comments as comments,
						wrk_shard as shard,
						" . $userSelect . "
						met_status as met_status "
						. $isGhost . "
						FROM " . $this->resolveTableName('work') . " work,
						" . $this->resolveTableName('metadata') . " metadata
						WHERE wrk_metadata_id = met_id
						AND wrk_type = ? " . $userFilter . " ORDER BY wrk_id DESC";
		$ret = App::Db()->fetchAll($sql, $params);
		$this->LoadStatus($ret);
		Profiling::EndTimer();
		return $ret;
	}
	private function LoadStatus(&$ret)
	{
		if ($ret == null) return;
		$status = self::$posibleStatus;
		foreach($ret as &$item)
		{
			$item['status'] = '';
			foreach($status as $st => $val)
			{
				if ($item['met_status'] == $st)
					$item['status'] = $val;
			}
		}
	}
}
