<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\App;
use helena\services\backoffice\PublishService;
use minga\framework\tests\TestCaseBase;

class cTestPushCreateKey extends TestCaseBase
{
	public function testPushCreateKey()
	{
		$workId = 0; //Params::GetInt("id");
		if ($workId == 0)
		{
			$em = App::Orm()->GetEntityManager();

			$text = "<br>No se indicó el parámetro id.";
			$records = $em->getRepository('helena\entities\backoffice\DraftWork')->findAll();
			$text .= "<table><tr><td>Id<td>Shard<td>Titulo";
			foreach($records as $work)
				$text .= "<tr><td>" . $work->getId() . "<td>" . $work->getShard() . "<td>" . $work->getMetadata()->getTitle();

			$text .= "</table>";
			return $text;
		}

		// le activa los flags
		App::Db()->exec("UPDATE draft_work
			SET wrk_metadata_changed = 1,
			wrk_dataset_data_changed = 0,
			wrk_metric_data_changed = 1
			WHERE wrk_id = ?", [$workId]);

		$service = new PublishService();
		$arr = $service->StartPublication($workId);
		return "Key created:" . $arr['key'] . "<br><a href='testPushStepKey?key=" . $arr['key'] . "'>StepKey</a><br>" . json_encode($arr);

	}
}

// class cTestPushCreateKey extends cController
// {
// 	public function Show()
// 	{
// 		$workId = Params::GetInt("id");
// 		if (!$workId)
// 		{
// 			$em = App::Orm()->GetEntityManager();
//
// 			$text = "<br>No se indicó el parámetro id.";
// 			$records = $em->getRepository('helena\entities\backoffice\DraftWork')->findAll();
// 			$text .= "<table><tr><td>Id<td>Shard<td>Titulo";
// 			foreach($records as $work)
// 				$text .= "<tr><td>" . $work->getId() . "<td>" . $work->getShard() . "<td>" . $work->getMetadata()->getTitle();
//
// 			$text .= "</table>";
// 			return $text;
// 		}
//
// 		// le activa los flags
// 		App::Db()->exec("UPDATE draft_work set wrk_metadata_changed = 1,
// 				 wrk_dataset_data_changed = 0,
// 				 wrk_metric_data_changed = 1 WHERE wrk_id = ?", array($workId));
//
// 		$service = new PublishService();
// 		$arr = $service->StartPublication($workId);
// 		return "Key created:" . $arr['key'] . "<br><a href='testPushStepKey?key=" . $arr['key'] . "'>StepKey</a><br>" . json_encode($arr);
// 	}
// }
