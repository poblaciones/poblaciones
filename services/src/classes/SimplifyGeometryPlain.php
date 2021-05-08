<?php

namespace helena\classes;

use minga\framework\PublicException;

class SimplifyGeometryPlain
{
	public $discardOversimplified = true;

  // Non recursive DouglasPeuckerSimplify PHP implementation

	// Transformado de https://github.com/mjaschen/phpgeo
	// Tiene removida la recursividad, no creas nuevos arrays en cada ciclo
	// y maneja adecuadamente polígonos cerrados.

	// Metros de tolerancia para la simplificación de DouglasPeucker (1 peor calidad, 6 mejor)
	private static $quality = 3.5;

	public function Simplify($geometry)
	{
		$tolerance = self::$quality;
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


	// simplification using optimized Douglas-Peucker algorithm with recursion elimination
	private static function RingDouglasPeuckerSimplify($points, $sqTolerance) {

		$len = count($points);
		$markers = array_fill(0, $len-1, null);
		$first = 0;
		$last = $len - 1;
		$stack = array();
		$newPoints = array();
		$index = null;

		$markers[$first] = $markers[$last] = 1;

		while ($last) {

			$maxSqDist = 0;

			for ($i = $first + 1; $i < $last; $i++) {
				$sqDist = self::getSqSegDist($points[$i], $points[$first], $points[$last]);

				if ($sqDist > $maxSqDist) {
					$index = $i;
					$maxSqDist = $sqDist;
				}
			}

			if ($maxSqDist > $sqTolerance) {
				$markers[$index] = 1;
				array_push($stack, $first, $index, $index, $last);
			}

			$last = array_pop($stack);
			$first = array_pop($stack);
		}

		//var_dump($markers, $points, $i);
		for ($i = 0; $i < $len; $i++) {
			if ($markers[$i]) $newPoints[] = $points[$i];
		}

		return $newPoints;
	}

	// square distance from a point to a segment
	private static function getSqSegDist($p, $p1, $p2) {
		$x = $p1[1];
		$y = $p1[0];
		$dx = $p2[1] - $x;
		$dy = $p2[0] - $y;

		if (intval($dx) !== 0 || intval($dy) !== 0) {

			$t = (($p[1] - $x) * $dx + ($p[0] - $y) * $dy) / ($dx * $dx + $dy * $dy);

			if ($t > 1) {
				$x = $p2[1];
				$y = $p2[0];

			} else if ($t > 0) {
				$x += $dx * $t;
				$y += $dy * $t;
			}
		}

		$dx = $p[1] - $x;
		$dy = $p[0] - $y;

		return $dx * $dx + $dy * $dy;
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