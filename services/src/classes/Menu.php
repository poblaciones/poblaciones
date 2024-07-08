<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\Str;

class Menu
{
	protected $account;
	public static $useEventMenu = false;

	function __construct($account)
	{
		$this->account = $account;
	}

	public static function RegisterAdmin(&$vals)
	{
		$menu = new Menu(Account::Current());
		$menu->RegisterAdminMenu($vals);
	}

	private function RegisterAdminMenu(&$vals)
	{
		$menu_set = array();
		$configurationMenu = array();


		$activityMenu = array();
		$activityMenu[] = self::MenuItem('ADMIN', '/logs/activity', 'Actividad');
		$activityMenu[] = self::MenuItem('PERFORMANCE', '/logs/performance', 'Rendimiento');
		$activityMenu[] = self::MenuItem('SEARCHLOG', '/logs/search', 'Búsquedas');
		$activityMenu[] = self::MenuItem('TRAFFIC', '/logs/traffic', 'Tráfico');
		$activityMenu[] = self::MenuItem('ERRORS', '/logs/errors', 'Errores');

		$configurationMenu = array();
		$configurationMenu[] = self::MenuItem('PLATFORM', '/logs/platform', 'Plataforma');
		$configurationMenu[] = self::MenuItem('PLUGINS', '/logs/plugins', 'Plugins');
		$configurationMenu[] = self::MenuItem('CACHES', '/logs/caches', 'Cachés');
		$configurationMenu[] = self::MenuItem('TESTS', '/logs/tests', 'Tests');

		if(Session::IsMegaUser())
		{
			$menu_set['Actividad'] = $activityMenu;
			$menu_set['Configuración'] = $configurationMenu;
		}
		$vals['menu_set'] = $menu_set;
	}

	public static function MenuSet($link, $children)
	{
		return array("link" => $link,	"items" => $children);
	}

	public static function MenuItem($key, $url, $link = "", $linkLong = '', $publicUrl = "")
	{
		if (Context::Settings()->GetPublicUrl() != "" &&
				Str::StartsWith($url, Context::Settings()->GetPublicUrl()) == false &&
				Str::StartsWith($url, "javascript:") == false &&
				Str::StartsWith($url, "http:") == false)
			$url = Context::Settings()->GetPublicUrl() . $url;
		return array("key" => $key,	"url" => $url, "link" => $link,	"link_long" => $linkLong, "public_url" => $publicUrl);
	}
}
