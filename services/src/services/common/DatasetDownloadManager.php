<?php

namespace helena\services\common;

use minga\framework\PublicException;
use minga\framework\ErrorException;
use minga\framework\Str;

use helena\classes\DownloadStateBag;
use helena\db\frontend\DatasetDownloadModel;
use helena\db\frontend\BoundaryDownloadModel;
use helena\db\frontend\ClippingRegionItemModel;
use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;
use helena\caches\BoundaryDownloadCache;
use helena\classes\App;


class DatasetDownloadManager extends BaseDownloadManager
{

	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft = false, $extraColumns = array())
	{
		self::ValidateType($type);
		self::ValidateClippingItem($clippingItemId);

		// Si está cacheado, sale
		if(self::IsCached($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft, $extraColumns);
		$this->PrepareNewState($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft, $extraColumns);
		return $this->GenerateNextFilePart();
	}

	private static function IsCached($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft)
	{
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity, $partition);
		$filename = null;
		return self::getCache($fromDraft)->HasData($datasetId, $cacheKey, $filename);
	}

	private static function GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $type, $fromDraft)
	{
		$validFileTypes = self::$validFileTypes;
		if (array_key_exists($type[0], $validFileTypes))
			$ext = $validFileTypes[$type[0]]['extension'];
		else
			throw new PublicException('Tipo de archivo inválido');

		$datasetName = App::Db()->fetchScalar("SELECT dat_caption FROM " . ($fromDraft ? 'draft_' : '') . "dataset WHERE dat_id = ?", array($datasetId));
		$name = $datasetName;

		if($urbanity)
			$name .= ' - ' . Str::ToLower($urbanity);

		if($partition)
		{
			$partitionName = App::Db()->fetchScalar("SELECT dla_caption FROM " . ($fromDraft ? 'draft_' : '') . "dataset_column_value_label WHERE dla_dataset_column_id = (SELECT dat_partition_column_id FROM " . ($fromDraft ? 'draft_' : '') . "dataset WHERE dat_id = ?) AND dla_value = ?", array($datasetId, $partition));
			$name .= ' - ' . $partitionName;
		}

		$name .= self::RegionsAsText($clippingItemId);

		return Str::SanitizeFilename($name) . '.' . $ext;
	}

	public static function RegionsAsText($clippingItemId)
	{
		if (!$clippingItemId) return '';
		if (!is_array($clippingItemId))
			$clippingItemId = [$clippingItemId];

		$sql = "SELECT GROUP_CONCAT(cli_caption ORDER BY cli_caption SEPARATOR ', ')
								FROM clipping_region_item
								WHERE cli_id IN (" . Str::JoinInts($clippingItemId) . ")";
		$res = App::Db()->fetchScalar($sql);
		return ' - ' . $res;
	}

	private static function createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::CreateKey($type);
		else
			return DownloadCache::CreateKey($type, $clippingItemId, $clippingCircle, $urbanity, $partition);
	}

	private static function getCache($fromDraft)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::Cache();
		else
			return DownloadCache::Cache();
	}

	protected function PutFileToCache()
	{
		if($this->state->Step() == self::STEP_CACHED)
			return $this->state->ReturnState(false);

		if (!file_exists($this->state->Get('outFile')) || filesize($this->state->Get('outFile')) == 0)
			throw new PublicException("No fue posible generar el archivo.");

		$cache = self::getCache($this->state->FromDraft());
		$cache->PutData($this->state->Get('datasetId'), $this->state->Get('cacheKey'), $this->state->Get('outFile'));
		unlink($this->state->Get('outFile'));

		$this->state->SetStep(self::STEP_CACHED);
		return $this->state->ReturnState(true);
	}

	private static function ValidateClippingItem($clippingItemIds)
	{
		if($clippingItemIds)
		{
			foreach($clippingItemIds as $clippingItemId)
			{
				$model = new ClippingRegionItemModel();
				if(is_numeric($clippingItemId) == false || $model->Exists($clippingItemId) == false)
					throw new PublicException('La región indicada no fue encontrada');
			}
		}
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft = false)
	{
		self::ValidateType($type);

		if (!$fromDraft)
		{
			self::ValidateClippingItem($clippingItemId);
		}
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId, $clippingCircle, $urbanity, $partition);
		$friendlyName = self::GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $type, $fromDraft);
		$cache = self::getCache($fromDraft);
		// Lo devuelve desde el cache
		$filename = null;
		if ($cache->HasData($datasetId, $cacheKey, $filename, true))
			return App::StreamFile($filename, $friendlyName);
		else
			throw new PublicException('No ha sido posible descargar el archivo.');
	}

	protected function LoadState($key)
	{
		$this->state = new DownloadStateBag();
		$this->state->LoadFromKey($key);
	}

	protected  function LoadModel()
	{
		$this->model = new DatasetDownloadModel($this->state->Get('fullQuery'), $this->state->Get('countQuery'),
								$this->state->Cols(), $this->state->Get('fullParams'), $this->state->Get('wktIndex'),
								$this->state->ExtraColumns());
		$this->model->fromDraft = $this->state->FromDraft();
	}

	protected function PrepareNewModel($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft, $extraColumns)
	{
		$this->model = new DatasetDownloadModel();
		$this->model->fromDraft = $fromDraft;
		$this->model->extraColumns = $extraColumns;
		$this->model->PrepareFileQuery($datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, self::GetPolygon($type));
	}


	protected  function PrepareNewState($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $fromDraft, $extraColumns)
	{
		$this->state = DownloadStateBag::Create($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $this->model, $fromDraft);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$friendlyName = self::GetFileName($datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $type, $fromDraft);
		$this->state->Set('friendlyName', $friendlyName);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$info = $this->model->GetExtraStateInfo($datasetId);
		$this->state->Set('latVariable', $info['lat']);
		$this->state->Set('lonVariable', $info['lon']);
		$this->state->Set('areSegments', $info['areSegments']);
		$this->state->Set('extraColumns', $extraColumns);
		$this->state->Save();
	}


}

