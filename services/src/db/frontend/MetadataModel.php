<?php

namespace helena\db\frontend;

use minga\framework\Arr;
use minga\framework\Profiling;
use helena\db\frontend\GeographyItemModel;
use helena\classes\App;

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

		$sql = "SELECT *, (SELECT MIN(wrk_id) FROM " . $this->draftPreffix . "work WHERE wrk_metadata_id = met_id) AS wrk_id
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
	public function GetDatasetMetadata($datasetId)
	{
		if ($datasetId == null)
			return null;
		Profiling::BeginTimer();
		$sql = "SELECT dat_caption FROM " . $this->draftPreffix . "dataset WHERE dat_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		// Trae las columnas
		$sql = "SELECT dco_id, dco_variable, dco_label FROM " . $this->draftPreffix . "dataset_column WHERE dco_dataset_id = ? ORDER BY dco_order";
		$columns = App::Db()->fetchAll($sql, array($datasetId));
		$ret['columns'] = $columns;
		// Trae las etiquetas
		$sql = "SELECT dco_id, dla_value, dla_caption FROM " . $this->draftPreffix . "dataset_label JOIN " . $this->draftPreffix . "dataset_column ON dco_id = dla_dataset_column_id WHERE dco_dataset_id = ? ORDER BY dco_order, dla_order";
		$values = App::Db()->fetchAll($sql, array($datasetId));
		$diccionary = Arr::FromSortedToKeyed($values, 'dco_id');
		// Completa etiquetas en columns
		foreach($columns as $column)
			 $column['values'] = Arr::SafeGet($diccionary, $column['dco_id'], null);
		// Listo
		Profiling::EndTimer();
		return $ret;
	}

}


