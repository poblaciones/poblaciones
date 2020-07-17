<?php

namespace helena\classes;

use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;

class DownloadStateBag extends StateBag
{
	public static function Create($type, $datasetId, $clippingItemId, $model, $fromDraft)
	{
		$ret = new DownloadStateBag();
		$ret->Initialize();
		$folder = $ret->GetFolder();
		if ($fromDraft)
			$key = BackofficeDownloadCache::CreateKey($type);
		else
			$key = DownloadCache::CreateKey($type, $clippingItemId);

		$ret->SetArray(array(
			'type' => $type,
			'datasetId' => $datasetId,
			'clippingItemId' => $clippingItemId,
			'cacheKey' => $key,
			'outFile' => $folder . '/outfile',
			'dFile' => $folder . '/intermediate_data.json',
			'fullQuery' => $model->fullQuery,
			'countQuery' => $model->countQuery,
			'fullParams' => $model->fullParams,
			'extraColumns' => null,
			'cols' => $model->fullCols,
			'fromDraft' => $fromDraft,
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

}

