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

		$ret->Url = Links::GetFullyQualifiedUrl($ret->Url);
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
		// Hace absolute la URL
		$ret->Url = Links::GetFullyQualifiedUrl($ret->Url);
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

