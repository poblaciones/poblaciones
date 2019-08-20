<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\db\admin\ContactModel;

use helena\classes\Session;
use helena\classes\Menu;
use helena\classes\App;

class cContactItem extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$contactModel	= new ContactModel($this->FromDraft());

		$id = $contactModel->GetDefaultId();
		$contact = $contactModel->GetObjectForEdit($id);

		$this->templateValues['id'] = $id;
		$this->templateValues['contact'] = $contact;
		$this->templateValues['html_title'] = 'Instituciones';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('contactItem.html.twig');
	}
	public function Post()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;

		$contactModel = new ContactModel($this->FromDraft());

		$id = $contactModel->GetDefaultId();
		$contact = $contactModel->GetObjectForEdit($id);
		$contact->FillFromParams();
		$contactModel->DbSave($contact);

		return App::Redirect("/admin/contact");
	}
}
