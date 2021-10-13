<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use helena\db\frontend\SignatureModel;
use minga\framework\Context;
use helena\classes\Callbacks;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$model = new SignatureModel();
		$signatures = $model->GetSignatures();
		$blockStrategy = array('UseDataTileBlocks' => Context::Settings()->Map()->UseDataTileBlocks,
													 'UseLabelTileBlocks' => Context::Settings()->Map()->UseLabelTileBlocks,
													 'TileDataBlockSize' => Context::Settings()->Map()->TileDataBlockSize,
													 'LabelsBlockSize' => Context::Settings()->Map()->LabelsBlockSize,);
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$ret = array('Signatures' => $signatures,
									'Blocks' => $blockStrategy,
									'StaticServer' =>  Context::Settings()->Servers()->GetContentServerUris(),
									'UseLightMap' =>  Context::Settings()->Map()->UseLightMap,
									'StaticWorks' =>  Context::Settings()->Map()->ContentServerWorks,
									'UseGradients' => Context::Settings()->Map()->UseGradients,
									'UseTextures' => Context::Settings()->Map()->UseTextures,

									'UsePerimeter' =>  Context::Settings()->Map()->UsePerimeter,
									'UseFavorites' => Context::Settings()->Map()->UseFavorites,
									'UseEmbedding' => Context::Settings()->Map()->UseEmbedding,
									'UseUrbanity' => Context::Settings()->Map()->UseUrbanity,
									'UseMultiselect' => Context::Settings()->Map()->UseMultiselect,

									'MaxQueueRequests' => Context::Settings()->Map()->MaxQueueRequests,
									'MaxStaticQueueRequests' => Context::Settings()->Map()->MaxStaticQueueRequests,
									'User' => $user);

		Callbacks::$MapsOpened++;

		return $ret;
	}
}

