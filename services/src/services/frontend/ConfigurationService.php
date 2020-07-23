<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use helena\db\frontend\RevisionsModel;
use minga\framework\Context;
use helena\classes\Callbacks;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$model = new RevisionsModel();
		$revisions = $model->GetRevisions();
		$blockStrategy = array('UseDataTileBlocks' => Context::Settings()->Map()->UseDataTileBlocks,
													 'UseLabelTileBlocks' => Context::Settings()->Map()->UseLabelTileBlocks,
													 'TileDataBlockSize' => Context::Settings()->Map()->TileDataBlockSize,
													 'LabelsBlockSize' => Context::Settings()->Map()->LabelsBlockSize);
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$ret = array('Revisions' => $revisions,
									'Blocks' => $blockStrategy,
									'StaticServer' =>  Context::Settings()->Servers()->GetContentServerUris(),
									'StaticWorks' =>  Context::Settings()->Map()->ContentServerWorks,
									'UseGradients' => Context::Settings()->Map()->UseGradients,

									'UseFavorites' => Context::Settings()->Map()->UseFavorites,
									'UseCreatePdf' => Context::Settings()->Map()->UseCreatePdf,
									'UseEmbedding' => Context::Settings()->Map()->UseEmbedding,
									'UseCollapsePanel' => Context::Settings()->Map()->UseCollapsePanel,
									'UseUrbanity' => Context::Settings()->Map()->UseUrbanity,

									'MaxQueueRequests' => Context::Settings()->Map()->MaxQueueRequests,
									'MaxStaticQueueRequests' => Context::Settings()->Map()->MaxStaticQueueRequests,
									'User' => $user);

		Callbacks::$MapsOpened++;

		return $ret;
	}
}

