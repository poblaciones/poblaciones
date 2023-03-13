<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\classes\App;

use helena\classes\Session;
use helena\classes\Menu;
use helena\classes\Paths;

use minga\framework\IO;
use minga\framework\Str;
use minga\framework\Date;
use minga\framework\Context;

use helena\classes\Remember;

class cActivity extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		// Pone atributos
		$cacheData = self::ResolveData();
		$spaceData = json_decode(IO::ReadAllText($cacheData), true);
		if (!array_key_exists('total_orphan_size', $spaceData)) $spaceData['total_orphan_size'] = 0;
		if (!array_key_exists('total_tmp_size', $spaceData)) $spaceData['total_tmp_size'] = 0;

		foreach($spaceData as $key => $value)
			$this->AddValue($key, $value);

		$this->AddValue('action_url', "/logs/activity");

		// Pone el menu
		Menu::RegisterAdmin($this->templateValues);

		// Listo
		$this->title = 'Actividad';
		return $this->Render('activity.html.twig');
	}

	public static function ResolveData()
	{
		$cachedData = Paths::GetAdminCacheLocalPath() . '/activity.txt';
		if (file_exists($cachedData) == false)
		{
			$data = self::ResolveSpace();
			$data['dateCache'] = Date::UserFormattedAr(Date::ArNow());
			IO::WriteAllText($cachedData, json_encode($data));
		}
		return $cachedData;
	}
	public function Post()
	{
		$file = self::ResolveData();
		IO::Delete($file);
		$this->message = 'Estadística recalculada con éxito.';
		return $this->Show();
	}

	public function ResolveDbSpacePerUser()
	{
		// Obtiene la lista de cartografías del usuario.

		// Obtiene la lista de adjuntos de esas cartografías.
		// Obtiene la lista de datasets de esas cartografías.

		// Suma los work_draft, work_public y work_public_snapshot de esos datos.
		// Suma los adjuntos

	}
	static function ResolveSpace()
	{
		$vals = array();
		self::ResolveSiteSpace($vals);
		return $vals;
	}

	static function SafeDivKb($a)
	{
		return self::SafeDiv($a, 1024);
	}

	static function SafeDiv($a, $b)
	{
		if ($b == 0) return 0;
		return $a / $b;
	}
	static function ResolveSiteSpace(&$vals)
	{
		// Calcula espacio del sitio
		$dirInfo = IO::GetDirectorySize(Context::Paths()->GetLogLocalPath());

		$vals['log_files_count'] = $dirInfo['inodes'];
		$vals['log_size'] =  round(intval(self::SafeDivKb($dirInfo['size'])) / 1024, 2);

		$cachePath = Context::Paths()->GetStorageCaches();
		$cacheInfo = IO::GetDirectorySize($cachePath);
		$vals['caches_files_count'] = $cacheInfo ['inodes'];
		$vals['caches_size'] =  round(intval(self::SafeDivKb($cacheInfo ['size'])) / 1024, 2);
		// trae todo los cachés de services
		$parentCacheDirs = IO::GetDirectories($cachePath . '/services');
		$caches = array();
		foreach($parentCacheDirs as $cacheGroup)
		{
			$cacheDirs = IO::GetDirectories($cachePath . '/services/' . $cacheGroup);
			foreach($cacheDirs as $cacheDir)
			{
				$cacheInfo = IO::GetDirectorySize($cachePath . '/services/' . $cacheGroup . '/' . $cacheDir);
				$cacheData = array('files_count' => $cacheInfo ['inodes'],
							'size' => round(intval(self::SafeDivKb($cacheInfo ['size'])) / 1024, 2),
							'label' => 'services/' . $cacheGroup . '/' . $cacheDir);
				$caches[] = $cacheData;
			}
		}
		$vals['caches'] = $caches;

		$indexSpace = App::Db()->GetDBSize();

		$vals['total_data_size'] = Str::SizeToHumanReadable($indexSpace['data']+$indexSpace['index']);
		$vals['index_data_size'] = Str::SizeToHumanReadable($indexSpace['data']);
		$vals['index_index_size'] = Str::SizeToHumanReadable($indexSpace['index']);

		$orphanSpace = App::GetOrphanSize();
		$vals['total_orphan_size'] = Str::SizeToHumanReadable($orphanSpace['size']);

		$tmpSpace = App::GetTmpSize();
		$vals['total_tmp_size'] = Str::SizeToHumanReadable($tmpSpace['size']);

		$dirInfo = IO::GetDirectorySize(Context::Paths()->GetRoot());

		$totalSize = $dirInfo['size'] + $indexSpace['data'] + $indexSpace['index'];
		$vals['total_size'] = round($totalSize / 1024 / 1024, 2);
		$vals['total_disk_size'] = Str::SizeToHumanReadable($dirInfo['size']);
		$vals['total_inodes'] = $dirInfo['inodes'];
	}

}
