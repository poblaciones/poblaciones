<?php

namespace helena\classes;

use helena\caches\DownloadCache;
use helena\caches\BoundaryDownloadCache;

class DownloadBoundaryStateBag extends StateBag
{
	public static function Create($type, $boundaryId, $model, $clippingItemId, $clippingCircle)
	{
		$ret = new DownloadBoundaryStateBag();
		$ret->Initialize();
		$folder = $ret->GetFolder();
		$key = BoundaryDownloadCache::CreateKey($type, $boundaryId, $clippingItemId, $clippingCircle);

		$ret->SetArray(array(
			'type' => $type,
			'boundaryId' => $boundaryId,
			'cacheKey' => $key,
			'outFile' => $folder . '/outfile',
			'clippingItemId' => $clippingItemId,
			'clippingCircle' => $clippingCircle,
			'dFile' => $folder . '/intermediate_data.json',
			'fullQuery' => $model->fullQuery,
			'countQuery' => $model->countQuery,
			'fullParams' => $model->fullParams,
			'extraColumns' => null,
			'cols' => $model->fullCols,
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
	public function AreSegments()
	{
		return false;
	}

}

