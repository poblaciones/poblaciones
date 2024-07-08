<?php

namespace helena\services\backoffice;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\IO;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\ErrorException;

use helena\classes\App;
use helena\db\frontend\FileModel;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\WorkFlags;


class OnboardingService extends BaseService
{
	private const MAX_ONBOARDING_HEIGHT = 250;

	public function CreateOnboarding($workId)
	{
		$onboarding = new entities\DraftOnboarding();
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$onboarding->setWork($work);
		$onboarding->setEnabled(false);
		App::Orm()->Save($onboarding);

		for ($n = 1; $n <= 5; $n++) {
			$step = new entities\DraftOnboardingStep();
			$step->setOrder($n);
			$step->setEnabled(true);
			$step->setCaption('Bienvenidos');
			$step->setContent('');
			$step->setImageAlignment('L');
			$step->setOnboarding($onboarding);
			$onboarding->Steps[] = $step;
			App::Orm()->Save($step);
		}
		return $onboarding;
	}

	public function GetOnboarding($workId)
	{
		Profiling::BeginTimer();
		$onboarding = App::Orm()->findByProperty(entities\DraftOnboarding::class, "Work", $workId);
		if (!$onboarding)
		{
			$onboarding = $this->CreateOnboarding($workId);
		}
		else
		{
			$steps = App::Orm()->findManyByQuery("SELECT s FROM e:DraftOnboardingStep s JOIN s.Onboarding o WHERE o.Id = :p1 ORDER BY s.Order", array($onboarding->getId()));
			$onboarding->Steps = $steps;
		}
		Profiling::EndTimer();
		return $onboarding;
	}


	public function UpdateOnboarding($workId, $onboarding)
	{
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$onboarding->setWork($draftWork);

		App::Orm()->Save($onboarding);
		WorkFlags::SetMetadataDataChanged($workId);

		return self::OK;
	}

	public function UpdateOnboardingStep($workId, $step, $image)
	{
		$onboardingId = $step->getOnboarding()->getId();
		$onboarding = App::Orm()->find(entities\DraftOnboarding::class, $onboardingId);

		if ($onboarding->getWork()->getId() !== $workId)
			throw new \Exception("Invalid step");
		if ($onboardingId !== $step->getId())
			$step->setOnboarding($onboarding);

		// Traigo el base64 de la nueva imagen
		if ($image) {
			$file = $this->GetNewStepImage();
			$step->setImage($file);

			$fileController = new FileService();
			$fileController->SaveBase64BytesToFile(
				$image,
				$file,
				$workId,
				null, self::MAX_ONBOARDING_HEIGHT
			);
		}
		App::Orm()->Save($step);
		WorkFlags::SetMetadataDataChanged($workId);

		return $step;
	}

	private function GetNewStepImage()
	{
		$wat = new entities\DraftFile();
		$wat->setName('step_'. uniqid());
		$wat->setType('image/*');
		return $wat;
	}

	public function GetStepImage($workId, $n)
	{
		$step = App::Orm()->findByQuery("SELECT s FROM e:DraftOnboardingStep s
				JOIN s.Onboarding o
				JOIN o.Work w WHERE w.Id = :p1 AND s.Order = :p2", array($workId, $n));
		// saca el file
		$fileModel = new FileModel(true, $workId);
		$outFile = IO::GetTempFilename() . '.tmp';
		if (!$step->getImage())
		{
			return '';
		}
		$fileModel->ReadFileToFile($step->getImage()->getId(), $outFile);

		// lo convierte
		$dataURL = IO::ConvertFiletoBase64($outFile);
		IO::Delete($outFile);
		return $dataURL;
	}
}
