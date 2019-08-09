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
		$activityMenu[] = self::MenuItem('ADMIN', '/admin/activity', 'Actividad');
		$activityMenu[] = self::MenuItem('PERFORMANCE', '/admin/performance', 'Rendimiento');
		$activityMenu[] = self::MenuItem('SEARCHLOG', '/admin/search', 'Búsquedas');
		$activityMenu[] = self::MenuItem('TRAFFIC', '/admin/traffic', 'Tráfico');
		$activityMenu[] = self::MenuItem('ERRORS', '/admin/errors', 'Errores');

		$configurationMenu = array();
		$configurationMenu[] = self::MenuItem('PLATFORM', '/admin/platform', 'Plataforma');
		$configurationMenu[] = self::MenuItem('CACHES', '/admin/caches', 'Cachés');

		$contentsMenu = array();
		$contentsMenu[] = self::MenuItem('PUBLICDATADRAFT', '/admin/publicDataDraft', 'Datos públicos');
		$contentsMenu[] = self::MenuItem('CARTOGRAPHIESDRAFT', '/admin/cartographiesDraft', 'Cartografías');
		$contentsMenu[] = self::MenuItem('INSTITUTIONSDRAFT', '/admin/institutionsDraft', 'Instituciones');
		$contentsMenu[] = self::MenuItem('SOURCESDRAFT', '/admin/sourcesDraft', 'Fuentes');
		$contentsMenu[] = self::MenuItem('CATEGORIESDRAFT', '/admin/categoriesDraft', 'Categorías');
		$contentsMenu[] = self::MenuItem('CONTACTDRAFT', '/admin/contactDraft', 'Contacto');

		$menu_set['Contenidos de usuario'] = $contentsMenu;

		$publicMenu = array();
		$publicMenu[] = self::MenuItem('PUBLICDATA', '/admin/publicData', 'Datos públicos');
		$publicMenu[] = self::MenuItem('CARTOGRAPHIES', '/admin/cartographies', 'Cartografías');
		$publicMenu[] = self::MenuItem('INSTITUTIONS', '/admin/institutions', 'Instituciones');
		$publicMenu[] = self::MenuItem('SOURCES', '/admin/sources', 'Fuentes');
		$publicMenu[] = self::MenuItem('CATEGORIES', '/admin/categories', 'Categorías');
		$publicMenu[] = self::MenuItem('CONTACT', '/admin/contact', 'Contacto');

		$menu_set['Contenidos públicos'] = $publicMenu;

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
