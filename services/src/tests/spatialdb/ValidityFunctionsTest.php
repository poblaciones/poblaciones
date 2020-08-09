<?php declare(strict_types=1);

namespace helena\tests\spatialdb;

class ValidityFunctionsTest extends SpatialTestBase
{
	public function testValidPoints()
	{
		$points = $this->getPoints();
		$this->evaluateSet($points, "GeometryIsValid", 100);
	}

	public function testValidPolygons()
	{
		$polygons = $this->getPolygons();
		$this->evaluateSet($polygons, "GeometryIsValid", 100);
		$this->evaluateSet($polygons, "PolygonIsValid", 100);
	}

	public function testValidLineStrings()
	{
		$lineStrings = $this->getLineStrings();
		$this->evaluateSet($lineStrings, "GeometryIsValid", 100);
	}

	public function testValidMultiLineStrings()
	{
		$lineStrings = $this->getMultiLineStrings();
		$this->evaluateSet($lineStrings, "GeometryIsValid", 100);
	}

	public function testValidMultiPolygons()
	{
		$multiPolygons = $this->getMultiPolygons();
		$this->evaluateSet($multiPolygons, "GeometryIsValid", 100);
		$this->evaluateSet($multiPolygons, "MultiPolygonIsValid", 100);
	}
}

