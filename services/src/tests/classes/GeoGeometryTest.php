<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\GeoGeometry;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas de GeoGeometry (reemplazo de phayes/geoPHP). No requieren base de datos.
 * Los valores esperados fueron generados con geoPHP sobre las mismas entradas.
 */
class GeoGeometryTest extends TestCase
{
	private static function dbBinary(string $wkt): string
	{
		return pack('V', 4326) . GeoGeometry::WktToWkb($wkt);
	}

	public function wktProvider() : array
	{
		return [
			'punto' => ['POINT (-58.38 -34.6)', 'Point', [-58.38, -34.6]],
			'línea' => ['LINESTRING (0 0, 1 1, 2 0)', 'LineString', [[0.0, 0.0], [1.0, 1.0], [2.0, 0.0]]],
			'polígono con hueco' => ['POLYGON ((0 0, 10 0, 10 10, 0 0), (2 2, 3 2, 3 3, 2 2))', 'Polygon',
				[[[0.0, 0.0], [10.0, 0.0], [10.0, 10.0], [0.0, 0.0]], [[2.0, 2.0], [3.0, 2.0], [3.0, 3.0], [2.0, 2.0]]]],
			'multipunto' => ['MULTIPOINT ((1 2), (3 4))', 'MultiPoint', [[1.0, 2.0], [3.0, 4.0]]],
			'multilínea' => ['MULTILINESTRING ((0 0, 1 1), (2 2, 3 3))', 'MultiLineString',
				[[[0.0, 0.0], [1.0, 1.0]], [[2.0, 2.0], [3.0, 3.0]]]],
			'multipolígono' => ['MULTIPOLYGON (((0 0, 1 0, 1 1, 0 0)), ((5 5, 6 5, 6 6, 5 5)))', 'MultiPolygon',
				[[[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 0.0]]], [[[5.0, 5.0], [6.0, 5.0], [6.0, 6.0], [5.0, 5.0]]]]],
		];
	}

	/**
	 * @dataProvider wktProvider
	 */
	public function testWktRoundTrip(string $wkt, string $type, array $coordinates) : void
	{
		$g = GeoGeometry::FromWkt($wkt);
		$this->assertSame($type, $g->GetType());
		$this->assertSame($coordinates, $g->AsArray());
		$this->assertSame($wkt, $g->ToWkt());
		$this->assertSame(json_encode(['type' => $type, 'coordinates' => $coordinates]), $g->ToGeoJson());
	}

	/**
	 * @dataProvider wktProvider
	 */
	public function testWkbRoundTrip(string $wkt, string $type, array $coordinates) : void
	{
		$wkb = GeoGeometry::WktToWkb($wkt);
		$back = GeoGeometry::FromWkb($wkb);
		$this->assertSame($type, $back->GetType());
		$this->assertSame($coordinates, $back->AsArray());
		$this->assertSame($wkb, $back->ToWkb());
	}

	public function testWkbPuntoLittleEndianConocido() : void
	{
		// POINT(1 2) NDR: valor canónico del estándar
		$this->assertSame('0101000000000000000000f03f0000000000000040', bin2hex(GeoGeometry::WktToWkb('POINT (1 2)')));
	}

	public function testWkbBigEndian() : void
	{
		$wkb = hex2bin('00000000013FF00000000000004000000000000000');
		$this->assertSame([1.0, 2.0], GeoGeometry::FromWkb($wkb)->AsArray());
	}

	public function testWkbConZIsoYEwkbDescartaZ() : void
	{
		$iso = "\x01" . pack('V', 1001) . pack('e3', 1, 2, 3);
		$this->assertSame([1.0, 2.0], GeoGeometry::FromWkb($iso)->AsArray());
		$ewkb = "\x01" . pack('V', 0xA0000001) . pack('V', 4326) . pack('e3', 5, 6, 7);
		$this->assertSame([5.0, 6.0], GeoGeometry::FromWkb($ewkb)->AsArray());
	}

	public function testWktConZYSrid() : void
	{
		$this->assertSame([1.0, 2.0], GeoGeometry::FromWkt('SRID=4326;POINT Z (1 2 3)')->AsArray());
		$this->assertSame('POINT (1 2)', GeoGeometry::FromWkt('point(1 2)')->ToWkt());
		$this->assertSame([[1.0, 2.0], [3.0, 4.0]], GeoGeometry::FromWkt('MULTIPOINT (1 2, 3 4)')->AsArray());
	}

	public function testVacios() : void
	{
		$p = GeoGeometry::FromWkt('POINT EMPTY');
		$this->assertTrue($p->IsEmpty());
		$this->assertSame('POINT EMPTY', $p->ToWkt());
		$this->assertNull($p->GetBBox());
		$this->assertSame('POLYGON EMPTY', GeoGeometry::FromWkt('POLYGON EMPTY')->ToWkt());
		// Un punto vacío sobrevive al ciclo WKB (NaN NaN)
		$this->assertTrue(GeoGeometry::FromWkb($p->ToWkb())->IsEmpty());
	}

	public function testBBox() : void
	{
		$g = GeoGeometry::FromWkt('POLYGON ((-3 1, 5 1, 5 9, -3 1), (0 2, 1 2, 1 3, 0 2))');
		$this->assertSame(['maxy' => 9.0, 'miny' => 1.0, 'maxx' => 5.0, 'minx' => -3.0], $g->GetBBox());
		$m = GeoGeometry::FromWkt('MULTIPOLYGON (((0 0, 1 0, 1 1, 0 0)), ((5 5, 6 5, 6 7, 5 5)))');
		$this->assertSame(['maxy' => 7.0, 'miny' => 0.0, 'maxx' => 6.0, 'minx' => 0.0], $m->GetBBox());
	}

	public function testDbBinaryReduceMultiConUnSoloComponente() : void
	{
		$g = GeoGeometry::FromDbBinary(self::dbBinary('MULTIPOLYGON (((0 0, 1 0, 1 1, 0 0)))'));
		$this->assertSame('Polygon', $g->GetType());
		$this->assertSame([[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 0.0]]], $g->AsArray());
	}

	public function testDbBinaryMantieneMultiConVariosComponentes() : void
	{
		$g = GeoGeometry::FromDbBinary(self::dbBinary('MULTIPOLYGON (((0 0, 1 0, 1 1, 0 0)), ((5 5, 6 5, 6 6, 5 5)))'));
		$this->assertSame('MultiPolygon', $g->GetType());
		$this->assertCount(2, $g->AsArray());
	}

	public function testDbBinaryColeccionHomogeneaSeConvierteEnMulti() : void
	{
		$g = GeoGeometry::FromDbBinary(self::dbBinary('GEOMETRYCOLLECTION (POINT (1 2), POINT (3 4))'));
		$this->assertSame('MultiPoint', $g->GetType());
		$this->assertSame([[1.0, 2.0], [3.0, 4.0]], $g->AsArray());
	}

	public function testDbBinaryColeccionMixtaSeMantiene() : void
	{
		$g = GeoGeometry::FromDbBinary(self::dbBinary('GEOMETRYCOLLECTION (POINT (1 2), LINESTRING (0 0, 1 1))'));
		$this->assertSame('GeometryCollection', $g->GetType());
		$this->assertSame('GEOMETRYCOLLECTION (POINT (1 2), LINESTRING (0 0, 1 1))', $g->ToWkt());
	}

	public function testDbBinaryColeccionVaciaDevuelveNull() : void
	{
		$this->assertNull(GeoGeometry::FromDbBinary(self::dbBinary('GEOMETRYCOLLECTION EMPTY')));
	}

	public function invalidWktProvider() : array
	{
		return [['POLYGON ((1 2, 3'], ['FOO (1 2)'], ['POINT (a b)'], [''], ['POINT (1 2) basura']];
	}

	/**
	 * @dataProvider invalidWktProvider
	 */
	public function testWktInvalidoLanzaExcepcion(string $wkt) : void
	{
		$this->expectException(\InvalidArgumentException::class);
		GeoGeometry::FromWkt($wkt);
	}

	public function invalidWkbProvider() : array
	{
		return [
			'vacío' => [''],
			'truncado' => ["\x01\x01\x00\x00\x00\x00\x00"],
			'orden inválido' => ["\x05\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"],
			'contador gigante' => ["\x01\x03\x00\x00\x00\xff\xff\xff\x7f"],
			'tipo desconocido' => ["\x01\x63\x00\x00\x00\x00\x00\x00\x00"],
		];
	}

	/**
	 * @dataProvider invalidWkbProvider
	 */
	public function testWkbInvalidoLanzaExcepcion(string $wkb) : void
	{
		$this->expectException(\InvalidArgumentException::class);
		GeoGeometry::FromWkb($wkb);
	}

	public function testDbBinaryTruncadoLanzaExcepcion() : void
	{
		$this->expectException(\InvalidArgumentException::class);
		GeoGeometry::FromDbBinary("\x00\x00");
	}
}
