<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use minga\framework\Params;
use helena\classes\App;
use helena\classes\Session;
use helena\classes\Links;
use minga\framework\PublicException;
use minga\framework\Performance;

class cArk extends cPublicController
{
	public function Show()
	{
		Performance::SetController('ark', 'get', true);

		$uri = Request::GetRequestURI(true);
		// Tiene las posibles estructuras:
		// (A) /ark:/13683/<workId>
		// (B) /ark:/13683/<workId>/<metricId>

		$parts = explode('/', $uri);
		array_shift($parts);
		if ($parts[0] !== 'ark:')
			throw new PublicException("Ruta inválida.");
		array_shift($parts);
		$naan = $parts[0];
		if ($naan != App::Settings()->Map()->NAAN)
			throw new PublicException("NAAN en ruta inválido.");
		array_shift($parts);

		$workId = Params::CheckParseIntValue($parts[0]);
		if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;
		array_shift($parts);

		$metricId = null;
		if (sizeof($parts) > 0)
			$metricId = Params::CheckParseIntValue($parts[0]);

		if ($metricId !== null)
			return $this->RedirectWorkMetric($workId, $metricId);
		else
			return $this->RedirectWork($workId);
	}

	private function RedirectWork($workId)
	{
		// http://localhost:8000/map/3701
		return $this->RedirectJs(Links::GetWorkUrl($workId));
	}

	private function RedirectWorkMetric($workId, $metricId)
	{
		// http://localhost:8000/map/3501/#/l=6301&!r19166
		return $this->RedirectJs(Links::GetWorkMetricUrl($workId, $metricId));
	}

	private function RedirectJs($url)
	{
		return "<html><body onload=\"document.location='" . $url . "';\"></body></html>";
	}
}
