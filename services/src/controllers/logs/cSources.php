<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\SourceModel;

use helena\classes\Session;
use helena\classes\Menu;

class cSources extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$sourcesModel	= new SourceModel($this->FromDraft());
		if (array_key_exists("delete", $_GET))
		{
			$sourcesModel->Delete($_GET['id']);
		}
		$sources = $sourcesModel->GetList();
		$this->LoadLinks($sources);
		$this->templateValues['sources'] = $sources;

		$this->templateValues['html_title'] = 'Instituciones';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('sources.html.twig');
	}
	private function LoadLinks(&$ret)
	{
		$this->templateValues['new_url'] = '/logs/sourcesItem';
		if ($ret == null) return;
		foreach($ret as &$item)
		{
			$item['edit_url'] = '/logs/sourcesItem?id=' . $item['id'];
			$item['delete_url'] = '/logs/sources?delete&id=' . $item['id'];
		}
	}

}
