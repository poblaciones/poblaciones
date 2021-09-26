<?php

namespace helena\services\common;

use minga\framework\PublicException;
use minga\framework\Str;

use helena\classes\DownloadBoundaryStateBag;
use helena\db\frontend\BoundaryDownloadModel;
use helena\caches\BoundaryDownloadCache;
use helena\classes\App;


class BoundaryDownloadManager extends BaseDownloadManager
{
	public function CreateMultiRequestFile($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		self::ValidateType($type);
		// Si está cacheado, sale
		if($this->IsCached($type, $boundaryId, $clippingItemId, $clippingCircle))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $boundaryId, $clippingItemId, $clippingCircle);
		$this->PrepareNewState($type, $boundaryId, $clippingItemId, $clippingCircle);
		return $this->GenerateNextFilePart();
	}

	private static function IsCached($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryId, $clippingItemId, $clippingCircle);
		$filename = null;
		return BoundaryDownloadCache::Cache()->HasData($cacheKey, $filename);
	}

	public static function GetFileBytes($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		self::ValidateType($type);

		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryId, $clippingItemId, $clippingCircle);
		$friendlyName = self::GetFileName($boundaryId, $type, $clippingItemId, $clippingCircle);
		$cache = BoundaryDownloadCache::Cache();
		// Lo devuelve desde el cache
		$filename = null;
		if ($cache->HasData($cacheKey, $filename, true))
		{
			return App::StreamFile($filename, $friendlyName);
		}
		else
			throw new PublicException('No ha sido posible descargar el archivo.');
	}

	private static function GetFileName($boundaryId, $type, $clippingItemId, $clippingCircle)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$boundaryName = App::Db()->fetchScalar("SELECT bou_caption FROM boundary WHERE bou_id = ?", array($boundaryId));
		$name = $boundaryName;

		$name .= DatasetDownloadManager::RegionsAsText($clippingItemId);

		return Str::SanitizeFilename($name) . '.' . $ext;
	}

	protected function PutFileToCache()
	{
		if($this->state->Step() == self::STEP_CACHED)
			return $this->state->ReturnState(false);

		if (!file_exists($this->state->Get('outFile')) || filesize($this->state->Get('outFile')) == 0)
			throw new PublicException("No fue posible generar el archivo.");

		$cache = BoundaryDownloadCache::Cache();
		$cache->PutData($this->state->Get('cacheKey'), $this->state->Get('outFile'));
		unlink($this->state->Get('outFile'));

		$this->state->SetStep(self::STEP_CACHED);
		return $this->state->ReturnState(true);
	}


	protected function LoadState($key)
	{
		$this->state = new DownloadBoundaryStateBag();
		$this->state->LoadFromKey($key);
	}

	protected function LoadModel()
	{
		$this->model = new BoundaryDownloadModel($this->state->Get('fullQuery'), $this->state->Get('countQuery'),
								$this->state->Cols(), $this->state->Get('fullParams'), $this->state->Get('wktIndex'),
								$this->state->ExtraColumns());
	}
	protected function PrepareNewModel($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		$this->model = new BoundaryDownloadModel();
		$this->model->PrepareFileQuery($boundaryId, self::GetPolygon($type), $clippingItemId, $clippingCircle);
	}


	private function PrepareNewState($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		$this->state = DownloadBoundaryStateBag::Create($type, $boundaryId, $this->model, $clippingItemId, $clippingCircle);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetFileName($boundaryId, $type, $clippingItemId, $clippingCircle);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$this->state->Save();
	}
}

