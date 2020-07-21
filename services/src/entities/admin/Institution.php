<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModelLabeled;

class Institution extends BaseMapModelLabeled
{
	public $Id;
	public $Name;
	public $Web;
	public $Email;
	public $Address;
	public $Phone;
	public $Country;
	public $WatermarkId;
	public $PrimaryColor;

	public static function GetMapLabeled()
	{
		return array (
			array('ins_id', 'Id'),
			array('ins_caption', 'Name', 'Nombre'),
			array('ins_web', 'Web', 'Web'),
			array('ins_email', 'Email', 'Correo electrónico'),
			array('ins_address', 'Address', 'Dirección postal'),
			array('ins_phone', 'Phone', 'Teléfono'),
			array('ins_country', 'Country', 'País'),
			array('ins_watermark_id', 'WatermarkId', 'Logo'),
			array('ins_color', 'PrimaryColor', 'PrimaryColor'));
	}
}