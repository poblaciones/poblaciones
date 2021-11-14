<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use minga\framework\SearchLog;
use minga\framework\Performance;

use helena\classes\Session;
use helena\classes\Menu;
use minga\framework\Profiling;
use minga\framework\Params;
use minga\framework\Context;

class cSearchLog extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$this->AddValue('action_post_url', '/logs/search');

		Menu::RegisterAdmin($this->templateValues);

		// Resuelve lo mensual
		$path = Context::Paths()->GetSearchLogLocalPath();
		$month = cStatsSolver::AddMonthlyInfoFiled($this->templateValues, $path, true);

		$fixedMethods = array('get', 'cache', 'post');

		$this->AddValue('search_table', SearchLog::GetSearchTable($month, true));

		$this->title = 'Búsquedas';

		return $this->Render('searchLog.html.twig');
	}

	public function Post()
	{
		if ($app = Session::CheckSessionAlive())
			return $app;

		return $this->Show();
	}
}
