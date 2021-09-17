<?php

namespace helena\services\backoffice;

use helena\services\backoffice\metrics\MetricsAreaCalculator;

class CalculatedAreaService extends CalculatedServiceBase
{
	function __construct()
	{
		$this->calculator = new MetricsAreaCalculator();
	}

}

