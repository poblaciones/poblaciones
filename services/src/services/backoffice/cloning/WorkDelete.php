<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
use helena\classes\DbFile;
use helena\entities\backoffice as entities;
use helena\db\backoffice\WorkModel;
use helena\services\backoffice\DatasetService;
use minga\framework\Profiling;
use helena\caches\WorkPermissionsCache;
use  helena\services\backoffice\FileService;

class WorkDelete
{
	private	$workId;
	private $state;

	public function __construct($state)
	{
		$this->state = $state;
		$this->workId = $this->state->Get('workId');
	}
	public function DeleteWork()
	{
		Profiling::BeginTimer();

		$work = App::Orm()->find(entities\DraftWork::class, $this->workId);
		$metadata = $work->getMetadata();
		$previewId = $work->getPreviewFileId();

		$this->doDeleteWorkVersions();
		$this->doDeleteExtraMetrics();
		$this->doDeleteIcons();
		$this->doDeleteAnnotations();
		$this->doDeleteOnBoarding();
		$this->doDeleteRevisions();
		$this->doDeleteWork();
		$this->doDeletePreview($previewId);

		//if ($metadata->getId() != 818 && $metadata->getId() != 2204 && $metadata->getId() != 1889)
		$this->doDeleteMetadata($metadata);

		$this->doDeleteChunks();

		Profiling::EndTimer();
	}

	public function DeleteDatasets()
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$datasets = $workModel->GetDatasets($this->workId);
		if ($this->state->GetTotalSlices() == 0)
		{
			$totalSlices = sizeof($datasets);
			$this->state->SetTotalSlices($totalSlices);
		}
		if ($this->state->GetTotalSlices() > 0)
		{
			$dataset = $datasets[0];
			$service = new DatasetService();
			$service->DeleteDataset($this->workId, $dataset['dat_id']);
		}
		$this->state->NextSlice();

		Profiling::EndTimer();
		return sizeof($datasets) <= 1;
	}

	private function doDeleteChunks()
	{
		// Borra la tabla de chunks de archivos
		$chunkTable = DbFile::GetChunksTableName(true, $this->workId);
		App::Db()->dropTable($chunkTable);
	}

	private function doDeleteWork()
	{
		// Borra
		$delete = "DELETE FROM work_space_usage WHERE wdu_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('work_space_usage');
		$delete = "DELETE FROM draft_work WHERE wrk_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_work');
	}
	private function doDeleteExtraMetrics()
	{
		// Borra
		$delete = "DELETE FROM draft_work_extra_metric WHERE wmt_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_work_extra_metric');

	}
	private function doDeleteIcons()
	{
		// Borra
		$delete = "DELETE FROM draft_work_icon WHERE wic_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_work_icon');
	}


	private function doDeleteAnnotations()
	{
		// Borra items
		$delete = "DELETE draft_annotation_item FROM draft_annotation_item
					INNER JOIN draft_annotation ON ann_id = ani_annotation_id
					WHERE ann_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_annotation_item');

		// Borra principal
		$delete = "DELETE FROM draft_annotation WHERE ann_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_annotation');
	}

	private function doDeleteOnBoarding()
	{
		// Borra pasos
		$delete = "DELETE draft_onboarding_step FROM draft_onboarding_step
					INNER JOIN draft_onboarding ON onb_id = obs_onboarding_id
					WHERE onb_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_onboarding_step');

		// Borra principal
		$delete = "DELETE FROM draft_onboarding WHERE onb_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_onboarding');
	}

	private function doDeleteRevisions()
	{
		// Borra
		$delete = "DELETE FROM review WHERE rev_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('review');
	}
	private function doDeleteWorkVersions()
	{
		// Borra
		$delete = "DELETE FROM draft_metric_version WHERE mvr_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		App::Db()->markTableUpdate('draft_metric_version');
	}

	private function doDeletePreview($fileId)
	{
		$fs = new FileService();
		$fs->DeleteFile($fileId, $this->workId);
	}

	private function doDeleteMetadata($metadata)
	{
		// Borra las relaciones con fuente
		$delete = "DELETE FROM draft_metadata_source WHERE msc_metadata_id = ?";
		App::Db()->exec($delete, array($metadata->getId()));

		// Borra la relación con instituciones
		$deleteMetadataInstitutions = "DELETE FROM draft_metadata_institution WHERE min_metadata_id = ?";
		App::Db()->exec($deleteMetadataInstitutions, array($metadata->getId()));
		App::Db()->markTableUpdate('draft_metadata_institution');

		// Consulta archivos a borrar
		$queryDeleteFiles = "SELECT fil_id FROM draft_file JOIN
						draft_metadata_file ON mfi_file_id = fil_id WHERE
								mfi_metadata_id = ?";
		$filesRes = App::Db()->fetchAll($queryDeleteFiles, array($metadata->getId()));
		$files = array();
		foreach($filesRes as $fileRow)
			$files[] = $fileRow['fil_id'];

		// Borra metada_files
		$deleteMetadataFiles = "DELETE FROM draft_metadata_file WHERE mfi_metadata_id = ?";
		App::Db()->exec($deleteMetadataFiles, array($metadata->getId()));
		App::Db()->markTableUpdate('draft_metadata_file');
		// Borra los files
		if (sizeof($files) > 0)
		{
			$deleteFiles = "DELETE draft_file FROM draft_file WHERE fil_id IN (" . join(',', $files) . ")";
			App::Db()->exec($deleteFiles);
			App::Db()->markTableUpdate('draft_file');
		}
		// Borra metadatos
		$delete = "DELETE FROM draft_metadata WHERE met_id = ?";
		App::Db()->exec($delete, array($metadata->getId()));
		App::Db()->markTableUpdate('draft_metadata');

		// Decide si borra Contact
		$contact = $metadata->getContact();
		if ($metadata->getType() !== 'P' && $contact != null &&
			$this->IsLastParent($contact))
		{	// Borra el contacto
			App::Orm()->delete($contact);
		}

	}
	private function IsLastParent($contact)
	{
		// Se fija si era el último
		$childrenSql = "SELECT count(*) FROM draft_metadata WHERE met_contact_id = ?";
		$sibilings = App::Db()->fetchScalarInt($childrenSql, array($contact->getId()));
		return ($sibilings <= 1);
	}

	public function DeletePermissions()
	{
		// Copia permisos
		$metadata = "DELETE FROM draft_work_permission WHERE wkp_work_id = ?";
		App::Db()->exec($metadata, array($this->workId));
		App::Db()->markTableUpdate('draft_work_permission');

		WorkPermissionsCache::Clear($this->workId);
	}
}

