<?php

namespace helena\classes;

use minga\framework\FrameworkCallbacks;
use helena\classes\App;

class Callbacks extends FrameworkCallbacks
{
	public static $AddressQueried = 0;
	public static $MapsOpened = 0;

	public function RenderTemplate(string $template, array $vals = []) : void
	{
		App::RenderResponse($template, $vals);
	}
	public function RenderMessage(string $template, array $vals = []) : string
	{
		return App::RenderMessage($template, $vals);
	}
	public function EndRequest() : void
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