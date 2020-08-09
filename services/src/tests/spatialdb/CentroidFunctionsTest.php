<?php declare(strict_types=1);

namespace helena\tests\spatialdb;


class CentroidFunctionsTest extends SpatialTestBase
{
	public function testValidPoints()
	{
		$points = $this->getPoints();
		$this->evaluateSet($points, "GeometryCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($points, "GeometryCentroid", "[Centroid_lat]", "ST_Y");
	}

	public function testValidPolygons()
	{
		$polygons = $this->getPolygons();
		$this->evaluateSet($polygons, "GeometryCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($polygons, "GeometryCentroid", "[Centroid_lat]", "ST_Y");
	}

	public function testValidLineStrings()
	{
		$lineStrings = $this->getLineStrings();
		$this->evaluateSet($lineStrings, "GeometryCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($lineStrings, "GeometryCentroid", "[Centroid_lat]", "ST_Y");

		$this->evaluateSet($lineStrings, "LineStringCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($lineStrings, "LineStringCentroid", "[Centroid_lat]", "ST_Y");
	}

	public function testValidMultiLineStrings()
	{
		$lineStrings = $this->getMultiLineStrings();
		$this->evaluateSet($lineStrings, "GeometryCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($lineStrings, "GeometryCentroid", "[Centroid_lat]", "ST_Y");

		$this->evaluateSet($lineStrings, "MultiLineStringCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($lineStrings, "MultiLineStringCentroid", "[Centroid_lat]", "ST_Y");
	}

	public function testValidMultiPolygons()
	{
		$multiPolygons = $this->getMultiPolygons();
		$this->evaluateSet($multiPolygons, "GeometryCentroid", "[Centroid_lon]", "ST_X");
		$this->evaluateSet($multiPolygons, "GeometryCentroid", "[Centroid_lat]", "ST_Y");
	}

}

