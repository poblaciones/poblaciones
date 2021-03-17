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
		return Context::Settings()->GetHomePublicUrl();
	}
	public static function GetTermsUrl()
	{
		return Context::Settings()->GetHomePublicUrl() . '/terminos';
	}
	public static function GetPrivacyUrl()
	{
		return Context::Settings()->GetHomePublicUrl() . '/privacidad';
	}
	public static function GetInstitutionalUrl()
	{
		return Context::Settings()->GetHomePublicUrl() . '/institucional';
	}
	public static function GetContactUrl()
	{
		return Context::Settings()->GetHomePublicUrl() . '/contacto';
	}
	public static function TooltipUrl()
	{
		return '/services/frontend/tooltip';
	}
	public static function GetWorkUrl($workId)
	{
		return self::GetMapUrl() . '/' .  $workId;
	}
	public static function GetWorkMetadataUrl($workId)
	{
		return '/services/metadata/GetWorkMetadataPdf?w=' . $workId;
	}
	public static function GetMetadataUrl($metadataId)
	{
		return '/services/metadata/GetMetadataPdf?m=' . $metadataId;
	}
	public static function GetWorkMetricUrl($workId, $metricId, $regionItemId)
	{
 		// http://desa.poblaciones.org/map/3501/#/l=6301&!r19166
		if ($workId)
			$basePart = self::GetWorkUrl($workId);
		else
			$basePart = self::GetMapUrl();
		$regionPart = ($regionItemId ? '/&!r' . $regionItemId : '');
		$metricPart = ($metricId ? '/l=' . $metricId : '');
		return $basePart . '/#' . $regionPart . $metricPart;
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

