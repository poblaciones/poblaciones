<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use minga\framework\Performance;
use minga\framework\WebClient;
use minga\framework\settings\CacheSettings;
use minga\framework\Context;
use minga\framework\Log;
use minga\framework\Str;
use minga\framework\PublicException;

use helena\caches\AddressesCache;
use helena\classes\Callbacks;

class AddressServiceModel
{
	public function SearchFeatures($originalQuery)
	{
		Profiling::BeginTimer();

		$wc = new WebClient();
		$wc->Initialize();

		$encodedQuery = urlencode($originalQuery);
		if (Context::Settings()->Map()->GoogleGeocodingArea)
			$encodedQuery .= "&components=" . Context::Settings()->Map()->GoogleGeocodingArea;
		// Fuerza uso de caché
		$keepState = Context::Settings()->Cache()->Enabled;
		Context::Settings()->Cache()->Enabled = CacheSettings::Enabled;
		// Resuelve
		$res = null;
		if (!AddressesCache::Cache()->HasData($encodedQuery, $res))
		{
			$url = $this->resolveUrl($encodedQuery);
			// Verifica si hay un límite
			$limit = Context::Settings()->Limits()->AddressQueryDaylyLimit;
			if ($limit > 0)
			{
				$current = Performance::ReadTodayExtraValues('AddressQuery');
				if ($current >= $limit)
				{
					Log::HandleSilentException(new PublicException('Se ha llegado al límite diario de consultas de direcciones (AddressQuery).'));
					Profiling::EndTimer();
					return [];
				}
			}
			// Ok, sigue....
			Callbacks::$AddressQueried++;
			$res = $wc->Execute($url);
			AddressesCache::Cache()->PutData($encodedQuery, $res);
		}
		Context::Settings()->Cache()->Enabled = $keepState;
		// Formatea

		/* Ejemplos de type (por ahora no usa el type para icono):

		Planetario: types: [ "establishment", "museum", "point_of_interest", "tourist_attraction"]
		Escuela Cabral: types: ["establishment","point_of_interest","school"]
		Dirección: types: ["street_address"]
		Dirección con indicación de piso: types: ["subpremise"]

		*/

		$obj = json_decode($res);
		$ret = [];
		if ($obj->status == "OK")
		{
			for($n = 0; $n < min(10, sizeof($obj->results)); $n++)
			{
				$result = $obj->results[$n];
				$item = ['Id' => null,
									'Caption' => Str::Replace($result->formatted_address, "&" , "y"),
									'Type' => "P", 'ExtraIds' => "", 'Symbol' => "fas fa-map-marker-alt",
									'Lat' => $result->geometry->location->lat,
									'Lon' => $result->geometry->location->lng,
									'Extra' => "Ubicación"];
				$ret[] = $item;
			}
		}
		Profiling::EndTimer();
		return $ret;
	}
	private function resolveUrl($encodedQuery)
	{
		return "https://maps.googleapis.com/maps/api/geocode/json?address=" .
							$encodedQuery . "&key=" . Context::Settings()->Keys()->GoogleGeocodingKey;
	}
}


