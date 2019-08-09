<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;
use minga\framework\Serializator;
use helena\classes\App;

class MetricsList extends BaseMapModel
{
	public $Hash;
	public $Metrics = array();

	public function CalculateHash()
	{
		$s = Serializator::Serialize($this->Metrics);
		$this->Hash = hash('md5', $s, false);
	}
	private function HasLocalEnvironment()
	{
		foreach($this->Metrics as $metric)
		{
			foreach($metric->Versions as $version)
			{
				if ($version->Environment != null)
					return true;
			}
		}
		return false;
	}
}


