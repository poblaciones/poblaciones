<?php declare(strict_types=1);

namespace helena\tests\spatialdb;


class CentroidFunctionsTest extends SpatialTestBase
{
	public function testValidPoints()
	{
		$points = $this->getPoints();
		$this->evaluateSet($points, "ST_Centroid", "[Centroid]", true);
	}

	public function testValidPolygons()
	{
		$polygons = $this->getPolygons();
		$this->evaluateSet($polygons, "ST_Centroid", "[Centroid]", true);
	}

	public function testValidLineStrings()
	{
		$lineStrings = $this->getLineStrings();
		$this->evaluateSet($lineStrings, "LineStringCentroid", "[Centroid]", true);
	}

	public function testValidMultiLineStrings()
	{
		$lineStrings = $this->getMultiLineStrings();
		$this->evaluateSet($lineStrings, "MultiLineStringCentroid", "[Centroid]", true);
	}

	public function testValidMultiPolygons()
	{
		$multiPolygons = $this->getMultiPolygons();
		$this->evaluateSet($multiPolygons, "ST_Centroid", "[Centroid]", true);
	}

}

