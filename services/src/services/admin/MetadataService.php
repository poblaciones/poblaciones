<?php

namespace helena\services\admin;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\entities\admin\structs\MetadataInfo;
use minga\framework\PublicException;
use minga\framework\Profiling;
use minga\framework\Performance;
use helena\services\backoffice as services;


class MetadataService extends BaseService
{
	public function GetNextId($className)
	{
		Profiling::BeginTimer();
		$metadata = App::Orm()->getClassMetadata($className);
		$table = $metadata->GetTableName();
		$id = $metadata->GetColumnName("Id");

		$sql = "SELECT IFNULL(MAX(" . $id . ") + 100, 100) FROM " . $table . " WHERE " . $id . " % 100 = 0";

		$ret = App::Db()->fetchScalarInt($sql);
		Profiling::EndTimer();

		return $ret;
	}

	public function EnsureId($className, $object)
	{
		$currentId = $object->getId();
		if (!$currentId) {
			$nextId = $this->GetNextId($className);
			$object->setId($nextId);
		}
	}

	public function GetMetadata($metadataId)
	{
		$ret = new MetadataInfo();
		$ret->Metadata = App::Orm()->find(entities\Metadata::class, $metadataId);
		if ($ret->Metadata === null)
			throw new PublicException('El elemento no existe en la base de datos.');

		// Colecciones de metadatos
		$metadataService = new services\MetadataService(false);
		$ret->Sources = $metadataService->GetSources($metadataId);
		$ret->Institutions = $metadataService->GetInstitutions($metadataId);
		$ret->Files = $metadataService->GetFiles($metadataId);

		return $ret;
	}
}

