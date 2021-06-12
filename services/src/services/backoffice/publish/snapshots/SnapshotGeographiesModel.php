<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\caches\GeographyCache;
use minga\framework\Profiling;
use helena\classes\Account;
use helena\classes\App;
use helena\classes\VersionUpdater;

class SnapshotGeographiesModel
{
	public function Clean()
	{
	 	Profiling::BeginTimer();

		App::Db()->exec("TRUNCATE TABLE snapshot_geography_item");;
		VersionUpdater::Increment('CARTOGRAPHY_VIEW');

		GeographyCache::Cache()->Clear();

	 	Profiling::EndTimer();
	}
	public function Regen()
	{
	 	Profiling::BeginTimer();

		$ver = new VersionUpdater("SNAPSHOT_CARTOGRAPHY");

		$sql = "insert into snapshot_geography_item(giw_geography_item_id, giw_caption, giw_centroid, giw_urbanity, giw_geography_id, "
						. "giw_geometry_r1, giw_geometry_r2, giw_geometry_r3, giw_geometry_r4, giw_geometry_r5, giw_geometry_r6, giw_area_m2, giw_population, giw_households, giw_children, giw_geography_is_tracking_level) "
						. "select gei_id, gei_caption, gei_centroid, gei_urbanity,gei_geography_id, gei_geometry_r1, gei_geometry_r2, gei_geometry_r3, gei_geometry_r4, gei_geometry_r5, gei_geometry_r6, gei_area_m2, gei_population, gei_households, gei_children, geo_is_tracking_level "
						. "	from geography_item, geography where gei_geography_id = geo_id";

		$ret = App::Db()->exec($sql);

		VersionUpdater::Increment('CARTOGRAPHY_VIEW');

		$ver->SetUpdated();

	 	Profiling::EndTimer();

		return $ret;
	}
}
