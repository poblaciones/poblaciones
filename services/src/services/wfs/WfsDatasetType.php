<?php

namespace helena\services\wfs;

use minga\framework\Log;

// Tipos de dataset según Dataset.Type en GetSelectedMetric
class WfsDatasetType
{
	const CENSUS = 'D'; // Polígonos censales - geometría viene de MySQL vía GetGeographyByEnvelope
	const SHAPES = 'S'; // Polígonos propios  - geometría viene de ShapesService vía GetShapesByEnvelope
	const POINTS = 'L'; // Puntos             - lat/lon incluidos en GetMetricData
}
