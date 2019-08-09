<?php

namespace helena\db\admin;

use helena\entities\admin\Contact;

use minga\framework\Profiling;
use helena\classes\App;

class ContactModel extends BaseModel
{
	public function __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('contact', $fromDraft);
		$this->idField = 'con_id';
		$this->captionField = 'con_person';

	}

	public function GetObjectForEdit($contactId)
	{
		if ($contactId == null)
			return new Contact();

		$data = $this->GetForEdit($contactId);
		$ret = new Contact();
		$field = $ret->Fill($data);
		return $ret;
	}
	private function GetForEdit($contactId)
	{
		Profiling::BeginTimer();
		$params = array($contactId);

		$sql = "SELECT * FROM " . $this->tableName . " WHERE con_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetDefaultId()
	{
		Profiling::BeginTimer();
		$params = array();

		$sql = "SELECT con_id FROM " . $this->tableName . " WHERE con_public_data_editor = 1 LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();

		return $ret['con_id'];
	}

}


