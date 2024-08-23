<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use minga\framework\PhpSession;

use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;

use helena\db\frontend\SignatureModel;
use minga\framework\Context;
use minga\framework\Performance;
use helena\classes\Callbacks;
use helena\classes\App;
use minga\framework\Cookies;

class ConfigurationService extends BaseService
{
    const CookieName = 'nav';
    const ValidRenew = 3000; // en días

	public function GetTransactionServer()
	{
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		return ['Server' => $dynamicServer->publicUrl];
	}

    public function GetCurrentMapProvider()
    {
        // Se fija la configuración actual
        $ret = App::Settings()->Map()->MapsAPI;
        // Se fija el valor en sesión
		$sessionValue = PhpSession::GetSessionValue('MapsAPI', null);
        if ($sessionValue)
            $ret = $sessionValue;
        return $ret;
    }
	public function SwitchSessionProvider()
    {
		// Invierte y setea en sesión
        $current = $this->GetCurrentMapProvider();
        // Se fija el valor en sesión
		if ($current == "google")
			$new = "leaflet";
		else
			$new = "google";

        PhpSession::SetSessionValue('MapsAPI', $new);
        return self::OK;
    }

	public function GetNavigationCookieId()
    {
        $cookie = Cookies::GetCookie(self::CookieName);
        if ($cookie == '')
            return '';
        $key = Key::loadFromAsciiSafeString(Context::Settings()->Keys()->GetRememberKey());
        $id = Crypto::decrypt(base64_decode($cookie), $key, true);
        return $id;
    }

    private function CheckNavigationCookie()
    {
        $id = $this->GetNavigationCookieId();
        return ($id != '');
    }

	public function CreateNavigationCookie()
    {
        $id = PhpSession::SessionId();
        if ($id == "")
            $id = uniqid('', true);

        $key = Key::loadFromAsciiSafeString(Context::Settings()->Keys()->GetRememberKey());
        $enc = Crypto::encrypt($id, $key, true);
        $value = base64_encode($enc);
        Cookies::SetCookie(self::CookieName, $value, self::ValidRenew);
        return $id;
    }

	public function GetConfiguration($topUrl = null, $clientUrl = null)
	{
		$session = new SessionService();
		$model = new SignatureModel();
		$signatures = $model->GetSignatures();

		$blockStrategy = array('UseDataTileBlocks' => App::Settings()->Map()->UseDataTileBlocks,
													 'UseLabelTileBlocks' => App::Settings()->Map()->UseLabelTileBlocks,
													 'TileDataBlockSize' => App::Settings()->Map()->TileDataBlockSize,
													 'LabelsBlockSize' => App::Settings()->Map()->LabelsBlockSize,);
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		if (!$this->CheckNavigationCookie())
			$this->CreateNavigationCookie();

		$navigation = $session->GetNavigationId();

		$mainServer = App::Settings()->Servers()->Main();

		$ret = array('Signatures' => $signatures,
									'Blocks' => $blockStrategy,
									'StaticServer' =>  Context::Settings()->Servers()->GetContentServerUris(),
									'HomePage' =>  Context::Settings()->Servers()->Home()->publicUrl,

									'Help' => App::Settings()->Help(),
									'StaticWorks' =>  App::Settings()->Map()->ContentServerWorks,
									'UseGradients' => App::Settings()->Map()->UseGradients,
									'UseTextures' => App::Settings()->Map()->UseTextures,

									'UsePerimeter' =>  App::Settings()->Map()->UsePerimeter,
									'UseFavorites' => App::Settings()->Map()->UseFavorites,
									'UseEmbedding' => App::Settings()->Map()->UseEmbedding,
									'UseUrbanity' => App::Settings()->Map()->UseUrbanity,
									'UseMultiselect' => App::Settings()->Map()->UseMultiselect,
									'UseDeckgl' => App::Settings()->Map()->UseDeckgl,
									'UseCompareSeries' => App::Settings()->Map()->UseCompareSeries,

									'UseNewMenu' => App::Settings()->Map()->UseNewMenu,
									'OwnerLogo' => App::Settings()->Map()->OwnerLogo,
									'MapsAPI' => $this->GetCurrentMapProvider(),
									'NavigationId' => $navigation['id'],
									'NavigationMonth' => $navigation['month'],
									'MaxQueueRequests' => App::Settings()->Map()->MaxQueueRequests,
									'MaxStaticQueueRequests' => App::Settings()->Map()->MaxStaticQueueRequests,
									'User' => $user,
									'MainServer' => $mainServer->publicUrl);

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

