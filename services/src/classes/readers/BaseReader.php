<?php

namespace helena\classes\readers;

use minga\framework\IO;
use minga\framework\PublicException;

class BaseReader
{
	protected $folder;

	protected $sourceFile;
	protected $extension;
	protected $intermediateFile;

	function __construct($folder, $extension)
	{
		$this->folder = $folder;
		$this->extension = $extension;

		$this->sourceFile = $folder . '/file.dat';
		$this->intermediateFile = $folder . '/file_' . $extension . '.dat';
	}

	public static function CreateReader($path, $fileExtension)
	{
		if ($fileExtension == "csv" || $fileExtension == "txt")
			return new CsvReader($path, $fileExtension);
		else if ($fileExtension == "xlsx" || $fileExtension == "xls")
			return new XlsxReader($path, $fileExtension);
		else if ($fileExtension == "sav")
			return new SavReader($path, $fileExtension);
		else if ($fileExtension == "kml" || $fileExtension == "kmz")
			return new KmxReader($path, $fileExtension);
		else
			throw new PublicException('La extensión del archivo debe ser CSV, TXT, XLSX, XLS, SAV, KML o KMZ. Extensión recibida: ' . $fileExtension);
	}

	public function Prepare($sheetName)
	{
	}

	public function WriteJson($sheetName)
	{
	}

	public function ReadSheetNames()
	{
		return [];
	}

	public function OutputHeaderFilename()
	{
		return $this->folder . '/header.json';
	}

	public function OutputDataFilename()
	{
		return $this->folder . '/data_00001.json';
	}

	protected function PrepareIntermediateFile()
	{
		if (!file_exists($this->intermediateFile))
		{
			IO::Move($this->sourceFile, $this->intermediateFile);
		}
		return $this->intermediateFile;
	}

}

