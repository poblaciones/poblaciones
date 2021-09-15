<?php

namespace helena\services\backoffice\publish;

use helena\classes\StateBag;

class CalculateMetricStateBag extends StateBag
{
	public static function Create($datasetId, $source, $output, $area = null)
	{
		$ret = new CalculateMetricStateBag();
		$ret->Initialize();
		$ret->Set('datasetId', $datasetId);
		$ret->Set('source', $source);
		$ret->Set('output', $output);
		if ($area !== null)
			$ret->Set('area', $area);
		return $ret;
	}
}
