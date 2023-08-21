<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\Session;

use minga\framework\Date;
use minga\framework\Profiling;

class OnboardingModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'onboarding';
		$this->idField = 'onb_id';
		$this->captionField = '';

	}
	public function GetOnboardingInfo($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT onb_id, onb_enabled, obs_content StepContent,
						obs_id StepId, obs_caption StepName, obs_image_id ImageId,
						obs_image_alignment Alignment
				FROM onboarding
				JOIN onboarding_step
						ON obs_onboarding_id = onb_id
						WHERE onb_work_id = ? AND obs_enabled = 1
						AND (LENGTH(TRIM(obs_content)) > 0 OR obs_image_id IS NOT NULL)
						ORDER BY obs_order";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function CheckOwner($workId, $fileId)
	{
		Profiling::BeginTimer();
		$params = array($workId, $fileId);

		$sql = "SELECT COUNT(*)
				FROM onboarding
				JOIN onboarding_step
						ON obs_onboarding_id = onb_id
				WHERE onb_work_id = ? AND obs_image_id = ?";

		$ret = App::Db()->fetchScalarInt($sql, $params);
		Profiling::EndTimer();
		if ($ret == 0) throw new \Exception("Invalida request");
	}
}
