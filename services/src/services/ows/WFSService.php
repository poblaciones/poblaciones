<?php

namespace helena\services\ows;

use minga\framework\IO;
use helena\classes\Paths;
use minga\framework\PublicException;

use minga\framework\Context;
use minga\framework\System;
use minga\framework\Log;

use helena\classes\Python;
use helena\classes\App;
use helena\services\common\BaseService;

class WFSService extends BaseService
{
	public function GetCapabilities($params)
	{
		$inFile = IO::GetTempFilename();
		$outFile = IO::GetTempFilename();

		IO::WriteJson($inFile, $params);
		$args = [$inFile, $outFile];

		self::Execute('getCapabilities.py', $args);

		return '<?xml version="1.0" encoding="UTF-8"?>' . IO::ReadAllText($outFile);
	}

	public function GetFeature($params)
	{
		$inFile = IO::GetTempFilename();
		$outFile = IO::GetTempFilename();

		IO::WriteJson($inFile, $params);
		$args = [$inFile, $outFile];

		self::Execute('getFeature.py', $args);

		return IO::ReadAllText($outFile);
	}

	public function DescribeFeatureType($params)
	{
		$inFile = IO::GetTempFilename();
		$outFile = IO::GetTempFilename();

		IO::WriteJson($inFile, $params);
		$args = [$inFile, $outFile];

		self::Execute('describeFeatureType.py', $args);

		return '<?xml version="1.0" encoding="UTF-8"?>' . IO::ReadAllText($outFile);
	}

	public static function OWSParameterMissingException($text)
	{
		Log::HandleSilentException(new \Exception($text));
		return App::Response('<ows:ExceptionReport xmlns:xs="http://www.w3.org/2001/XMLSchema"
							xmlns:ows="http://www.opengis.net/ows"
							xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
							 version="1.0.0" xsi:schemaLocation="http://www.opengis.net/ows http://mapa.educacion.gob.ar/geoserver/schemas/ows/1.0.0/owsExceptionReport.xsd">
							<ows:Exception exceptionCode="MissingParameterValue" locator="service">
							<ows:ExceptionText>' . $text . '</ows:ExceptionText>
							</ows:Exception>
							</ows:ExceptionReport>', 'text/xml');
	}
	public static function OWSParameterException($text)
	{
		Log::HandleSilentException(new \Exception($text));
		return App::Response('<ows:ExceptionReport xmlns:xs="http://www.w3.org/2001/XMLSchema"
							xmlns:ows="http://www.opengis.net/ows"
							xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
							 version="1.0.0" xsi:schemaLocation="http://www.opengis.net/ows http://mapa.educacion.gob.ar/geoserver/schemas/ows/1.0.0/owsExceptionReport.xsd">
							<ows:Exception exceptionCode="InvalidParameterValue" locator="service">
							<ows:ExceptionText>' . $text . '</ows:ExceptionText>
							</ows:Exception>
							</ows:ExceptionReport>', 'text/xml');
	}
	public static function Execute($scriptName, $args = [])
	{
		$lines = array();
		$python = "c:\\python27\\python.exe";
		$dir = "D:\\Pablo\\Sociologia\\Mapa Social\\featureserver-master\\fs2";
		$script = $dir . '/' . $scriptName;
		$params = array_merge([$script], $args);

		if (is_dir($python))
			$python .= "/python";

		if (IO::Exists($python) === false)
			throw new PublicException('El ejecutable de Python no fue encontrado: ' . $python);
		if (IO::Exists($script) === false)
			throw new PublicException('El script de Python no fue encontrado en ' . $script);

		chdir($dir);
		$ret = System::Execute($python, $params, $lines);
		if($ret !== 0)
		{
			$detail =  implode("\\n", $params) . "\n-------------------------------\nOutput: " . implode("\n", $lines);
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

