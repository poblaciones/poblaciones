<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
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
		$this->doDeleteOnBoarding();
		$this->doDeleteRevisions();
		$this->doDeleteWork();
		$this->doDeletePreview($previewId);
		$this->doDeleteMetadata($metadata);

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

	private function doDeleteWork()
	{
		// Borra
		$delete = "DELETE FROM work_space_usage WHERE wdu_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
		$delete = "DELETE FROM draft_work WHERE wrk_id = ?";
		App::Db()->exec($delete, array($this->workId));
	}
	private function doDeleteExtraMetrics()
	{
		// Borra
		$delete = "DELETE FROM draft_work_extra_metric WHERE wmt_work_id = ?";
		App::Db()->exec($delete, array($this->workId));

	}
	private function doDeleteIcons()
	{
		// Borra
		$delete = "DELETE FROM draft_work_icon WHERE wic_work_id = ?";
		App::Db()->exec($delete, array($this->workId));

	}

	private function doDeleteOnBoarding()
	{
		// Borra pasos
		$delete = "DELETE draft_onboarding_step FROM draft_onboarding_step
					INNER JOIN draft_onboarding ON onb_id = obs_onboarding_id
					WHERE onb_work_id = ?";
		App::Db()->exec($delete, array($this->workId));

		// Borra principal
		$delete = "DELETE FROM draft_onboarding WHERE onb_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
	}

	private function doDeleteRevisions()
	{
		// Borra
		$delete = "DELETE FROM review WHERE rev_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
	}
	private function doDeleteWorkVersions()
	{
		// Borra
		$delete = "DELETE FROM draft_metric_version WHERE mvr_work_id = ?";
		App::Db()->exec($delete, array($this->workId));
	}

	private function doDeletePreview($fileId)
	{
		$fs = new FileService();
		$fs->DeleteFile($fileId);
	}

	private function doDeleteMetadata($metadata)
	{
		// Borra las relaciones con fuente
		$delete = "DELETE FROM draft_metadata_source WHERE msc_metadata_id = ?";
		App::Db()->exec($delete, array($metadata->getId()));
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
		// Borra los files
		if (sizeof($files) > 0)
		{
			$deleteFiles = "DELETE draft_file FROM draft_file WHERE fil_id IN (" . join(',', $files) . ")";
			App::Db()->exec($deleteFiles);
		}
		// Borra metadatos
		$delete = "DELETE FROM draft_metadata WHERE met_id = ?";
		App::Db()->exec($delete, array($metadata->getId()));

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

		WorkPermissionsCache::Clear($this->workId);
	}
}

