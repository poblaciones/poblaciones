<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModelLabeled;

class Source extends BaseMapModelLabeled
{
	public $Id;
	public $Alias;
	public $Caption;
	public $Institution;
	public $InstitutionId;
	public $Authors;
	public $Version;
	public $Web;
	public $Wiki;
	public $IsGlobal;
	public $Contact;
	public $ContactId;
	function __construct()
	{
		$this->Institution = new Institution();
		$this->Contact = new Contact();
	}
	public static function GetMapLabeled()
	{
		return array(
			array('src_id', 'Id'),
			array('src_caption', 'Caption', 'Título'),
			array('', 'Institution', 'Institución'),
			array('src_institution_id', 'InstitutionId'),
			array('src_authors', 'Authors', 'Autores'),
			array('src_version', 'Version', 'Edición'),
			array('src_wiki', 'Wiki', 'Wikipedia'),
			array('src_web', 'Web', 'Página web'),
			array('src_is_global', 'IsGlobal', 'Global'),
			array('src_contact_id', 'ContactId'),
			array('', 'Contact', '#CONTACT#Punto de Contacto'));
	}
	public function FillMetadata($row)
	{
		$this->Fill($row);
		if ($row['src_con_id'] != null)
		{
			$this->Contact->Fill($row, null, 'src_');
		}
		if ($row['src_ins_id'] != null)
		{
			$this->Institution->Fill($row, null, 'src_');
		}

	}
	public function FillMetadataFromParams($preffix = '')
	{
		$this->FillFromParams($preffix);
		if ($this->InstitutionId === '') $this->InstitutionId = null;
		$this->Contact->FillFromParams($preffix . 'Contact');
		$this->Institution->FillFromParams($preffix . 'Institution');
	}
}


