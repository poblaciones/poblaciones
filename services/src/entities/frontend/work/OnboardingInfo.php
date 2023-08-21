<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;

class OnboardingInfo extends BaseMapModel
{
	public $Id;
	public $Enabled = false;
	public $Steps;

	public static function GetMap()
	{
		return array (
			'onb_id' => 'Id',
			'onb_enabled' => 'Enabled'
		);
	}

	public function FillSteps($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$arr[] = array('Id' => $row['StepId'], 'Name' => $row['StepName'],
								'Content' => $row['StepContent'],
								'ImageId' => $row['ImageId'],
								'Alignment' => $row['Alignment']);
		}
		$this->Steps = $arr;
	}
}



