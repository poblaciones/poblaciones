<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\System;
use minga\framework\Log;
use minga\framework\IO;
use minga\framework\ErrorException;

class Python
{
	public static function Execute($scriptName, $args = [])
	{
		$lines = array();
		$python = App::GetPython3Path();
		$script = Paths::GetPythonScriptsPath() . '/' . $scriptName;
		$params = array_merge([$script], $args);

		if (is_dir($python))
			throw new ErrorException('El parámetro al ejecutable de Python debe indicar el ejecutable (/python), no una carpeta: ' . $python);

		if (IO::Exists($python) === false)
			throw new ErrorException('El ejecutable de Python no fue encontrado en ' . $python);
		if (IO::Exists($script) === false)
			throw new ErrorException('El script de Python no fue encontrado en ' . $script);

		$ret = System::Execute($python, $params, $lines);
		if($ret !== 0)
		{
			$err = '';
			$detail =  implode("\n", $params) . "\n-------------------------------\nOutput: " . implode("\n", $lines);
			if(App::Debug() || Context::Settings()->isTesting)
				$err = $detail;
			else
				Log::HandleSilentException(new ErrorException($detail));
			Log::$extraErrorInfo = array_merge([$python], $params);

			throw new ErrorException('Error en la ejecución del script. ' . $err);
		}

		return $lines;
	}
}
