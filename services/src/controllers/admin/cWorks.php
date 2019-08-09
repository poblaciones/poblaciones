<?php

namespace helena\controllers\admin;

use helena\controllers\common\cController;
use helena\db\admin\WorkModel;

use helena\classes\Session;
use helena\classes\Menu;

abstract class cWorks extends cMultiController
{
	public function Show()
	{
		if ($app = Session::CheckIsSiteEditor())
			return $app;
		$worksModel	= new WorkModel($this->FromDraft());
		if (array_key_exists("delete", $_GET))
		{
			if ($this->mode === 'P')
			{
				$worksModel->RevokeWork(intval($_GET['id'] / 100));
			}
			else
			{
				throw new \Exception('Para borrar datos no publicados utilice la UI de backoffice.');
			}
		}
		$onlyCurrentUser = (Session::IsMegaUser() == false);
		$works = $worksModel->GetList($this->type, $onlyCurrentUser);
		$this->LoadLinks($works);
		$this->templateValues['type'] = $this->type;
		$this->templateValues['mode'] = $this->mode;
		$this->templateValues['works'] = $works;

		$this->templateValues['html_title'] = $this->ResolveTitle();

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('works.html.twig');
	}
	private function LoadLinks(&$ret)
	{
		$entity = $this->resolveEntity();

		$this->templateValues['new_url'] = '/admin/' . $entity . 'Item';
		if ($ret == null) return;
		foreach($ret as &$item)
		{
			$item['edit_url'] = '/admin/' . $entity . 'Item?id=' . $item['id'];
			$item['delete_url'] = '/admin/' . $entity . '?delete&id=' . $item['id'];
		}
	}
	 abstract public function ResolveTitle();
}
