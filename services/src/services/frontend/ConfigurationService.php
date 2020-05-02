<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

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
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$ret = array('Revisions' => $revisions,
									'Blocks' => $blockStrategy,
									'GeographyServer' => Context::Settings()->Servers()->GetServer('geography')->publicUrl,
									'UseGradients' => Context::Settings()->Map()->UseGradients,
									'MaxQueueRequests' => Context::Settings()->Map()->MaxQueueRequests,
									'User' => $user);
		return $ret;
	}
}

