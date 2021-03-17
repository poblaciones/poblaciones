<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\caches\BoundaryCache;
use helena\caches\SelectedBoundaryCache;
use helena\caches\FabMetricsCache;

use minga\framework\Profiling;
use helena\classes\App;
use helena\classes\VersionUpdater;

class SnapshotBoundaryModel
{
	public function Clean()
	{
	 	Profiling::BeginTimer();

		App::Db()->exec("TRUNCATE TABLE snapshot_boundary_item");;

		App::Db()->exec("TRUNCATE TABLE snapshot_boundary");;

		VersionUpdater::Increment('BOUNDARY_VIEW');

		FabMetricsCache::Cache()->Clear();
		BoundaryCache::Cache()->Clear();
		SelectedBoundaryCache::Cache()->Clear();

	 	Profiling::EndTimer();
	}
	public function Regen()
	{
	 	Profiling::BeginTimer();

		 $sql = "INSERT INTO snapshot_boundary(bow_boundary_id, bow_caption, bow_group)
							SELECT bou_id, bou_caption, bgr_caption FROM boundary JOIN boundary_group ON bgr_id = bou_group_id
							WHERE bou_visible = 1";
		$ret = App::Db()->exec($sql);

		$sql = "INSERT INTO snapshot_boundary_item
									(`biw_boundary_id`,
										`biw_clipping_region_item_id`,
										`biw_caption`,
										`biw_centroid`,
										`biw_geometry_r1`)
										SELECT bcr_boundary_id, cli_id, cli_caption, cli_centroid, cli_geometry_r1
										FROM boundary_clipping_region
									INNER JOIN  boundary ON bou_id = bcr_boundary_id
									INNER JOIN  clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id
									WHERE bou_visible = 1;";

		$ret = App::Db()->exec($sql);

		FabMetricsCache::Cache()->Clear();
		BoundaryCache::Cache()->Clear();
		SelectedBoundaryCache::Cache()->Clear();

		VersionUpdater::Increment('BOUNDARY_VIEW');

	 	Profiling::EndTimer();

		return $ret;
	}
}
