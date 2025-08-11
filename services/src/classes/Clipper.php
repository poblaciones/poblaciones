<?php

namespace helena\classes;

// based on: https://github.com/aperture-sh/charger/blob/master/clipper/src/main/kotlin/io/marauder/charged/Clipper.kt

class Clipper
{
	function clipCollectionByEnvelope($fc, $envelope, $enlarge = true)
	{
		$offsetX = ($enlarge ? ($envelope->Max->Lon - $envelope->Min->Lon) * .01 : 0);
		$offsetY = ($enlarge ? ($envelope->Max->Lat - $envelope->Min->Lat) * .01 : 0);

		return $this->clipCollection(
			$fc,
			GeoJson::TrimNumber($envelope->Min->Lon - $offsetX),
			GeoJson::TrimNumber($envelope->Max->Lon + $offsetX),
			GeoJson::TrimNumber($envelope->Min->Lat - $offsetY),
			GeoJson::TrimNumber($envelope->Max->Lat + $offsetY)
		);
	}

	function clipCollection($fc, $k1, $k2, $k3, $k4)
	{
		$ret = array();
		$filtered = [];
		foreach ($fc as $feature) {
			$f = $this->clipFeature($feature, $k1, $k2, $k3, $k4);
			if ($f)
				$filtered[] = $f;
		}
		return $filtered;
	}

	private function clipFeature($f, $k1, $k2, $k3, $k4)
	{
		$feature = array(
			'type' => 'Feature',
			'id' => $f['id'],
			'geometry' => array('type' => $f['geometry']['type'])
		);

		if (isset($f['properties']))
			$feature['properties'] = $f['properties'];

		if ($f['geometry']['type'] === 'Point') {
			$points = $this->filterPoints([$f['geometry']['coordinates']], $k1, $k2, $k3, $k4);
			if (sizeof($points) === 0)
				return null;
			$feature['geometry']['coordinates'] = $points[0];
			return $feature;
		} else if ($f['geometry']['type'] === 'Multipoint') {
			$points = $this->filterPoints($f['geometry']['coordinates'], $k1, $k2, $k3, $k4);
			if (sizeof($points) === 0)
				return null;
			$feature['geometry']['coordinates'] = $points;
			return $feature;
		} else if ($f['geometry']['type'] === 'Linestring') {
			$lines = $this->clipLine($this->clipLine([$f['geometry']['coordinates']], $k1, $k2, 0), $k3, $k4, 1);
			if (sizeof($lines) === 0)
				return null;
			$feature['geometry']['coordinates'] = $lines[0];
			return $feature;
		} else if ($f['geometry']['type'] === 'Multilinestring') {
			$lines = $this->clipLine($this->clipLine($f['geometry']['coordinates'], $k1, $k2, 0), $k3, $k4, 1);
			if (sizeof($lines) === 0)
				return null;
			$feature['geometry']['coordinates'] = $lines;
			return $feature;
		} else if ($f['geometry']['type'] === 'Polygon') {
			$lines = $this->clipPolygon($this->clipPolygon($f['geometry']['coordinates'], $k1, $k2, 0), $k3, $k4, 1);
			if (sizeof($lines) === 0)
				return null;
			$feature['geometry']['coordinates'] = $lines;
			return $feature;
		} else if ($f['geometry']['type'] === 'Multipolygon') {
			$coordinates = [];
			foreach ($f['geometry']['coordinates'] as $polygon) {
				$polygon = $this->clipPolygon($this->clipPolygon($polygon, $k1, $k2, 0), $k3, $k4, 1);
				if (sizeof($polygon) > 0)
					$coordinates[] = $polygon;
			}
			if (sizeof($coordinates) === 0)
				return null;
			$feature['geometry']['coordinates'] = $coordinates;
			return $feature;
		} else {
			$feature['geometry']['coordinates'] = $f['geometry']['coordinates'];
			return $feature;
		}
	}

	private function filterPoints($coordinates, $scaleK1, $scaleK2, $scaleK3, $scaleK4)
	{
		$ret = [];
		foreach ($coordinates as $coordinate) {
			if (
				!($coordinate[0] > $scaleK2 || $coordinate[0] < $scaleK1 ||
					$coordinate[1] > $scaleK4 || $coordinate[1] < $scaleK3)
			)
				$ret[] = $coordinate;
		}
		return $ret;
	}

	private function clipPolygon($g, $k1, $k2, $axis)
	{
		$polygon = [];
		foreach ($g as $ring) {
			$slice = [];
			for ($i = 0; $i < sizeof($ring) - 1; $i++) {
				if ($ring[$i][$axis] < $k1) {
					if ($ring[$i + 1][$axis] > $k2) {
						$this->addIntersectTo($slice, $ring, $i, $k1, $axis);
						$this->addIntersectTo($slice, $ring, $i, $k2, $axis);
						// ---|-----|-->
					} else if ($ring[$i + 1][$axis] >= $k1) {
						$this->addIntersectTo($slice, $ring, $i, $k1, $axis);
						// ---|-->  |
					}
				} else if ($ring[$i][$axis] > $k2) {
					if ($ring[$i + 1][$axis] < $k1) {
						$this->addIntersectTo($slice, $ring, $i, $k2, $axis);
						$this->addIntersectTo($slice, $ring, $i, $k1, $axis);
						// <--|-----|---
					} else if ($ring[$i + 1][$axis] <= $k2) {
						$this->addIntersectTo($slice, $ring, $i, $k2, $axis);
						// |  <--|---
					}
				} else {
					$slice[] = $ring[$i];
					if ($ring[$i + 1][$axis] < $k1) {
						$this->addIntersectTo($slice, $ring, $i, $k1, $axis);
						// <--|---  |
					} else if ($ring[$i + 1][$axis] > $k2) {
						$this->addIntersectTo($slice, $ring, $i, $k2, $axis);
						// |  ---|-->
					}
					// | --> |
				}
			}
			if (sizeof($slice) > 0) {
				$a = $ring[sizeof($ring) - 1];
				if ($a[$axis] >= $k1 && $a[$axis] <= $k2)
					$slice[] = $a;
				if (
					sizeof($slice) > 0 &&
					($slice[0][0] != $slice[sizeof($slice) - 1][0]
						|| $slice[0][1] != $slice[sizeof($slice) - 1][1])
				) {
					$slice[] = $slice[0];
				}
				$polygon[] = $slice;
			}
		}
		return $polygon;
	}

	private function clipLine($g, $k1, $k2, $axis)
	{
		$lines = [];
		foreach ($g as $line) {
			$slice = [];
			for ($i = 0; $i < sizeof($line) - 1; $i++) {
				if ($line[$i][$axis] < $k1) {
					if ($line[$i + 1][$axis] > $k2) {
						$this->addIntersectTo($slice, $line, $i, $k1, $axis);
						$this->addIntersectTo($slice, $line, $i, $k2, $axis);
						// ---|-----|-->
					} else if ($line[$i + 1][$axis] >= $k1) {
						$this->addIntersectTo($slice, $line, $i, $k1, $axis);
						// ---|-->  |
					}
				} else if ($line[$i][$axis] > $k2) {
					if ($line[$i + 1][$axis] < $k1) {
						$this->addIntersectTo($slice, $line, $i, $k2, $axis);
						$this->addIntersectTo($slice, $line, $i, $k1, $axis);
						// <--|-----|---
					} else if ($line[$i + 1][$axis] <= $k2) {
						$this->addIntersectTo($slice, $line, $i, $k2, $axis);
						$slice[] = $this->intersect($line[$i], $line[$i + 1], $k2, $axis);
						// |  <--|---
					}
				} else {
					$slice[] = $line[$i];
					if ($line[$i + 1][$axis] < $k1)
						$this->addIntersectTo($slice, $line, $i, $k1, $axis);
					// <--|---  |
					elseif ($line[$i + 1][$axis] > $k2)
						$this->addIntersectTo($slice, $line, $i, $k2, $axis);
					// |  ---|-->
					elseif ($i === sizeof($line) - 2)
						$slice[] = $line[$i + 1];
					// | --> |
				}
			}
			if (sizeof($slice) > 0)
				$lines[] = $slice;
		}
		return $lines;
	}

	private function addIntersectTo(&$slice, $ring, $i, $k1, $axis)
	{
		$slice[] = $this->intersect($ring[$i], $ring[$i + 1], $k1, $axis);
	}

	private function intersect($a, $b, $clip, $axis)
	{
		if ($axis === 0) {
			return [
				$clip, GeoJson::TrimNumber(
					($clip - $a[0]) * ($b[1] - $a[1]) / ($b[0] - $a[0]) + $a[1]
				)
			];
		} else {
			return [
				GeoJson::TrimNumber(
					($clip - $a[1]) * ($b[0] - $a[0]) / ($b[1] - $a[1]) + $a[0]
				),
				$clip
			];
		}
	}
}