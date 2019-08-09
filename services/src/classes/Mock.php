<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Str;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\PhpSession;
use minga\framework\ErrorException;

use helena\classes\Paths;

use Twig\Environment;
use Twig\Extension\StringLoaderExtension;
use Twig\Loader\FilesystemLoader;

use JMS\Serializer\SerializerBuilder;
use JMS\Serializer\SerializationContext;
use JMS\Serializer\Naming\IdenticalPropertyNamingStrategy;

use Symfony\Component\PropertyInfo\Extractor\ReflectionExtractor;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class Mock
{
	public static $isMocking = true;

	public static function SaveJson($value)
	{
		if (!self::$isMocking)
			return;

		$fullFilename = self::resolveFilename('json', true);
		$text = json_encode($value);
		IO::WriteAllText($fullFilename, $text);
	}
	public static function LoadRequest()
	{
		$filename = self::resolveFilename('', false, true);
		$ext = 'json';
		$file = $filename . $ext;

		if (file_exists($file))
		{
			$value = IO::ReadAllText($file);
			$response = new Response($value);
			$response->headers->set('Content-Type', 'application/json');
			return $response;
		}
		else
			throw new ErrorException('Content not found in mock cache.');
	}
	public static function SaveText($text, $isJson = true)
	{
		if (!self::$isMocking)
			return;

		$ext = ($isJson ? 'json' : 'html');
		$fullFilename = self::resolveFilename($ext, true);
		IO::WriteAllText($fullFilename, $text);
	}
	private static function resolveFilename($ext, $createFolder = false, $removeMockFromPath = false)
	{
		$queryStringLength = strlen($_SERVER['QUERY_STRING']);
		if ($queryStringLength > 0) $queryStringLength++;
		$uriOnly = substr($_SERVER['REQUEST_URI'], 0, strlen($_SERVER['REQUEST_URI']) - $queryStringLength);

		if ($removeMockFromPath)
			$uriOnly = substr($uriOnly, 5);

			//Context::Paths()->GetMockPath()
		$folder =  Context::Paths()->GetTempPath()  . $uriOnly ;
		if ($createFolder)
			IO::EnsureExists($folder);
		$filePart = $_SERVER['QUERY_STRING'];
		if (strlen($filePart) > 32)
			$filePart = hash('md5', $filePart);

		$file = 'data' . $filePart;
		$fullFilename = $folder  . '/' . $file . "." . $ext;
		return $fullFilename;
	}
}
