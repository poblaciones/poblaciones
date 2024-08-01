<?php

namespace helena\services\backoffice\publish\snapshots;

use minga\framework\Profiling;
use helena\caches\ClippingCache;
use helena\classes\App;

use helena\classes\VersionUpdater;

class SnapshotGeographiesByRegionModel
{
	public function Clean()
	{
	 	Profiling::BeginTimer();

		App::Db()->truncate("snapshot_clipping_region_item_geography_item");
		VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');

		ClippingCache::Cache()->Clear();

	 	Profiling::EndTimer();
	}

	public function Regen()
	{
		$ver = new VersionUpdater("SNAPSHOT_CARTOGRAPHY_REGION");

	 	Profiling::BeginTimer();
		VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');

		$rowsAffected = 0;
		$l = 1;
		$sqlInsert = "INSERT INTO snapshot_clipping_region_item_geography_item (cgv_clipping_region_id, "
			.  "cgv_clipping_region_item_id, cgv_clipping_region_priority, cgv_geography_item_id, cgv_urbanity, cgv_area_m2, cgv_population, cgv_households, "
			. "cgv_children, cgv_geography_id, cgv_level) ";

		$sql = $sqlInsert . "SELECT cli_clipping_region_id, cli_id, clr_priority, gei_id, gei_urbanity, gei_area_m2, " .
			"gei_population, gei_households, gei_children, gei_geography_id, "
				. $l . " FROM clipping_region_item, " .
						"clipping_region_item_geography_item, " .
						"clipping_region, " .
						"geography_item  " .
						"WHERE gei_id = cgi_geography_item_id ".
						"AND clr_id = cli_clipping_region_id " .
						"AND cli_id = cgi_clipping_region_item_id";
		$r = App::Db()->exec($sql);
		App::Db()->markTableUpdate('snapshot_clipping_region_item_geography_item');

		$rowsAffected += $r;
		while ($r != 0)
		{ // Inserta niveles inferiores
			$l++;
			$sqlRecursive = $sqlInsert . "SELECT cgv_clipping_region_id, cgv_clipping_region_item_id, clr_priority, gei_id, gei_urbanity, gei_area_m2, " .
				"gei_population, gei_households, gei_children, gei_geography_id, " . $l
				." FROM snapshot_clipping_region_item_geography_item ," .
							"geography_item,  " .
							"clipping_region " .
							"WHERE clr_id = cgv_clipping_region_id AND gei_parent_id = cgv_geography_item_id and cgv_level = " . ($l - 1);
			$r = App::Db()->exec($sqlRecursive);
			$rowsAffected += $r;
		}

		$r = 1; $l = 1;
		while ($r != 0)
		{ // Inserta niveles superiores
			$l--;
			$sqlRecursive = $sqlInsert . "SELECT DISTINCT cgv_clipping_region_id, cgv_clipping_region_item_id, clr_priority, cai1.gei_id, cai1.gei_urbanity, cai1.gei_area_m2, " .
				"cai1.gei_population, cai1.gei_households, cai1.gei_children, cai1.gei_geography_id, " . $l
				. " FROM snapshot_clipping_region_item_geography_item " .
							"JOIN geography_item gei_children ON gei_children.gei_id = cgv_geography_item_id " .
							"JOIN geography_item cai1 ON cai1.gei_id = gei_children.gei_parent_id " .
							"JOIN clipping_region ON clr_id = cgv_clipping_region_id " .
							"WHERE gei_children.gei_parent_id IS NOT NULL AND cgv_level = " . ($l + 1);
			$r = App::Db()->exec($sqlRecursive);
			$rowsAffected += $r;
		}

		VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');
		$ver->SetUpdated();

		Profiling::EndTimer();
		return $rowsAffected;
	}
}
