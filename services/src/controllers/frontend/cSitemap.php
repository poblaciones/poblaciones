<?php

namespace helena\controllers\frontend;

use helena\classes\App;
use helena\controllers\common\cPublicController;
use helena\classes\Links;
use helena\db\frontend\MetadataModel;

use minga\framework\Str;


class cSitemap extends cPublicController
{
	public function Show()
	{
		$model = new MetadataModel();
		$links = $model->GetSitemapLinks();

		$this->AddValue('links', $links);
		$this->AddValue('baseurl', Links::GetFullyQualifiedUrl(Links::GetHandleUrl()));

		App::SetContentType("application/xml");
		return $this->Render("sitemap.html.twig");
	}
}