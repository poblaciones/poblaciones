<?php

namespace helena\services\common;

use minga\framework\Date;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use minga\framework\IO;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Performance;
use minga\framework\WebConnection;

use helena\classes\Links;
use helena\caches\PdfMetadataCache;
use helena\caches\DictionaryMetadataCache;
use helena\services\common\BaseService;
use helena\db\frontend\MetadataModel;
use helena\db\frontend\FileModel;
use helena\classes\App;
use minga\framework\Context;
use helena\classes\PdfCreator;
use helena\classes\Statistics;
use helena\db\backoffice\WorkModel;
use OpenSpout\Writer\Common\Creator\WriterEntityFactory;
use OpenSpout\Writer\Common\Creator\Style\StyleBuilder;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Writer\XLSX\Entity\SheetView;


class MetadataService extends BaseService
{
	public function GetMetadataFile($metadataId, $fileId)
	{
		$metadataTable = new MetadataModel();
		$metadataFile = $metadataTable->GetMetadataFileByFileId($metadataId, $fileId);
		if ($metadataFile == null)
		  throw new PublicException("El adjunto no se corresponde con los metadatos indicados.");

		$friendlyName = $metadataFile['mfi_caption'] . '.pdf';

		$workId = $metadataFile['work_id'];
		if ($workId)
			Statistics::StoreDownloadMetadataAttachmentHit($workId, $metadataFile['mfi_id']);

		$fileModel = new FileModel(false, $workId);

		return $fileModel->SendFile($fileId, $friendlyName);
	}

	public function GetWorkMetadataPdf($metadataId, $datasetId = null, $fromDraft = false, $workId = null)
	{
		if (!$metadataId)
		{
			$model = new WorkModel($fromDraft);
			$work = $model->GetWork($workId);
			$metadataId = $work['wrk_metadata_id'];
		}
		return $this->GetMetadataPdf($metadataId, $datasetId, $fromDraft, $workId);
	}
	public function GetMetadataPdf($metadataId, $datasetId = null, $fromDraft = false, $workId = null)
	{
		$model = new MetadataModel($fromDraft);
		$metadata = $model->GetMetadata($metadataId);
		// Si no indica work, no pueden ser metadatos de un work
		if (!$workId && $metadata['met_type'] !== 'C')
		{
			throw new PublicException('Indicación de metadatos no válida.');
		}

		if ($metadata === null || sizeof($metadata) < 2) throw new PublicException('Metadatos no encontrados.');
		$friendlyName = $metadata['met_title'] . '.pdf';
		if ($workId)
			$metadata['met_ark'] = Links::GetWorkArkUrl($workId);

		// se fija en el caché
		$key = PdfMetadataCache::CreateKey($datasetId);
		$data = null;
		if ($fromDraft === false && $workId !== null)
			Statistics::StoreDownloadMetadataHit($workId);

		if ($fromDraft === false && PdfMetadataCache::Cache()->HasData($metadataId, $key, $data))
		{
			$friendlyName = Str::SanitizeFilename($friendlyName);

			return App::SendFile($data, true)
				->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName);
		}
		else
		{
			Performance::CacheMissed();
		}
		$metadata['wrk_access_link'] = $model->GetAccessLink($workId);

		$sources = $model->GetMetadataSources($metadataId);
		$institutions = $model->GetMetadataInstitutions($metadataId);
		if ($datasetId || $workId)
			$model->AddGeographyMetadata($sources, $datasetId, $workId);
		$dataset = $model->GetDatasetMetadata($datasetId);

		$metadata['met_online_since_formatted'] = $this->formatDate($metadata['met_online_since']);
		$metadata['met_last_online_formatted'] = $this->formatDate($metadata['met_last_online']);

		$PdfCreator = new PdfCreator();
		$filename = $PdfCreator->CreateMetadataPdf($metadata, $sources, $institutions, $dataset, $fromDraft);

		if ($fromDraft === false)
		{
			PdfMetadataCache::Cache()->PutData($metadataId, $key, $filename);
		}
		$friendlyName = Str::SanitizeFilename($friendlyName);

		return App::SendFile($filename)
			->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
			->deleteFileAfterSend(true);
	}

	public function GetXlsDictionary($metadataId, $datasetId, $workId)
	{
		$model = new MetadataModel(false);
		$metadata = $model->GetMetadata($metadataId);
		// Si no indica work, no pueden ser metadatos de un work
		if (!$workId)
		{
			throw new PublicException('Indicación de metadatos no válida.');
		}
		if ($metadata === null || sizeof($metadata) < 2) throw new PublicException('Metadatos no encontrados.');

		$dataset = $model->GetDatasetMetadata($datasetId);
		$friendlyName = $dataset['dat_caption'] . ' - Diccionario de datos.xlsx';
		$friendlyName = Str::SanitizeFilename($friendlyName);

		// se fija en el caché
		$key = DictionaryMetadataCache::CreateKey($datasetId);
		$data = null;
		Statistics::StoreDownloadDictionaryHit($workId);

		if (DictionaryMetadataCache::Cache()->HasData($metadataId, $key, $data))
		{
			return App::SendFile($data)
				->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
				->deleteFileAfterSend(true);
		}
		else
		{
			Performance::CacheMissed();
		}
		// Crea el excel
		$filename = $this->CreateXlsxDictionary($dataset);

		// Listo
		DictionaryMetadataCache::Cache()->PutData($metadataId, $key, $filename);

		return App::SendFile($filename)
			->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
			->deleteFileAfterSend(true);
	}

	private function CreateXlsxDictionary($dataset)
	{
		$fileExcel = IO::GetTempFilename();

		$writer = WriterEntityFactory::createXLSXWriter();
		$writer->setTempFolder(Context::Paths()->GetTempPath());
		$writer->openToFile($fileExcel);

		$writer->getCurrentSheet()->setSheetView(
      (new SheetView())
          ->setZoomScale(90)
          ->setZoomScaleNormal(90)
          ->setZoomScalePageLayoutView(90)
  );

		$writer->setColumnWidth(60, 2);
		$this->AddTwoColumnExcelRow($writer, 'Diccionario de datos de ' . $dataset['dat_caption'], null, true);

		foreach($dataset['columns'] as $column)
		{
			$label = $column['dco_label'];
			if ($label === null || trim($label) === '') {
				$label = '-';
			}
			$this->AddTwoColumnExcelRow($writer, '', null);

			$this->AddTwoColumnExcelRow($writer, 'Variable:', $column['dco_variable'], true, false, Color::rgb(217, 217, 217));
			$this->AddTwoColumnExcelRow($writer, 'Etiqueta:', $label);

			if (array_key_exists('values', $column) && $column['values'] != null)
			{
				$this->AddTwoColumnExcelRow($writer, '', null);

				$this->AddTwoColumnExcelRow($writer, 'Valores', 'Etiquetas', false, true, Color::rgb(242, 242, 242));
				foreach($column['values'] as $value)
				{
					$this->AddTwoColumnExcelRow($writer, $value['dla_value'] + 0, $value['dla_caption'], false ,true);
				}
			}
		}

		$writer->close();

		return $fileExcel;
	}

	private function AddTwoColumnExcelRow($writer, $value1, $value2 = null, $bold = false, $firstCentered = false, $color = null)
	{
		$outCells = [];
		if ($firstCentered)
		{
			$styleBuilder = new StyleBuilder();
			$styleBuilder->setCellAlignment(CellAlignment::CENTER);
			$style = $styleBuilder->build();
			$outCells[] = WriterEntityFactory::createCell($value1, $style);
		}
		else
		{
			$outCells[] = WriterEntityFactory::createCell($value1);
		}
		$outCells[] = WriterEntityFactory::createCell($value2);
		if ($bold || $color)
		{
			$styleBuilder = new StyleBuilder();
			if ($bold)
				$styleBuilder->setFontBold();
			if ($color)
				 $styleBuilder->setBackgroundColor($color);
			$style = $styleBuilder->build();
			$singleRow = WriterEntityFactory::createRow($outCells, $style);
		}
		else
		{
			$singleRow = WriterEntityFactory::createRow($outCells);
		}
		$writer->addRow($singleRow);
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

