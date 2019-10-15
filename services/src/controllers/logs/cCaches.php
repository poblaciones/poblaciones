<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;

use helena\services\backoffice\publish\snapshots\SnapshotGeographiesModel;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;
use helena\services\backoffice\publish\snapshots\SnapshotGeographiesByRegionModel;
use helena\services\backoffice\publish\CacheManager;
use helena\classes\Session;
use helena\classes\Menu;
use helena\db\backoffice\VersionUpdater;

use minga\framework\IO;
use minga\framework\Arr;


class cCaches extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		// Pone atributos
		$cacheData = cActivity::ResolveData();
		$spaceData = json_decode(IO::ReadAllText($cacheData), true);
		foreach($spaceData as $key => $value)
			$this->AddValue($key, $value);

		$this->AddValue('action_url', "/logs/caches");

		$this->AddValue('updateStatus', $this->LoadUpdateStates());

		// Pone el menu
		Menu::RegisterAdmin($this->templateValues);

		// Listo
		$this->title = 'Cachés';
		return $this->Render('caches.html.twig');
	}

	private function LoadUpdateStates()
	{
		$data = VersionUpdater::LoadCartoUpdateStates();
		return Arr::ToKeyArr($data);
	}
	public function Post()
	{
		$cm = new CacheManager();
		if (array_key_exists('calculateSpace', $_POST))
		{
			$file = cActivity::ResolveData();
			IO::Delete($file);
			$this->message = 'Estadística recalculada con éxito.';
		} else if (array_key_exists('regenGeography', $_POST)) {
			$model = new SnapshotGeographiesModel();
			$model->Clean();
			$this->message = 'Regeneradas ' . $model->Regen() . ' filas. Si modificó Geografías existentes, debe borrar manualmente el caché de Geografías.';
		} else if (array_key_exists('regenClipping', $_POST)) {
			$model = new SnapshotLookupModel();
			$model->ClearClippingRegions();
			$this->message = 'Regeneradas ' . $model->RegenClippingRegions() . ' filas. . Si modificó Regiones existentes, debe borrar manualmente el caché de Labels.';
		} else if (array_key_exists('regenClippingGeography', $_POST)) {
			$model = new SnapshotGeographiesByRegionModel();
			$model->Clean();
			$this->message = 'Regeneradas ' . $model->Regen() . ' filas. Si modificó Regiones existentes, debe borrar manualmente el caché de Labels.';
		}
		return $this->Show();
	}

}
