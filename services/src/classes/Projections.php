<?php

namespace helena\classes;

use minga\framework\Str;
use minga\framework\IO;

use minga\framework\PublicException;

use proj4php\Proj4php;
use proj4php\Proj;
use proj4php\Point;

class Projections
{
	private $from;
	private $to;
	private $projector;

	function __construct($crsFrom, $crsTo)
	{
		// Initialise Proj4
		$proj4 = new Proj4php();

		// Create two different projections.
		$this->from = new Proj($crsFrom, $proj4);
		$this->to = new Proj($crsTo, $proj4);
		$this->projector = $proj4;
	}

	public function ProjectGeometry($geometry)
	{
		$shapeType = $geometry::GEOJSON_BASETYPE;
		$arr = $geometry->getArray();
		$class = get_class($geometry);
		$cloned = new $class();

		if ($shapeType == "Point")
			$arrayProjected = $this->ProjectXYPoint($arr);
		else if ($shapeType == "MultiPoint" || $shapeType == "Linestring")
		{
			$arrayProjected = $this->ProjectPointList($arr);
		}
		else if ($shapeType == "Polygon")
		{
			$arrayProjected = $this->ProjectPolygon($arr);
		}
		else if ($shapeType == "MultiLinestring")
		{
			$arrayProjected = $this->ProjectParts($arr, false);
		}
		else if ($shapeType == "MultiPolygon")
		{
			$arrayProjected = $this->ProjectParts($arr, true);
		}
		else
			throw new PublicException("Tipo de geometría no soportada: " . $shapeType);

		$cloned->initFromArray($arrayProjected);
		return $cloned;
	}

	public function ProjectXYPoint($point)
	{
		// Your original point
		$srcPoint = new Point($point['x'], $point['y'], $this->from);

		// Create your new point in WGS84 projection
		$dstPoint = $this->projector->transform($this->to, $srcPoint);
		return ['x' => $dstPoint->x, 'y' => $dstPoint->y];
	}
	public function ProjectPointList($arr)
	{
		$list = [];
		foreach($arr['points'] as $point)
			$list[] = $this->ProjectXYPoint($point);
		return 	['points' => $list, 'numpoints' => sizeof($list) ];
	}
	public function ProjectPolygon($arr)
	{
		$list = [];
		foreach($arr['rings'] as $ring)
			$list[] = $this->ProjectPointList($ring);
		return 	['rings' => $list, 'numrings' => sizeof($list) ];
	}
	public function ProjectParts($arr, $arePolygons)
	{
		$list = [];
		if ($arePolygons)
			foreach($arr['parts'] as $part)
				$list[] = $this->ProjectPolygon($part);
		else
			foreach($arr['parts'] as $part)
				$list[] = $this->ProjectPointList($part);

		return 	['parts' => $list, 'numparts' => sizeof($list) ];
	}

}
