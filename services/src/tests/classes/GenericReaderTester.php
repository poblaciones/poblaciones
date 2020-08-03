<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\CsvReader;
use helena\classes\Paths;
use helena\classes\TestCase;

use helena\classes\readers\BaseReader;

use minga\framework\IO;
use minga\framework\FileBucket;

class GenericReaderTester
{
	private $test;
	private $bucket = null;
	function __construct($test)
	{
		$this->test = $test;
	}
	public function cleanUp()
	{
		if ($this->bucket)
			$this->bucket->Delete();
	}
	public function testReadFile($file, $sheetName, $expectedHeaderSize, $expectedOutSize)
	{
		$extension = IO::GetFileExtension($file);
		$fileOnly = IO::GetFilenameNoExtension($file);

		$bucket = FileBucket::Create();
		$this->bucket = $bucket;

		IO::Copy($file, $bucket->path . '/file.dat');

		$reader = BaseReader::CreateReader($bucket->path, $extension);

		$reader->Prepare($sheetName);
		$reader->WriteJson($sheetName);

		$this->test->assertFile($reader->OutputHeaderFilename(), $expectedHeaderSize, 'Header de archivo: ' . $fileOnly . '.' . $extension);

		$this->test->assertFile($reader->OutputDataFilename(), $expectedOutSize, 'data_00001 de archivo: ' . $fileOnly . '.' . $extension);
	}
}