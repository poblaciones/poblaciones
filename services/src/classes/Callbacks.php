<?php

namespace helena\classes;

use minga\framework\FrameworkCallbacks;
use minga\framework\Db;
use minga\framework\Performance;
use helena\classes\App;

class Callbacks extends FrameworkCallbacks
{
	public static $AddressQueried = 0;
	public static $MapsOpened = 0;

	public function RenderTemplate(string $template, $vals = []) : void
	{
		App::RenderResponse($template, $vals);
	}
	public function RenderMessage(string $template, $vals = []) : string
	{
		return App::RenderMessage($template, $vals);
	}
	public function EndRequest() : void
	{
		App::EndRequest();
	}
	public function Db() : Db
	{
		return App::Db();
	}
	public function ExtraHitsLabels() : array
	{
		if (App::Settings()->Keys()->GetGoogleMapsCount() == 1)
			return ['MapsOpened', 'AddressQuery', 'Usuarios únicos', '', '', 'Errores'];
		else
			return ['MapsOpened', 'AddressQuery', 'Usuarios únicos', 'Secondary', 'Terciary', 'Errores'];
	}
	public function ExtraHits() : array
	{
		$errorCount = Performance::GetCurrentErrorCount();

		if (App::Settings()->Keys()->GetGoogleMapsCount() == 1)
			return [ self::$MapsOpened, self::$AddressQueried, Session::$NewSession, 0, 0, $errorCount ];
		// Tiene varias
		$useSecondary = (App::Settings()->Keys()->GetGoogleMapsIndex() == 1);
		$useTertiary = (App::Settings()->Keys()->GetGoogleMapsIndex() == 2);

		if ($useSecondary)
			return [ self::$MapsOpened, self::$AddressQueried, Session::$NewSession, self::$MapsOpened, 0, $errorCount ];
		else if ($useTertiary)
			return [ self::$MapsOpened, self::$AddressQueried, Session::$NewSession, 0, self::$MapsOpened, $errorCount ];
		else
			return [ self::$MapsOpened, self::$AddressQueried, Session::$NewSession, 0, 0, $errorCount ];

	}
}
