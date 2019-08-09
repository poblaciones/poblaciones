<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\TreeMaker;
use minga\framework\Profiling;


class ClippingRegionModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'clipping_region';
		$this->idField = 'clr_id';
		$this->captionField = 'clr_caption';

	}

	public function GetComboRegions($idParent, $idCountry)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT clr_id AS id, clr_caption AS name FROM clipping_region
			WHERE clr_parent_id = ? AND clr_country_id = ? ORDER BY clr_caption';

		$items = App::Db()->fetchAll($sql, array((int)$idParent, (int)$idCountry));
		$ret = $this->ToCombo($items);
		Profiling::EndTimer();
		return $ret;
	}

	public function HasMoreLevels($idParent, $idCountry)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT COUNT(clr_id) FROM clipping_region
			WHERE clr_parent_id = ? AND clr_country_id = ?';

		$ret = ((int)App::Db()->fetchColumn($sql, array((int)$idParent, (int)$idCountry)) > 0);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetComboRegionsRecursive($idCountry)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT clr_id AS id, clr_caption AS name, clr_parent_id As parent FROM clipping_region WHERE clr_country_id = ? ORDER BY clr_caption';
		$items = App::Db()->fetchAll($sql, array((int)$idCountry));

		$tree = TreeMaker::GenerateTree($items, $this->GetCountriesParentId());
		$arr = array();
		TreeMaker::ToArray($tree, $arr);
		$ret = array_flip($arr);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetCountriesParentId()
	{
		Profiling::BeginTimer();
		$sql = 'SELECT clr_id AS id FROM clipping_region WHERE clr_country_id IS NULL LIMIT 1';
		$ret = (int)App::Db()->fetchColumn($sql);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetComboCountries()
	{
		Profiling::BeginTimer();
		$sql = 'SELECT cli_id AS id, cli_caption AS name FROM clipping_region
			JOIN clipping_region_item ON clr_id = cli_clipping_region_id
			WHERE clr_country_id IS NULL LIMIT 1';

		$items = App::Db()->fetchAll($sql);
		$ret = $this->ToCombo($items);
		Profiling::EndTimer();
		return $ret;
	}

}

