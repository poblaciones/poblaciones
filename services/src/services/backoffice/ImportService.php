<?php

namespace helena\services\backoffice;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\Str;
use minga\framework\FileBucket;
use minga\framework\PublicException;

use helena\classes\readers\BaseReader;

use helena\services\common\BaseService;
use helena\classes\Paths;
use helena\classes\App;

use helena\entities\backoffice\DraftDataset;

use helena\services\backoffice\import\MetadataMerger;
use helena\services\backoffice\import\ImportStateBag;
use helena\services\backoffice\import\DatasetTable;
use helena\services\backoffice\import\DatasetColumns;
use helena\services\backoffice\publish\WorkFlags;
use helena\entities\backoffice as entities;


class ImportService extends BaseService
{
	const STEP_BEGIN = 0;
	const STEP_CONVERTED = 1;
	const STEP_INSERTING = 2;
	const STEP_INSERTED = 3;
	const STEP_END = 4;

	const DEFAULT_NAME_CAPTIONS = ['nombre', 'nombre_place', 'name', 'descripción', 'descripcion', 'fna'];
	private $state;

	public function CreateMultiImportFile($datasetId, $bucketId, $fileExtension, $keepLabels, $selectedSheetIndex)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		WorkFlags::SetDatasetDataChanged($dataset->getWork()->getId());

		$bucket = FileBucket::Load($bucketId);
		$this->PrepareNewState($datasetId, $keepLabels, $bucketId);
		$this->state->SetTotalSteps(self::STEP_END);
		$fileExtension = Str::ToLower($fileExtension);

		// obtiene la instancia del reader
		$reader = BaseReader::CreateReader($bucket->path, $fileExtension);

		// Ejecuta los dos pasos de un reader
		$reader->Prepare($selectedSheetIndex);
		$reader->WriteJson($selectedSheetIndex);

		// Listo
		$this->state->SetStep(self::STEP_CONVERTED, 'Creando tablas');
		return $this->state->ReturnState(false);
	}

	public function VerifyDatasetsImportFile($bucketId, $fileExtension)
	{
		$bucket = FileBucket::Load($bucketId);
		$fileExtension = Str::ToLower($fileExtension);

		$reader = BaseReader::CreateReader($bucket->path, $fileExtension);
		$selfImport = $reader->CanGeoreference();
		return ['Sheets' => $reader->ReadSheetNames(), 'CanGeoreference' => $selfImport];
	}

	public function FileChunkImport($bucketId) {
		$bucket = FileBucket::Load($bucketId);
		return $this->SaveTo($bucket);
	}

	private function SaveTo($bucket)
	{
		$uploadFolder = $bucket->path;
		$extension = '';
		if (!empty($_FILES))
		{
			$tempFileName = $_FILES['file']['tmp_name'];
			$actual = file_get_contents($tempFileName);
			$extension = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
			$destFile =  $uploadFolder . '/file.dat';
			file_put_contents($destFile, $actual, FILE_APPEND | LOCK_EX);
		}

		return array('status' => 'OK', 'bucket' => $bucket->id, 'extension' => $extension);
	}

	public function SingleStepFileImport()
	{
		$bucket = FileBucket::Create();
		return $this->SaveTo($bucket);
	}

	public function StepMultiImportFile($key)
	{
		// Carga los estados
		$this->LoadState($key);
		// Avanza
		switch($this->state->Step())
		{
			case self::STEP_CONVERTED:
				return $this->CreateTables();
			case self::STEP_INSERTING:
				return $this->InsertData();
			case self::STEP_INSERTED:
				{
					$this->CreateMetadata();
					$this->MergeOldData();
					$this->AutoMatchName();
					return $this->UpdateMetadata();
				}
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	private function LoadState($key)
	{
		$this->state = new ImportStateBag();
		$this->state->LoadFromKey($key);
	}

	private function PrepareNewState($datasetId, $keepLabels, $defaultBucketId)
	{
		$this->state = ImportStateBag::Create($datasetId, $defaultBucketId);
		$this->state->Set("datasetId", $datasetId);
		$this->state->Set("keepLabels", $keepLabels);
		$this->state->Save();
	}

	private function UpdateMetadata()
	{
		$tableName = $this->state->Get("tableName");
		$datasetId = $this->state->GetDatasetId();
		// Lo saca de temp
		$datasetTable = new DatasetTable();
		$datasetTable->PromoteFromTemp($tableName);
		$tableName = DatasetTable::GetNonTemporaryName($tableName);
		// Actualiza el nombre de tabla
		$dataset = App::Orm()->find(DraftDataset::class, $datasetId);
		$dataset->setTable($tableName);
		$dataset->setGeocoded(false);
		// Termina
		$this->state->SetStep(self::STEP_END, 'Completado exitosamente');
		return $this->state->ReturnState(true);
	}

	private function MergeOldData()
	{
		$datasetId = $this->state->GetDatasetId();
		$targetDatasetId = $datasetId;
		$keepOldMetadata = $this->state->GetKeepLabels();
		$dropSourceDataset = true;
		$maxPreviousId = $this->state->Get('maxPreviousId');

		$merger = new MetadataMerger($datasetId, $targetDatasetId, $keepOldMetadata,
																	$maxPreviousId, $dropSourceDataset);
		$merger->MergeMetadata();
	}

	private function AutoMatchName()
	{
		$datasetId = $this->state->GetDatasetId();
		// Se fija si alguna columna tiene que ir como name
		$sql = "SELECT MIN(dco_id) FROM draft_dataset_column WHERE dco_caption IN('"
					. implode("','", self::DEFAULT_NAME_CAPTIONS) . "') AND dco_dataset_id = ?";
		$dcoId = App::Db()->fetchScalarIntNullable($sql, array($datasetId));
		if ($dcoId) {
			$update = "UPDATE draft_dataset SET dat_caption_column_id = ? WHERE dat_caption_column_id IS NULL AND dat_id = ?";
			App::Db()->exec($update, array($dcoId, $datasetId));
			App::Db()->markTableUpdate('draft_dataset');
		}
	}

	private function CreateMetadata()
	{
		// Guarda max id previo
		$maxPreviousId = App::Db()->fetchScalarIntNullable("SELECT max(dco_id) FROM draft_dataset_column");
		$this->state->Set('maxPreviousId', $maxPreviousId);
		// Inserta columnas
		$datasetId = $this->state->GetDatasetId();
		$headers = $this->state->GetHeaders();
		$datasetColumns = new DatasetColumns($headers);
		$datasetColumns->InsertColumnDescriptions($datasetId);
	}

	private function CreateTables()
	{
		$datasetTable = new DatasetTable();
		$headers = $this->state->GetHeaders();
		$tableName = $datasetTable->CreateTable($headers);
		$this->state->Set('tableName', $tableName);
		$this->state->SetStep(self::STEP_INSERTING, 'Insertando datos');
		return $this->state->ReturnState(false);
	}

	private function InsertData()
	{
		// Comienza a insertar
		$headers = $this->state->GetHeaders();
		$tableName = $this->state->Get("tableName");
		$datasetTable = new DatasetTable();

		$files = IO::GetFilesStartsWith($this->state->GetFileFolder(), "data_");
		$this->state->SetTotalSlices(sizeof($files));
		if (sizeof($files) > 0)
		{
			$file = $files[$this->state->Slice()];
			$filePath = $this->state->GetFileFolder() . "/" . $file;
			$datasetTable->InsertDatafile($tableName, $headers, $filePath);
			$this->state->NextSlice();
		}
		if ($this->state->Slice() == $this->state->GetTotalSlices())
		{
			$this->state->SetStep(self::STEP_INSERTED, 'Actualizando dataset');
		}
		return $this->state->ReturnState(false);
	}
}

