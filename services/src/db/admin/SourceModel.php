<?php

namespace helena\db\admin;

use helena\entities\admin\Source;
use helena\classes\App;
use minga\framework\Profiling;


class SourceModel extends BaseModel
{
	public function __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('source', $fromDraft);
		$this->idField = 'src_id';
		$this->captionField = 'src_caption';

	}

	public function GetObjectForEdit($sourceId)
	{
		if ($sourceId == null)
			return new Source();

		$data = $this->GetForEdit($sourceId);
		$ret = new Source();
		$field = $ret->FillMetadata($data);
		return $ret;
	}

	private function GetForEdit($sourceId)
	{
		Profiling::BeginTimer();
		$params = array($sourceId);

		$sql = "SELECT  source.*,
										i2.ins_id as src_ins_id,
										i2.ins_caption as src_ins_caption,
										i2.ins_web as src_ins_web,
										i2.ins_email as src_ins_email,
										i2.ins_address as src_ins_address,
										i2.ins_phone as src_ins_phone,
										i2.ins_country as src_ins_country,
										c2.con_id as src_con_id,
										c2.con_person as src_con_person,
										c2.con_email as src_con_email,
										c2.con_phone as src_con_phone
						 FROM " . $this->resolveTableName('source') . " source
						LEFT JOIN " . $this->resolveTableName('institution') . " i2 on src_institution_id = i2.ins_id
						LEFT JOIN " . $this->resolveTableName('contact') . " c2 on src_contact_id = c2.con_id
						WHERE src_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetList()
	{
		Profiling::BeginTimer();
		$sql = "SELECT src_id as id, src_caption as caption, src_is_global as isGlobal, src_version version,
							(select count(*) from " . $this->resolveTableName('metadata_source') . " metadata WHERE msc_source_id = src_id) as usages,
							(	select GROUP_CONCAT(met_title SEPARATOR '\n')
								from " . $this->resolveTableName('metadata') . " metadata JOIN " . $this->resolveTableName('metadata_source') . " metadataSource ON msc_metadata_id = met_id where msc_source_id = src_id) as users
							FROM " . $this->resolveTableName('source') . " source ORDER BY src_caption";

		$ret = App::Db()->fetchAll($sql);

		Profiling::EndTimer();
		return $ret;
	}
	public function Delete($id)
	{
		$contactModel = new ContactModel($this->fromDraft);

		$source = $this->GetById($id);
		$contactId = $source['src_contact_id'];

		$this->DeleteById($id);

		if ($contactId != null)
				$contactModel->DeleteById($contactId);
	}

	public function Save($source)
	{
		$contactModel = new ContactModel($this->fromDraft);
		$sourceModel = new SourceModel($this->fromDraft);
		$institutionModel = new InstitutionModel($this->fromDraft);

		if ($source->Contact != null &&
				$source->Contact->Person != null && (
				!$source->ContactId || $source->Contact->isDirty))
			$source->ContactId = $contactModel->DbSave($source->Contact);

		if ($source->Institution != null &&
				$source->Institution->Name != null && (
				!$source->InstitutionId || $source->Institution->isDirty))
			$source->InstitutionId = $institutionModel->DbSave($source->Institution);

		$sourceModel->DbSave($source);
	}


	public function GetPublicSources()
	{
		Profiling::BeginTimer();

		$sql = "SELECT src_id, CONCAT(src_caption, ' (', src_version, ')') caption
						FROM " . $this->resolveTableName('source') . " source WHERE src_is_global = 1 ORDER BY src_caption";

		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}
