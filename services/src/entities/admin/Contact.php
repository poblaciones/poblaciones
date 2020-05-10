<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModelLabeled;

class Contact extends BaseMapModelLabeled
{
	public $Id;
	public $Person;
	public $Email;
	public $Phone;

	public static function GetMapLabeled()
	{
		return array (
			array('con_id', 'Id'),
			array('con_person', 'Person', 'Nombre y apellido'),
			array('con_email', 'Email', 'Correo electrónico'),
			array('con_phone', 'Phone', 'Teléfono'));
	}
}