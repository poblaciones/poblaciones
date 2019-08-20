<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\InstitutionModel;

use helena\classes\Session;
use helena\classes\Menu;
use Symfony\Component\HttpFoundation\Request;

class cInstitutions extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$institutionsModel	= new InstitutionModel($this->FromDraft());
		if (array_key_exists("delete", $_GET))
		{
			$institutionsModel->DeleteById($_GET['id']);
		}
		$institutions = $institutionsModel->GetList();
		$this->LoadLinks($institutions);
		$this->templateValues['institutions'] = $institutions;

		$this->templateValues['html_title'] = 'Instituciones';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('institutions.html.twig');
	}
	private function LoadLinks(&$ret)
	{
		$this->templateValues['new_url'] = '/admin/institutionsItem';
		if ($ret == null) return;
		foreach($ret as &$item)
		{
			$item['edit_url'] = '/admin/institutionsItem?id=' . $item['id'];
			$item['delete_url'] = '/admin/institutions?delete&id=' . $item['id'];
		}
	}

}
