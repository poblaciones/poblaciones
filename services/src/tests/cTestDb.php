<?php

namespace helena\tests;

use helena\controllers\common\cController;

use helena\entities\admin\Contact;
use helena\classes\Session;
use helena\classes\App;
use helena\db\admin\ContactModel;

class cTestDb extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$contactModel = new ContactModel();
		$contactInfo = new Contact();
		$contactInfo->Person = 'pepe';
		$contactInfo->Email = 'pepe@a.com';
		App::Db()->begin();
		echo 'insertado un registro. id: ' .  $contactModel->DbSave($contactInfo);
		App::Db()->rollback();
		echo 'rollback ok';
		exit();

	}
}
