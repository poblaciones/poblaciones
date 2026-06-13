<?php

namespace helena\services\frontend;

use minga\framework\PublicException;
use minga\framework\IO;

use helena\entities\frontend\work\WorkInfo;
use helena\entities\frontend\metadata\MetadataInfo;
use helena\services\backoffice\publish\PublishDataTables;

use helena\services\common\BaseService;
use helena\classes\Links;
use helena\db\frontend\MetadataModel;
use helena\db\frontend\AnnotationsModel;
use helena\db\frontend\WorkModel;
use helena\db\frontend\OnboardingModel;
use helena\db\frontend\FileModel;
use helena\classes\App;
use helena\classes\Session;
use helena\entities\frontend\geometries\Envelope;

class WorkService extends BaseService
{
	public function GetWork($workId)
	{
		$worksTable = new WorkModel();
		$ret = $this->GetWorkOnly($workId);
		$rows = $worksTable->GetWorkMetricsInfo($workId);
		$ret->FillMetrics($rows);
		$metadataTable = new MetadataModel();
		$rows = $metadataTable->GetMetadataFiles($ret->Metadata->Id);
		$ret->Metadata->FillFiles($rows);
		$onboardingTable = new OnboardingModel();
		$rows = $onboardingTable->GetOnboardingInfo($workId);
		$ret->FillOnboarding($rows);
		if (App::Settings()->Map()->UseAnnotations)
		{
			$annotationsModel = new AnnotationsModel();
			$workIdUnShardified = PublishDataTables::Unshardify($workId);
			$ret->Annotations = $annotationsModel->GetAnnotations($workIdUnShardified);
		}
		else
		{
			$ret->Annotations = [];
		}
		return $ret;
	}

	public function GetCurrentUserPublicMetrics()
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		// Trae los indicadores del usuario
		$sql = "SELECT mtr_id `Id`, met_title Caption, MAX(wrk_is_private) IsPrivate FROM metric
					JOIN metric_version ON mtr_id = mvr_metric_id
					JOIN metric_version_level ON mvr_id = mvl_metric_version_id
					JOIN dataset ON dat_id = mvl_dataset_id
					JOIN `work` ON wrk_id = dat_work_id
					JOIN metadata ON met_id = wrk_metadata_id
					WHERE dat_work_id IN (
					SELECT " . PublishDataTables::ShardifiedDb('wkp_work_id') . " FROM draft_work_permission WHERE wkp_user_id = " . $userId . ")
					GROUP BY mtr_id, mtr_caption, met_title
					ORDER BY MAX(met_publication_date) DESC,
							met_title ASC,
							mtr_caption ASC";
		$ret = App::Db()->fetchAll($sql);
		return $ret;
	}

	public function GetWorkOnly($workId)
	{
		$worksTable = new WorkModel();
		$metadataTable = new MetadataModel();
		$work = $worksTable->GetWork($workId);
		if (!$work) {
			throw new PublicException("La cartografía no ha sido encontrada.");
		}
		$institutions = $metadataTable->GetInstitutions($work['met_id']);

		$ret = new WorkInfo();
		$workIdUnShardified = PublishDataTables::Unshardify($workId);
		$ret->CanEdit = Session::IsWorkEditor($workIdUnShardified);
		$ret->Fill($work);
		$ret->FillStartup($work);
		if ($work['met_extents'])
			$ret->Extents = Envelope::FromDb($work['met_extents'])->Trim();

		$ret->Url = Links::GetWorkStableUrl($ret->Url, $work['wrk_id']);

		$ret->Metadata = new MetadataInfo();
		$ret->Metadata->Fill($work);
		$ret->Metadata->FillInstitutions($institutions);
		$ret->ArkUrl = Links::GetWorkArkUrl($workId);
		return $ret;
	}

	public function GetWorkImage($workId)
	{
		$work = $this->GetWorkOnly($workId);
		$fileId = $work->ImageId;
		$fileModel = new FileModel(false, $workId);
		return $fileModel->SendFile($fileId);
	}
	public function GetWorkByMetricVersion($metricVersionId)
	{
		$worksTable = new WorkModel();
		$work = $worksTable->GetWorkByMetricVersion($metricVersionId);
		if (!$work)
			// La versión no tiene levels
			return null;
		$ret = new WorkInfo();
		$ret->Fill($work);
		$ret->Metadata = new MetadataInfo();
		$ret->Metadata->Fill($work);
		$ret->ArkUrl = Links::GetWorkArkUrl($work['wrk_id']);
		// Hace absoluta la URL
		$ret->Url = Links::GetWorkStableUrl($ret->Url, $work['wrk_id']);
		$metadataTable = new MetadataModel();
		$rows = $metadataTable->GetMetadataFiles($ret->Metadata->Id);
		$ret->Metadata->FillFiles($rows);
		return $ret;
	}

	public function GetOnboardingStepImage($workId, $fileId)
	{
		// hace el chequeo de seguridad...
		$onboardingModel = new OnboardingModel();
		$onboardingModel->CheckOwner($workId, $fileId);
		// lo devuelve...
		$fileModel = new FileModel(false, $workId);
		$outFile = IO::GetTempFilename() . '.tmp';
		$fileModel->ReadFileToFile($fileId, $outFile);
		// lo convierte
		$dataURL = IO::ConvertFiletoBase64($outFile);
		IO::Delete($outFile);
		return $dataURL;
	}
}

