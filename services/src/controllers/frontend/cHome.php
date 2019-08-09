<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Context;
use minga\framework\Str;
use helena\classes\App;
use helena\classes\Links;

class cHome	extends cPublicController
{
	public function Show()
	{
		return App::Redirect(Links::GetMapUrl());
	}

}
