<?php

namespace helena\controllers\admin;

use helena\controllers\common\cController;
use helena\db\admin\WorkModel;
use helena\db\admin\SourceModel;
use helena\db\admin\InstitutionModel;
use helena\db\admin\ContactModel;
use helena\db\admin\MetricGroupModel;

use helena\classes\Session;
use helena\classes\Account;
use helena\classes\Menu;
use helena\classes\App;

use minga\framework\Arr;
use minga\framework\Params;
use minga\framework\CreativeCommons;

class cWorksItem extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$isFromDraft = $this->FromDraft();
		$worksModel	= new WorkModel($isFromDraft);
		$sourcesModel	= new SourceModel($isFromDraft);
		$metricGroupModel = new MetricGroupModel();
		$institutionsModel = new InstitutionModel($isFromDraft);

		$id = Params::GetInt('id', null);
		$work = $worksModel->GetObjectForEdit($id);

		$this->templateValues['validStatus'] = WorkModel::$posibleStatus;
		$this->templateValues['publicSources'] = Arr::ToKeyArr($sourcesModel->GetPublicSources());
		$this->AddValue('licenseVersions', CreativeCommons::GetVersions());
		$this->templateValues['id'] = $id;

		$this->templateValues['groups'] = $metricGroupModel->GetMetricGroupsForCombo();
		$this->templateValues['institutions'] = $institutionsModel->GetInstitutionsForCombo();

		$this->templateValues['type'] = $this->type;
		$this->templateValues['mode'] = $this->mode;
		$this->templateValues['work'] = $work;

		$this->templateValues['html_title'] = 'Cartografías';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('worksItem.html.twig');
	}
	public function Post()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$isFromDraft = $this->FromDraft();
		$worksModel	= new WorkModel($isFromDraft);
		$sourcesModel	= new SourceModel($isFromDraft);
		$metricGroupModel = new MetricGroupModel();
		$institutionsModel = new InstitutionModel($isFromDraft);
		$contactsModel = new ContactModel($isFromDraft);

		$id = Params::GetInt('id', null);
		$work = $worksModel->GetObjectForEdit($id);
		$work->FillMetadataFromParams();
		$work->Type = $this->type;
		$work->Metadata->Type = $this->type;

		if ($this->type == 'P')
		{
			$work->Metadata->ContactId = $contactsModel->GetDefaultId();
			$work->Metadata->InstitutionId = $institutionsModel->GetDefaultId();
			// Se asegura de que grabe estas cosas
			$work->Metadata->Source->isDirty = true;
			$work->Metadata->Source->Type = $this->type;
			$work->Metadata->Source->Contact->isDirty = true;
		}
		else
		{
			// Se asegura de que no trate de grabar estas cosas
			// (graba el SourceId, no el objeto)
			$work->Metadata->Source->Contact = null;
			$work->Metadata->Source->Institution = null;
			$work->Metadata->Source = null;
		}
		$worksModel->Save($work);

		$entity = $this->resolveEntity();
		return App::Redirect("/admin/" . $entity);
	}
}
