<?php declare(strict_types=1);

namespace helena\tests\spatialdb;

class AreaFunctionsTest extends SpatialTestBase
{

	public function testAreaPolygons2()
	{
		$polygons = $this->getPolygons();
		$this->evaluateSet($polygons, "GeometryAreaSphere", "[Area]");
		$this->evaluateSet($polygons, "PolygonAreaSphere", "[Area]");
	}

	public function testAreaPoints()
	{
		$points = $this->getPoints();
		$this->evaluateSet($points, "GeometryAreaSphere", 0);
	}

	public function testAreaLineStrings()
	{
		$lineStrings = $this->getLineStrings();
		$this->evaluateSet($lineStrings, "GeometryAreaSphere", 0);
	}

	public function testAreaMultiLineStrings()
	{
		$multiPolygons = $this->getMultiLineStrings();
		$this->evaluateSet($multiPolygons, "GeometryAreaSphere", 0);
	}

	public function testAreaMultiPolygons()
	{
		$multiPolygons = $this->getMultiPolygons();
		$this->evaluateSet($multiPolygons, "GeometryAreaSphere", "[Area]");
		$this->evaluateSet($multiPolygons, "MultiPolygonAreaSphere", "[Area]");
	}
}

