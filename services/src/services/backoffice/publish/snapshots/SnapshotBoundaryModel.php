<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\caches\BoundaryCache;
use helena\caches\SelectedBoundaryCache;
use helena\caches\FabMetricsCache;

use helena\caches\BoundaryVisiblityCache;
use helena\caches\BoundaryDownloadCache;
use helena\caches\BoundarySummaryCache;

use minga\framework\Profiling;
use helena\classes\App;
use helena\classes\VersionUpdater;
use helena\services\backoffice\publish\CacheManager;

class SnapshotBoundaryModel
{
	public function Clean()
	{
	 	Profiling::BeginTimer();

		App::Db()->exec("TRUNCATE TABLE snapshot_boundary_item");;

		App::Db()->exec("TRUNCATE TABLE snapshot_boundary");;

		VersionUpdater::Increment('BOUNDARY_VIEW');

		FabMetricsCache::Cache()->Clear();

		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();

	 	Profiling::EndTimer();
	}
	public function Regen()
	{
	 	Profiling::BeginTimer();

		 $sql = "INSERT INTO snapshot_boundary(bow_boundary_id, bow_caption, bow_group)
							SELECT bou_id, bou_caption, bgr_caption FROM boundary JOIN boundary_group ON bgr_id = bou_group_id
							WHERE bou_is_private = 0";
		$ret = App::Db()->exec($sql);

		$sql = "INSERT INTO snapshot_boundary_item
									(`biw_boundary_id`,
										`biw_clipping_region_item_id`,
										`biw_caption`,
										`biw_code`,
										`biw_centroid`,
										biw_area_m2,
										biw_geometry_r1,
										biw_geometry_r2,
										biw_geometry_r3,
										biw_envelope)
										SELECT bcr_boundary_id, cli_id, cli_caption, cli_code, cli_centroid,
											cli_area_m2, cli_geometry_r1, cli_geometry_r2, cli_geometry_r3,
											PolygonEnvelope(cli_geometry)
										FROM boundary_clipping_region
									INNER JOIN  boundary ON bou_id = bcr_boundary_id
									INNER JOIN  clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id";

		$ret = App::Db()->exec($sql);

		FabMetricsCache::Cache()->Clear();

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();

		VersionUpdater::Increment('BOUNDARY_VIEW');

	 	Profiling::EndTimer();

		return $ret;
	}
}
