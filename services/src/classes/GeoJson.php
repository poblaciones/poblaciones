<?php

namespace helena\classes;

use minga\framework\Str;
use minga\framework\PublicException;

use Location\Processor\Polyline\SimplifyDouglasPeucker;
use Location\Line;
use Location\Coordinate;
use Location\Polyline;

class GeoJson
{
	const PRECISION = 6;

	public function Generate($results)
	{
		$geojson = array(
			'type' => 'FeatureCollection',
			'features' => array()
		);
		foreach($results as $res)
		{
			$feature = array(
				'type' => 'Feature',
				'properties' => array(
					'name' => $res['name'],
					'color' => $this->GetColor(),
				),
				'geometry' => array(
					'type' => $this->GeoType($res['value']),
					'coordinates' => array($this->GeoTextToArray($res['value'])),
				),
			);
			array_push($geojson['features'], $feature);
		}
		return $geojson;
	}
	public static function TrimLocation($arr)
	{
		return array(self::TrimNumber($arr[0]), self::TrimNumber($arr[1]));
	}
	public static function TrimNumber($x)
	{
		return round($x, self::PRECISION);
	}
	public static function TrimRecursive($arr)
	{
		if (is_array($arr))
		{
			$ret = array();
			foreach($arr as $a)
			{
				$ret[] = self::TrimRecursive($a);
			}
			return $ret;
		}
		else
		{
			return self::TrimNumber($arr);
		}
	}
	public static function ReallocRecursive($arr)
	{
			$size = sizeof($arr);
			$ret = new \SplFixedArray($size);
			for($n = 0; $n < $size; $n++)
			{
				$val = $arr[$n];
				if (is_array($val))
				{
					$ret[$n] = self::ReallocRecursive($val);
				}
				else
				{
					$ret[$n] = $val;
				}
			}
			return $ret;
	}
	public static function ProjectRecursive($arr)
	{
		if (sizeof($arr) == 0) return $arr;

		if (is_array($arr[0]))
		{
			$ret = array();
			foreach($arr as $a)
			{
				$ret[] = self::ProjectRecursive($a);
			}
			return $ret;
		}
		else
		{
			return self::ProjectLocation($arr);
		}
	}
	public function GenerateFromBinary($results, $getCentroids = false, $project = false)
	{
		$geojson = array(
			'type' => 'FeatureCollection',
			'features' => array(),
			'projected' => $project
		);
		$features = array();
		foreach($results as $res)
		{
			$feature = $this->GenerateFeatureFromBinary($res, true, $getCentroids, $project);
			if ($feature != null)
			{
				$features[] = $feature;
			}
		}
		$geojson['features'] = $features;
		return $geojson;
	}
	public function GenerateFeatureFromBinary($row, $useFID = false, $getCentroids = false, $project = false)
	{
		if (array_key_exists('valueClipped', $row))
			$geometry = $row['valueClipped'];
		else
		{
			$data = unpack("@4/a*", $row['value']);
			$geometry = \geoPHP::load($data, 'wkb');
		}
		if ($geometry == null)
			return null;

		$ret = array(
				'type' => 'Feature');
		if ($useFID)
			$ret['id'] = $row['FID'];
		if ($getCentroids)
		{
			$ret['properties'] = array('centroid' => self::TrimLocation(array($row['Lat'], $row['Lon'])));
		}
		if ($project)
			$coordinates = self::ProjectRecursive($geometry->asArray());
		else
			$coordinates = $geometry->asArray(); //self::ReallocRecursive($geometry->asArray());

		$ret['geometry'] = array(
					'type' => $geometry->getGeomType(),
					'coordinates' => $coordinates
					);
		return $ret;
	}
	/*
	private static function simplify($geometry)
	{
		// FALTA IMPLEMENTAR LINE, MULTIPOLYGON y MULTILINE
		$distance = 0.25; // Equivalente a 5 aprox.

		$coordinates = $geometry->asArray();
		if ($geometry->getGeomType() == 'Polygon')
		{
			//echo sizeof($coordinates[0]);
			$init = sizeof($coordinates[0]);
			$simplifier = new SimplifyDouglasPeucker($distance); //0.3
			$polyline = new Polyline();
			for($n = 1; $n < sizeof($coordinates[0]); $n++) {
				$point = $coordinates[0][$n];
				$polyline->addPoint(new Coordinate($point[1], $point[0]));
			}
			$simplifiedLine = $simplifier->simplify($polyline);
			//echo ' ' . sizeof($polyline->getPoints()) . ' <br>';
			$newArr = array();
			foreach ($simplifiedLine->getPoints() as $point) {
				$newArr[] = array($point->getLng(), $point->getLat());
			}
			// repone el último para cerrarlo
			$newArr[] = $newArr[0];
//			$compress =  sizeof($newArr) / $init;
			$coordinates[0] = $newArr;
			//echo ' ' . sizeof($newArr) . ' <br>';
		}
		else
		{
			echo $geometry->getGeomType();
		}
		return $coordinates;
	}
	*/
	private static function ProjectLocation($point)
	{
		if (sizeof($point) !== 2) throw new PublicException('La coordenada no se encuentra completa.');
		$lng = $point[0];
		$lat = $point[1];

		$siny = min(max(sin($lat * (pi() / 180)), -0.9999), 0.9999);
		$x = 128 + $lng * (256 / 360);
		$y = 128 + 0.5 * log((1 + $siny) / (1 - $siny)) * -(256 / (2 * pi()));
		return array($x, $y);
	}

	public function GenerateFromEllipsis($circle)
	{
		$geojson = array(
			'type' => 'FeatureCollection',
			'features' => array()
		);
		$xR = $circle->Radius->Lon;
		$yR = $circle->Radius->Lat;
		$coords = array();
		for($i = 0; $i < 360; $i += 5)
		{
	    $t = deg2rad($i);
			$x = $circle->Center->Lon + $xR * cos($t);
			$y = $circle->Center->Lat +$yR * sin($t);
			$coords[] = [$x, $y];
		}
		$coords[] = $coords[0];
		$feature = array(
			'type' => 'Feature',
			'id' => 'circleClipping',
			'geometry' => array(
				'type' => 'Polygon',
				'coordinates' => [ $coords]
			)
		);
		array_push($geojson['features'], $feature);
		return $geojson;
	}

	function GetColor()
	{
		$rand = rand(0, 2);
		if($rand == 1)
			return "red";
		elseif($rand == 2)
			return "blue";
		else
			return "green";
	}

	function GeoType($text)
	{
		if(Str::StartsWith($text, "MULTIPOLYGON"))
			return "Multipolygon";
		elseif(Str::StartsWith($text, "POLYGON"))
			return "Polygon";
		if(Str::StartsWith($text, "MULTILINESTRING"))
			return "Multilinestring";
		elseif(Str::StartsWith($text, "LINESTRING"))
			return "Linestring";
		elseif(Str::StartsWith($text, "POINT"))
			return "Point";
		else
			throw new PublicException('Tipo geográfico no soportado');
	}

	function GeoTextToArray($text)
	{
		if(Str::StartsWith($text, "MULTI"))
		{
			$text = str_replace("MULTIPOLYGON", "", $text);
			$text = str_replace("MULTILINESTRING", "", $text);
			$pols = explode("),(", $text);
			$super = array();
			foreach($pols as $pol)
			{
				$ret = array();
				$items = $this->GetItems($pol);
				foreach($items as $item)
				{
					$parts = explode(" ", $item);
					$ret[] = array((double)$parts[0], (double)$parts[1]);
				}
				$super[] = $ret;
			}
			return $super;
		}
		else
		{
			$text = str_replace("POLYGON", "", $text);
			$text = str_replace("LINESTRING", "", $text);
			$ret = array();
			$items = $this->GetItems($text);
			foreach($items as $item)
			{
				$parts = explode(" ", $item);
				$ret[] = array((double)$parts[0], (double)$parts[1]);
			}

			return $ret;
		}
	}

	function GetItems($text)
	{
		$text = str_replace("(", "", $text);
		$text = str_replace(")", "", $text);
		return explode(",", $text);
	}

}
