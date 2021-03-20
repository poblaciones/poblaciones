<?php

namespace helena\services\common;

use minga\framework\PublicException;
use minga\framework\ErrorException;
use minga\framework\Str;

use helena\classes\writers\SpssWriter;
use helena\classes\writers\CsvWriter;
use helena\classes\writers\StataWriter;
use helena\classes\writers\RWriter;
use helena\classes\writers\XlsxWriter;
use helena\classes\writers\ShpWriter;

use helena\classes\DownloadStateBag;
use helena\classes\DownloadBoundaryStateBag;
use helena\db\frontend\DatasetDownloadModel;
use helena\db\frontend\BoundaryDownloadModel;
use helena\db\frontend\ClippingRegionItemModel;
use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;
use helena\caches\BoundaryDownloadCache;
use helena\classes\App;


class BoundaryDownloadManager extends DownloadManagerBase
{
	public function CreateMultiRequestFile($type, $boundaryId)
	{
		self::ValidateType($type);
		// Si está cacheado, sale
		if($this->IsCached($type, $boundaryId))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $boundaryId);
		$this->PrepareNewState($type, $boundaryId);
		return $this->GenerateNextFilePart();
	}

	private static function IsCached($type, $boundaryId)
	{
		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryId);
		$filename = null;
		return BoundaryDownloadCache::Cache()->HasData($cacheKey, $filename);
	}

	public static function GetFileBytes($type, $boundaryId)
	{
		self::ValidateType($type);

		$cacheKey = BoundaryDownloadCache::CreateKey($type, $boundaryId);
		$friendlyName = self::GetFileName($boundaryId, $type);
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

	private static function GetFileName($boundaryId, $type)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$name = 'boundary' . $boundaryId . $type;

		return $name . '.' . $ext;
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
	protected function PrepareNewModel($type, $boundaryId)
	{
		$this->model = new BoundaryDownloadModel();
		$this->model->PrepareFileQuery($boundaryId, self::GetPolygon($type));
	}


	private function PrepareNewState($type, $boundaryId)
	{
		$this->state = DownloadBoundaryStateBag::Create($type, $boundaryId, $this->model);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetFileName($boundaryId, $type);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$this->state->Save();
	}
}

