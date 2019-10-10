<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\SourceModel;
use helena\db\admin\InstitutionModel;

use helena\classes\Session;
use helena\classes\Menu;
use helena\classes\App;
use minga\framework\Params;

class cSourcesItem extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$sourcesModel	= new SourceModel($this->FromDraft());
		$institutionsModel	= new InstitutionModel($this->FromDraft());

		$id = Params::GetInt('id', null);
		$source = $sourcesModel->GetObjectForEdit($id);

		$this->templateValues['institutions'] = $institutionsModel->GetInstitutionsForCombo();

		$this->templateValues['id'] = $id;
		$this->templateValues['source'] = $source;
		$this->templateValues['html_title'] = 'Fuentes';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('sourcesItem.html.twig');
	}
	public function Post()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$sourcesModel = new SourceModel($this->FromDraft());

		$id = Params::GetInt('id', null);
		$source = $sourcesModel->GetObjectForEdit($id);
		$source->FillMetadataFromParams();
		
		$sourcesModel->Save($source);

		return App::Redirect("/admin/sources");
	}
}
