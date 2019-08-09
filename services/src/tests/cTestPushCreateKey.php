<?php

namespace helena\tests;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use minga\framework\Params;
use helena\services\backoffice\PublishService;

class cTestPushCreateKey extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$workId = Params::GetInt("id");
		if (!$workId)
		{

			$em = App::Db()->GetEntityManager();

			$text = "<br>No se indicó el parámetro id.";
			$records = $em->getRepository('helena\entities\backoffice\DraftWork')->findAll();
			$text .= "<table><tr><td>Id<td>Shard<td>Titulo";
			foreach($records as $work)
				$text .= "<tr><td>" . $work->getId() . "<td>" . $work->getShard() . "<td>" . $work->getMetadata()->getTitle();

			$text .= "</table>";
			return $text;
		}

		// le activa los flags
		App::Db()->exec("UPDATE draft_work set wrk_metadata_changed = 1,
				 wrk_dataset_data_changed = 0,
				 wrk_metric_data_changed = 1 WHERE wrk_id = ?", array($workId));

		$service = new PublishService();
		$arr = $service->StartPublication($workId);
		return "Key created:" . $arr['key'] . "<br><a href='testPushStepKey?key=" . $arr['key'] . "'>StepKey</a><br>" . json_encode($arr);
	}
}
