<?php

namespace helena\classes\writers\metrics;

use minga\framework\Log;
use minga\framework\PublicException;

/**
 * Embebe en un GeoPackage la simbología que la plataforma de indicadores tiene definida para
 * el dataset exportado, como estilos de QGIS (tabla layer_styles): un estilo por cada variable
 * de cada indicador que usa este dataset como level, a través de metric_version_level.
 *
 * Un error al resolver una variable puntual no debe impedir la descarga del archivo de datos:
 * se descarta esa variable (o, ante un problema estructural, se descarta el embebido completo)
 * y se registra en el log.
 */
class MetricsMetadataExporter
{
	// Deben coincidir con GpkgWriter::TABLE_NAME / GEOM_COLUMN.
	const TABLE_NAME = 'features';
	const GEOM_COLUMN = 'geom';

	public static function Export(\SQLite3 $db, int $datasetId, bool $fromDraft, array $cols, string $geometryKind): void
	{
		try
		{
			$repository = new VariableSymbologyRepository($fromDraft);
			$levels = $repository->GetMetricVersionLevels($datasetId);
			if (count($levels) === 0)
				return;

			$columnMap = self::BuildColumnMap($cols);
			self::CreateLayerStylesTable($db);

			$defaultAssigned = false;
			foreach ($levels as $level)
			{
				$variables = $repository->GetVariables((int)$level['mvl_id']);
				foreach ($variables as $variable)
				{
					try
					{
						$wantsDefault = !$defaultAssigned && !empty($variable['mvv_is_default']);
						$saved = self::ExportVariable($db, $repository, $level, $variable, $columnMap, $geometryKind, $wantsDefault);
						if ($saved && $wantsDefault)
							$defaultAssigned = true;
					}
					catch (\Exception $e)
					{
						Log::LogException($e, true);
					}
				}
			}
		}
		catch (\Exception $e)
		{
			Log::LogException($e, true);
		}
	}

	private static function BuildColumnMap(array $cols): array
	{
		$map = array();
		foreach ($cols as $col)
		{
			if (isset($col['variable']) && isset($col['effectiveVariable']))
				$map[$col['variable']] = $col['effectiveVariable'];
		}
		return $map;
	}

	private static function ExportVariable(\SQLite3 $db, VariableSymbologyRepository $repository, array $level,
		array $variable, array $columnMap, string $geometryKind, bool $wantsDefault): bool
	{
		$cutMode = $variable['vsy_cut_mode'];
		$valueLabels = $repository->GetValueLabels((int)$variable['mvv_id']);

		if ($cutMode === 'V')
		{
			$cutVariable = $variable['cut_column_variable'];
			if ($cutVariable === null || !isset($columnMap[$cutVariable]))
				return false; // columna de corte fuera del export
			$expr = '"' . $columnMap[$cutVariable] . '"';
			$isText = QmlRendererBuilder::ResolveIsTextComparison($variable['cut_column_format']);
		}
		else if ($cutMode === 'S')
		{
			$expr = null;
			$isText = false;
		}
		else if ($cutMode === 'J' || $cutMode === 'T' || $cutMode === 'M')
		{
			$expr = VariableFormula::Build($variable, $columnMap);
			if ($expr === null)
				return false; // fórmula fuera de alcance o columna no exportada
			$isText = false;
		}
		else
			return false; // CutMode no reconocido

		if ($cutMode !== 'S' && count($valueLabels) === 0)
			return false;

		$rendererXml = QmlRendererBuilder::Build($variable['mvv_caption'], $cutMode, $expr, $isText, $valueLabels, $geometryKind);
		if ($rendererXml === null)
			return false;

		$styleName = $level['mtr_caption'] . ' - ' . $variable['mvv_caption'];
		$description = $variable['mvv_legend'] !== null ? $variable['mvv_legend'] : '';

		self::InsertStyle($db, $styleName, $rendererXml, $description, $wantsDefault);
		return true;
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
