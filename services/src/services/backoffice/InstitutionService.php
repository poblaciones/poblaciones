<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\admin as adminServices;
use minga\framework\Arr;
use minga\framework\IO;
use minga\framework\PublicException;
use helena\db\frontend\FileModel;
use helena\classes\Session;

class InstitutionService extends BaseService
{
	public const MAX_WATERMARK_HEIGHT = 240;

	public function GetNewInstitution()
	{
		$new = new entities\DraftInstitution();
		$new->setIsGlobal(false);
		return $new;
	}

	public function Update($institution, $watermarkImage)
	{
		// Verifica el permiso
		$meta = new MetadataService();
		$meta->CompleteInstitution($institution);
		if (!$institution->getIsEditableByCurrentUser())
			throw new PublicException('No tiene permisos para editar esta institución.');

		if ($watermarkImage)
		{
			$file = $this->GetNewWatermark();
			$institution->setWatermark($file);

			$fileController = new FileService($this->isDraft);
			$fileController->SaveBase64BytesToFile($watermarkImage, $file, null,
										 null, self::MAX_WATERMARK_HEIGHT);
		}
		App::Orm()->Save($institution);
		$institution->setIsEditableByCurrentUser(true);
		return $institution;
	}

	public function GetAllInstitutionsByCurrentUser()
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		$user = App::Orm()->findManyByQuery("SELECT DISTINCT y FROM e:DraftInstitution y WHERE y.IsGlobal = 0 AND
																	(EXISTS (SELECT i FROM e:DraftMetadataInstitution mi
																				JOIN mi.Institution i
																				JOIN mi.Metadata m
																			WHERE i.IsGlobal = 0 AND i.Id = y.Id AND
																			EXISTS (SELECT p FROM
																				e:DraftWorkPermission p JOIN p.Work w JOIN p.User u
																							JOIN w.Metadata mp WHERE mp.Id = m.Id AND u.Id = :p1))
														OR
																	EXISTS (
																			SELECT i2 FROM e:DraftMetadataSource ms JOIN ms.Source s
																			JOIN s.Institution i2 JOIN ms.Metadata m2 WHERE EXISTS
																				(SELECT p2 FROM e:DraftWorkPermission p2 JOIN p2.Work w2
																				JOIN w2.Metadata m3 JOIN p2.User u2 WHERE m3.Id = m2.Id
																					AND u2.Id = :p1) AND i2.IsGlobal = 0 AND i2.Id = y.Id)
																	)", array($userId));
		// Agrega las globales
		$records = App::Orm()->findManyByProperty(entities\DraftInstitution::class, 'IsGlobal', true, array('Caption' => 'ASC'));
		// Listo
		return Arr::AddRange($user, $records);
	}

	public function GetAllPublicInstitutions()
	{
		$records = App::Orm()->findManyByProperty($this->ApplyDraft(entities\DraftInstitution::class), 'IsGlobal', true, array('Caption' => 'ASC'));
		return $records;
	}

	public function GetInstitutionWatermark($watermarkId, $fromDraft=true)
	{
		$outFile = $this->GetInstitutionWatermarkFile($watermarkId, $fromDraft);
		$dataURL = IO::ConvertFiletoBase64($outFile);
		IO::Delete($outFile);
		return $dataURL;
	}

	public function GetInstitutionWatermarkFile($watermarkId, $fromDraft=true)
	{
		$fileModel = new FileModel($fromDraft);
		$outFile = IO::GetTempFilename() . '.tmp';
		$fileModel->ReadFileToFile($watermarkId, $outFile);
		return $outFile;
	}

	private function GetNewWatermark()
	{
		if ($this->isDraft)
			$wat = new entities\DraftFile();
		else
		{
			$wat = new entities\File();

			$adminServices = new adminServices\MetadataService();
			$adminServices->EnsureId(entities\File::class, $wat);
		}
		$wat->setName('watermark_' . uniqid());
		$wat->setType('image/*');
		return $wat;
	}

	public function UpdateWorkInstitution($workId, $metadataId, $institution)
	{
		// Si no está asociada, la agrega
		$this->AddInstitutionToMetadata($workId, $metadataId, $institution->getId());
		// Repone los flags de permisos
		$meta = new MetadataService();
		$meta->CompleteInstitution($institution);
		return $institution;
	}

	public function AddInstitutionToMetadata($workId, $metadataId, $institutionId)
	{
		// Save de MetadataInstitution que los vincula (setear order en metadataInstitution)
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);
		$institution = App::Orm()->find($this->ApplyDraft(entities\DraftInstitution::class), $institutionId);
		// Se fija si ya está asociado
		$existing = App::Db()->fetchScalarIntNullable(
			"SELECT * FROM " . $this->makeTableName("metadata_institution") . " WHERE min_metadata_id = ? AND min_institution_id = ?",
			array($metadata->getId(), $institution->getId())
		);
		if ($existing !== null && $existing > 0)
			return self::OK;

		$sql = "SELECT MAX(min_order) FROM " . $this->makeTableName("metadata_institution") . " WHERE min_metadata_id = ?";
		$max = App::Db()->fetchScalarIntNullable($sql, array($metadata->getId()));
		if ($max === null)
			$max = 1;
		else
			$max++;

		if ($this->isDraft)
			$newInstitutionMetadata = new entities\DraftMetadataInstitution();
		else
		{
			$newInstitutionMetadata = new entities\MetadataInstitution();

			$adminServices = new adminServices\MetadataService();
			$adminServices->EnsureId(entities\MetadataInstitution::class, $newInstitutionMetadata);
		}
		$newInstitutionMetadata->setOrder($max);
		$newInstitutionMetadata->setInstitution($institution);
		$newInstitutionMetadata->setMetadata($metadata);
		App::Orm()->save($newInstitutionMetadata);

		return self::OK;
	}

	private function LoadAndValidate($workId, $metadataId, $institutionId)
	{
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);

		$metadataInstitution = App::Orm()->findByProperties($this->ApplyDraft(entities\DraftMetadataInstitution::class), array("Metadata.Id" => $metadata->getId(), "Institution.Id" => $institutionId));
		if ($metadataInstitution === null)
			throw new PublicException('Invalid relation.');
		return $metadataInstitution;
	}
	public function MoveInstitutionUp($workId, $metadataId, $institutionId)
	{
		$metadataInstitution = $this->LoadAndValidate($workId, $metadataId, $institutionId);
		// Obtiene el anterior
		$previousInstitutionId = App::Db()->fetchScalarNullable(
			"SELECT min_id FROM " . $this->makeTableName("metadata_institution") . " WHERE min_metadata_id = ? AND min_order < ? ORDER BY min_order DESC LIMIT 1",
			array($metadataInstitution->getMetadata()->getId(), $metadataInstitution->getOrder())
		);
		if ($previousInstitutionId === null)
			return self::OK;
		$metadataInstitutionAlter = App::Orm()->find($this->ApplyDraft(entities\DraftMetadataInstitution::class), $previousInstitutionId);
		if ($metadataInstitutionAlter === null)
			return self::OK;

		// Actualiza
		$order1 = $metadataInstitutionAlter->getOrder();
		$order2 = $metadataInstitution->getOrder();
		$metadataInstitution->setOrder($order1);
		$metadataInstitutionAlter->setOrder($order2);
		App::Orm()->save($metadataInstitution);
		App::Orm()->save($metadataInstitutionAlter);
		return self::OK;
	}

	public function MoveInstitutionDown($workId, $metadataId, $institutionId)
	{
		$metadataInstitution = $this->LoadAndValidate($workId, $metadataId, $institutionId);
		// Obtiene el siguiente... necesita traer el metadata
		$nextInstitutionId = App::Db()->fetchScalarNullable(
			"SELECT min_id FROM " . $this->makeTableName("metadata_institution") . " WHERE min_metadata_id = ? AND min_order > ? ORDER BY min_order ASC LIMIT 1",
			array($metadataInstitution->getMetadata()->getId(), $metadataInstitution->getOrder())
		);
		if ($nextInstitutionId === null)
			return self::OK;
		$metadataInstitutionAlter = App::Orm()->find($this->ApplyDraft(entities\DraftMetadataInstitution::class), $nextInstitutionId);
		if ($metadataInstitutionAlter === null)
			return self::OK;

		// Actualiza
		$order1 = $metadataInstitutionAlter->getOrder();
		$order2 = $metadataInstitution->getOrder();
		$metadataInstitution->setOrder($order1);
		$metadataInstitutionAlter->setOrder($order2);
		App::Orm()->save($metadataInstitution);
		App::Orm()->save($metadataInstitutionAlter);
		return self::OK;
	}
	public function RemoveInstitutionFromWork($workId, $metadataId, $institutionId)
	{
		$ms = new MetadataService($this->isDraft);
		$metadata = $ms->ResolveMetadata($workId, $metadataId);
		$metadataId = $metadata->getId();
		// Si hay algo idéntico, sale
		$sql = "DELETE FROM " . $this->makeTableName("metadata_institution") . " WHERE min_metadata_id = ? AND min_institution_id = ?";
		App::Db()->exec($sql, array($metadataId, $institutionId));
		App::Db()->markTableUpdate($this->makeTableName('metadata_institution'));

		return self::OK;
	}
}

