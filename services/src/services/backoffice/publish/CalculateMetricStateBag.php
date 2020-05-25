<?php

namespace helena\services\backoffice\publish;

use helena\classes\StateBag;

class CalculateMetricStateBag extends StateBag
{
	public static function Create($datasetId, $source, $output)
	{
		$ret = new CalculateMetricStateBag();
		$ret->Initialize();
		$ret->Set('datasetId', $datasetId);
		$ret->Set('source', $source);
		$ret->Set('output', $output);
		return $ret;
	}
}
