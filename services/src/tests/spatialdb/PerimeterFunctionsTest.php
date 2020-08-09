<?php declare(strict_types=1);

namespace helena\tests\spatialdb;


class PerimeterFunctionsTest extends SpatialTestBase
{
	public function testPerimeterPoints()
	{
		$points = $this->getPoints();
		$this->evaluateSet($points, "GeometryPerimeterSphere", 0);
	}

	public function testPerimeterLineStrings()
	{
		$lineStrings = $this->getLineStrings();
		$this->evaluateSet($lineStrings, "GeometryPerimeterSphere", "[Perimeter]");
	}

	public function testPerimeterMultiLineStrings()
	{
		$multiLineStrings = $this->getMultiLineStrings();
		$this->evaluateSet($multiLineStrings, "GeometryPerimeterSphere", "[Perimeter]");
		$this->evaluateSet($multiLineStrings, "MultiLineStringPerimeterSphere", "[Perimeter]");
	}

	public function testPerimeterPolygons()
	{
		$polygons = $this->getPolygons();
		$this->evaluateSet($polygons, "GeometryPerimeterSphere", "[Perimeter]");
		$this->evaluateSet($polygons, "PolygonPerimeterSphere", "[Perimeter]");
	}


	public function testPerimeterMultiPolygons()
	{
		$multiPolygons = $this->getMultiPolygons();
		$this->evaluateSet($multiPolygons, "GeometryPerimeterSphere", "[Perimeter]");
		$this->evaluateSet($multiPolygons, "MultiPolygonPerimeterSphere", "[Perimeter]");
	}
}

