<?php

namespace helena\classes;

use minga\framework\FrameworkCallbacks;
use helena\classes\App;

class Callbacks extends FrameworkCallbacks
{
	public static $AddressQueried = 0;
	public static $MapsOpened = 0;

	public function RenderTemplate($template, $vals = null)
	{
		return App::RenderResponse($template, $vals);
	}
	public function RenderMessage($template, $vals = null)
	{
		return App::RenderMessage($template, $vals);
	}
	public function EndRequest()
	{
		App::EndRequest();
	}
	public function Db()
	{
		return App::Db();
	}
	public function ExtraHitsLabels()
	{
		return ['MapsOpened', 'AddressQuery', 'Usuarios únicos'];
	}
	public function ExtraHits()
	{
		return [ self::$MapsOpened, self::$AddressQueried, Session::$NewSession ];
	}
}