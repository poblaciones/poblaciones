<?php

namespace helena\classes;

use minga\framework\PublicException;

class SimplifyGeometry
{
	//  'WGS-84' => [ 'a' => 6378137.0, 'f'    => 298.257223563, getArithmeticMeanRadius => a * (1 - 1 / f / 3);
	// eq. radios  6378137
	// mean radius 6371008.7714151
  private const ellipsoidRadius = 6371008.7714151;
	private const PI = 3.1415926;
	public $discardOversimplified = true;

  // Non recursive DouglasPeuckerSimplify PHP implementation

	// Transformado de https://github.com/mjaschen/phpgeo
	// Tiene removida la recursividad, no creas nuevos arrays en cada ciclo
	// y maneja adecuadamente polígonos cerrados.

	// Metros de tolerancia para la simplificación de DouglasPeucker (1 peor calidad, 6 mejor)
	private static $quality = [ 1 => 1550, 2 => 450, 3 => 300, 4 => 200, 5 => 55, 6 => 35 ];

	public function Simplify($geometry, $rzoom)
	{
		$tolerance = self::$quality[$rzoom];
		switch(strtoupper($geometry['type']))
		{
			case "POINT":
			case "MULTIPOINT":
				return $geometry;
			case "LINESTRING":
				$coordinates = $this->RingDouglasPeuckerSimplify($geometry['coordinates'], $tolerance);
				break;
			case "MULTILINESTRING":
				$coordinates = $this->MultiLineStringSimplify($geometry['coordinates'], $tolerance);
				break;
			case "POLYGON":
				$coordinates = $this->PolygonSimplify($geometry['coordinates'], $tolerance);
				break;
			case "MULTIPOLYGON":
				$coordinates = $this->MultiPolygonSimplify($geometry['coordinates'], $tolerance);
				break;
			default:
				throw new \Exception("Tipo de geometría no reconocida.");
		}
		if ($coordinates === null)
			return null;
		else
			return ['type' => $geometry['type'], 'coordinates' => $coordinates];
	}

	private function RingDouglasPeuckerSimplify($ls, $tolerance)
	{
		$lineSize = sizeof($ls);
		if ($lineSize < 4) return $ls;

		$lastPoint = $lineSize - 1;

		$ranges = [];
		$results = [];

		// Inicializa ambas tablas
		$results[] = $ls[0];
		if ($this->IsClosed($ls))
		{
			$ranges[] = [1, $lastPoint];
			$results[] = $ls[1];
		}
		else
		{
			$ranges[] = [0, $lastPoint];
		}
		while(sizeof($ranges) > 0)
		{
			$range = array_pop($ranges);
			$start = $range[0];
			$end = $range[1];

			if ($end - $start > 1)
				$outMost = $this->getOutMostVertexPoint($ls, $start, $end, $tolerance);
			else
				$outMost = null;

		if ($outMost !== null)
			{
				$ranges[] = [$outMost, $end];
				$ranges[] = [$start, $outMost];
			}
			else
			{
				$results[] = $ls[$end];
			}
		}

		// Con dos puntos y un cierre, evita dar un polígono inválido
		if ($this->IsClosed($ls) && sizeof($results) === 3)
			return $this->TreatOverSimplified($ls, $results);
		else
			return $results;
	}

	private function TreatOverSimplified($ls, $results)
	{
		// Arma un triángulo con el más alejado
		$middlePoint = $this->getOutMostVertexPoint($ls, 1, sizeof($ls) - 1, -1);
		if ($middlePoint)
		{
			array_splice($results, 1, 0, [$ls[$middlePoint]]);
			return $results;
		}
		if ($this->discardOversimplified)
			return null;
		else
			return $ls;
	}

	private function IsClosed($ls)
	{
		return ($ls[0][0] === $ls[sizeof($ls) - 1][0] && $ls[0][1] === $ls[sizeof($ls) - 1][1]);
	}

	public function MultiPolygonSimplify($coordinates, $threshold)
	{
		$res = [];
		foreach($coordinates as $polygonCoordinates)
		{
			$simplified = $this->PolygonSimplify($polygonCoordinates, $threshold);
			if ($simplified !== null)
				$res[] = $simplified;
	  }
		if (sizeof($res) > 0)
			return $res;
		else
			return null;
	}

	public function LineStringSimplify($coordinates, $threshold)
	{
		return $this->RingDouglasPeuckerSimplify($coordinates, $threshold);
	}

	public function MultiLineStringSimplify($coordinates, $threshold)
	{
		$res = [];
		foreach($coordinates as $lineStringCoordinates)
		{
			$simplified = $this->RingDouglasPeuckerSimplify($lineStringCoordinates, $threshold);
			if ($simplified !== null)
				$res[] = $simplified;
	  }
		if (sizeof($res) > 0)
			return $res;
		else
			return null;
	}

	public  function PolygonSimplify($coordinates, $threshold)
	{
		$res = [];
		for($n = 0; $n < sizeof($coordinates); $n++)
		{
			$ringsCoordinates = $coordinates[$n];
			$simplified = $this->RingDouglasPeuckerSimplify($ringsCoordinates, $threshold);
			if ($simplified !== null)
				$res[] = $simplified;
			else if ($n === 0)
				return null;
	  }
		return $res;
	}

	private function getOutMostVertexPoint($coordinates, $start, $end, $tolerance)
	{
		$distanceMax = 0;
		$index = 0;

		for($n = $start + 1; $n < $end; $n++)
		{
			$distance = $this->getPerpendicularDistance($coordinates[$n],
																	$coordinates[$start], $coordinates[$end]);
      if ($distance > $distanceMax)
			{
          $index = $n;
          $distanceMax = $distance;
      }
    }
		if ($distanceMax > $tolerance || ($tolerance === -1 && $distanceMax > 0))
			return $index;
		else
			return null;
	}

	private function getPerpendicularDistance($point, $start, $end)
  {
	  $firstLinePointLat = $this->deg2radLatitude($start[1]);
    $firstLinePointLng = $this->deg2radLongitude($start[0]);

    $firstLinePointX = self::ellipsoidRadius * cos($firstLinePointLng) * sin($firstLinePointLat);
    $firstLinePointY = self::ellipsoidRadius * sin($firstLinePointLng) * sin($firstLinePointLat);
    $firstLinePointZ = self::ellipsoidRadius * cos($firstLinePointLat);

    $secondLinePointLat = $this->deg2radLatitude($end[1]);
    $secondLinePointLng = $this->deg2radLongitude($end[0]);

    $secondLinePointX = self::ellipsoidRadius * cos($secondLinePointLng) * sin($secondLinePointLat);
    $secondLinePointY = self::ellipsoidRadius * sin($secondLinePointLng) * sin($secondLinePointLat);
    $secondLinePointZ = self::ellipsoidRadius * cos($secondLinePointLat);

    $pointLat = $this->deg2radLatitude($point[1]);
    $pointLng = $this->deg2radLongitude($point[0]);

    $pointX = self::ellipsoidRadius * cos($pointLng) * sin($pointLat);
    $pointY = self::ellipsoidRadius * sin($pointLng) * sin($pointLat);
    $pointZ = self::ellipsoidRadius * cos($pointLat);

    $normalizedX = $firstLinePointY * $secondLinePointZ - $firstLinePointZ * $secondLinePointY;
    $normalizedY = $firstLinePointZ * $secondLinePointX - $firstLinePointX * $secondLinePointZ;
    $normalizedZ = $firstLinePointX * $secondLinePointY - $firstLinePointY * $secondLinePointX;

    $length = sqrt($normalizedX * $normalizedX + $normalizedY * $normalizedY + $normalizedZ * $normalizedZ);

    if ($length > 0) {
        $normalizedX /= $length;
        $normalizedY /= $length;
        $normalizedZ /= $length;
    }

    $thetaPoint = $normalizedX * $pointX + $normalizedY * $pointY + $normalizedZ * $pointZ;

    $length = sqrt($pointX * $pointX + $pointY * $pointY + $pointZ * $pointZ);

    if ($length > 0)
        $thetaPoint /= $length;

    $distance = abs((self::PI / 2) - acos($thetaPoint));

    return $distance * self::ellipsoidRadius;
  }

  /**
    * @param float $latitude
    *
    * @return float
    */
  protected function deg2radLatitude($latitude)
  {
      return deg2rad(90 - $latitude);
  }

  /**
    * @param float $longitude
    *
    * @return float
    */
  protected function deg2radLongitude($longitude)
  {
    if ($longitude > 0) {
        return deg2rad($longitude);
    }

    return deg2rad($longitude + 360);
  }
}