<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
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
		$wk = new WorkService();
		$wk->CompleteInstitution($institution);
		if (!$institution->getIsEditableByCurrentUser())
			throw new PublicException('No tiene permisos para editar esta institución.');

		if ($watermarkImage)
		{
			$file = $this->GetNewWatermark($institution);
			$institution->setWatermark($file);

			$fileController = new FileService();
			$fileController->SaveBase64BytesToFile($watermarkImage, $file,
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
																	(EXISTS (SELECT i FROM e:DraftWorkPermission p JOIN p.Work w
																	JOIN w.Metadata m JOIN m.Institution i JOIN p.User u WHERE u.Id = :p1 AND i.IsGlobal = 0 AND i.Id = y.Id)
																	OR
																	EXISTS (
																			SELECT i2 FROM e:DraftMetadataSource ms JOIN ms.Source s
																			JOIN s.Institution i2 JOIN ms.Metadata m2 WHERE EXISTS
																				(SELECT p2 FROM e:DraftWorkPermission p2 JOIN p2.Work w2
																				JOIN w2.Metadata m3 JOIN p2.User u2  WHERE m3.Id = m2.Id
																					AND u2.Id = :p1) AND i2.IsGlobal = 0 AND i2.Id = y.Id)
																	)", array($userId));
		// Agrega las globales
		$records = App::Orm()->findManyByProperty(entities\DraftInstitution::class, 'IsGlobal', true, array('Caption' => 'ASC'));
		// Listo
		return Arr::AddRange($user, $records);
	}

	public function GetAllInstitutions()
	{
		$records = App::Orm()->findAll(entities\DraftInstitution::class, array('Caption' => 'ASC'));
		return $records;
	}

	public function GetInstitutionWatermark($watermarkId, $fromDraft=true)
	{
		$outFile = $this->GetInstitutionWatermarkFile($watermarkId, $fromDraft);
		$fileController = new FileService();
		$dataURL = $fileController->ConvertFiletoBase64($outFile);
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

	private function GetNewWatermark($institution)
	{
		$wat = new entities\DraftFile();
		$wat->setName('watermark_'. uniqid());
		$wat->setType('image/*');
		return $wat;
	}
}

