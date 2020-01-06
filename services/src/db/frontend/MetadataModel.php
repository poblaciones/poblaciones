<?php

namespace helena\db\frontend;

use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\App;
use helena\services\backoffice\publish\snapshots\Variable;

class MetadataModel extends BaseModel
{
	private $draftPreffix = false;

	public function __construct($fromDraft = false)
	{
		$this->tableName = 'metadata';
		$this->idField = 'met_id';
		$this->captionField = '';
		$this->draftPreffix = ($fromDraft ? 'draft_' : '');
	}

	public function GetMetadataFileByFileId($metadataId, $fileId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId, $fileId);

		$sql = "SELECT * FROM " . $this->draftPreffix . "metadata_file WHERE mfi_metadata_id = ? AND mfi_file_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetadataByWorkId($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT m.* FROM " . $this->draftPreffix . "work w JOIN " . $this->draftPreffix . "metadata m ON m.met_id = w.wrk_metadata_id WHERE wrk_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorkIdByMetadataId($metadataId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId);

		$sql = "SELECT wrk_id FROM " . $this->draftPreffix . "work WHERE wrk_metadata_id = ? LIMIT 1";

		$ret = App::Db()->fetchScalarIntNullable($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetadata($metadataId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId);
		if ($this->draftPreffix)
			$extents = '';
		else
			$extents = 'AsText(met_extents) Extents, ';

		$sql = "SELECT *, " . $extents . "(SELECT MIN(wrk_id) FROM " . $this->draftPreffix . "work WHERE wrk_metadata_id = met_id) AS wrk_id
							FROM " . $this->draftPreffix . "metadata
							LEFT JOIN " . $this->draftPreffix . "institution ON met_institution_id = ins_id
							LEFT JOIN " . $this->draftPreffix . "contact ON met_contact_id = con_id
								WHERE met_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetadataSources($metadataId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId);

		$sql = "SELECT * FROM " . $this->draftPreffix . "metadata_source
		          INNER JOIN " . $this->draftPreffix . "source ON msc_source_id = src_id
							LEFT JOIN " . $this->draftPreffix . "institution ON src_institution_id = ins_id
							LEFT JOIN " . $this->draftPreffix . "contact ON src_contact_id = con_id
							WHERE msc_metadata_id = ? ORDER BY msc_order";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
	public function GetMetadataFiles($metadataId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId);

		$sql = "SELECT mfi_order, mfi_id Id, mfi_caption Caption, mfi_web Web, mfi_file_id FileId
									FROM " . $this->draftPreffix . "metadata_file WHERE mfi_metadata_id = ? ORDER BY mfi_order, mfi_id";
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetAccessLink($workId)
	{
		if (!$workId) return null;
		Profiling::BeginTimer();
		$params = array($workId);
		$sql = "SELECT wrk_access_link FROM " . $this->draftPreffix . "work WHERE wrk_id = ? LIMIT 1";
		$ret = App::Db()->fetchScalar($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetDatasetMetadata($datasetId)
	{
		if ($datasetId == null)
			return null;

		Profiling::BeginTimer();

		// Trae atributos generales
		$sql = "SELECT dat_caption FROM " . $this->draftPreffix . "dataset WHERE dat_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		// Trae columnas e indicadores
		$ret['columns'] = $this->GetDatasetColumnsMetadata($datasetId);
		$ret['metrics'] = $this->GetDatasetMetricsMetadata($datasetId);

		// Listo
		Profiling::EndTimer();
		return $ret;
	}

	private function GetDatasetMetricsMetadata($datasetId)
	{
		Profiling::BeginTimer();
		$metricToVariableJoin = $this->draftPreffix . "metric
								JOIN " . $this->draftPreffix . "metric_version ON mvr_metric_id = mtr_id
								JOIN " . $this->draftPreffix . "metric_version_level ON mvl_metric_version_id = mvr_id
								JOIN " . $this->draftPreffix . "variable ON mvv_metric_version_level_id = mvl_id ";
		// Trae las variables
		$sql = "select mtr_id, mtr_caption, mvr_caption, mvv_id, mvv_caption,
								c1.dco_variable AS mvv_data_column_variable, c1.dco_caption AS mvv_data_column_caption,
								c2.dco_variable AS mvv_normalization_column_variable, c2.dco_caption AS mvv_normalization_column_caption,
								mvv_normalization, mvv_normalization_scale, mvv_normalization_column_id,
								mvv_data, mvv_data_column_id, geo_caption, geo_revision
								FROM " . $metricToVariableJoin . "
								JOIN " . $this->draftPreffix . "dataset ON mvl_dataset_id = dat_id
								LEFT JOIN geography ON dat_geography_id = geo_id
								LEFT JOIN " . $this->draftPreffix . "dataset_column c1 ON c1.dco_id = mvv_data_column_id
								LEFT JOIN " . $this->draftPreffix . "dataset_column c2 ON c2.dco_id = mvv_normalization_column_id
								WHERE mvl_dataset_id = ? ORDER BY mtr_caption, mtr_id, mvr_caption, mvv_caption, geo_revision";
		$variables = App::Db()->fetchAll($sql, array($datasetId));
		// Completa los nombres de variables
		foreach($variables as &$variable)
		{
			$variable['mvv_formula'] = Variable::FormulaToString($variable);
		}
		// Trae las categorías
		$sql = "select mvv_id, vvl_caption, vvl_fill_color
								FROM " . $metricToVariableJoin . "
								JOIN " . $this->draftPreffix . "variable_value_label ON vvl_variable_id = mvv_id
								WHERE mvl_dataset_id = ? ORDER BY mvv_id, vvl_order";

		$values = App::Db()->fetchAll($sql, array($datasetId));
		$diccionary = Arr::FromSortedToKeyed($values, 'mvv_id');
		// Completa categorías
		foreach($variables as &$variable)
			 $variable['values'] = Arr::SafeGet($diccionary, $variable['mvv_id'], null);
		// Agrupa por metric
		$metrics = Arr::FromSortedToKeyed($variables, 'mtr_id');

		Profiling::EndTimer();
		return $metrics;
	}

	private function GetDatasetColumnsMetadata($datasetId)
	{
		Profiling::BeginTimer();
		// Trae las columnas
		$sql = "SELECT dco_id, dco_variable, dco_label FROM " . $this->draftPreffix . "dataset_column WHERE dco_dataset_id = ? ORDER BY dco_order";
		$columns = App::Db()->fetchAll($sql, array($datasetId));
		// Trae las etiquetas
		$sql = "SELECT dco_id, dla_value, dla_caption FROM " . $this->draftPreffix . "dataset_column_value_label JOIN " . $this->draftPreffix . "dataset_column ON dco_id = dla_dataset_column_id WHERE dco_dataset_id = ? ORDER BY dco_order, dla_order, dla_value";
		$values = App::Db()->fetchAll($sql, array($datasetId));
		$diccionary = Arr::FromSortedToKeyed($values, 'dco_id');
		// Completa etiquetas en columns
		foreach($columns as &$column)
			 $column['values'] = Arr::SafeGet($diccionary, $column['dco_id'], null);
		Profiling::EndTimer();
		return $columns;
	}
}


