<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\IO;

class Paths
{
	public static function GetPHPUnitPath()
	{
		return Context::Paths()->GetRoot() . "/vendor/phpunit/phpunit/phpunit";
	}

	public static function GetPythonScriptsPath()
	{
		return Context::Paths()->GetRoot() . "/py";
	}

	public static function GetResourcesPath()
	{
		return Context::Paths()->GetRoot() . "/resources";
	}

	public static function GetMessageTemplatesPath()
	{
		return Context::Paths()->GetRoot() . "/templates/messages";
	}

	public static function GetDbEntitiesPath()
	{
		return Context::Paths()->GetRoot() . '/src/entities/backoffice';
	}

	public static function GetTemplatePaths()
	{
		return self::GetCommonPaths('templates');
	}

	private static function GetCommonPaths($preffix, $suffix = '')
	{
		$ret = array(Context::Paths()->GetRoot() . "/" . $preffix . "/common" . $suffix,
			Context::Paths()->GetRoot() . "/" . $preffix . "/authenticate" . $suffix,
			Context::Paths()->GetRoot() . "/" . $preffix . "/backoffice" . $suffix,
			Context::Paths()->GetRoot() . "/" . $preffix . "/logs" . $suffix,
			Context::Paths()->GetRoot() . "/" . $preffix . "/frontend" . $suffix);
		$ret = self::CleanPaths($ret);
		return $ret;
	}

	public static function GetMacrosPaths()
	{
		return self::GetCommonPaths('templates', '/macros');
	}

	public static function GetMessagesPaths()
	{
		return self::GetCommonPaths('templates', '/messages');
	}

	public static function CleanPaths($paths)
	{
		$ret = array();
		foreach($paths as $path)
			if (file_exists($path))
				$ret[] = $path;
		return $ret;
	}

	public static function GetSitemapFolder()
	{
		return Context::Paths()->GetStorageRoot(). '/sitemaps';
	}

    public static function GetNavigationFolder()
    {
        return Context::Paths()->GetStorageRoot() . '/navigation';
    }

    public static function GetGradientsFolder()
	{
		return Context::Paths()->GetStorageRoot(). '/gradients';
	}

	public static function GetSerializerPath()
	{
		$ret = Context::Paths()->GetRoot() . '/serializer_cache';
		IO::EnsureExists($ret);
		return $ret;
	}

	public static function GetDoctrineProxiesPath()
	{
		$ret = Context::Paths()->GetRoot() . '/doctrine_proxies';
		IO::EnsureExists($ret);
		return $ret;
	}

	public static function GetStatisticsPath()
	{
		$ret = Context::Paths()->GetStorageRoot() .'/stats';
		return $ret;
	}

	public static function GetAdminCacheLocalPath()
	{
		$ret = Context::Paths()->GetStorageData() .'/admin/cache';
		IO::EnsureExists($ret);
		return $ret;
	}

	public static function GetImagesLocalPath()
	{
		return Context::Paths()->GetRoot() . '/images';
	}

	public static function GetTestsLocalPath()
	{
		return Context::Paths()->GetRoot() . "/src/tests";
	}

	public static function GetTestsDataLocalPath()
	{
		return self::GetTestsLocalPath() . "/data";
	}

	public static function GetTestsConfigLocalPath()
	{
		return self::GetTestsLocalPath() . "/config";
	}

}
