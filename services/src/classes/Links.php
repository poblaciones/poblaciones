<?php

namespace helena\classes;

use minga\framework\Context;

class Links
{
	public static function GetFullyQualifiedUrl($url)
	{
		if ($url === null || $url === '') return $url;
		return Context::Settings()->GetPublicUrl() . $url;
	}
	public static function GetBackofficeUrl()
	{
		return self::GetFullyQualifiedUrl('/users/');
	}
	public static function GetHomeUrl()
	{
		return Context::Settings()->GetMainServerPublicUrl();
	}
	public static function GetTermsUrl()
	{
		return Context::Settings()->GetMainServerPublicUrl() . '/terminos';
	}
	public static function GetPrivacyUrl()
	{
		return Context::Settings()->GetMainServerPublicUrl() . '/privacidad';
	}
	public static function GetInstitutionalUrl()
	{
		return Context::Settings()->GetMainServerPublicUrl() . '/institucional';
	}
	public static function GetContactUrl()
	{
		return Context::Settings()->GetMainServerPublicUrl() . '/contacto';
	}
	public static function TooltipUrl()
	{
		return '/services/frontend/tooltip';
	}
	public static function GetWorkUrl($workId)
	{
		return self::GetMapUrl() . '/' .  $workId;
	}

	public static function GetWorkMetricUrl($workId, $metricId, $regionItemId)
	{
 		// http://desa.poblaciones.org/map/3501/#/l=6301&!r19166
		return self::GetWorkUrl($workId) . '/#/l=' . $metricId . ($regionItemId ? '&!r' . $regionItemId : '');
	}
	public static function GetWorkHandleUrl($workId, $metricId = null, $regionId = null, $regionItemId = null)
	{
		return self::GetHandleUrl() . '/' . $workId . ($metricId !== null ? '/' . $metricId : '') . ($regionId !== null ? '/' . $regionId : '') . ($regionItemId !== null ? '/' . $regionItemId : '');
	}
	public static function GetBackofficeWorkUrl($workId)
	{
		return Context::Settings()->GetPublicUrl() . "/users/#/cartographies/" . $workId;
	}

	public static function GetHandleUrl()
	{
		return '/handle';
	}
	public static function GetMapUrl()
	{
		return '/map';
	}
}

