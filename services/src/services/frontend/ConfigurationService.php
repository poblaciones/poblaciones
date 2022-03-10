<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use helena\db\frontend\SignatureModel;
use minga\framework\Context;
use helena\classes\Callbacks;
use helena\classes\App;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$model = new SignatureModel();
		$signatures = $model->GetSignatures();
		$blockStrategy = array('UseDataTileBlocks' => App::Settings()->Map()->UseDataTileBlocks,
													 'UseLabelTileBlocks' => App::Settings()->Map()->UseLabelTileBlocks,
													 'TileDataBlockSize' => App::Settings()->Map()->TileDataBlockSize,
													 'LabelsBlockSize' => App::Settings()->Map()->LabelsBlockSize,);
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$ret = array('Signatures' => $signatures,
									'Blocks' => $blockStrategy,
									'StaticServer' =>  Context::Settings()->Servers()->GetContentServerUris(),
									'UseLightMap' =>  App::Settings()->Map()->UseLightMap,
									'StaticWorks' =>  App::Settings()->Map()->ContentServerWorks,
									'UseGradients' => App::Settings()->Map()->UseGradients,
									'UseTextures' => App::Settings()->Map()->UseTextures,

									'UsePerimeter' =>  App::Settings()->Map()->UsePerimeter,
									'UseFavorites' => App::Settings()->Map()->UseFavorites,
									'UseEmbedding' => App::Settings()->Map()->UseEmbedding,
									'UseUrbanity' => App::Settings()->Map()->UseUrbanity,
									'UseMultiselect' => App::Settings()->Map()->UseMultiselect,

									'MaxQueueRequests' => App::Settings()->Map()->MaxQueueRequests,
									'MaxStaticQueueRequests' => App::Settings()->Map()->MaxStaticQueueRequests,
									'User' => $user);

		Callbacks::$MapsOpened++;

		return $ret;
	}
}

