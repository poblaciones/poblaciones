<?php

namespace helena\classes;

class TreeMaker
{

	public static function GenerateTree(array $arr, $rootId = null)
	{
		$ret = array();
		foreach($arr as $c)
		{
			if($c['parent'] == $rootId)
				$ret[] = array('item' => $c, 'children' => TreeMaker::GenerateTree($arr, $c['id']));
		}
		return $ret;
	}

	//TODO: Probar.
	public static function MakeNodeTree(array $items, $node, $relationsCount = null)
	{
		foreach($items as $item)
		{
			$itemText  = $item['item']['name'];
			$reg = $item['item'];
			if ($relationsCount != null && $reg != null && isset($reg['id']))
			{
				if(isset($relationsCount[$reg['id']]))
					$itemText += " (" . $relationsCount[$reg['id']] . ")";
			}
			$childNode = array($itemText);
			$childNode['tag'] = $item['item'];

			$node['nodes'][] = $childNode;
			TreeMaker::MakeNodeTree($item['children'], $childNode, $relationsCount);
		}
	}

	public static function ToArray(array $items, array &$list, $deep = 0)
	{
		foreach ($items as $item)
		{
			$list[$item['item']['id']] = str_repeat('_', $deep * 3) . $item['item']['name'];
			TreeMaker::ToArray($item['children'], $list, $deep + 1);
		}
	}
}

