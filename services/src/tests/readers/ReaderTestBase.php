<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\readers\BaseReader;
use helena\classes\TestCase;
use minga\framework\IO;
use minga\framework\FileBucket;

class ReaderTestBase extends TestCase
{
	private $bucket = null;

	public function cleanUp()
	{
		if ($this->bucket)
			$this->bucket->Delete();
	}
	public function readAndCheckFile($file, $selectedSheetIndex, $expectedHeaderSize, $expectedOutSize)
	{
		$extension = IO::GetFileExtension($file);
		$fileOnly = IO::GetFilenameNoExtension($file);

		$bucket = FileBucket::Create();
		$this->bucket = $bucket;

		IO::Copy($file, $bucket->path . '/file.dat');

		$reader = BaseReader::CreateReader($bucket->path, $extension);

		$reader->Prepare($selectedSheetIndex);
		$reader->WriteJson($selectedSheetIndex);

		$this->assertFile($reader->OutputHeaderFilename(), $expectedHeaderSize, 'Header de archivo: ' . $fileOnly . '.' . $extension);

		$this->assertFile($reader->OutputDataFilename(), $expectedOutSize, 'data_00001 de archivo: ' . $fileOnly . '.' . $extension);
	}
}