<?php

namespace helena\db\admin;

use minga\framework\Profiling;

use helena\entities\admin\Institution;
use helena\classes\App;
use minga\framework\Arr;

class InstitutionModel extends BaseModel
{
	public function __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('institution', $fromDraft);
		$this->idField = 'ins_id';
		$this->captionField = 'ins_caption';

	}
	public function GetDefaultId()
	{
		Profiling::BeginTimer();
		$params = array();

		$sql = "SELECT ins_id FROM " . $this->tableName . " WHERE ins_public_data_editor = 1 LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();

		return $ret['ins_id'];
	}
	public function GetObjectForEdit($institutionId)
	{
		if ($institutionId == null)
			return new Institution();

		$data = $this->GetForEdit($institutionId);
		$ret = new Institution();
		$field = $ret->Fill($data);
		return $ret;
	}
	private function GetForEdit($institutionId)
	{
		Profiling::BeginTimer();
		$params = array($institutionId);

		$sql = "SELECT * FROM " . $this->tableName . " WHERE ins_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetList()
	{
		Profiling::BeginTimer();
		$sql = "SELECT ins_id as id, ins_caption as caption, ins_phone phone, ins_email email FROM " . $this->tableName . " ORDER BY ins_caption";

		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetInstitutionsForCombo()
	{
		Profiling::BeginTimer();
		$params = array();

		$sql = "SELECT ins_id, ins_caption FROM " . $this->tableName . " ORDER BY ins_caption";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();

		return Arr::ToKeyArr($ret);
	}
}


