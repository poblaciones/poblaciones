<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\RevisionsModel;

class RevisionsService extends BaseService
{
	public function GetRevisions()
	{
		$model = new RevisionsModel();
		return array('Revisions' => $model->GetRevisions());
	}
}

