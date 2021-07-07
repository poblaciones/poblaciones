<?php

namespace helena\services\admin;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\Date;
use helena\entities\backoffice as entities;

class ReviewService extends BaseService
{

	public function GetReviews()
	{
		$reviews = App::Orm()->findAll(entities\Review::class, array('SubmissionDate' => 'DESC'));
		return $reviews;
	}

	public function UpdateReview($review)
	{
		$currentStatus = App::Db()->fetchScalarNullable("SELECT rev_decision FROM review WHERE rev_id = ?", array($review->getId()));
		if ($review->getDecision() === null) {
			$review->setResolutionDate(null);
			$review->setUserDecision(null);
		} else if ($currentStatus !== $review->getDecision()) {
			$review->setResolutionDate(new \DateTime());
			$userService = new UserService();
			$user = $userService->GetCurrentUser();
			$review->setUserDecision($user);
		}
		App::Orm()->save($review);
		return $review;
	}

	public function DeleteReview($review)
	{
		App::Orm()->delete($review);
		return self::OK;
	}

}
