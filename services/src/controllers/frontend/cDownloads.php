<?php

namespace helena\controllers\frontend;

use minga\framework\Request;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\Arr;
use minga\framework\Context;
use minga\framework\Str;

use helena\classes\App;
use helena\classes\Links;
use helena\controllers\common\cPublicController;


class cDownloads extends cPublicController
{
	private $cleanRoute;
	private $cleanRouteBase;

	public function Show()
	{
		Performance::SetController('downloads', 'get', true);

		$sql = "SELECT mvw_work_id Id, mvw_work_caption Caption,
			 mvw_work_authors Authors, mvw_work_institution Institution,
         GROUP_CONCAT(mvw_metric_caption SEPARATOR ', ') Metrics
			FROM snapshot_metric_version
			where mvw_work_is_private = false
			and mvw_work_is_indexed = true
			group by mvw_work_id, mvw_work_caption,
					 mvw_work_authors, mvw_work_institution
			order by mvw_work_caption";

		$res = App::Db()->fetchAll($sql);
		// Hace el distinct de institutions
		$institutions = [];

		foreach($res as &$row)
		{
			$row['publicUrl'] = Links::GetWorkUrl($row['Id']);
			$row['metadataUrl'] = Links::GetWorkMetadataUrl($row['Id']);
			if (!in_array($row['Institution'], $institutions))
				$institutions[] = $row['Institution'];
		}

		$this->AddValue('institutions', $institutions);
		$this->AddValue('rows', $res);
		return $this->Render("downloads.html.twig");
  }
}
