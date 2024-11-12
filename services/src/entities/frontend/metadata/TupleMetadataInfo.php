<?php

namespace helena\entities\frontend\metadata;

use helena\entities\BaseMapModel;

class TupleMetadataInfo extends BaseMapModel
{
	public $GeographyId;
	public $CompareGeographyId;
	public $MetadataId;

	public static function GetMap()
	{
		return array (
			'gtu_geography_id' => 'GeographyId',
			'gtu_previous_geography_id' => 'CompareGeographyId',
			'gtu_metadata_id' => 'MetadataId',
			);
	}
}


