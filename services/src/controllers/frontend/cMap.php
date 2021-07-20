<?php

namespace helena\controllers\frontend;

use minga\framework\Context;
use minga\framework\Params;
use minga\framework\Request;
use minga\framework\PublicException;

use helena\services\common\MetadataService;
use helena\services\frontend\WorkService;
use helena\classes\Session;
use helena\classes\Statistics;
use helena\controllers\common\cPublicController;
use helena\services\frontend\LookupService;
use helena\db\frontend\MetadataModel;
use helena\classes\App;
use helena\classes\Links;

class cMap extends cPublicController
{
	private $workId = null;

	public function Show()
	{
		if (Context::Settings()->Servers()->OnlyCDNs())
		{
			echo('Server ' . Context::Settings()->applicationName . ' running.');
			App::EndRequest();
		}
		// Resuelve el parámetro de búsqueda
		if ($ret = $this->ResolveSearchRedirect())
			return $ret;

		// Si hay ruta de obra, se fija si está permitida
		$this->CheckWorkId();

		if ($this->workId)
		{
			// Devuelve metadatos ej. http://mapas/map/3701/metadata
			$res = $this->ResolveMetadataRequest();
			if ($res) return $res;

			// Guarda el hit
			Statistics::StoreLanding($this->workId);
		}
		// Renderiza el html
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GoogleMapsKey);
		$this->AddValue('google_analytics_key', Context::Settings()->Keys()->GoogleAnalyticsKey);
		$this->AddValue('add_this_key', Context::Settings()->Keys()->AddThisKey);

		$this->RegisterOpenGraphTags();
		$this->RegisterFacebookId();
		// Header always unset X-Frame-Options
		// https://www.a2hosting.com/kb/developer-corner/configuring-frames-with-the-x-frame-options-header

    return $this->Render('index.html.twig');
  }

	private function ResolveMetadataRequest()
	{
		$level3 = Request::GetThirdUriPart();
		if ($level3 == "metadata")
		{
			$controller = new MetadataService();
			$workService = new WorkService();
			$work = $workService->GetWorkOnly($this->workId);
			$metadataId = $work->Metadata->Id;

			return $controller->GetMetadataPdf($metadataId, null, false, $this->workId);
		}
		else
			return null;
	}
	private function CheckWorkId()
	{
		$level2 = Request::GetSecondUriPart();
		if ($level2 && is_numeric($level2))
		{
			$this->workId = Params::CheckParseIntValue($level2);
			Session::$AccessLink = Request::GetThirdUriPart();
			Session::CheckIsWorkPublicOrAccessible($this->workId);
		}
	}
	private function ResolveSearchRedirect()
	{
		$search = Params::Get("q");
		if (!$search) return null;

		// Prueba una búsqueda
		$service = new LookupService();
		$ret = $service->Search($search, 'h', false);
		if (sizeof($ret) === 0)
			return null;
		$result = $ret[0];
		if ($result['Type'] == 'L')
		{
			$metricId = $result['Id'];
			$regionId = null;
		}
		else if ($result['Type'] == 'C')
		{
			$regionId = $result['Id'];
			$metricId = null;
		}
		else
			throw new PublicException('No está soportada la redirección para este tipo de elemento');

		return App::Redirect(Links::GetWorkMetricUrl(null, $metricId, $regionId));
	}
	private function RegisterOpenGraphTags()
	{
		$this->AddValue('application_name' , 'Poblaciones');
		$this->AddValue('description', 'Plataforma abierta de datos espaciales de la Argentina');
		// Se fija si está sirviendo para una cartografía en particular
		if ($this->workId)
		{
			$service = new MetadataModel();
			$metadata = $service->GetMetadataByWorkId($this->workId);
			if ($metadata !== null) {
				$this->AddValue('application_name' , "Mapa de " . $metadata['met_title'] . " - Poblaciones");
				$this->AddValue('description', $metadata['met_abstract']);
			}
		}
		$this->AddValue('image', App::AbsoluteUrl('/static/img/og.png'));
	}
	private function RegisterFacebookId()
	{
		$facebookId = "";
		$creds = Context::Settings()->Oauth()->Credentials;
		if (array_key_exists('facebook', $creds))
		{
			$facebookId = $creds['facebook']['key'];
		}
		$this->AddValue('facebookId', $facebookId);
	}

}
