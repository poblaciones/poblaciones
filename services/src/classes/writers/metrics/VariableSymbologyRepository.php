<?php

namespace helena\classes\writers\metrics;

use helena\classes\App;

/**
 * Consultas de sólo lectura sobre el modelo de indicadores (metric / metric_version_level /
 * variable / symbology / variable_value_label) asociado a un dataset. Soporta tanto las tablas
 * publicadas como las de borrador (draft_), según el origen de la descarga.
 */
class VariableSymbologyRepository
{
	private $prefix;

	public function __construct(bool $fromDraft)
	{
		$this->prefix = $fromDraft ? 'draft_' : '';
	}

	/**
	 * Indicadores (metric) para los que este dataset actúa como level, a través de
	 * metric_version_level. Un mismo dataset puede servir a más de un indicador.
	 */
	public function GetMetricVersionLevels(int $datasetId): array
	{
		$sql = "SELECT mvl_id, mtr_id, mtr_caption, ST_AsText(mvl_extents) AS mvl_extents_wkt
						FROM {$this->prefix}metric_version_level
						JOIN {$this->prefix}metric_version ON mvl_metric_version_id = mvr_id
						JOIN {$this->prefix}metric ON mvr_metric_id = mtr_id
						WHERE mvl_dataset_id = ?
						ORDER BY mtr_caption";
		return App::Db()->fetchAll($sql, array($datasetId));
	}

	/**
	 * Variables de un metric_version_level, con los datos de su symbology y el nombre técnico
	 * ("variable") de cada dataset_column involucrada en su fórmula (dato, normalización,
	 * brecha y columna de corte).
	 */
	public function GetVariables(int $metricVersionLevelId): array
	{
		$sql = "SELECT variable.*,
							vsy_cut_mode,
							cutcolumn.dco_variable AS cut_column_variable,
							cutcolumn.dco_format AS cut_column_format,
							data.dco_variable AS mvv_data_column_variable,
							normalization.dco_variable AS mvv_normalization_column_variable,
							gap_data.dco_variable AS mvv_gap_data_column_variable,
							gap_normalization.dco_variable AS mvv_gap_normalization_column_variable
						FROM {$this->prefix}variable
						JOIN {$this->prefix}symbology ON mvv_symbology_id = vsy_id
						LEFT JOIN {$this->prefix}dataset_column data ON data.dco_id = mvv_data_column_id
						LEFT JOIN {$this->prefix}dataset_column normalization ON normalization.dco_id = mvv_normalization_column_id
						LEFT JOIN {$this->prefix}dataset_column gap_data ON gap_data.dco_id = mvv_gap_data_column_id
						LEFT JOIN {$this->prefix}dataset_column gap_normalization ON gap_normalization.dco_id = mvv_gap_normalization_column_id
						LEFT JOIN {$this->prefix}dataset_column cutcolumn ON cutcolumn.dco_id = vsy_cut_column_id
						WHERE mvv_metric_version_level_id = ?
						ORDER BY mvv_order, mvv_id";
		return App::Db()->fetchAll($sql, array($metricVersionLevelId));
	}

	/**
	 * Categorías o puntos de corte de una variable, en el orden en que deben evaluarse.
	 */
	public function GetValueLabels(int $variableId): array
	{
		$sql = "SELECT vvl_caption, vvl_value, vvl_fill_color, vvl_line_color, vvl_visible
						FROM {$this->prefix}variable_value_label
						WHERE vvl_variable_id = ?
						ORDER BY vvl_order, vvl_id";
		return App::Db()->fetchAll($sql, array($variableId));
	}
}
