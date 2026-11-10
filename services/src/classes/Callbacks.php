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
	public static $UniqueUsers = 0;

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
	// Las posiciones se conservan para no alterar el histórico: 'Sesiones sin cookie'
	// (posición 2) ya no se registra y 'Usuarios únicos' se agrega al final.
	public function ExtraHitsLabels() : array
	{
		if (App::Settings()->Keys()->GetGoogleMapsCount() == 1)
			return ['MapsOpened', 'AddressQuery', 'Sesiones sin cookie (histórico)', '', '', 'Errores', 'Usuarios únicos'];
		else
			return ['MapsOpened', 'AddressQuery', 'Sesiones sin cookie (histórico)', 'Secondary', 'Terciary', 'Errores', 'Usuarios únicos'];
	}
	public function ExtraHits() : array
	{
		$errorCount = Performance::GetCurrentErrorCount();
		$secondary = 0;
		$tertiary = 0;

		if (App::Settings()->Keys()->GetGoogleMapsCount() > 1)
		{
			if (App::Settings()->Keys()->GetGoogleMapsIndex() == 1)
				$secondary = self::$MapsOpened;
			else if (App::Settings()->Keys()->GetGoogleMapsIndex() == 2)
				$tertiary = self::$MapsOpened;
		}
		return [ self::$MapsOpened, self::$AddressQueried, 0, $secondary, $tertiary, $errorCount, self::$UniqueUsers ];
	}
}
