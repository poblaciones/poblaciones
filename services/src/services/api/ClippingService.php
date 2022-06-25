<?php

namespace helena\services\api;

use helena\classes\App;
use helena\classes\Links;
use helena\classes\GeoJson;

use minga\framework\Arr;
use minga\framework\MessageBox;

use helena\services\frontend\LookupService;
use helena\services\common\BaseService;
use helena\db\frontend\ClippingRegionItemModel;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Geometry;
use helena\entities\frontend\metadata\MetadataInfo;
use helena\entities\frontend\geometries\Coordinate;


class ClippingService extends BaseService
{
	public function GetFeature($version, $id)
	{
		$this->CheckVersion($version);
		$data = null;

		$table = new ClippingRegionItemModel();
		$items = $table->GetClippingRegionItemsGeometries([$id]);
		if (sizeof($items) == 0)
			return null;

		$item = $items[0];
		$envelope = Envelope::FromDb($item['Envelope'])->Trim();
		$canvas = Geometry::FromDb($item['Geometry'], $item['Id']);
		$canvas['features'][0]['geometry']['coordinates'] = GeoJson::TrimRecursive($canvas['features'][0]['geometry']['coordinates']);
		$geom = $canvas['features'][0]['geometry'];

		$ret = ['Id' => $id, 'Envelope' => $envelope, 'Geometry' => $geom];

		$data = $table->GetClippingRegionItem($id);
		if ($data != null)
		{
			$ret['Name'] = $data['Name'];
			$ret['TypeName']= $data['Type'];
			$ret['Centroid'] = Coordinate::FromDb($data['Location'])->Trim();
			$ret['Metadata'] = new MetadataInfo();
			$ret['Metadata']->Fill($data);
			$ret['Metadata']->Url = App::AbsoluteUrl(Links::GetMetadataUrl($ret['Metadata']->Id));
		}
		return $ret;
	}

	public function Search($version, $q)
	{
		$this->CheckVersion($version);

		$controller = new LookupService();
		$filter = 'r';
		$data = $controller->Search($q, $filter, false);
		$res = [];
		foreach($data as $row)
		{
			$res[] = ['Id' => $row['Id'],
								'Name' => $row['Caption'],
								'Context' => $row['Extra'],
								'ContextIds' => Arr::SanitizeIds(explode("\t", $row['ExtraIds']), false)];
		}
		return $res;
	}

	public function CheckVersion($version) {
		if ($version != 1)
			MessageBox::ThrowMessage("Incorrect API version specified. Suggested parameter: v=1");
	}
}

