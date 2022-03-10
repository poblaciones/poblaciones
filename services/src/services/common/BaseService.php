<?php

namespace helena\services\common;

use helena\classes\App;
use minga\framework\Performance;
use minga\framework\Context;
use helena\classes\GlobalTimer;
use minga\framework\PublicException;

class BaseService
{
	const OK = "OK";

	public function GetBaseUrl()
	{
		return App::Request()->getSchemeAndHttpHost()
			. App::Request()->getBaseUrl();
	}
	public static function Shardified($id)
	{
		return $id * 100 + App::Settings()->Shard()->CurrentShard;
	}

	public function GotFromCache($data)
	{
		if (!Performance::IsCacheMissed())
			Performance::SetMethod('cache');

		$data->EllapsedMs = GlobalTimer::EllapsedMs();
		$steps = GlobalTimer::GetSteps();
		if (sizeof($steps) > 0)
		{
			array_unshift($steps, $data->EllapsedMs);
			$data->EllapsedMs = $steps;
		}
		$data->Cached = 1;
		return $data;
	}

	public function RedirectToRoute($route, array $params = array(), $status = 302)
	{
		return App::RedirectParams(
			$route, $params, $status);
	}

	protected function CheckNotNullNumeric($param)
	{
		if ($param === "" || $param === null)
			throw new PublicException("Parameter required.");
		if (!is_numeric($param))
			throw new PublicException("Numeric parameter required.");
	}
	protected function CheckNotNumericNullable(& $param)
	{
		if ($param === "" || $param === null || $param === "null")
		{
			$param = null;
			return;
		}
		if (!is_numeric($param))
			throw new PublicException("Numeric nullable parameter required.");
	}

}

