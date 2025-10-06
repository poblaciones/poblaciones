<?php

namespace helena\services\backoffice;

use minga\framework\PublicException;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\admin as adminServices;
use minga\framework\Arr;
use helena\classes\Session;

class SourceService extends BaseService
{
	public function GetNewSource()
	{
		if ($this->isDraft)
		{
			$entity = new entities\DraftSource();
			$contact = new entities\DraftContact();
		}
		else
		{
			$entity = new entities\Source();
			$contact = new entities\Contact();
		}
		$entity->setIsGlobal(false);
		$entity->setContact($contact);

		return $entity;
	}

	public function GetAllPublicSources()
	{
		$records = App::Orm()->findManyByProperty($this->ApplyDraft(entities\DraftSource::class), 'IsGlobal', true, array('Caption' => 'ASC', 'Version' => 'DESC'));
		$this->fixSources($records);
		return $records;
	}

	public function GetAllSourcesByCurrentUser()
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		$user = App::Orm()->findManyByQuery("SELECT DISTINCT s FROM e:DraftSource s
																					JOIN e:DraftMetadataSource ms WITH ms.Source = s
																					JOIN s.Institution i2 JOIN ms.Metadata m2 WHERE EXISTS
																					(SELECT p2 FROM e:DraftWorkPermission p2 JOIN p2.Work w2
																					JOIN w2.Metadata m3 JOIN p2.User u2 WHERE m3.Id = m2.Id
																						AND u2.Id = :p1) AND s.IsGlobal = 0", array($userId));
		// Agrega las globales
		$records = App::Orm()->findManyByProperty($this->ApplyDraft(entities\DraftSource::class), 'IsGlobal', true, array('Caption' => 'ASC', 'Version' => 'DESC'));
		$ret = Arr::AddRange($user, $records);
		$this->fixSources($ret);
		return $ret;
	}

	public function fixSources($records)
	{
		foreach($records as $record)
		{
			if ($record->getContact() === null)
			{
				if ($this->isDraft)
					$contact = new entities\DraftContact();
				else
					$contact = new entities\Contact();

				$record->setContact($contact);
				App::Orm()->save($contact);
				App::Orm()->save($record);
			}
		}
	}

	public function Update($workId, $metadataId, $source)
	{
		if ($workId) {
			$work = App::Orm()->find(entities\DraftWork::class, $workId);
			// Si el work es publicData, pone globales las fuentes e instituciones
			$isGlobal = $work->getType() === 'P';
		}
		else
		{
			$isGlobal = true;
		}
		// Guarda la fuente
		$ins = $source->getInstitution();
		if ($ins !== null)
		{
			if ($isGlobal) $ins->setIsGlobal(true);
			App::Orm()->Save($ins);
		}
		if ($source->getContact() !== null)
			App::Orm()->Save($source->getContact());
		if ($isGlobal) $source->setIsGlobal(true);

		// Verifica permisos
		$meta = new MetadataService();
		$meta->CompleteSource($source);
		if (!$source->getIsEditableByCurrentUser())
			throw new PublicException('No tiene permisos para editar esta fuente.');
		App::Orm()->Save($source);
		// Si no está asociada, la agrega
		$this->AddSourceToMetadata($workId, $metadataId, $source->getId());
		// Repone los flags de permisos
		$meta->CompleteSource($source);
		return $source;
	}

	public function AddSourceToMetadata($workId, $metadataId, $sourceId)
	{
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);

		// Save de MetadataSource que los vincula (setear order en metadataSource)
		$source = App::Orm()->find($this->ApplyDraft(entities\DraftSource::class), $sourceId);
		// Se fija si ya está asociado
		$existing = App::Db()->fetchScalarIntNullable("SELECT * FROM " . $this->makeTableName("metadata_source") . " WHERE msc_metadata_id = ? AND msc_source_id = ?",
				array($metadata->getId(), $source->getId()));
		if ($existing !== null && $existing > 0) return self::OK;

		$sql = "SELECT MAX(msc_order) FROM " . $this->makeTableName("metadata_source") . " WHERE msc_metadata_id = ?";
		$max = App::Db()->fetchScalarIntNullable($sql, array($metadata->getId()));
		if ($max === null)
			$max = 1;
		else
			$max++;

		if ($this->isDraft)
			$newSourceMetadata = new entities\DraftMetadataSource();
		else
		{
			$newSourceMetadata = new entities\MetadataSource();

			$adminServices = new adminServices\MetadataService();
			$adminServices->EnsureId(entities\MetadataSource::class, $newSourceMetadata);
		}
		$newSourceMetadata->setOrder($max);
		$newSourceMetadata->setSource($source);
		$newSourceMetadata->setMetadata($metadata);

		App::Orm()->save($newSourceMetadata) ;

		return self::OK;
	}

	private function LoadAndValidate($workId, $metadataId, $sourceId)
	{
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);
		$metadataId = $metadata->getId();
		$metadataSource = App::Orm()->findByProperties($this->ApplyDraft(entities\DraftMetadataSource::class),
													array("Metadata.Id" => $metadataId, "Source.Id" => $sourceId));
		if ($metadataSource === null)
			throw new PublicException('Invalid relation.');
		return $metadataSource;
	}
	public function MoveSourceUp($workId, $metadataId, $sourceId)
	{
		$metadataSource = $this->LoadAndValidate($workId, $metadataId, $sourceId);
		// Obtiene el anterior
		$previousSourceId = App::Db()->fetchScalarNullable("SELECT msc_id FROM " . $this->makeTableName("metadata_source") . " WHERE msc_metadata_id = ? AND msc_order < ? ORDER BY msc_order DESC LIMIT 1",
									 array($metadataSource->getMetadata()->getId(), $metadataSource->getOrder()));
		if ($previousSourceId === null)
			return self::OK;
		$metadataSourceAlter = App::Orm()->find($this->ApplyDraft(entities\DraftMetadataSource::class), $previousSourceId);
		if ($metadataSourceAlter === null)
				return self::OK;
		// Actualiza
		$order1 = $metadataSourceAlter->getOrder();
		$order2 = $metadataSource->getOrder();
		$metadataSource->setOrder($order1);
		$metadataSourceAlter->setOrder($order2);
		App::Orm()->save($metadataSource);
		App::Orm()->save($metadataSourceAlter);
		return self::OK;
	}

	public function MoveSourceDown($workId, $metadataId, $sourceId)
	{
		$metadataSource = $this->LoadAndValidate($workId, $metadataId, $sourceId);
		// Obtiene el siguiente
		$nextSourceId = App::Db()->fetchScalarNullable("SELECT msc_id FROM " . $this->makeTableName('metadata_source')
											. " WHERE msc_metadata_id = ? AND msc_order > ? ORDER BY msc_order ASC LIMIT 1",
									array($metadataSource->getMetadata()->getId(), $metadataSource->getOrder()));
		if ($nextSourceId === null)
			return self::OK;
		$metadataSourceAlter = App::Orm()->find($this->ApplyDraft(entities\DraftMetadataSource::class), $nextSourceId);
		if ($metadataSourceAlter === null)
				return self::OK;
			// Actualiza
		$order1 = $metadataSourceAlter->getOrder();
		$order2 = $metadataSource->getOrder();
		$metadataSource->setOrder($order1);
		$metadataSourceAlter->setOrder($order2);
		App::Orm()->save($metadataSource);
		App::Orm()->save($metadataSourceAlter);
		return self::OK;
	}
	public function RemoveSourceFromWork($workId, $metadataId, $sourceId)
	{
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);
		$metadataId = $metadata->getId();
		// Si hay algo idéntico, sale
		$sql = "DELETE FROM " . $this->makeTableName('metadata_source') . " WHERE msc_metadata_id = ? AND	msc_source_id = ?";
		App::Db()->exec($sql, array($metadataId, $sourceId));
		App::Db()->markTableUpdate($this->makeTableName('metadata_source'));

		return self::OK;
	}
}

