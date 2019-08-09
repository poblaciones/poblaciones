<?php

namespace helena\services\backoffice;

use minga\framework\ErrorException;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Arr;
use helena\classes\Session;

class SourceService extends BaseService
{
	public function GetNewSource()
	{
		$entity = new entities\DraftSource();
		$entity->setIsGlobal(false);
		$contact = new entities\DraftContact();
		$entity->setContact($contact);
		return $entity;
	}

	public function GetAllSources()
	{
		$records = App::Orm()->findAll(entities\DraftSource::class, array('Caption' => 'ASC', 'Version' => 'DESC'));
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
		$records = App::Orm()->findManyByProperty(entities\DraftSource::class, 'IsGlobal', true, array('Caption' => 'ASC', 'Version' => 'DESC'));
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
				$contact = new entities\DraftContact();
				$record->setContact($contact);
				App::Orm()->save($contact);
				App::Orm()->save($record);
			}
		}
	}
	public function Update($workId, $source)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		// Si el work es publicData, pone globales las fuentes e instituciones
		$isGlobal = $work->getType() === 'P';
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
		$wk = new WorkService();
		$wk->CompleteSource($source);
		if (!$source->getIsEditableByCurrentUser())
			throw new ErrorException('No tiene permisos para editar esta fuente.');
		App::Orm()->Save($source);
		// Si no está asociada, la agrega
		$this->AddSourceToWork($workId, $source->getId());
		// Repone los flags de permisos
		$wk->CompleteSource($source);
		return $source;
	}

	public function AddSourceToWork($workId, $sourceId)
	{
		// Save de MetadataSource que los vincula (setear order en metadataSource)
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$source = App::Orm()->find(entities\DraftSource::class, $sourceId);
		$metadata = $work->getMetadata();
		// Se fija si ya está asociado
		$existing = App::Db()->fetchScalarIntNullable("SELECT * FROM draft_metadata_source WHERE msc_metadata_id = ? AND msc_source_id = ?",
				array($metadata->getId(), $source->getId()));
		if ($existing !== null && $existing > 0) return self::OK;

		$sql = "SELECT MAX(msc_order) FROM draft_metadata_source WHERE msc_metadata_id = ?";
		$max = App::Db()->fetchScalarIntNullable($sql, array($metadata->getId()));
		if ($max === null)
			$max = 1;
		else
			$max++;

		$newSourceMetadata = new entities\DraftMetadataSource();
		$newSourceMetadata->setOrder($max);
		$newSourceMetadata->setSource($source);
		$newSourceMetadata->setMetadata($metadata);

		App::Orm()->save($newSourceMetadata) ;

		return self::OK;
	}

	private function LoadAndValidate($workId, $sourceId)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$metadataId = $work->getMetadata()->getId();
		$metadataSource = App::Orm()->findByProperties(entities\DraftMetadataSource::class, array("Metadata.Id" => $metadataId, "Source.Id" => $sourceId));
		if ($metadataSource === null)
			throw new ErrorException('Invalid relation.');
		return $metadataSource;
	}
	public function MoveSourceUp($workId, $sourceId)
	{
		$metadataSource = $this->LoadAndValidate($workId, $sourceId);
		// Obtiene el anterior
		$previousSourceId = App::Db()->fetchScalar("SELECT msc_id FROM draft_metadata_source WHERE msc_metadata_id = ? AND msc_order < ? ORDER BY msc_order DESC LIMIT 1",
									 array($metadataSource->getMetadata()->getId(), $metadataSource->getOrder()));
		$metadataSourceAlter = App::Orm()->find(entities\DraftMetadataSource::class, $previousSourceId);
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

	public function MoveSourceDown($workId, $sourceId)
	{
		$metadataSource = $this->LoadAndValidate($workId, $sourceId);
		// Obtiene el siguiente
		$nextSourceId = App::Db()->fetchScalar("SELECT msc_id FROM draft_metadata_source WHERE msc_metadata_id = ? AND msc_order > ? ORDER BY msc_order ASC LIMIT 1",
									array($metadataSource->getMetadata()->getId(), $metadataSource->getOrder()));
		$metadataSourceAlter = App::Orm()->find(entities\DraftMetadataSource::class, $nextSourceId);
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
	public function RemoveSourceFromWork($workId, $sourceId)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$metadataId = $work->getMetadata()->getId();
		// Si hay algo idéntico, sale
		$sql = "DELETE FROM draft_metadata_source WHERE msc_metadata_id = ? AND	msc_source_id = ?";
		App::Db()->exec($sql, array($metadataId, $sourceId));

		return self::OK;
	}
}

