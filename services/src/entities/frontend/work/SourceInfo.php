<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;

class SourceInfo extends BaseMapModel
{
	public $Id;
	public $Web;
	public $Wiki;
	public $Name;

	public static function GetMap()
	{
		return array (
			'src_id' => 'Id',
			'src_web' => 'Web',
			'src_wiki' => 'Wiki',
			'src_caption' => 'Name');
	}

}


