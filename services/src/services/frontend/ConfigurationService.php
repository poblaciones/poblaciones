<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use helena\db\frontend\SignatureModel;
use minga\framework\Context;
use minga\framework\Performance;
use helena\classes\Callbacks;
use helena\classes\App;

class ConfigurationService extends BaseService
{
	public function GetConfiguration($topUrl = null, $clientUrl = null)
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
									'UseDeckgl' => App::Settings()->Map()->UseDeckgl,
									'UseNewMenu' => App::Settings()->Map()->UseNewMenu,

									'MapsAPI' => App::Settings()->Map()->MapsAPI,

									'MaxQueueRequests' => App::Settings()->Map()->MaxQueueRequests,
									'MaxStaticQueueRequests' => App::Settings()->Map()->MaxStaticQueueRequests,
									'User' => $user);

		Callbacks::$MapsOpened++;

//		self::CheckMapLimits(Callbacks::$MapsOpened);

		return $ret;
	}

	private static function CheckMapLimits($mapsOpened)
	{
		if ($mapsOpened == Context::Settings()->Limits()->WarningMonthlyMapsPerKey)
		{
			Performance::SendPerformanceWarning('apertura de mapas por key cercano al límite',
				Context::Settings()->Limits()->WarningMonthlyMapsPerKey . ' hits', $mapsOpened . ' hits');
		}

		if ($mapsOpened == Context::Settings()->Limits()->LimitMonthlyMapsPerKey)
		{
			Performance::SendPerformanceWarning('apertura de mapas por key agotado - DENEGACIÓN DE PERMISO',
				Context::Settings()->Limits()->LimitMonthlyMapsPerKey . ' hits', $mapsOpened . ' hits');
		}
	}
}

