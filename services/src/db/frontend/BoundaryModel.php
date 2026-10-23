<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\Arr;
use minga\framework\Context;
use helena\services\backoffice\publish\PublishDataTables;
use helena\db\frontend\SnapshotClippingRegionItemModel;

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
		// bvr_extents es geometry: boundary_version.* lo trae en binario (WKB),
		// que Envelope::FromDb no puede parsear. ST_AsText lo pisa como texto
		// (misma columna repetida al final del SELECT), igual que mvl_extents
		// en MetricVersionModel.
		$sql = "SELECT boundary_version.*, metadata.*, ST_AsText(bvr_extents) AS bvr_extents
          FROM boundary_version
					LEFT JOIN metadata ON met_id = IFNULL(bvr_metadata_id,
						(select max(clr_metadata_id) FROM clipping_region JOIN
						boundary_version_clipping_region ON bcr_clipping_region_id = clr_id WHERE bcr_boundary_version_id = bvr_id))
					WHERE bvr_boundary_id = ?";
		$ret = App::Db()->fetchAll($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetValuesByBoundaryVersionId($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT  clr_id AS vvl_id,
						clr_caption AS vvl_caption,
						null AS vvl_value,
						clr_color AS vvl_line_color,
						clr_color AS vvl_fill_color,
						null AS vvl_symbol,
						1 vvl_visible
					 FROM boundary_version_clipping_region
					 JOIN clipping_region ON bcr_clipping_region_id = clr_id
					WHERE bcr_boundary_version_id = ? ORDER BY clr_caption";
		$ret = App::Db()->fetchAll($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetBoundariesWithItems()
	{
		Profiling::BeginTimer();
		$sql = "SELECT bou_id Id, bou_caption Name, bou_icon Icon, bou_sort_by OrderBy, bou_is_suggestion Suggestion, bou_gropup_by_parent UseParent,
					bgr_caption `Group`, bgr_icon GroupIcon, (SELECT MAX(geo_revision) FROM geography where geo_is_tracking_level = 1) AS PopulationVersion,
                   (SELECT MAX(bvr_id) FROM boundary_version WHERE bvr_boundary_id = bou_id) VersionId
            FROM boundary INNER JOIN boundary_group ON bou_group_id = bgr_id ORDER BY bgr_order, bou_group_id, bou_order";
		$boundaries = App::Db()->fetchAll($sql);
		$exclusions = '';
		$ret = [];
		foreach ($boundaries as &$boundary) {
			$useParent = $boundary['UseParent'];
			$useParentSelect = '';
			$useParentFrom = '';
			$orderBy = '';
			if ($useParent)
			{
				$useParentSelect  = ' parent.cli_caption ParentCaption, parent.cli_code ParentCode, cli.cli_parent_id ParentId, ';
				$useParentFrom = ' LEFT JOIN clipping_region_item parent ON parent.cli_id = cli.cli_parent_id ';
				$orderBy = 'ParentCaption, ParentId,';
			}
			if ($boundary['OrderBy'] == 'P') {
				// por tama�o
				$orderBy .= "clc_population DESC, cli.cli_code";
				$sql = "SELECT min(cli.cli_id) Id, cli.cli_caption `Name`, " . $useParentSelect . " clc_population Population
                    FROM boundary_version_clipping_region c
                    JOIN clipping_region_item cli ON cli.cli_clipping_region_id = bcr_clipping_region_id
                    JOIN snapshot_lookup_clipping_region_item ON cli.cli_id = clc_clipping_region_item_id
					" . $useParentFrom . "
                    WHERE bcr_boundary_version_id = ? " . $exclusions . "
                    GROUP BY cli.cli_caption, cli.cli_code, clc_population
                    ORDER BY " . $orderBy;
			} else {
				// default por nombre
				if ($boundary['OrderBy'] == 'C')
					$orderBy .= 'cli.cli_code';
				else
					$orderBy .= 'cli.cli_caption, cli.cli_code';

				$sql = "SELECT cli.cli_id Id, cli.cli_caption `Name` , cli.cli_code Code," . $useParentSelect . " IFNULL(clc_population, 0) Population
                    FROM boundary_version_clipping_region c
                    JOIN clipping_region_item cli ON cli.cli_clipping_region_id = bcr_clipping_region_id
                    LEFT JOIN snapshot_lookup_clipping_region_item ON cli.cli_id = clc_clipping_region_item_id
                    " . $useParentFrom . "
                    WHERE bcr_boundary_version_id = ? " . $exclusions . "
                    ORDER BY " . $orderBy;
			}
			$items = App::Db()->fetchAll($sql, array($boundary['VersionId']));
			if (sizeof($items) > 0)
			{
				if ($useParent)
				{
					$items = Arr::FromSortedToKeyed($items, 'ParentId');
					$families = [];
					foreach (array_keys($items) as $key) {
						$children = $items[$key];
						$families[] = ['Id' => $key, 'Name' => $children[0]['ParentCaption'],
							'Items' => Arr::UnsetKeysArray($children, ['ParentId', 'ParentCaption', 'ParentCode']), 'Code' => $children[0]['ParentCode']];
					}
					$items = $families;
				}
				$boundary['Items'] = $items;
				$ret[] = $boundary;
			}
		}
		Profiling::EndTimer();
		$grouped = Arr::FromSortedToKeyed($ret, 'Group');
		$groups = [];
		foreach (array_keys($grouped) as $key) {
			$items = $grouped[$key];

			$groups[] = ['Id' => null, 'Name' => $key, 'Items' => $items, 'Icon' => $items[0]['GroupIcon']];
		}
		return $groups;
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

	public function GetFabBoundaryVersions()
	{
		Profiling::BeginTimer();

		$sql = "SELECT bgr_caption `Group`, bgr_icon GroupIcon, bou_id BoundaryId, bou_caption BoundaryName,
						bvr_id VersionId, bvr_caption VersionName
						FROM boundary
						INNER JOIN boundary_group ON bou_group_id = bgr_id
						INNER JOIN boundary_version ON bvr_boundary_id = bou_id
						WHERE EXISTS (SELECT * FROM snapshot_boundary_version_item WHERE biw_boundary_id = bou_id)
						ORDER BY bgr_order, bgr_caption, bou_order, bou_caption, bvr_id";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}


