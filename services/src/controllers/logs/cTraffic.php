<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;
use minga\framework\Context;

use helena\classes\Session;
use helena\classes\Menu;
use minga\framework\Traffic;
use minga\framework\Params;


class cTraffic extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$this->AddValue('action_post_url', '/logs/traffic');

		Menu::RegisterAdmin($this->templateValues);

		// Resuelve lo mensual
		$period = cStatsSolver::AddDaylyInfo($this->templateValues);

		$this->AddValue('traffic', Traffic::GetTraffic($period == 'Ayer', $totalIps, $totalHits));
		$this->AddValue('ips_count', array_sum($totalIps));
		$this->AddValue('ips_by_device', $totalIps);
		$this->AddValue('hits_count', $totalHits);
		$this->AddValue('publicURL', Context::Settings()->GetPublicUrl());
		$this->AddValue('limit', Context::Settings()->Limits()->LogAgentThresholdDaylyHits);
		$this->AddValue('now', date("Y-m-d H:i:s"));

		$this->title = 'Tráfico';

		return $this->Render('traffic.html.twig');
	}

	public function Post()
	{
		return $this->Show();
	}
}
