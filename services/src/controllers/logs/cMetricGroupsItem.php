<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\MetricGroupModel;
use helena\services\backoffice\publish\CacheManager;
use helena\classes\VersionUpdater;
use helena\classes\Session;
use helena\classes\Menu;
use helena\classes\App;
use minga\framework\Params;

class cMetricGroupsItem extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$metricGroupsModel	= new MetricGroupModel();

		$id = Params::GetInt('id', null);
		$metricGroup = $metricGroupsModel->GetObjectForEdit($id);

		$this->templateValues['id'] = $id;
		$this->templateValues['groups'] = $metricGroupsModel->GetMetricGroupsForCombo();
		$this->templateValues['metricGroup'] = $metricGroup;
		$this->templateValues['html_title'] = 'Categorías';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('metricGroupsItem.html.twig');
	}
	public function Post()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$metricGroupsModel = new MetricGroupModel();

		$id = Params::GetInt('id', null);
		$metricGroup = $metricGroupsModel->GetObjectForEdit($id);
		$metricGroup->FillFromParams();
		if ($metricGroup->ParentId == '') $metricGroup->ParentId = null;
		$metricGroupsModel->DbSave($metricGroup);

		$caches = new CacheManager();
		$caches->CleanFabMetricsCache();
		$caches->CleanMetricGroupsMetadataCache();
		VersionUpdater::Increment('FAB_METRICS');

		return App::Redirect("/logs/categories");
	}
}
