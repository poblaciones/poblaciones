<?php

namespace helena\services\wfs;

// GML 3.2 de una colección de entidades.
//
// Las coordenadas se declaran con el URN EPSG::4326, cuyo orden de ejes es latitud,
// longitud (al revés que GeoJSON). Toda geometría recibida en orden GeoJSON [lon, lat]
// se invierte acá, y en ningún otro lugar.
class WfsGml
{
	public static function Escape($text)
	{
		$text = preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u', '', (string) $text);
		return htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8');
	}

	// $features: [['id' => string, 'geometry' => array|null, 'properties' => [nombre => valor]]]
	public static function Collection($localTypeName, $features, $numberMatched, $includeMembers)
	{
		$ns = WfsConfig::GetWfsNamespaceUri();
		$pfx = WfsConfig::NAMESPACE_PREFIX;

		$members = '';
		$returned = 0;
		if ($includeMembers)
		{
			$returned = count($features);
			foreach ($features as $feature)
				$members .= self::Member($pfx, $localTypeName, $feature);
		}

		return '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
			. '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"'
			. ' xmlns:gml="http://www.opengis.net/gml/3.2"'
			. ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
			. ' xmlns:' . $pfx . '="' . self::Escape($ns) . '"'
			. ' numberMatched="' . (int) $numberMatched . '" numberReturned="' . $returned . '"'
			. ' timeStamp="' . gmdate('Y-m-d\TH:i:s\Z') . '">' . "\n"
			. $members
			. "</wfs:FeatureCollection>\n";
	}

	private static function Member($pfx, $localTypeName, $feature)
	{
		$tag = $pfx . ':' . $localTypeName;
		$id = self::Escape($feature['id']);

		$xml = "  <wfs:member>\n    <" . $tag . ' gml:id="' . $id . "\">\n";
		if ($feature['geometry'] !== null)
		{
			$geometry = self::Geometry($feature['geometry'], $feature['id'] . '.geom');
			if ($geometry !== '')
				$xml .= '      <' . $pfx . ':' . WfsFieldNames::GEOMETRY . '>' . $geometry . '</' . $pfx . ':' . WfsFieldNames::GEOMETRY . ">\n";
		}
		foreach ($feature['properties'] as $name => $value)
			$xml .= self::Property($pfx, $name, $value);
		$xml .= '    </' . $tag . ">\n  </wfs:member>\n";
		return $xml;
	}

	private static function Property($pfx, $name, $value)
	{
		$tag = $pfx . ':' . $name;
		if ($value === null)
			return '      <' . $tag . ' xsi:nil="true"/>' . "\n";
		if (is_bool($value))
			$value = ($value ? 'true' : 'false');
		return '      <' . $tag . '>' . self::Escape($value) . '</' . $tag . ">\n";
	}

	// Recibe un arreglo GeoJSON [lon, lat].
	public static function Geometry($geometry, $id)
	{
		$srs = WfsConfig::CRS_URN;
		$coordinates = $geometry['coordinates'];

		switch ($geometry['type'])
		{
			case 'Point':
				return '<gml:Point srsName="' . $srs . '" gml:id="' . $id . '"><gml:pos>' . self::Pair($coordinates) . '</gml:pos></gml:Point>';

			case 'MultiPoint':
				$members = '';
				foreach ($coordinates as $i => $point)
					$members .= '<gml:pointMember><gml:Point gml:id="' . $id . '.p' . $i . '"><gml:pos>' . self::Pair($point) . '</gml:pos></gml:Point></gml:pointMember>';
				return '<gml:MultiPoint srsName="' . $srs . '" gml:id="' . $id . '">' . $members . '</gml:MultiPoint>';

			case 'LineString':
				return '<gml:LineString srsName="' . $srs . '" gml:id="' . $id . '"><gml:posList>' . self::PosList($coordinates) . '</gml:posList></gml:LineString>';

			case 'MultiLineString':
				$members = '';
				foreach ($coordinates as $i => $line)
					$members .= '<gml:curveMember><gml:LineString gml:id="' . $id . '.l' . $i . '"><gml:posList>' . self::PosList($line) . '</gml:posList></gml:LineString></gml:curveMember>';
				return '<gml:MultiCurve srsName="' . $srs . '" gml:id="' . $id . '">' . $members . '</gml:MultiCurve>';

			case 'Polygon':
				return '<gml:Polygon srsName="' . $srs . '" gml:id="' . $id . '">' . self::Rings($coordinates) . '</gml:Polygon>';

			case 'MultiPolygon':
				$members = '';
				foreach ($coordinates as $i => $rings)
					$members .= '<gml:surfaceMember><gml:Polygon gml:id="' . $id . '.s' . $i . '">' . self::Rings($rings) . '</gml:Polygon></gml:surfaceMember>';
				return '<gml:MultiSurface srsName="' . $srs . '" gml:id="' . $id . '">' . $members . '</gml:MultiSurface>';
		}
		return '';
	}

	private static function Rings($rings)
	{
		$xml = '';
		foreach ($rings as $i => $ring)
		{
			if ($i === 0)
				$xml .= '<gml:exterior><gml:LinearRing><gml:posList>' . self::PosList($ring) . '</gml:posList></gml:LinearRing></gml:exterior>';
			else
				$xml .= '<gml:interior><gml:LinearRing><gml:posList>' . self::PosList($ring) . '</gml:posList></gml:LinearRing></gml:interior>';
		}
		return $xml;
	}

	private static function Pair($coordinate)
	{
		return $coordinate[1] . ' ' . $coordinate[0];
	}

	private static function PosList($coordinates)
	{
		$pairs = [];
		foreach ($coordinates as $coordinate)
			$pairs[] = self::Pair($coordinate);
		return implode(' ', $pairs);
	}
}
