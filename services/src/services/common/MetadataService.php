<?php

namespace helena\services\common;

use minga\framework\Date;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use minga\framework\IO;
use minga\framework\PublicException;
use minga\framework\Performance;
use helena\caches\PdfMetadataCache;
use helena\services\common\BaseService;
use helena\db\frontend\MetadataModel;
use helena\db\frontend\FileModel;
use helena\classes\App;
use helena\classes\PdfCreator;
use helena\classes\Statistics;

class MetadataService extends BaseService
{
	public function GetMetadataFile($metadataId, $fileId)
	{
		$metadataTable = new MetadataModel();
		$metadataFile = $metadataTable->GetMetadataFileByFileId($metadataId, $fileId);
		if ($metadataFile == null)
		  throw new PublicException("El adjunto no se corresponde con los metadatos indicados.");

		$friendlyName = $metadataFile['mfi_caption'] . '.pdf';
		$fileModel = new FileModel();

		$workId = $metadataFile['work_id'];
		if ($workId)
			Statistics::StoreDownloadMetadataAttachmentHit($workId, $metadataFile['mfi_id']);

		return $fileModel->SendFile($fileId, $friendlyName);
	}

	public function GetMetadataPdf($metadataId, $datasetId = null, $fromDraft = false, $workId = null)
	{
		$model = new MetadataModel($fromDraft);
		$metadata = $model->GetMetadata($metadataId);
		if ($metadata === null || sizeof($metadata) < 2) throw new PublicException('Metadatos no encontrados.');
		$friendlyName = $metadata['met_title'] . '.pdf';

		// se fija en el caché
		$key = PdfMetadataCache::CreateKey($datasetId);
		$data = null;
		if ($fromDraft === false && $workId !== null)
			Statistics::StoreDownloadMetadataHit($workId);

	if ($fromDraft === false && PdfMetadataCache::Cache()->HasData($metadataId, $key, $data))
		{
			return App::SendFile($data)
				->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
				->deleteFileAfterSend(true);
		}
		else
		{
			Performance::CacheMissed();
		}
		$metadata['wrk_access_link'] = $model->GetAccessLink($workId);

		$sources = $model->GetMetadataSources($metadataId);
		$dataset = $model->GetDatasetMetadata($datasetId);

		$metadata['met_online_since_formatted'] = $this->formatDate($metadata['met_online_since']);
		$metadata['met_last_online_formatted'] = $this->formatDate($metadata['met_last_online']);


		$PdfCreator = new PdfCreator();
		$filename = $PdfCreator->CreateMetadataPdf($metadata, $sources, $dataset);

		if ($fromDraft === false)
		{
			PdfMetadataCache::Cache()->PutData($metadataId, $key, $filename);
		}

		return App::SendFile($filename)
			->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
			->deleteFileAfterSend(true);
	}

	private function formatDate($date)
	{
		if ($date === null)
			return "-";
		else {
			if (is_string($date)) $date = strtotime($date);
			return Date::DateToDDMMYYYY($date);
		}
	}
}

