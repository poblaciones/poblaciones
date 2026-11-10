<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\services\wfs\WfsFieldNames;
use helena\services\wfs\WfsGml;
use helena\services\wfs\WfsRequest;
use helena\services\wfs\WfsTypeName;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas de las partes de WFS que dependen del protocolo y no de la base de datos:
 * orden de ejes, nombres de capa y de propiedades, y GML.
 */
class WfsTest extends TestCase
{
	protected function tearDown(): void
	{
		$_GET = [];
	}

	public function bboxProvider() : array
	{
		return [
			'sin CRS: latitud, longitud' => ['-32,-65,-29,-61', [-65.0, -32.0, -61.0, -29.0]],
			'URN EPSG:4326: latitud, longitud' => ['-32,-65,-29,-61,urn:ogc:def:crs:EPSG::4326', [-65.0, -32.0, -61.0, -29.0]],
			'EPSG:4326 corto: longitud, latitud' => ['-65,-32,-61,-29,EPSG:4326', [-65.0, -32.0, -61.0, -29.0]],
			'CRS84: longitud, latitud' => ['-65,-32,-61,-29,urn:ogc:def:crs:OGC:1.3:CRS84', [-65.0, -32.0, -61.0, -29.0]],
		];
	}

	/** @dataProvider bboxProvider */
	public function testBboxSeDevuelveSiempreEnOrdenLongitudLatitud(string $bbox, array $esperado)
	{
		$_GET = ['BBOX' => $bbox];
		$this->assertSame($esperado, WfsRequest::GetBbox());
	}

	public function testBboxInvalidoOAusenteEsNulo()
	{
		$_GET = ['BBOX' => '1,2,x,4'];
		$this->assertNull(WfsRequest::GetBbox());
		$_GET = [];
		$this->assertNull(WfsRequest::GetBbox());
	}

	public function testLosParametrosNoDistinguenMayusculas()
	{
		$_GET = ['typenames' => 'pob:a-1-b', 'ResultType' => 'HITS', 'OUTPUTFORMAT' => 'Application/JSON'];
		$this->assertSame('pob:a-1-b', WfsRequest::GetTypeNames());
		$this->assertTrue(WfsRequest::IsHits());
		$this->assertSame('application/json', WfsRequest::GetOutputFormat());
	}

	public function testTypeNameAceptaPrefijoYLista()
	{
		$lista = WfsTypeName::ParseRequestedList('pob:nbi-2022-radios, b_3_v_9');
		$this->assertCount(2, $lista);
		$this->assertSame('nbi-2022-radios', $lista[0]->LocalName);
		$this->assertSame(WfsTypeName::TYPE_BOUNDARY, $lista[1]->Type);
		$this->assertSame(9, $lista[1]->BoundaryVersionId);
	}

	public function testTagQueEmpiezaConDigitoGeneraNombreDeElementoXmlValido()
	{
		$nombre = WfsTypeName::ForMetricFriendly('2010_nbi', '2022', 'Radios');
		$this->assertSame('m_2010_nbi-2022-radios', $nombre);
		$this->assertSame('m_2010_nbi', WfsTypeName::Parse($nombre)->MetricTag);
	}

	public function testNombresDePropiedadesSonValidosYUnicos()
	{
		$variables = [
			['Id' => 1, 'ShortName' => 'Hogares con NBI (%)'],
			['Id' => 2, 'ShortName' => 'Hogares con NBI (%)'],
			['Id' => 3, 'ShortName' => '2da variable'],
			['Id' => 4, 'ShortName' => 'name'],
			['Id' => 5],
		];
		$nombres = WfsFieldNames::ForVariables($variables);
		$this->assertSame('hogares_con_nbi', $nombres[1]);
		$this->assertSame('hogares_con_nbi_2', $nombres[2]);
		$this->assertSame('v_2da_variable', $nombres[3]);
		$this->assertSame('name_4', $nombres[4]);
		$this->assertSame('v5', $nombres[5]);
	}

	public function testGmlInvierteEjesYConservaHuecos()
	{
		$poligono = ['type' => 'Polygon', 'coordinates' => [
			[[-58.0, -34.0], [-57.0, -34.0], [-57.0, -33.0], [-58.0, -34.0]],
			[[-57.5, -33.9], [-57.4, -33.9], [-57.4, -33.8], [-57.5, -33.9]],
		]];
		$gml = WfsGml::Geometry($poligono, 'f.1');
		$this->assertStringContainsString('srsName="urn:ogc:def:crs:EPSG::4326"', $gml);
		$this->assertStringContainsString('<gml:posList>-34 -58 -34 -57 -33 -57 -34 -58</gml:posList>', $gml);
		$this->assertStringContainsString('<gml:interior>', $gml);
	}

	public function testEscapeQuitaCaracteresInvalidosEnXml()
	{
		$this->assertSame('a &amp; &lt;b&gt; &quot;c&quot;', WfsGml::Escape("a & <b> \"c\"\x01"));
	}
}
