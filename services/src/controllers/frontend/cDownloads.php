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

		$works = $this->GetPublicIndexedWorkList();

		$works = $this->AddUrls($works);

		$datasets = $this->GetPublicIndexedDatasetsList();

		$institutions = $this->CreateInstitutionsList($works);

		// Agrega para twig
		$this->AddValue('institutions', $institutions);
		$this->AddValue('rows', $works);

		return $this->Render("downloads.html.twig");
  }

	private function GetPublicIndexedDatasetsList()
	{
			$res = $this->GetPublicIndexedWorkList();
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

		return $res;
	}

	private function GetPublicIndexedWorkList()
	{
		$res = $this->GetPublicIndexedWorkList();
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

		return $res;
	}

	private function AddUrls($res)
	{
		foreach($res as &$row)
		{
			$row['publicUrl'] = Links::GetWorkUrl($row['Id']);
			$row['metadataUrl'] = Links::GetWorkMetadataUrl($row['Id']);
		}
		return $res;
	}
	private function CreateInstitutionsList($res)
	{
		// Hace el distinct de institutions
		$institutionsUsed = [];
		$institutions = [ ['Caption' => null, 'Short' => 'Todas' ]];

		foreach($res as &$row)
		{
			if (!in_array($row['Institution'], $institutionsUsed))
			{
				$institutionsUsed[] = $row['Institution'];
				$institutions[] = ['Caption' => $row['Institution'],
											'Short' => $this->ShortName($row['Institution'])];
			}
		}
		return $institutions;
	}

	private function ShortName($cad)
	{
		$ret = Str::Replace($cad, "Poblaciones. Plataforma abierta de datos espaciales de población de la Argentina.", "Poblaciones");
		$ret = Str::Replace($ret, "Poblaciones. Plataforma abierta de datos espaciales de población de la Argentina", "Poblaciones");
		$ret = Str::Replace($ret, "Plataforma abierta de datos espaciales de población de la Argentina.", "Poblaciones");
		$ret = Str::Replace($ret, "Instituto de Investigaciones Gino Germani, Facultad de Ciencias Sociales (UBA)", "Instituto de Investigaciones Gino Germani (IGG/UBA)");

	return $ret;
	}
}
