<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\MetricGroupModel;
use helena\services\backoffice\publish\CacheManager;
use helena\classes\Session;
use helena\classes\Menu;

class cMetricGroups extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$metricGroupsModel	= new MetricGroupModel();
		if (array_key_exists("delete", $_GET))
		{
			$metricGroupsModel->DeleteById($_GET['id']);
			$caches = new CacheManager();
			$caches->CleanFabMetricsCache();
			$caches->CleanMetricGroupsMetadataCache();
		}
		$metricGroups = $metricGroupsModel->GetList();
		$this->LoadLinks($metricGroups);
		$this->templateValues['metricGroups'] = $metricGroups;

		$this->templateValues['html_title'] = 'Categorías';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('metricGroups.html.twig');
	}
	private function LoadLinks(&$ret)
	{
		$this->templateValues['new_url'] = '/logs/categoriesItem';
		if ($ret == null) return;
		foreach($ret as &$item)
		{
			$item['edit_url'] = '/logs/categoriesItem?id=' . $item['id'];
			$item['delete_url'] = '/logs/categories?delete&id=' . $item['id'];
		}
	}

}
