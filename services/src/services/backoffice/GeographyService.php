<?php

namespace helena\services\backoffice;

use helena\classes\App;
use minga\framework\Profiling;

class GeographyService extends DbSession
{

	public function GetGeographyItems($geographyId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT gei_id Id, gei_code Value, gei_caption Caption, 0 `Order` FROM geography_item WHERE gei_geography_id = ?";
		$ret = App::Db()->fetchAll($sql, array($geographyId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetAllGeographies()
	{
		Profiling::BeginTimer();
		$list = App::Orm()->findManyByQuery("SELECT g FROM e:Geography g ORDER BY g.Revision DESC, g.Caption");
		$ret = [];
		foreach($list as $item)
			if ($item->getRootCaption() !== 'Otros')
				$ret[] = $item;
		foreach($list as $item)
			if ($item->getRootCaption() === 'Otros')
				$ret[] = $item;
		Profiling::EndTimer();
		return $ret;
	}
}

