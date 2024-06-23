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


abstract class BaseDownloadManager
{
	protected const STEP_BEGIN = 0;
	protected const STEP_ADDING_ROWS = 1;
	protected const STEP_CREATED = 2;
	protected const STEP_DATA_COMPLETE = 3;
	protected const STEP_CACHED = 4;

	public const FILE_SPSS = 1;
	public const FILE_CSV = 2;
	public const FILE_SHP = 3;
	public const FILE_XLSX = 4;
	public const FILE_STATA = 5;
	public const FILE_R = 6;

	protected static $validFileTypes = ['s' => [ 'extension' => 'sav', 'Caption' => 'SPSS', 'type' => self::FILE_SPSS],
																		'z' => [ 'extension' => 'zsav', 'Caption' => 'SPSS', 'type' => self::FILE_SPSS],
																		't' => [ 'extension' => 'dta', 'Caption' => 'Stata', 'type' => self::FILE_STATA],
																		'r' => [ 'extension' => 'rdata', 'Caption' => 'R', 'type' => self::FILE_R],
																		'c' => [ 'extension' => 'csv', 'Caption' => 'CSV', 'type' => self::FILE_CSV],
																		'x' => [ 'extension' => 'xlsx', 'Caption' => 'Excel', 'type' => self::FILE_XLSX],
																		'h' => [ 'extension' => 'zip', 'Caption' => 'Shapefile', 'type' => self::FILE_SHP]];

	protected const OUTPUT_LATIN3_WINDOWS_ISO = false;

	protected $start = 0.0;
	protected $model;
	protected $state;

	abstract protected function PutFileToCache();
	abstract protected function LoadState($key);
	abstract protected function LoadModel();

	function __construct()
	{
			$this->start = microtime(true);
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

	protected function GenerateNextFilePart()
	{
		// Continúa creando el archivo
		$this->CreateNextFilePart();
		if($this->state->Step() == self::STEP_DATA_COMPLETE)
			return $this->PutFileToCache();
		else
			return $this->state->ReturnState(false);
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


	protected static function ValidateType($type)
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

	protected function getFileType()
	{
		$validFileTypes = self::$validFileTypes;
		$type = $this->state->Get('type');
		if (array_key_exists($type[0], $validFileTypes))
			return $validFileTypes[$type[0]]['type'];
		else
			throw new PublicException('Tipo de descarga no reconocido');
	}
	protected function getWriter($fileType)
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

	protected function CreateNextFilePart()
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
				$this->state->SetStep(self::STEP_CREATED, 'Consolidando archivo');
			}
			$this->state->Save();
		}
		else if($this->state->Step() == self::STEP_CREATED)
		{
			$writer->Flush();
			$this->state->SetStep(self::STEP_DATA_COMPLETE, 'Descargando archivo');
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

