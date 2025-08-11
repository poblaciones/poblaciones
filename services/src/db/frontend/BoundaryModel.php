<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\Context;
use helena\services\backoffice\publish\PublishDataTables;

class BoundaryModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = '';
		$this->idField = '';
		$this->captionField = '';
	}

	public function GetBoundaryVersionById($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT * FROM boundary_version
					WHERE bvr_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectedBoundary($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT boundary.* FROM boundary WHERE bou_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectedBoundaryVersions($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT boundary_version.*, metadata.*
          FROM boundary_version
					LEFT JOIN metadata ON met_id = IFNULL(bvr_metadata_id,
						(select max(clr_metadata_id) FROM clipping_region JOIN
						boundary_version_clipping_region ON bcr_clipping_region_id = clr_id WHERE bcr_boundary_version_id = bvr_id))
					WHERE bvr_boundary_id = ?";
		$ret = App::Db()->fetchAll($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetRecommendedBoundaries()
	{

		Profiling::BeginTimer();
		$sql = "SELECT bou_id Id, bou_caption Name, bou_icon Icon, bou_sort_by OrderBy,
						(SELECT MAX(bvr_id) FROM boundary_version WHERE bvr_boundary_id = bou_id) VersionId
						FROM boundary WHERE bou_is_suggestion = 1 ORDER BY bou_group_id, bou_order";
		$boundaries = App::Db()->fetchAll($sql);
		$exclusions = '';
		if (sizeof(App::Settings()->Map()->BoundaryRecommendationExclusions) > 0)
		{
			$exclusions = " AND cli_caption NOT IN (";
			$text = "";
			foreach(App::Settings()->Map()->BoundaryRecommendationExclusions as $item)
			{
				if ($text != "")
					$text .= ",";
				$text .= Str::CheapSqlEscape($item);
			}
			$exclusions .= $text . ") ";
		}
		foreach($boundaries as &$boundary)
		{
			if ($boundary['OrderBy'] == 'P') {
				$sql = "SELECT min(cli_id) Id, cli_caption `Name`, '' as `Group` FROM boundary_version_clipping_region  c
						JOIN clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id
						JOIN snapshot_lookup_clipping_region_item ON cli_id = clc_clipping_region_item_id
					 WHERE bcr_boundary_version_id = ? " . $exclusions . "
                     group by cli_caption, cli_code, clc_population
                     ORDER BY clc_population DESC, cli_code LIMIT 25";
			}
			else
			{
				// default por nombre
				$orderBy = 'cli_caption, cli_code';
				if ($boundary['OrderBy'] == 'C')
					$orderBy = 'cli_code';

				$sql = "SELECT cli_id Id, cli_caption `Name`, '' as `Group` FROM boundary_version_clipping_region  c
						JOIN clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id
					     WHERE bcr_boundary_version_id = ? " . $exclusions . " ORDER BY " . $orderBy . " LIMIT 25";
			}
			$items = App::Db()->fetchAll($sql, array($boundary['VersionId']));
			$boundary['Items'] = $items;
		}
		Profiling::EndTimer();
		return $boundaries;
	}

	public function GetFabBoundaries()
	{
		Profiling::BeginTimer();

		$sql = "SELECT bou_id Id, bou_caption Name, bgr_caption `Group`
							FROM boundary INNER JOIN boundary_group ON bou_group_id = bgr_id
							WHERE EXISTS (SELECT * FROM
							snapshot_boundary_version_item WHERE biw_boundary_id = bou_id) ORDER BY bgr_order, bgr_caption, bou_order, bou_caption";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}


