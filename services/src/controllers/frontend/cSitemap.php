<?php

namespace helena\controllers\frontend;

use helena\classes\App;
use helena\controllers\common\cPublicController;
use helena\classes\Links;
use minga\framework\Str;


class cSitemap extends cPublicController
{
	public function Show()
	{
		$links = App::Db()->fetchAll("SELECT wrk_id as url, DATE_FORMAT(met_update, '%Y-%m-%d') as lastmod, met_title as title
																	FROM work 
																	JOIN metadata ON met_id = wrk_metadata_id
																	WHERE wrk_is_indexed = 1 AND wrk_is_private = 0");
		// Hace el pseudo-encoding para los nombres
		foreach($links as &$link)
			$link['title'] = Str::CrawlerUrlEncode($link['title']);
		$this->AddValue('links', $links);
		$this->AddValue('baseurl', Links::GetFullyQualifiedUrl(Links::GetHandleUrl()));
		App::SetContentType("application/xml");
		return $this->Render("sitemap.html.twig");
	}
}