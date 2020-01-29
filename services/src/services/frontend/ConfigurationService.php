<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\RevisionsModel;
use minga\framework\Context;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$model = new RevisionsModel();
		$revisions = $model->GetRevisions();
		$blockStrategy = array('UseTileBlocks' => Context::Settings()->Map()->UseTileBlocks,
													 'TileDataBlockSize' => Context::Settings()->Map()->TileDataBlockSize,
													 'LabelsBlockSize' => Context::Settings()->Map()->LabelsBlockSize);
		return array('Revisions' => $revisions, 'Blocks' => $blockStrategy, 'MaxQueueRequests' => Context::Settings()->Map()->MaxQueueRequests);
	}
}

