<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class RevisionsModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'version';
		$this->idField = 'ver_id';
		$this->captionField = 'ver_name';
	}

	public function GetRevisions()
	{
		$pairs = array('CARTOGRAPHY_VIEW' => array('Geography'),
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
		$ret['SmallLabelsFrom'] = SnapshotLookupModel::SMALL_LABELS_FROM;
		return $ret;
	}

}


