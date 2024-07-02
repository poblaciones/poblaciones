<?php

namespace helena\services\api;

use helena\classes\App;
use helena\classes\Python;

use minga\framework\Context;
use minga\framework\Log;
use minga\framework\IO;
use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\MessageBox;

use helena\services\common\BaseService;

use minga\framework\FileBucket;

class BackupService extends BaseService
{
	private $bucket;
	private $state = array();

	const STATE_FILE = 'state.json';

	public function CreateJob($securityKey, $lastBackupDate = '')
	{
		if (!App::Settings()->Keys()->IsRemoteBackupAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();

		$bucket = FileBucket::Create();
		// guarda $lastBackupDate
		$this->state['lastBackupDate'] = $lastBackupDate;
		$this->state['pendigBytes'] = -1;
		$this->state['pendingTables'] = -1;
		$this->state['totalBytes'] = -1;
		$this->state['totalTables'] = -1;

		// guarda
		$this->bucket = $bucket;
		$this->Save();

		return ['id' => $bucket->id];
	}
	private function Status()
	{
		return [
			'Status' => 'CONTINUE',
			'currentBytes' => $this->state['totalBytes'] - $this->state['pendingBytes'],
			'currentTable' => $this->state['totalTables'] - $this->state['pendingTables'],
			'totalBytes' => $this->state['totalBytes'],
			'totalTables' => $this->state['totalTables']
		];
	}

	public function StepJob($securityKey, $key, $returnOnlyFlowControl = false)
	{
		if (!App::Settings()->Keys()->IsRemoteBackupAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();

		$this->LoadFromKey($key);

		if ($returnOnlyFlowControl)
			return $this->Status();

		$result = $this->Iterate();
		$this->Save();

		if ($result == 1)
			return $this->Status();
		if ($result == 2)
			return [ 'Status' => 'COMPLETE' ];
		if ($result == 3)
			return [ 'Status' => 'FAILED' ];
		if ($result == 4)
			return [ 'Status' => 'UNEXPECTED ERROR' ];
	}

	public function StepFiles($securityKey, $key, $n)
	{
		if (!App::Settings()->Keys()->IsRemoteBackupAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();
		$this->LoadFromKey($key);

		$path = $this->bucket->path;
		$files = IO::GetFilesRecursive($path, '', true);
		Arr::Remove($files, $path . '/state.json');
		if ($n > sizeof($files))
		{
			return ['Status' => 'COMPLETE'];
		}
		if ($n == 0)
		{
			$size = 0;
			foreach ($files as $file)
				$size += filesize($file);
			return ['Filessize' => $size, 'Filecount' => sizeof($files)];
		}
		// Manda el archivo
		$file = $files[$n - 1];
		if (Str::EndsWith($file, ".zip"))
			$contentType = 'application/zip';
		elseif (Str::EndsWith($file, ".json"))
			$contentType = 'application/json';
		else
			$contentType = 'text/plain';
		// Calcula la carpeta
		$folder = substr($file, strlen($path));
		$i = strrpos($folder, '/');
		$relativeFolder = substr($folder, 1, $i);

		$this->SendFile($file, $relativeFolder, $contentType);
	}

	private function SendFile(string $filename, string $folder, string $contentType): void
	{
		$size = filesize($filename);

		// send the right headers
		header('Content-Type: ' . $contentType);
		header('Content-Length: ' . $size);
		header('Content-Disposition: filename="' . stripslashes($folder . basename($filename)) . '"');

		if (ob_get_length())
			ob_clean();
		flush();

		if ($size < 15 * 1024 * 1024)
			ob_start();
		else if (ob_get_length())
			ob_end_flush();

		readfile($filename);
		exit;
	}

	///////////////
	private function Save()
	{
		IO::WriteJson($this->bucket->path . '/' . self::STATE_FILE, $this->state, true);
	}

	private function LoadFromKey($key)
	{
		if ($key == "")
			throw new PublicException('No se ha indicado el identificador de datos del proceso.');
		if (Str::Contains($key, "..") || Str::Contains($key, "/") || Str::Contains($key, "\\") || Str::Contains($key, " "))
			throw new PublicException('El identificador de datos del proceso no es válido.');
		$bucket = FileBucket::Load($key);
		$this->bucket = $bucket;
		$folder = $bucket->GetBucketFolder();
		$this->state = IO::ReadJson($folder . '/' . self::STATE_FILE);
	}

	private function Iterate()
	{
		// Ejecuta un paso
		$args = ["backup", "--host", Context::Settings()->Db()->Host, "--user", Context::Settings()->Db()->User,
					"--output_path", $this->bucket->path,
			"--password", Context::Settings()->Db()->Password, "--database", Context::Settings()->Db()->Name,
						"--exclude_tables", "tmp_*", "--step_by_step"];

		if ($this->state['totalBytes'] != -1)
			$args[] = '--resume';

		$output = Python::Execute("bcup", $args);

		$pendingBytes = $this->getFromLinesInt($output, 'Pending bytes');
		$pendingTables = $this->getFromLinesInt($output, 'Pending tables');

		$this->state['pendingBytes'] = $pendingBytes;
		$this->state['pendingTables'] = $pendingTables;

		if ($this->state['totalBytes'] == -1)
			$this->state['totalBytes'] = $pendingBytes;
		if ($this->state['totalTables'] == -1)
			$this->state['totalTables'] = $pendingTables;

		 if ($this->hasLine($output, '--- STEP COMPLETED'))
			 return 1;
		 else if ($this->hasLine($output, '--- BACKUP COMPLETED'))
			 return 2;

		 // Salió con error
		Log::HandleSilentException(new \Exception("Backup failed\n\n" . implode("\n", $output)));

		 if ($this->hasLine($output, '--- BACKUP FAILED'))
			 return 3;
		 else
			 return 4;
	}

	private function getFromLinesInt($lines, $text)
	{
		$cad = $this->getFromLines($lines, $text);
		if($cad == "")
			return -1;
		else
			return (int) $cad;
	}

	private function getFromLines($lines, $text, $default = "")
	{
		for($n = sizeof($lines) - 1; $n >= 0; $n--)
		{
			$current = $lines[$n];
			if (Str::StartsWith($current, $text))
			{
				$ret = substr($current, strlen($text));
				if (Str::StartsWith($ret, ":"))
					$ret = substr($ret, 1);
				$ret = trim($ret);
				return $ret;
			}
		}
		return $default;
	}

	private function hasLine($lines, $text)
	{
		for($n = sizeof($lines) - 1; $n >= 0; $n--)
		{
			$current = $lines[$n];
			if (Str::StartsWith($current, $text))
			{
				return true;
			}
		}
		return false;
	}

	public function CheckVersion($version) {
		if ($version != 1)
			MessageBox::ThrowMessage("Incorrect API version specified. Suggested parameter: v=1");
	}
}

