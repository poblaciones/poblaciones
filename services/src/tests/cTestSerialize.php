<?php

namespace helena\tests;

use helena\controllers\common\cController;

use helena\entities\backoffice\DraftMetadata;
use helena\classes\Session;
use helena\classes\App;
use helena\db\admin\ContactModel;

class cTestSerialize extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$metadata = new DraftMetadata();

		echo App::Orm()->OrmSerialize($metadata);

		exit();

	}
}
