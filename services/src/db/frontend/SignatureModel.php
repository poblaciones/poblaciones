<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Context;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class SignatureModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'version';
		$this->idField = 'ver_id';
		$this->captionField = 'ver_name';
	}

	public function GetSignatures()
	{
		$pairs = array('CARTOGRAPHY_VIEW' => array('Geography'),
									 'BOUNDARY_VIEW' => array('Boundary'),
										'CARTOGRAPHY_REGION_VIEW' => array('Clipping'),
										'LOOKUP_REGIONS' => array('BigLabels'),
										'LOOKUP_VIEW' => array('SmallLabels', 'Search'),
										'FAB_METRICS' => array('FabMetrics'));
		$sql = "SELECT ver_name name, ver_value value FROM version";
		$rows = App::Db()->fetchAll($sql);
		$ret = array();
		foreach($rows as $row)
		{
			if (array_key_exists($row['name'], $pairs))
			{
				foreach($pairs[$row['name']] as $key)
					$ret[$key] = $row['value'];
			}
		}
		$ret['Suffix'] = App::Settings()->Map()->SignatureSuffix;
		$ret['SmallLabelsFrom'] = SnapshotLookupModel::SMALL_LABELS_FROM;
		return $ret;
	}

/*	public function GetRemoteSignatures($backoffice = false)
	{
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$url = $dynamicServer->publicUrl . '/services/' . ($backoffice ? 'backoffice/' : '') . 'GetSignatures';
		$response = $this->getRemoteJson($url);
		if ($response === null)
			throw new \ErrorException("No se pudieron obtener las firmas.");
		return $response;
	}

	private function getRemoteJson($url)
	{
		if (!App::Settings()->Servers()->VeryifyTransactionServerCertificate)
		{
			$context = stream_context_create([
				'ssl' => [
					'verify_peer' => false,
					'verify_peer_name' => false,
				],
			]);
			$jsonString = file_get_contents($url, false, $context);
		}
		else
		{
			$jsonString = file_get_contents($url);
		}
		if ($jsonString === false) {
			return null; // Error al obtener el contenido
		}
		$data = json_decode($jsonString, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			return null; // Error al decodificar el JSON
		}
		return $data;
	}
	*/
	public function GetLookupSignature()
	{
		$sql = "SELECT ver_value FROM version WHERE ver_name = 'LOOKUP_VIEW'";
		return App::Db()->fetchScalar($sql);
	}
}


