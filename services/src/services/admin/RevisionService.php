<?php

namespace helena\services\admin;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\Date;
use helena\entities\backoffice as entities;

class RevisionService extends BaseService
{

	public function GetRevisions()
	{
		$revisions = App::Orm()->findAll(entities\Revision::class, array('SubmissionDate' => 'DESC'));
		return $revisions;
	}

	public function UpdateRevision($revision)
	{
		$currentStatus = App::Db()->fetchScalarNullable("SELECT rev_decision FROM revision WHERE rev_id = ?", array($revision->getId()));
		if ($revision->getDecision() === null) {
			$revision->setResolutionDate(null);
			$revision->setUserDecision(null);
		} else if ($currentStatus !== $revision->getDecision()) {
			$revision->setResolutionDate(Date::DateTimeArNow());
			$userService = new UserService();
			$user = $userService->GetCurrentUser();
			$revision->setUserDecision($user);
		}
		App::Orm()->save($revision);
		return $revision;
	}

	public function DeleteRevision($revision)
	{
		App::Orm()->delete($revision);
		return self::OK;
	}

}
