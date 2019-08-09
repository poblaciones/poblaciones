<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;

class cFaq extends cPublicController
{
	public function Show()
	{
		if (array_key_exists('success', $_GET))
			$this->AddValue('showMessage', true);

		$this->useSearchBar = false;

		return $this->Render('faq.html.twig');
  }

}
