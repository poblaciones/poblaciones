<?php

namespace helena\services\backoffice;

use helena\services\backoffice\metrics\MetricsDistanceCalculator;

class CalculatedDistanceService extends CalculatedServiceBase
{
	function __construct()
	{
		$this->calculator = new MetricsDistanceCalculator();
	}

}

