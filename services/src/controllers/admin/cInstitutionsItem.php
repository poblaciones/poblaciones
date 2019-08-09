<?php

namespace helena\controllers\admin;

use helena\controllers\common\cController;
use helena\db\admin\InstitutionModel;

use helena\classes\Session;
use helena\classes\Menu;
use helena\classes\App;
use minga\framework\Params;

class cInstitutionsItem extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$institutionsModel = new InstitutionModel($this->FromDraft());

		$id = Params::GetInt('id', null);
		$institution = $institutionsModel->GetObjectForEdit($id);

		$this->templateValues['id'] = $id;
		$this->templateValues['institution'] = $institution;
		$this->templateValues['html_title'] = 'Instituciones';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('institutionsItem.html.twig');
	}
	public function Post()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$institutionsModel = new InstitutionModel($this->FromDraft());

		$id = Params::GetInt('id', null);
		$institution = $institutionsModel->GetObjectForEdit($id);
		$institution->FillFromParams();
		$institutionsModel->DbSave($institution);

		return App::Redirect("/admin/institutions");
	}
}
