<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;
use helena\classes\App;
use minga\framework\ErrorException;

class SelectedMetric extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;

	public $SelectedVersionIndex;
	public $Metric;
	public $SummaryMetric = 'N';
	public $Transparency = 'M';

	public $Visible;
	public $ShowLegendsMetricName;


	// Posibles Valores:
	// - N (default): Cantidad absoluta.
	// - P: Porcentaje
	// - K: Area en KM2
	// - H: Area en Hectáreas (100x100m)
	// - A: Porcentaje del área total.
	// - D: Densidad (cantidad absoluta / km2)
	// valores posibles (sumas de) :
	//					U: Urbano agrupado,
	//					D: Urbano disperso,
	//					R: Rural agrupado,
	//					L: Rural disperso,
	//					N: No indicado (todo, excluyente)
	//
	//					R y L corresponden a las categorias 2 y 3 de la variable URP del Censo.
	//					U y D corresponden a la categoría 1 de URP, siendo D aquellas con < de 250 habitantes por km2.'

	public $SelectedUrbanity = 'N';

	public $Versions = array();

	public static function GetMap()
	{
		return array ();
	}
	public function AddVersion($version)
	{
		$this->Versions[]= $version;
		$version->Metric = $this;
	}

	public function GetVersion($versionId)
	{
		foreach($this->Versions as $version)
			if ($version->Version->Id == $versionId)
				return $version;
		throw new ErrorException('La edición del indicador no ha sido encontrada.');
	}
}


