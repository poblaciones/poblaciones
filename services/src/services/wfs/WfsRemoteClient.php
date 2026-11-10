<?php

namespace helena\services\wfs;

use helena\classes\App;

use helena\services\frontend as services;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\Params;
use minga\framework\PublicException;
use minga\framework\WebConnection;

class WfsRemoteClient
{
	private static function IsLocal() {
		$ret = (App::Settings()->Servers()->Main()->publicUrl ==
			App::Settings()->Servers()->GetTransactionServer()->publicUrl);
		return $ret;
	}

	public static function GetSelectedInfos($metricsId)
	{
		if (self::IsLocal())
		{
			$controller = new services\SelectedMetricService();
			return App::JsonClone($controller->PublicGetSelectedInfos($metricsId));
		}
		else
		{
			return self::Get('/services/metrics/GetSelectedInfos', ['l' => $metricsId]);
		}

	}
	public static function GetSelectedMetric($metricId)
	{
		if (self::IsLocal())
		{
			$controller = new services\SelectedMetricService();
			return App::JsonClone($controller->PublicGetSelectedMetric($metricId));
		}
		else
		{
			return self::Get('/services/metrics/GetSelectedMetric', ['l' => $metricId]);
		}
	}
	public static function GetBoundaryByEnvelope($boundaryVersionId)
	{
		if (self::IsLocal())
			throw new PublicException("Las delimitaciones todavía no se publican por WFS en este servidor.");

		$data = self::Get('/services/frontend/boundaries/GetBoundaryByEnvelope', $boundaryVersionId);
		if ($data === null || isset($data['features']) == false)
			throw new PublicException("No se pudo obtener la delimitación {$boundaryVersionId}.");
		return $data;
	}

	public static function GetShapesByEnvelope($datasetId, $envelope)
	{
		if (self::IsLocal()) {
			$service = new services\ShapesService();
			return $service->GetShapesByEnvelope($datasetId, $envelope);
		} else {
			return self::Get('/services/frontend/shapes/GetShapesByEnvelope', ['d' => $datasetId, 'e' => $envelope->TextSerialize()]);
		}
	}

	// Devuelve la lista de filas (una por variable y entidad), o null si el servidor remoto falla.
	public static function GetTableMetricData($metricId, $versionId, $levelId, $getLatLong, $signature)
	{
		if (self::IsLocal())
		{
			$controller = new services\TableService();
			$partition = null;
			$result = App::JsonClone($controller->GetTableMetricData($metricId, $versionId, $levelId, $partition));
		}
		else
		{
			$args = ['m' => $metricId, 'v' => $versionId, 'l' => $levelId, 'w' => $signature];
			$args['pts'] = ($getLatLong ? 1 : 0);
			$result = self::Get('/services/frontend/processor/GetTableMetricData', $args);
		}
		if ($result === null)
			return null;
		// El servicio devuelve un MetricDataInfo: las filas están en Items.
		return $result['Items'];
	}

	public static function GetFabIndicators()
	{
		if (self::IsLocal())
		{
			$controller = new services\FabService();
			return App::JsonClone($controller->GetFabIndicators(false));
		}
		else
			return self::Get('/services/metrics/GetFabIndicators', ['w' => -1]);
	}
	public static function GetFabBoundaryVersions()
	{
		if (self::IsLocal())
		{
			$controller = new services\FabService();
			return App::JsonClone($controller->GetFabBoundaryVersions());
		}
		else
			return self::Get('/services/metrics/GetFabBoundaryVersions', ['w' => -1]);
	}

	private static function Get($path, $args = [])
	{
		$baseUrl = WfsConfig::GetRemoteApiBaseUrl();
		$url = rtrim($baseUrl, '/') . '/' . ltrim($path, '/');

		$conn = new WebConnection();
		$conn->Initialize();
		$conn->SetFollowRedirects(false);
		$conn->SetHeader("INTERNAL", "1");
		$conn->SetUserAgent(Params::SafeServer('HTTP_USER_AGENT', ''));
		$response = $conn->Get($url, '', 0, $args);
		$conn->Finalize();

		if ($response->httpCode !== 200)
		{
			Log::HandleSilentException(new \Exception(
				'WfsRemoteClient: Error HTTP ' . $response->httpCode . ' al consultar ' . $url
			));
			return null;
		}

		$content = IO::ReadAllText($response->file);
		IO::Delete($response->file);

		return json_decode($content, true);
	}
}
