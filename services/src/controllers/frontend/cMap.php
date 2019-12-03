<?php

namespace helena\controllers\frontend;

use minga\framework\Context;
use minga\framework\Params;
use minga\framework\Request;

use helena\controllers\common\cPublicController;
use helena\db\frontend\MetadataModel;
use helena\classes\App;

class cMap extends cPublicController
{
	public function Show()
	{
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GoogleMapsKey);
		$this->AddValue('google_analytics_key', Context::Settings()->Keys()->GoogleAnalyticsKey);
		$this->AddValue('add_this_key', Context::Settings()->Keys()->AddThisKey);

		$this->RegisterOpenGraphTags();
		$this->RegisterFacebookId();

    return $this->Render('index.html.twig');
  }
	private function RegisterOpenGraphTags()
	{
		$this->AddValue('application_name' , 'Poblaciones');
		$this->AddValue('description', 'Plataforma abierta de datos espaciales de la Argentina');
		// Se fija si está sirviendo para una cartografía en particular
		$level2 = Request::GetSecondUriPart();
		if ($level2 && is_numeric($level2))
		{
			$workId = Params::CheckParseIntValue($level2);
			$service = new MetadataModel();
			$metadata = $service->GetMetadataByWorkId($workId);
			if ($metadata !== null) {
				$this->AddValue('application_name' , "Poblaciones: " . $metadata['met_title']);
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
