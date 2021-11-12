<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use minga\framework\Performance;

use helena\classes\Session;
use helena\classes\Menu;
use minga\framework\Profiling;
use minga\framework\Params;
use minga\framework\Context;

class cPerformance extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		if (Profiling::IsProfiling())
		{
			$this->AddValue('profiling', "Activado");
			$this->AddValue('action', "Desactivar");
		}
		else
		{
			$this->AddValue('profiling', "Desactivado");
			$this->AddValue('action', "Activar");
		}

		$this->AddValue('now', date("Y-m-d H:i:s"));
		$this->AddValue('action_post_url', '/logs/performance');

		Menu::RegisterAdmin($this->templateValues);

		// Resuelve lo mensual
		$path = Context::Paths()->GetPerformanceLocalPath();
		$month = cStatsSolver::AddMonthlyInfo($this->templateValues, $path, true, true);

		$fixedMethods = array('get', 'cache', 'post');
		$fixedZones = array('público', 'backoffice', 'admin');

		$monthNoYesterday = ($month == "yesterday" ? "" : $month);
		$this->AddValue('dayly_table', Performance::GetDaylyTable($monthNoYesterday, true));
		$this->AddValue('controller_table', Performance::GetControllerTable($month, false, false, $fixedMethods));

		$this->AddValue('controller_table_admin', Performance::GetControllerTable($month, true, false, $fixedMethods));

		$this->AddValue('user_table', Performance::GetControllerTable($month, false, true, $fixedZones));

		$this->AddValue('locks_table', Performance::GetLocksTable($month));

		$this->title = 'Rendimiento';

		return $this->Render('performance.html.twig');
	}

	public function Post()
	{
		if ($app = Session::CheckSessionAlive())
			return $app;
		if (Params::Get('toggle') != null)
			Profiling::SetProfiling(! Profiling::IsProfiling());

		return $this->Show();
	}
}
