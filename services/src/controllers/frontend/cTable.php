<?php

namespace helena\controllers\frontend;

use minga\framework\Context;
use minga\framework\Params;
use minga\framework\Request;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Performance;

use helena\services\frontend\ConfigurationService;
use helena\services\common\MetadataService;
use helena\services\frontend\WorkService;
use helena\classes\Session;
use helena\classes\Statistics;
use helena\controllers\common\cPublicController;
use helena\services\frontend\SearchService;
use helena\db\frontend\MetadataModel;
use helena\classes\App;
use helena\classes\Links;

class cTable extends cPublicController
{
	private $workId = null;

	public function Show()
	{
		if (Context::Settings()->Servers()->OnlyCDNs())
		{
			echo('Server ' . Context::Settings()->applicationName . ' running.');
			App::EndRequest();
		}
		// Si hay ruta de obra, se fija si está permitida
		$this->SolveWorkId();
		if ($this->workId)
		{
			// Guarda el hit
			Statistics::StoreLanding($this->workId);
		}
        $configuration = new ConfigurationService();
		// Renderiza el html
		$this->AddValue('google_analytics_key', Context::Settings()->Keys()->GoogleAnalyticsKey);
		$this->AddValue('add_this_key', Context::Settings()->Keys()->AddThisKey);
		$this->AddValue('application_name', 'Poblaciones');
		// Si está embebido, lo indica para estadísticas
		if (Params::Get('emb'))
				Performance::AppendControllerSuffix('embedded');

		return $this->Render('table.html.twig');
	}

	private function SolveWorkId()
	{
		$level2 = Request::GetSecondUriPart();
		if ($level2 && is_numeric($level2))
		{
			$this->workId = Params::CheckParseIntValue($level2);
			Session::$AccessLink = Request::GetThirdUriPart();
		}
	}
}
