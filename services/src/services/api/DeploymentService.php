<?php

namespace helena\services\api;

use helena\classes\App;
use minga\framework\MessageBox;
use helena\services\common\BaseService;
use minga\framework\Context;
use minga\framework\ErrorException;
use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Log;
use minga\framework\Str;
use minga\framework\System;
use minga\framework\Zip;

class DeploymentService extends BaseService
{
	private static $validExtensions = ['zip', 'tar.bz2'];

	private function ReverseFile($filename)
	{
		$file = fopen($filename, 'c+b');
		if ($file)
		{
			// Leer el contenido completo del archivo
			$content = fread($file, filesize($filename));
			// Invertir el contenido
			$invertedContent = strrev($content);
			// Mover el puntero al inicio del archivo
			rewind($file);
			// Sobrescribir el archivo con el contenido invertido
			fwrite($file, $invertedContent);
			// Cerrar el archivo
			fclose($file);
		}
	}
	public function ReceiveFile($securityKey, $from = null, $length = null, $inverted = false) : array
	{
		if (!App::Settings()->Keys()->IsDeploymentAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();
		try
		{
			$file = Params::GetUploadedFile('file', self::$validExtensions);
			// invierte los bytes
			if ($inverted)
			{
				$this->ReverseFile($file);
			}
			//
			$dest = $this->GetUpdateFile(IO::GetFileExtension($file));
			if ($from == null || $from == 0)
				IO::Move($file, $dest);
			else
			{
				if ($length != filesize($file))
					throw new ErrorException("El tamaño esperado no coincide.");
				$this->moveFileWithOffset($file, $dest, $from);
			}

			return ['Status' => self::OK];
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}

	private function moveFileWithOffset($source, $destination, $offset = 0)
	{
		$chunkSize = 256 * 1024;
		$sourceFile = fopen($source, 'rb');
		$destFile = fopen($destination, 'cb');
		if (!$sourceFile || !$destFile) {
			throw new ErrorException("No se pudieorn abrir los archivos para realizar la operación 'mover'");
		}
		fseek($destFile, $offset);
		while (!feof($sourceFile)) {
			$chunk = fread($sourceFile, $chunkSize);
			fwrite($destFile, $chunk);
		}
		fclose($sourceFile);
		fclose($destFile);
		unlink($source);
	}

	public function Expand($securityKey) : array
	{
		if (!App::Settings()->Keys()->IsDeploymentAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();
		try
		{
			$file = $this->GetUpdateExistingFile();
			$dest = $this->GetUpdatePath();
			IO::RemoveDirectory($dest);
			IO::EnsureExists($dest);

			if(Str::EndsWith($file, '.zip'))
			{
				$zip = new Zip($file);
				$zip->Extract($dest);
			}
			elseif(Str::EndsWith($file, '.tar.bz2'))
			{
				$cmd = 'tar xf "' . $file . '" -C "' . $dest . '"';
				$ret = System::RunCommandRaw($cmd);
				if($ret['return'] != 0)
					throw new ErrorException("Error al descomprimir. " . print_r($ret, true));
			}
			else
				throw new ErrorException('Tipo de archivo inválido.');
			return ['Status' => self::OK];
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}

	public function Install($securityKey) : array
	{
		if (!App::Settings()->Keys()->IsDeploymentAuthKeyValid($securityKey))
			MessageBox::ThrowAccessDenied();
		try
		{
			$source = $this->GetUpdatePath();
			if(is_dir($source) == false)
				throw new ErrorException('Archivo no encontrado.');

			IO::MoveDirectoryContents($source, Context::Paths()->GetRoot());

			# Borra el zip/tar inicial.
			foreach(self::$validExtensions as $ext)
				IO::Delete($this->GetUpdateFile($ext));

			$twig_cache = Context::Paths()->GetTwigCache();
			IO::ClearDirectory($twig_cache, true);

			return ['Status' => self::OK];
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}

	private function GetUpdateFile(string $ext): string
	{
		if ($ext == "bz2")
			return Context::Paths()->GetTempPath() . '/pendingUpdate.tar.bz2';
		return Context::Paths()->GetTempPath() . '/pendingUpdate.' . $ext;
	}

	private function GetUpdateExistingFile(): string
	{
		foreach (self::$validExtensions as $ext) {
			$file = $this->GetUpdateFile($ext);
			if (file_exists($file))
				return $file;
		}
		throw new ErrorException('No se encontró el archivo.');
	}

	private function GetUpdatePath(): string
	{
		return IO::RemoveExtension($this->GetUpdateFile('dummy'));
	}

	private function ProcessError(\Exception $e) : array
	{
		Log::HandleSilentException($e);
		http_response_code(500);
		if (Context::Settings()->Debug()->debug) {
			$text = $e->getTraceAsString();
		} else
			$text = "";

		return ['Status' => self::ERROR, 'Message' => $e->getMessage(), 'Exception' => $text];
	}
}

