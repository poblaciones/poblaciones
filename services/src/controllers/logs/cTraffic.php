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

		// Resuelve el combo de período
		$period = cStatsSolver::AddDaylyInfo($this->templateValues);

		$traffic = Traffic::GetTraffic($period == 'Ayer');
		$this->AddValue('traffic', $traffic['data']);
		$this->AddValue('ips_count', $traffic['ips']);
		$this->AddValue('hits_count', $traffic['hits']);
		$this->AddValue('public_url', Context::Settings()->GetPublicUrl());
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
