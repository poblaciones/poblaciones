<?php

namespace helena\controllers\frontend;

use helena\classes\App;
use helena\controllers\common\cPublicController;
use helena\classes\Links;


class cSitemap extends cPublicController
{
	public function Show()
	{
		$links = App::Db()->fetchAll("SELECT wrk_id as url, DATE_FORMAT(met_update, '%Y-%m-%d') as lastmod 
																	FROM work 
																	JOIN metadata ON met_id = wrk_metadata_id
																	WHERE wrk_is_indexed = 1 AND wrk_is_private = 0");
		$this->AddValue('links', $links);
		$this->AddValue('baseurl', Links::GetFullyQualifiedUrl(Links::GetHandleUrl()));

		return $this->Render("sitemap.html.twig");
	}
}