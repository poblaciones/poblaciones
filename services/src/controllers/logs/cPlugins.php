<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;

use helena\classes\Session;
use helena\classes\Menu;

use minga\framework\IO;
use minga\framework\Arr;
use minga\framework\Context;
use minga\framework\Request;
use helena\classes\Paths;


class cPlugins extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		// Pone atributos
		$list = self::GetPlugins();
		$path = Request::GetLastUriPart();
		if (Arr::IndexOfByNamedValue($list, 'key', $path) != -1)
		{
			return $this->ResolvePlugin($path);
		}
		$this->AddValue('plugins', $list);
		$this->AddValue('action_url', "/logs/plugins");

		// Pone el menu
		Menu::RegisterAdmin($this->templateValues);

		// Listo
		$this->title = 'Plugins';
		return $this->Render('plugins.html.twig');
	}
	private function GetMain($pl)
	{
		$pluginPath = Paths::GetPluginsPath();
		return $pluginPath . '/' . $pl . '/main.php';
	}
	public static function GetPlugins()
	{
		$pluginPath = Paths::GetPluginsPath();
		$plugins = IO::GetDirectories($pluginPath);
		$ret = [];
		foreach($plugins as $plugin)
		{
			$ret[] = [ 'key' => $plugin, 'name' => $plugin];
		}
		return $ret;
	}
	private function ResolvePlugin($pl)
	{
		$plugins = self::GetPlugins();
		foreach ($plugins as $plugin) {
			if ($plugin['key'] == $pl)
			{
				include_once $this->GetMain($pl);
				exit;
			}
		}
	}
	public function Post()
	{
		if (array_key_exists('plugin', $_GET))
		{
			$file = cActivity::ResolveData();
			IO::Delete($file);
			$this->message = 'Estadística recalculada con éxito.';
		}
		return $this->Show();
	}

}
