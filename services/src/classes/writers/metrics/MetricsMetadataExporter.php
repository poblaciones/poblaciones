<?php

namespace helena\classes\writers\metrics;

use minga\framework\Log;
use minga\framework\PublicException;

/**
 * Embebe en un GeoPackage, como estilos de QGIS (tabla layer_styles), la simbología ya resuelta
 * por el collector correspondiente al tipo de descarga: un estilo por cada variable de cada
 * indicador que usa el dataset como level (VariableStyleCollector), o el estilo por tipo de
 * límite (BoundaryStyleCollector). Quién arma ese array es responsabilidad de cada Writer;
 * esta clase sólo lo graba.
 *
 * Ambos collectors comparten QmlRendererBuilder, también usado por el proyecto QGIS (.qgz) que
 * acompaña al export de Shapefile.
 */
class MetricsMetadataExporter
{
	// Deben coincidir con GpkgWriter::TABLE_NAME / GEOM_COLUMN.
	const TABLE_NAME = 'features';
	const GEOM_COLUMN = 'geom';

	/**
	 * @param array $styles salida de VariableStyleCollector::Collect o BoundaryStyleCollector::Collect
	 */
	public static function Export(\SQLite3 $db, array $styles): void
	{
		if (count($styles) === 0)
			return;

		try
		{
			self::CreateLayerStylesTable($db);
			foreach ($styles as $style)
				self::InsertStyle($db, $style['styleName'], $style['rendererXml'], $style['description'], $style['isDefault']);
		}
		catch (\Exception $e)
		{
			Log::LogException($e, true);
		}
	}

	private static function CreateLayerStylesTable(\SQLite3 $db): void
	{
		$db->exec('
			CREATE TABLE IF NOT EXISTS layer_styles (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				f_table_catalog TEXT,
				f_table_schema TEXT,
				f_table_name TEXT,
				f_geometry_column TEXT,
				styleName TEXT,
				styleQML TEXT,
				styleSLD TEXT,
				useAsDefault BOOLEAN,
				description TEXT,
				owner TEXT,
				ui TEXT,
				update_time DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		');
	}

	private static function InsertStyle(\SQLite3 $db, string $styleName, string $rendererXml, string $description, bool $isDefault): void
	{
		$qml = QmlRendererBuilder::WrapQml($rendererXml);
		$stmt = $db->prepare('INSERT INTO layer_styles
			(f_table_catalog, f_table_schema, f_table_name, f_geometry_column, styleName, styleQML, useAsDefault, description)
			VALUES (\'\', \'\', ?, ?, ?, ?, ?, ?)');
		if ($stmt === false)
			throw new PublicException('Error al preparar INSERT en layer_styles: ' . $db->lastErrorMsg());

		$stmt->bindValue(1, self::TABLE_NAME, SQLITE3_TEXT);
		$stmt->bindValue(2, self::GEOM_COLUMN, SQLITE3_TEXT);
		$stmt->bindValue(3, $styleName, SQLITE3_TEXT);
		$stmt->bindValue(4, $qml, SQLITE3_TEXT);
		$stmt->bindValue(5, $isDefault ? 1 : 0, SQLITE3_INTEGER);
		$stmt->bindValue(6, $description, SQLITE3_TEXT);
		$stmt->execute();
	}
}
