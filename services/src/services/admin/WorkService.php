<?php

namespace helena\services\admin;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\PublicException;
use helena\services\backoffice\publish\PublishSnapshots;
use helena\services\backoffice\publish\PublishDataTables;

class WorkService extends BaseService
{
	public function UpdateWorkIndexing($workId, $value)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsIndexed($value);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($value && $work->getAccessLink()) {
			throw new PublicException("No se puede indexar una cartografía con visibilidad por enlace.");
		}
		if ($work !== null) {
			$work->setIsIndexed($value);
			App::Orm()->save($work);
		}
		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkVisibility($workId);
		return self::OK;
	}

	public function UpdateWorkSegmentedCrawling($workId, $value)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setSegmentedCrawling($value);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($value && $work->getAccessLink()) {
			throw new PublicException("No se puede indexar una cartografía con visibilidad por enlace.");
		}
		if ($work !== null) {
			$work->setSegmentedCrawling($value);
			App::Orm()->save($work);
		}
		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkSegmentedCrawling($workId);
		return self::OK;
	}
}

