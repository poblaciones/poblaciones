<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\System;
use minga\framework\Log;
use minga\framework\IO;
use minga\framework\PublicException;

class Python
{
	public static function Execute($scriptName, $args = [])
	{
		$lines = array();
		$python = App::GetPython3Path();
		$script = Paths::GetPythonScriptsPath() . '/' . $scriptName;
		$params = array_merge([$script], $args);

		if (is_dir($python))
			$python .= "/python";

		if (IO::Exists($python) === false)
			throw new PublicException('El ejecutable de Python no fue encontrado: ' . $python);
		if (IO::Exists($script) === false)
			throw new PublicException('El script de Python no fue encontrado en ' . $script);

		$ret = System::Execute($python, $params, $lines);
		if($ret !== 0)
		{
			$detail =  implode("\n", $params) . "\n-------------------------------\nOutput: " . implode("\n", $lines);
			Log::$extraErrorInfo = array_merge([$python], $params);
			if(App::Debug() || Context::Settings()->isTesting)
			{
				$err = $detail;
				throw new PublicException('Error en la ejecución del script. ' . $err);
			}
			else
			{
				Log::HandleSilentException(new PublicException($detail));
				throw new PublicException('Error en la ejecución del script.');
			}
		}

		return $lines;
	}
}
