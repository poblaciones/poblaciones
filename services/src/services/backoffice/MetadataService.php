<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\WorkFlags;

class MetadataService extends DbSession
{
	public function UpdateMetadata($workId, $metadata)
	{
		$this->UpdateInstitutionGlobalFlag($workId, $metadata);
		$this->Save(entities\DraftMetadata::class, $metadata);
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	private function UpdateInstitutionGlobalFlag($workId, $metadata)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$isGlobal = $work->getType() === 'P';
		$metadataId = $work->getMetadata()->getId();

		$institutionRelations = App::Orm()->findManyByProperty(entities\DraftMetadataInstitution::class, "Metadata.Id", $metadataId);

		foreach($institutionRelations as $relation)
		{
			$ins = $relation->getInstitution();
			if ($ins !== null)
			{
				if ($isGlobal && $ins->getIsGlobal() == false)
				{
					$ins->setIsGlobal(true);
					App::Orm()->Save($ins);
				}
			}
		}
	}
}

