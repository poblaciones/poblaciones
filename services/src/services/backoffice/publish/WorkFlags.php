<?php

namespace helena\services\backoffice\publish;

use helena\classes\Session;
use minga\framework\Date;
use minga\framework\Profiling;

use helena\entities\backoffice\DraftWork;
use helena\classes\App;
use helena\db\backoffice\WorkModel;

class WorkFlags
{
	public static function SetMetadataDataChanged($workId)
	{
		Profiling::BeginTimer();
		$work = App::Orm()->find(DraftWork::class, $workId);
		$work->setMetadataChanged(true);
		self::Save($work);
		Profiling::EndTimer();
	}
	public static function SetMetricDataChanged($workId)
	{
		Profiling::BeginTimer();
		$work = App::Orm()->find(DraftWork::class, $workId);
		$work->setMetricDataChanged(true);
		self::Save($work);
		Profiling::EndTimer();
	}
	public static function SetDatasetLabelsChanged($workId)
	{
		Profiling::BeginTimer();
		$work = App::Orm()->find(DraftWork::class, $workId);
		$work->setDatasetLabelsChanged(true);
		self::Save($work);
		Profiling::EndTimer();
	}
	public static function SetDatasetDataChanged($workId)
	{
		Profiling::BeginTimer();
		$work = App::Orm()->find(DraftWork::class, $workId);
		$work->setDatasetDataChanged(true);
		self::Save($work);
		Profiling::EndTimer();
	}
	public static function ClearAll($workId)
	{
		Profiling::BeginTimer();

		$wm = new WorkModel();

		$work = App::Orm()->find(DraftWork::class, $workId);

		$work->setMetadataChanged(false);
		$work->setDatasetLabelsChanged(false);
		$work->setDatasetDataChanged(false);
		$work->setMetricLabelsChanged(false);
		$work->setMetricDataChanged(false);
		self::Save($work);
		Profiling::EndTimer();
	}
	public static function AllAreUnset($workId)
	{
		Profiling::BeginTimer();

		$work = App::Orm()->find(DraftWork::class, $workId);

		$allUnset = $work->getMetadataChanged() == false &&
					$work->getDatasetLabelsChanged() == false &&
					$work->getDatasetDataChanged() == false &&
					$work->getMetricLabelsChanged() == false &&
					$work->getMetricDataChanged();

		Profiling::EndTimer();

		return $allUnset;
	}
	public static function SetAll($workId)
	{
		Profiling::BeginTimer();

		$work = App::Orm()->find(DraftWork::class, $workId);

		$work->setMetadataChanged(true);
		$work->setDatasetLabelsChanged(true);
		$work->setDatasetDataChanged(true);
		$work->setMetricLabelsChanged(true);
		$work->setMetricDataChanged(true);

		self::Save($work);

		Profiling::EndTimer();
	}

	public static function Save($work)
	{
		Profiling::BeginTimer();

		$date = new \DateTime();
		$work->setUpdate($date);

		$userId = Session::GetCurrentUser()->GetUserId();
		$work->setUpdateUserId($userId);

		App::Orm()->save($work);

		Profiling::EndTimer();
	}
}
