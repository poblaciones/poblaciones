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
	public function CreateMultiRequestFile($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		self::ValidateType($type);
		// Si está cacheado, sale
		if($this->IsCached($type, $boundaryVersionId, $clippingItemId, $clippingCircle))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
		$this->PrepareNewState($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
		return $this->GenerateNextFilePart();
	}

	private static function IsCached($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
		$filename = null;
		return BoundaryDownloadCache::Cache()->HasData($cacheKey, $filename);
	}

	public static function GetFileBytes($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		self::ValidateType($type);

		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
		$friendlyName = self::GetFileName($boundaryVersionId, $type, $clippingItemId, $clippingCircle);
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

	private static function GetFileName($boundaryVersionId, $type, $clippingItemId, $clippingCircle)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$boundaryName = App::Db()->fetchScalar("SELECT CONCAT( bou_caption , ' (', bvr_caption, ')') FROM boundary INNER JOIN boundary_version ON bvr_boundary_id = bou_id WHERE bvr_id = ?", array($boundaryVersionId));
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
	protected function PrepareNewModel($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		$this->model = new BoundaryDownloadModel();
		$this->model->PrepareFileQuery($boundaryVersionId, self::GetPolygon($type), $clippingItemId, $clippingCircle);
	}


	private function PrepareNewState($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		$this->state = DownloadBoundaryStateBag::Create($type, $boundaryVersionId, $this->model, $clippingItemId, $clippingCircle);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetFileName($boundaryVersionId, $type, $clippingItemId, $clippingCircle);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$this->state->Save();
	}
}

