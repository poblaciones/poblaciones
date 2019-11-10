<?php

use helena\classes\App;
use minga\framework\Context;
use minga\framework\Test;

require_once __DIR__.'/../startup.php';

Test::SetServer(Context::Settings()->GetMainServerPublicUrl());

$rand = rand(0, 20000);

Test::WriteLine('Servicios de capas');
Test::Get('/services/metrics/GetFabMetrics');
Test::Get('/services/clipping/GetDefaultFrameAndClipping');
Test::Get('/services/clipping/GetLabels?x=85&y=156&z=8&w=' . $rand);
Test::Get('/services/clipping/CreateClipping?a=86&e=-36.321756,-56.568096%3B-38.339494,-61.822308&z=8&r=13903&w=' . $rand);
Test::Get('/services/clipping/CreateClipping?a=90&e=-36.321756,-56.568096%3B-38.339494,-61.822308&z=8&w=' . $rand);
Test::Get('/services/clipping/CreateClipping?a=90&e=-37.359188,-59.742139%3B-37.374946,-59.783188&z=15&r=19517&c=-37.366931,-59.761601%3B0.005383,0.006773&w=' . $rand);
Test::Get('/services/search?q=nbi');
Test::Get('/services/metrics/GetSelectedMetric?l=3401&w=' . $rand);
Test::Get('/services/metrics/GetTileData?l=3401&v=201&a=8501&u=N&x=86&y=156&e=-36.31489,-56.568096%3B-38.33281,-61.822308&z=8&w=' . $rand);
Test::Get('/services/metrics/GetSummary?l=3401&v=201&a=8501&u=N&e=-36.31489,-56.568096%3B-38.33281,-61.822308&z=8&w=' . $rand);

Test::WriteLine('Servicios de backoffice');
Test::Get('/services/backoffice/GetFactories');
Test::Get('/services/backoffice/GetCartographyMetrics');
Test::Get('/services/backoffice/GetAllGeographies');
Test::Get('/services/backoffice/GetPublicMetrics');
Test::Get('/services/backoffice/GetWorkInfo?w=37');
Test::Get('/services/backoffice/GetWorkMetricVersions?w=37');
Test::Get('/services/backoffice/GetDatasetColumns?k=119');
Test::Get('/services/backoffice/GetDatasetColumnsLabels?k=119');
Test::Get('/services/backoffice/GetDatasetMetricVersionLevels?k=119');
Test::Get('/services/backoffice/GetDatasetDataPaged?k=119&filterscount=0&groupscount=0&pagenum=0&pagesize=50&recordstartindex=0&recordendindex=50&page=0');
Test::Get('/services/backoffice/GetColumnDistributions?k=209&c=O&ci=9744&o=O&oi=9741&s=100');