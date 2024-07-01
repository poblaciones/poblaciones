<?php

namespace helena\services\api;

use helena\services\common\BaseService;
use minga\framework\Context;
use minga\framework\ErrorException;
use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Str;
use minga\framework\System;
use minga\framework\Zip;
use minga\framework\security\SecureTransport;

class UpdateService extends BaseService
{
	private static $validExtensions = ['zip', 'tar.bz2'];

	private function GetUpdateFile(string $ext) : string
	{
		if($ext == "bz2")
			return Context::Paths()->GetTempPath() . '/pendingUpdate.tar.bz2';
		return Context::Paths()->GetTempPath() . '/pendingUpdate.' . $ext;
	}

	private function GetUpdateExistingFile() : string
	{
		foreach(self::$validExtensions as $ext)
		{
			$file = $this->GetUpdateFile($ext);
			if(file_exists($file))
				return $file;
		}
		throw new ErrorException('No se encontró el archivo.');
	}

	private function GetUpdatePath() : string
	{
		return IO::RemoveExtension($this->GetUpdateFile('dummy'));
	}

	public function ReceiveFile() : array
	{
		try
		{
			$file = Params::GetUploadedFile('file', self::$validExtensions);
			if(SecureTransport::PostHashIsValid('file', $file) == false)
			{
				IO::Delete($file);
				throw new ErrorException('Falló validación.');
			}

			$dest = $this->GetUpdateFile(IO::GetFileExtension($file));
			IO::Move($file, $dest);
			return ['Status' => self::OK];
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}

	public function Unzip() : array
	{
		try
		{
			if(SecureTransport::UriHashIsValid() == false)
				throw new ErrorException("Pedido inválido.");

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

	public function Install() : array
	{
		try
		{
			if(SecureTransport::UriHashIsValid() == false)
				throw new ErrorException("Pedido inválido.");

			$source = $this->GetUpdatePath();
			if(is_dir($source) == false)
				throw new ErrorException('Archivo no encontrado.');

			IO::MoveDirectory($source, Context::Paths()->GetRoot());

			# Borra el zip/tar inicial.
			foreach(self::$validExtensions as $ext)
				IO::Delete($this->GetUpdateFile($ext));

			return ['Status' => self::OK];
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}

	private function ProcessError(\Exception $e) : array
	{
		http_response_code(400);
		return ['Status' => self::ERROR, 'Message' => $e->getMessage()];
	}
}

