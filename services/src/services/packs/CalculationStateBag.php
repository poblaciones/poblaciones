<?php

namespace helena\services\packs;

use helena\classes\StateBag;

// Para procesos que usan el Stepper sin depender de un archivo subido (a
// diferencia de GeoPackageStateBag): Initialize() es protected en la
// clase base, pensada para llamarse solo desde una subclase.
class CalculationStateBag extends StateBag
{
	public static function Create($bucketId = null)
	{
		$ret = new CalculationStateBag();
		$ret->Initialize($bucketId);
		return $ret;
	}
}
