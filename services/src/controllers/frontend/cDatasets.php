<?php

namespace helena\controllers\frontend;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\controllers\common\cPublicController;
use minga\framework\Request;
use minga\framework\Params;
use minga\framework\Arr;
use minga\framework\Context;
use minga\framework\Str;
use helena\classes\Session;
use helena\classes\Links;
use helena\entities\frontend\geometries\Envelope;
use helena\services\frontend\SelectedMetricService;
use minga\framework\ErrorException;
use helena\services\frontend\WorkService;
use helena\db\frontend\ClippingRegionItemModel;
use minga\framework\Profiling;
use minga\framework\Performance;
use helena\caches\WorkHandlesCache;

use helena\db\frontend\MetadataModel;


class cDatasets extends cPublicController
{
	private $cleanRoute;
	private $cleanRouteBase;

	public function Show()
	{
		Performance::SetController('datasets', 'get', true);

		return $this->Render("datasets.html.twig");
  }
}
