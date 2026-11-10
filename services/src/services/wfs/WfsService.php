<?php

namespace helena\services\wfs;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\PublicException;

class WfsService extends BaseService
{
	public function Handle()
	{
		$request = strtolower((string) WfsRequest::Get('request'));

		try
		{
			switch ($request)
			{
				case 'getcapabilities':
					$service = new WfsGetCapabilitiesService();
					return $service->GetCapabilities();

				case 'describefeaturetype':
					$service = new WfsDescribeFeatureTypeService();
					return $service->DescribeFeatureType();

				case 'getfeature':
					$service = new WfsGetFeatureService();
					return $service->GetFeature();

				default:
					throw new PublicException("REQUEST no reconocido o ausente: " . WfsRequest::Get('request'));
			}
		}
		catch (PublicException $e)
		{
			return $this->ExceptionReport($e->getMessage());
		}
	}

	// Los clientes WFS (QGIS entre ellos) esperan un ExceptionReport OGC: ante cualquier
	// otro cuerpo de error informan un fallo de análisis XML en lugar del motivo real.
	private function ExceptionReport($message)
	{
		$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
			. '<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1" version="2.0.0">' . "\n"
			. '  <ows:Exception exceptionCode="InvalidParameterValue"><ows:ExceptionText>'
			. WfsGml::Escape($message) . "</ows:ExceptionText></ows:Exception>\n"
			. '</ows:ExceptionReport>' . "\n";
		return App::Response($xml, 'application/xml; charset=UTF-8', 400);
	}
}
