<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;
use minga\framework\PublicException;

class SelectedMetricVersion
{
	public $Version;

	public $SymbolStackedPosition;
	public $Symbol;

	public $AutoLevel = false;
	public $LabelsCollapsed = false;
	public $Work;

	public $SelectedLevelIndex;

	public $ExcludedValues = array();

	/// <summary>
	/// Niveles de datos disponibles en geografías
	/// </summary>
	public $Levels = array();

	public function GetLevel($levelId)
	{
		foreach($this->Levels as $level)
			if ($level->Id == $levelId)
				return $level;
		throw new PublicException('El nivel del indicador no ha sido encontrado');
	}
}
