<?php

namespace helena\controllers\frontend;

use minga\framework\Context;
use minga\framework\Params;
use minga\framework\Request;
use minga\framework\Response;
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
		$this->SolveWorkId();
		if ($this->workId)
		{
			// Devuelve metadatos ej. http://mapas/map/3701/metadata
			$res = $this->ResolveMetadataRequest();
			if ($res) return $res;

			// Guarda el hit
			Statistics::StoreLanding($this->workId);
		}
        $configuration = new ConfigurationService();
        $mapsApi = $configuration->GetCurrentMapProvider();
		// Renderiza el html
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GetGoogleMapsKey());
		$this->AddValue('maps_api', $mapsApi);

		$this->AddValue('google_analytics_key', Context::Settings()->Keys()->GoogleAnalyticsKey);
		$this->AddValue('add_this_key', Context::Settings()->Keys()->AddThisKey);

		$this->AddValue('application_name', 'Poblaciones');
		if (App::Settings()->Servers()->IsTransactionServerRequest())
			$this->RegisterOpenGraphTags();

		$this->RegisterFacebookId();

		// Si está embebido, lo indica para estadísticas
		if (Params::Get('emb'))
				Performance::AppendControllerSuffix('embedded');

		return $this->Render('index.html.twig');
	}

	private function ResolveMetadataRequest()
	{
		$level3 = Request::GetThirdUriPart();
		if ($level3 == "metadata")
		{
			$hasAccess = Session::IsWorkPublicOrAccessible($this->workId);
			if (!$hasAccess)
			{
				if (App::Settings()->Servers()->IsTransactionServerRequest()
					&& !App::Settings()->Servers()->IsMainServerRequest() && Request::IsInternal())
				{	// hace un redirect
					return App::Response("<html><body onload=\"document.location='" . App::AbsoluteLocalUrl(Request::GetRequestURI()) . "';\"></body></html>", "text/html");
				}
				else
				{	// devuelve denied
					if ($denied = Session::CheckIsWorkPublicOrAccessible($this->workId))
						return $denied;
				}
			}

			$controller = new MetadataService();
			$workService = new WorkService();
			$work = $workService->GetWorkOnly($this->workId);
			$metadataId = $work->Metadata->Id;

			return $controller->GetMetadataPdf($metadataId, null, false, $this->workId);
		}
		else
			return null;
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
	private function ResolveSearchRedirect()
	{
		$search = Params::Get("q");
		if (!$search) return null;

		// Prueba una búsqueda
		$service = new SearchService();
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
		$this->AddValue('description', 'Plataforma abierta de datos espaciales de la Argentina');
		// Se fija si está sirviendo para una cartografía en particular
		if ($this->workId && Session::IsWorkPublicOrAccessible($this->workId))
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
