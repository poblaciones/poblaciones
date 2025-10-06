<?php

namespace helena\services\common;

use helena\classes\App;
use minga\framework\Performance;
use minga\framework\Str;
use minga\framework\ErrorException;
use helena\classes\GlobalTimer;
use minga\framework\PublicException;

class BaseService
{
	public const OK = "OK";
	public const ERROR = "ERROR";

	public $isDraft = null;

	public function __construct($isDraft = true)
	{
		$this->isDraft = $isDraft;
	}

	protected function makeTableName($table)
	{
		if ($this->isDraft === null) {
			throw new ErrorException('Debe indicarse el modo de trabajo (borrador/publicado)');
		}
		if ($this->isDraft)
			return 'draft_' . $table;
		else
			return $table;
	}

	protected function ApplyDraft($entityName)
	{
		if ($this->isDraft === null) {
			throw new ErrorException('Debe indicarse el modo de trabajo (borrador/publicado)');
		}

		if (!$this->isDraft) {
			$parts = explode("\\", $entityName);
			$last = $parts[count($parts) - 1];

			// quitar el prefijo solo si está al inicio
			if (Str::StartsWith($last, "Draft")) {
				$last = substr($last, strlen("Draft"));
			}
			$parts[count($parts) - 1] = $last;
			return implode("\\", $parts);
		}
		return $entityName;
	}

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

