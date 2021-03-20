<?php

namespace helena\services\common;

use minga\framework\PublicException;
use minga\framework\ErrorException;
use minga\framework\Str;

use helena\classes\writers\SpssWriter;
use helena\classes\writers\CsvWriter;
use helena\classes\writers\StataWriter;
use helena\classes\writers\RWriter;
use helena\classes\writers\XlsxWriter;
use helena\classes\writers\ShpWriter;

use helena\classes\DownloadStateBag;
use helena\classes\DownloadBoundaryStateBag;
use helena\db\frontend\DatasetModel;
use helena\db\frontend\BoundaryDownloadModel;
use helena\db\frontend\ClippingRegionItemModel;
use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;
use helena\caches\BoundaryDownloadCache;
use helena\classes\App;


class DownloadManager
{
	const STEP_BEGIN = 0;
	const STEP_ADDING_ROWS = 1;
	const STEP_CREATED = 2;
	const STEP_DATA_COMPLETE = 3;
	const STEP_CACHED = 4;

	const FILE_SPSS = 1;
	const FILE_CSV = 2;
	const FILE_SHP = 3;
	const FILE_XLSX = 4;
	const FILE_STATA = 5;
	const FILE_R = 6;

	private static $validFileTypes = ['s' => [ 'extension' => 'sav', 'Caption' => 'SPSS', 'type' => self::FILE_SPSS],
																		'z' => [ 'extension' => 'zsav', 'Caption' => 'SPSS', 'type' => self::FILE_SPSS],
																		't' => [ 'extension' => 'dta', 'Caption' => 'Stata', 'type' => self::FILE_STATA],
																		'r' => [ 'extension' => 'rdata', 'Caption' => 'R', 'type' => self::FILE_R],
																		'c' => [ 'extension' => 'csv', 'Caption' => 'CSV', 'type' => self::FILE_CSV],
																		'x' => [ 'extension' => 'xlsx', 'Caption' => 'Excel', 'type' => self::FILE_XLSX],
																		'h' => [ 'extension' => 'zip', 'Caption' => 'Shapefile', 'type' => self::FILE_SHP]];

	const OUTPUT_LATIN3_WINDOWS_ISO = false;

	private $start = 0.0;
	private $model;
	private $state;

	function __construct()
	{
			$this->start = microtime(true);
	}

	public function CreateMultiRequestDatasetFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft = false, $extraColumns = array())
	{
		self::ValidateType($type);
		self::ValidateClippingItem($clippingItemId);

		// Si está cacheado, sale
		if(self::IsCached($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft, $extraColumns);
		$this->PrepareNewState($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft, $extraColumns);
		return $this->GenerateNextFilePart();
	}
	public function CreateMultiRequestBoundaryFile($type, $boundaryId)
	{
		self::ValidateType($type);
		// Si está cacheado, sale
		if(BoundaryDownloadCache::Cache()->IsCached($type, $boundaryId))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewBoundaryModel($type, $boundaryId);
		$this->PrepareNewBoundaryState($type, $boundaryId);
		return $this->GenerateNextFilePart();
	}

	public function StepMultiRequestFile($key)
	{
		// Carga los estados
		$this->LoadState($key);
		$this->LoadModel();
		// Avanza
		switch($this->state->Step())
		{
			case self::STEP_DATA_COMPLETE:
				return $this->PutFileToCache();
			case self::STEP_CACHED:
				return $this->state->ReturnState(true);
			default:
				return $this->GenerateNextFilePart();
		}
	}

	private function GenerateNextFilePart()
	{
		// Continúa creando el archivo
		$this->CreateNextFilePart();
		if($this->state->Step() == self::STEP_DATA_COMPLETE)
			return $this->PutFileToCache();
		else
			return $this->state->ReturnState(false);
	}

	private static function IsCached($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft)
	{
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity);
		$filename = null;
		return self::getCache($fromDraft)->HasData($datasetId, $cacheKey, $filename);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft = false)
	{
		self::ValidateType($type);

		if (!$fromDraft)
		{
			self::ValidateClippingItem($clippingItemId);
		}
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity);
		$friendlyName = self::GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $type);
		$cache = self::getCache($fromDraft);
		// Lo devuelve desde el cache
		$filename = null;
		if ($cache->HasData($datasetId, $cacheKey, $filename, true))
			return App::StreamFile($filename, $friendlyName);
		else
			throw new PublicException('No ha sido posible descargar el archivo.');
	}

	public static function GetBoundaryFileBytes($type, $boundaryId)
	{
		self::ValidateType($type);

		$cacheKey = BoundaryDownloadCache::CreateKey($boundaryId, $type);
		$friendlyName = self::GetBoundaryFileName($boundaryId, $type);
		$cache = BoundaryDownloadCache::Cache();
		// Lo devuelve desde el cache
		$filename = null;
		if ($cache->HasData($cacheKey, $filename, true))
			return App::StreamFile($filename, $friendlyName);
		else
			throw new PublicException('No ha sido posible descargar el archivo.');
	}
	public static function GetFileTypeFromLetter($letter)
	{
		if (array_key_exists($letter, self::$validFileTypes))
			return self::$validFileTypes[$letter]['type'];
		else
			throw new ErrorException("Tipo de archivo no reconocido.");
	}

	private static function GetFileInfoFromFileType($fileType)
	{
		foreach (self::$validFileTypes as $key => $value)
			if ($value['type'] == $fileType)
				return $value;

		throw new ErrorException("Tipo de archivo no reconocido.");
	}

	public static function GetFileCaptionFromFileType($fileType)
	{
		$info = self::GetFileInfoFromFileType($fileType);
		return $info['Caption'];
	}
	private static function GetBoundaryFileName($boundaryId, $type)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$name = 'boundary' . $boundaryId . $type;

		return $name . '.' . $ext;
	}

	private static function GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $type)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$name = 'dataset' . $datasetId . $type;
		if (is_array($clippingItemId))
			$name .= 'r' . Str::JoinInts($clippingItemId, '-');
		else
			$name .= 'r' . $clippingItemId;

		if($urbanity)
			$name .= 'u' . Str::ToLower($urbanity);

		return $name . '.' . $ext;
	}

	private static function createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::CreateKey($type);
		else
			return DownloadCache::CreateKey($type, $clippingItemId, $clippingCircle, $urbanity);
	}

	private static function getCache($fromDraft)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::Cache();
		else
			return DownloadCache::Cache();
	}

	private function PutFileToCache()
	{
		if($this->state->Step() == self::STEP_CACHED)
			return $this->state->ReturnState(false);

		if (!file_exists($this->state->Get('outFile')) || filesize($this->state->Get('outFile')) == 0)
			throw new PublicException("No fue posible generar el archivo.");

		$cache = self::getCache($this->state->FromDraft());
		$cache->PutData($this->state->Get('datasetId'), $this->state->Get('cacheKey'), $this->state->Get('outFile'));
		unlink($this->state->Get('outFile'));

		$this->state->SetStep(self::STEP_CACHED);
		return $this->state->ReturnState(true);
	}

	private static function ValidateType($type)
	{
		// La primera letra es el tipo de archivo:
		// s = spss
		// z = spss zipped
		// c = csv
		// x = excel
		// t = stata
		// r = R
		$validFormats = self::$validFileTypes;
		// h = shapefile
		$validSpatialOnlyFormats = ['hw', 'h'];

		// La segunda letra (opcional) es:
		// w = wkt
		// g = geojson

		if (in_array($type, $validSpatialOnlyFormats)) return;

		if (strlen($type) > 0)
		{
			if (array_key_exists($type[0], $validFormats))
			{
				// puede no pedir parte geográfica, o pedir geojson, o wkt
				if (strlen($type) == 1 || ($type[1] === 'w' || $type[1] === 'g'))
					return;
			}
		}
		throw new PublicException('Tipo de descarga inválido');
	}

	private static function ValidateClippingItem($clippingItemIds)
	{
		if($clippingItemIds)
		{
			foreach($clippingItemIds as $clippingItemId)
			{
				$model = new ClippingRegionItemModel();
				if(is_numeric($clippingItemId) == false || $model->Exists($clippingItemId) == false)
					throw new PublicException('La región indicada no fue encontrada');
			}
		}
	}

	private function LoadState($key)
	{
		$this->state = new DownloadStateBag();
		$this->state->LoadFromKey($key);
	}

	private function LoadModel()
	{
		$this->model = new DatasetModel($this->state->Get('fullQuery'), $this->state->Get('countQuery'),
								$this->state->Cols(), $this->state->Get('fullParams'), $this->state->Get('wktIndex'),
								$this->state->ExtraColumns());
		$this->model->fromDraft = $this->state->FromDraft();
	}

	private function PrepareNewModel($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft, $extraColumns)
	{
		$this->model = new DatasetModel();
		$this->model->fromDraft = $fromDraft;
		$this->model->extraColumns = $extraColumns;
		$this->model->PrepareFileQuery($datasetId, $clippingItemId, $clippingCircle, $urbanity, self::GetPolygon($type));
	}

	private function PrepareNewBoundaryModel($type, $boundaryId)
	{
		$this->model = new BoundaryDownloadModel();
		$this->model->PrepareFileQuery($boundaryId, self::GetPolygon($type));
	}


	private function PrepareNewState($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $fromDraft, $extraColumns)
	{
		$this->state = DownloadStateBag::Create($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $this->model, $fromDraft);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $type);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$latLon = $this->model->GetLatLongColumns($datasetId);
		$this->state->Set('latVariable', $latLon['lat']);
		$this->state->Set('lonVariable', $latLon['lon']);
		$this->state->Set('extraColumns', $extraColumns);
		$this->state->Save();
	}

	private function PrepareNewBoundaryState($type, $boundaryId)
	{
		$this->state = DownloadBoundaryStateBag::Create($type, $boundaryId, $this->model);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetBoundaryFileName($boundaryId, $type);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$this->state->Save();
	}

	private function getFileType()
	{
		$validFileTypes = self::$validFileTypes;
		$type = $this->state->Get('type');
		if (array_key_exists($type[0], $validFileTypes))
			return $validFileTypes[$type[0]]['type'];
		else
			throw new PublicException('Tipo de descarga no reconocido');
	}
	private function getWriter($fileType)
	{
		if ($fileType === self::FILE_SPSS)
			return new SpssWriter($this->model, $this->state);
		else if ($fileType === self::FILE_CSV)
			return new CsvWriter($this->model, $this->state);
		else if ($fileType === self::FILE_STATA)
			return new StataWriter($this->model, $this->state);
		else if ($fileType === self::FILE_R)
			return new RWriter($this->model, $this->state);
		else if ($fileType === self::FILE_XLSX)
			return new XlsxWriter($this->model, $this->state);
		else if ($fileType === self::FILE_SHP)
			return new ShpWriter($this->model, $this->state);
		else
			throw new PublicException('Tipo de archivo de descarga no reconocido');
	}

	private function CreateNextFilePart()
	{
		$fileType = $this->getFileType();
		$writer = $this->getWriter($fileType);

		if($this->state->Step() == self::STEP_BEGIN)
		{
			$writer->SaveHeader();
			$this->state->SetStep(self::STEP_ADDING_ROWS, 'Anexando filas');
			$this->state->Save();
		}
		else if($this->state->Step() == self::STEP_ADDING_ROWS)
		{
			if (!$writer->PageData())
			{
				$this->state->SetStep(DownloadManager::STEP_CREATED, 'Consolidando archivo');
			}
			$this->state->Save();
		}
		else if($this->state->Step() == self::STEP_CREATED)
		{
			$writer->Flush();
			$this->state->SetStep(DownloadManager::STEP_DATA_COMPLETE, 'Descargando archivo');
			$this->state->Save();
		}
	}

	public static function GetPolygon($type)
	{
		if (strlen($type) < 2)
			return null;
		if (substr($type, 1, 1) === 'w')
			return 'wkt';
		else if (substr($type, 1, 1) === 'g')
			return 'geojson';
		else
			return null;
	}

}

