<?php

namespace helena\classes;

use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Profiling;

class GeoJson
{
	const PRECISION = 6;
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;

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

	public static function ProjectEnvelope($env)
	{
		return new \helena\entities\frontend\geometries\Envelope(self::ProjectCoordinate($env->Min), self::ProjectCoordinate($env->Max));
	}

	public static function ProjectCoordinate($coord)
	{
		$point = [$coord->Lon, $coord->Lat];
		$prj = self::ProjectLocation($point);
		return new \helena\entities\frontend\geometries\Coordinate($prj[1], $prj[0]);
	}

	public static function ProjectRecursive($arr, $projectedEnvelope = null)
	{
		if (sizeof($arr) == 0) return $arr;

		$ret = array();
		$arePoints = !is_array($arr[0][0]);
		if ($arePoints)
		{
			$last = null;
			foreach($arr as $a)
			{
				$p = self::ProjectLocation($a, $projectedEnvelope);
				if ($last === null || $last[0] !== $p[0] || $last[1] !== $p[1])
				{
					$ret[] = $p;
					$last = $p;
				}
			}
		}
		else
			foreach($arr as $a)
			{
				$ret[] = self::ProjectRecursive($a, $projectedEnvelope);
			}
		return $ret;
	}

	public function GenerateFromBinary($results, $getCentroids = false, $project = false, $hasCaption = false, $projectEnvelope = null)
	{
		Profiling::BeginTimer();
		$geojson = array(
			'type' => 'FeatureCollection',
			'features' => array(),
			'projected' => $project
		);
		$features = array();
		$projectedEnvelope = ($project ? self::ProjectEnvelope($projectEnvelope) : null);
		foreach($results as $res)
		{
			$feature = $this->GenerateFeatureFromBinary($res, true, $getCentroids, $project, $hasCaption, $projectedEnvelope);
			if ($feature != null)
			{
				$features[] = $feature;
			}
		}
		$geojson['features'] = $features;
		Profiling::EndTimer();
		return $geojson;
	}
	public function GenerateFeatureFromBinary($row, $useFID = false, $getCentroids = false, $project = false, $hasCaption = false, $projectedEnvelope = null)
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

		if (isset($row['dense']) && $row['dense'])
			$ret['dense'] = 1;


		if ($getCentroids || $hasCaption)
		{
			$properties = [];
			if ($getCentroids)
					$properties['centroid'] = self::TrimLocation(array($row['Lat'], $row['Lon']));
			if ($hasCaption)
			{
				$properties['Description'] = $row['Caption'];
			}
		$ret['properties'] = $properties;
		}
		if ($project)
			$coordinates = self::ProjectRecursive($geometry->asArray(), $projectedEnvelope);
		else
			$coordinates = $geometry->asArray(); //self::ReallocRecursive($geometry->asArray());

		$ret['geometry'] = array(
					'type' => $geometry->getGeomType(),
					'coordinates' => $coordinates
					);
		return $ret;
	}

	private static function ProjectLocation($point, $projectedEnvelope = null)
	{
		if (sizeof($point) !== 2) throw new PublicException('La coordenada no se encuentra completa.');
		$lng = $point[0];
		$lat = $point[1];

		$siny = min(max(sin($lat * (pi() / 180)), -0.9999), 0.9999);
		$x = 128 + $lng * (256 / 360);
		$y = 128 + 0.5 * log((1 + $siny) / (1 - $siny)) * -(256 / (2 * pi()));

		if ($projectedEnvelope)
			return self::scaleToBoundedPixel($x, $y, $projectedEnvelope);
		else
			return array($x, $y);
	}

	private static function scaleToBoundedPixel($x, $y, $projectedEnvelope) {
			$xRange = $projectedEnvelope->Max->Lon - $projectedEnvelope->Min->Lon;
			$yRange = $projectedEnvelope->Max->Lat - $projectedEnvelope->Min->Lat;
			return [ round(($x - $projectedEnvelope->Min->Lon) / $xRange * self::TILE_PRJ_SIZE),
							 round(($y - $projectedEnvelope->Min->Lat) / $yRange * self::TILE_PRJ_SIZE) ];
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
		elseif(Str::StartsWith($text, "MULTIPOINT"))
			return "Multipoint";
		elseif(Str::StartsWith($text, "POINT"))
			return "Point";
		else
			throw new PublicException('Tipo geográfico no soportado');
	}

	function GeoTextToArray($text)
	{
		if(Str::StartsWith($text, "MULTI"))
		{
			$text = str_replace("MULTIPOINT", "", $text);
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
