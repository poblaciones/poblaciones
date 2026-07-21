<?php

namespace helena\classes\writers\metrics;

use minga\framework\Str;

/**
 * Arma un proyecto QGIS (.qgz) que agrega el mismo shapefile una vez por cada indicador/variable
 * del dataset, con el estilo correspondiente ya aplicado. A diferencia del GeoPackage, un
 * shapefile no admite múltiples estilos embebidos conmutables desde una sola capa; este proyecto
 * reproduce esa experiencia agregando N instancias de capa (misma fuente de datos, sin duplicar
 * el archivo), que el usuario puede alternar prendiendo/apagando desde el panel de capas.
 *
 * IMPORTANTE: la estructura XML de un proyecto QGIS tiene muchos elementos opcionales que acá se
 * omiten a propósito (mapcanvas, snapping, layouts, etc.); QGIS 3.x completa los faltantes con
 * valores por defecto al abrir. Antes de usarlo en producción, conviene abrir un .qgz generado
 * por este código en QGIS y confirmar que carga sin errores y que el desplegable de capas
 * muestra los nombres/estilos esperados; si algo no coincide con lo esperado, comparar contra un
 * proyecto guardado manualmente desde la interfaz con capas equivalentes.
 */
class QgzProjectBuilder
{
	const GEOMETRY_TYPE_MAP = array(
		'fill'   => 'Polygon',
		'marker' => 'Point',
		'line'   => 'LineString',
	);

	const WGS84_SRS_XML =
		'<spatialrefsys nativeFormat="Wkt">'
		. '<wkt>GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AUTHORITY["EPSG","4326"]]</wkt>'
		. '<proj4>+proj=longlat +datum=WGS84 +no_defs</proj4>'
		. '<srsid>3452</srsid><srid>4326</srid><authid>EPSG:4326</authid>'
		. '<description>WGS 84</description><projectionacronym>longlat</projectionacronym>'
		. '<ellipsoidacronym>EPSG:7030</ellipsoidacronym><geographicflag>true</geographicflag>'
		. '</spatialrefsys>';

	/**
	 * @param array      $styles       salida de VariableStyleCollector::Collect
	 * @param string     $shpFileName  nombre de archivo del .shp (sin ruta), tal como queda dentro
	 *                                 del zip de salida, junto al .qgz
	 * @param string     $geometryKind 'fill' | 'marker' | 'line'
	 * @param array|null $bbox         ['minX','minY','maxX','maxY'] de los datos exportados, para
	 *                                 que el proyecto abra ya centrado; si es null (no se pudo
	 *                                 calcular), cae a la extensión mundial.
	 * @return string|null bytes del .qgz (zip), o null si no hay estilos que agregar
	 */
	public static function Build(array $styles, string $shpFileName, string $geometryKind, ?array $bbox = null): ?string
	{
		if (count($styles) === 0)
			return null;

		$layerTreeXml = '';
		$maplayersXml = '';
		foreach ($styles as $i => $style)
		{
			$layerId = self::GenerateLayerId($i);
			$checked = $style['isDefault'] ? 'Qt::Checked' : 'Qt::Unchecked';
			$name = self::Escape($style['styleName']);

			$layerTreeXml .= '<layer-tree-layer expanded="0" checked="' . $checked . '"'
				. ' id="' . $layerId . '" name="' . $name . '"/>';

			$maplayersXml .= self::BuildMapLayer($layerId, $style, $shpFileName, $geometryKind);
		}

		$qgsXml = self::BuildProjectXml($layerTreeXml, $maplayersXml, self::ResolveExtent($bbox));
		return self::ZipProject($qgsXml);
	}

	/**
	 * Agrega un margen del 10% del lado más largo (mínimo ~0.01°) para que la capa no quede
	 * pegada al borde del lienzo. Cae a la extensión mundial si no hay bbox o es degenerado.
	 */
	private static function ResolveExtent(?array $bbox): array
	{
		$world = array('xmin' => -180, 'ymin' => -90, 'xmax' => 180, 'ymax' => 90);
		if ($bbox === null)
			return $world;

		['minX' => $minX, 'minY' => $minY, 'maxX' => $maxX, 'maxY' => $maxY] = $bbox;
		if (!is_numeric($minX) || !is_numeric($minY) || !is_numeric($maxX) || !is_numeric($maxY))
			return $world;

		$width = $maxX - $minX;
		$height = $maxY - $minY;
		$margin = max($width, $height, 0.1) * 0.1;
		$margin = max($margin, 0.01);

		return array(
			'xmin' => $minX - $margin,
			'ymin' => $minY - $margin,
			'xmax' => $maxX + $margin,
			'ymax' => $maxY + $margin,
		);
	}

	private static function BuildMapLayer(string $layerId, array $style, string $shpFileName, string $geometryKind): string
	{
		$geomType = self::GEOMETRY_TYPE_MAP[$geometryKind] ?? 'Polygon';
		$name = self::Escape($style['styleName']);
		$abstract = self::Escape($style['description']);
		$datasource = self::Escape('./' . $shpFileName);

		return '<maplayer type="vector" geometry="' . $geomType . '" readOnly="0"'
			. ' hasScaleBasedVisibilityFlag="0" styleCategories="AllStyleCategories">'
			. '<id>' . $layerId . '</id>'
			. '<datasource>' . $datasource . '</datasource>'
			. '<layername>' . $name . '</layername>'
			. '<srs>' . self::WGS84_SRS_XML . '</srs>'
			. '<provider encoding="UTF-8">ogr</provider>'
			. $style['rendererXml']
			. '<layerOpacity>1</layerOpacity>'
			. '<abstract>' . $abstract . '</abstract>'
			. '</maplayer>';
	}

	// Versión declarada del proyecto: cuanto más vieja, menos QGIS instalados van a mostrar la
	// advertencia de "creado por una versión más nueva". 3.4 (Madeira, LTR) trae todo lo que
	// este builder usa (RuleRenderer, SimpleFill/SimpleMarker/SimpleLine), así que es un piso
	// razonable sin perder funcionalidad.
	const PROJECT_VERSION = '3.4.4-Madeira';

	private static function BuildProjectXml(string $layerTreeXml, string $maplayersXml, array $extent): string
	{
		return '<?xml version="1.0" encoding="UTF-8"?>'
			. '<qgis projectname="" version="' . self::PROJECT_VERSION . '">'
			. '<homePath path=""/>'
			. '<title>Indicadores</title>'
			. '<mapcanvas name="theMapCanvas">'
			. '<extent>'
			. '<xmin>' . self::FormatNumber($extent['xmin']) . '</xmin>'
			. '<ymin>' . self::FormatNumber($extent['ymin']) . '</ymin>'
			. '<xmax>' . self::FormatNumber($extent['xmax']) . '</xmax>'
			. '<ymax>' . self::FormatNumber($extent['ymax']) . '</ymax>'
			. '</extent>'
			. '<rotation>0</rotation>'
			. '<destinationsrs>' . self::WGS84_SRS_XML . '</destinationsrs>'
			. '</mapcanvas>'
			. '<projectCrs>' . self::WGS84_SRS_XML . '</projectCrs>'
			. '<layer-tree-group>' . $layerTreeXml . '</layer-tree-group>'
			. '<projectlayers>' . $maplayersXml . '</projectlayers>'
			. '</qgis>';
	}

	/**
	 * Un .qgz es un zip que contiene el proyecto .qgs (XML) con ese mismo nombre base.
	 */
	private static function ZipProject(string $qgsXml): string
	{
		$tmpDir = sys_get_temp_dir() . '/qgz_' . uniqid('', true);
		mkdir($tmpDir, 0777, true);
		$qgsPath = $tmpDir . '/project.qgs';
		file_put_contents($qgsPath, $qgsXml);

		$zipPath = $tmpDir . '/project.qgz';
		$zip = new \ZipArchive();
		$zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
		$zip->addFile($qgsPath, 'project.qgs');
		$zip->close();

		$bytes = file_get_contents($zipPath);
		unlink($qgsPath);
		unlink($zipPath);
		rmdir($tmpDir);
		return $bytes;
	}

	private static function GenerateLayerId(int $i): string
	{
		return 'indicador' . $i . '_' . substr(md5((string)$i . microtime()), 0, 8);
	}

	private static function FormatNumber(float $value): string
	{
		return rtrim(rtrim(sprintf('%.8F', $value), '0'), '.');
	}

	private static function Escape(string $value): string
	{
		return Str::CleanXmlString($value);
	}
}
