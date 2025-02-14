<?php

namespace helena\classes;

use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;

class DownloadStateBag extends StateBag
{
	public static function Create($type, $datasetId, $compareDatasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, $model, $fromDraft)
	{
		$ret = new DownloadStateBag();
		$ret->Initialize();
		$folder = $ret->GetFolder();
		if ($fromDraft)
			$key = BackofficeDownloadCache::CreateKey($type);
		else
			$key = DownloadCache::CreateKey($type, $compareDatasetId, $clippingItemId, $clippingCircle, $urbanity, $partition);

		$ret->SetArray(array(
			'type' => $type,
			'datasetId' => $datasetId,
			'compareDatasetId' => $compareDatasetId,
			'clippingItemId' => $clippingItemId,
			'clippingCircle' => $clippingCircle,
			'urbanity' => $urbanity,
			'partition' => $partition,
			'cacheKey' => $key,
			'outFile' => $folder . '/outfile',
			'dFile' => $folder . '/intermediate_data.json',
			'fullQuery' => $model->fullQuery,
			'countQuery' => $model->countQuery,
			'fullParams' => $model->fullParams,
			'extraColumns' => null,
			'cols' => $model->fullCols,
			'fromDraft' => $fromDraft,
			'areSegments' => false,
			'wktIndex' => $model->wktIndex,
			'index' => 0,
			'start' => 0,
			'progressLabel' => 'Creando archivo'
		));
		return $ret;
	}

	public function SetColWidth($keyCol, $value)
	{
		$this->state['cols'][$keyCol]['field_width'] = $value;
	}

	public function ExtraColumns()
	{
		return $this->state['extraColumns'];
	}
	public function Cols()
	{
		return $this->state['cols'];
	}
	public function FromDraft()
	{
		return $this->state['fromDraft'];
	}

	public function AreSegments()
	{
		return $this->state['areSegments'];
	}

}

