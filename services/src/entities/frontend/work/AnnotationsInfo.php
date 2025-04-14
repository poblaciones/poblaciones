<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;
use minga\framework\Arr;

class AnnotationsInfo extends BaseMapModel
{
	public $Id;
	public $Caption;
	public $GuestAccess;
	public $AllowedTypes;
	public $Items;

	public static function GetMap()
	{
		return array (
			'ann_id' => 'Id',
			'ann_caption' => 'Caption',
			'ann_guest_access' => 'GuestAccess',
			'ann_allowed_types' => 'AllowedTypes'
		);
	}

	public function FillItems($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			Arr::RemoveByValue($row, "AnnotationId");
			Arr::RemoveByValue($row, "AnnotationCaption");
			Arr::RemoveByValue($row, "AnnotationGuestAccess");
			Arr::RemoveByValue($row, "AnnotationAllowedTypes");
			$arr[] = $row;
		}
		$this->Items = $arr;
	}
}



