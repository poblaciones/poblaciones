<?php

/**
 * Configuración default de los tests que acceden a la base de datos o variables.
 * En el key "global" van variables globales para cualquier test.
 * Los otros keys tienen que ser la clase del test (nombre completo con namespace),
 * y dentro un array con key por cada método que tiene variables, los valores y el
 * modo que se setean las variables es a decisión del usuario.
 *
 * En el test el uso es dentro del método:
 * $this->Get(); con eso se obtiene el valor para ese método,
 * también se puede pedir por key si el método tiene un array de
 * datos:
 * $this->Get('key');
 *
 */


return [
	"global" => [
		// El usuario de la base de datos para todos los tests que necesitan login.
		"dbuser" => 'test',
	],
	"helena\\tests\\backoffice\\DatasetColumnServiceTest" => [
		"testGetDatasetColumns" => 119,
		"testGetDatasetColumnsLabels" => 119,
	],
	"helena\\tests\\backoffice\\WorkServiceTest" => [
		'testGetWorkInfo' => 36,
	],
	"helena\\tests\\backoffice\\MetricServiceTest" => [
		"testGetWorkMetricVersions" => 36,
		"testGetDatasetMetricVersionLevels" => 119,
		"testGetColumnDistributions" => [
			'k' => 209,
			'c' => 'O',
			'ci' => 9744,
			'o' => 'O',
			'oi' => 9741,
			's' => 100,
		],
	],
	"helena\\tests\\backoffice\\DatasetServiceTest" => [
		"testGetDatasetData" => [
			'k' => 119,
			'filterscount' => 0,
			'groupscount' => 0,
			'pagenum' => 0,
			'pagesize' => 50,
			'recordstartindex' => 0,
			'recordendindex' => 50,
			'page' => 0,
		],
	],

	"helena\\tests\\frontend\\LookupServiceTest" => [
		"testSearch" => "escuelas",
	],
	"helena\\tests\\frontend\\LabelServiceTest" => [
		"testGetLabels" => [
			'x' => 85,
			'y' => 156,
			'z' => 8,
			'b' => null,
		],
	],
	"helena\\tests\\frontend\\ClippingServiceTest" => [
		"ParamProvider" => [
			[
				'a' => 86,
				'e' => '-36.321756,-56.568096;-38.339494,-61.822308',
				'z' => 8,
				'r' => 13903,
				'c' => null,
				'retHasCanvas' => true,
				'retHasEnvelope' => true,
				'retHasLevels' => true,
			], [
				'a' => 90,
				'e' => '-36.321756,-56.568096;-38.339494,-61.822308',
				'z' => 8,
				'r' => null,
				'c' => null,
				'retHasCanvas' => false,
				'retHasEnvelope' => false,
				'retHasLevels' => true,
			], [
				'a' => 90,
				'e' => '-37.359188,-59.742139;-37.374946,-59.783188',
				'z' => 15,
				'r' => 19517,
				'c' => '-37.366931,-59.761601;0.005383,0.006773',
				'retHasCanvas' => true,
				'retHasEnvelope' => true,
				'retHasLevels' => true,
			],
		],
	],
	"helena\\tests\\frontend\\cHandleTest" => [
		"setUp" => [
			'workId' => 3801,
			'metricId' => 5101,
			'regionId' => 15476,
		],
	],
	"helena\\tests\\frontend\\TileDataServiceTest" => [
		"testGetTileData" => [
			'l' => 3401,
			'v' => 601,
			'a' => 18801,

			'u' => 'N',
			'x' => 86,
			'y' => 156,
			'e' => '-36.31489,-56.568096;-38.33281,-61.822308',
			'z' => 8,
			'b' => null,
		],
	],
	"helena\\tests\\frontend\\SummaryServiceTest" => [
		"testGetSummary" => [
			'l' => 3401,
			'v' => 601,
			'a' => 18801,

			'u' => 'N',
			'e' => '-36.31489,-56.568096;-38.33281,-61.822308',
			'z' => 8,
		],
	],
	"helena\\tests\\frontend\\SelectedMetricServiceTest" => [
		"testPublicGetSelectedMetric" => 3401,
	],
];

