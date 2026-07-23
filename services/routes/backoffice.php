<?php

use helena\classes\App;
use minga\framework\Request;

App::RegisterControllerGet('/users', helena\controllers\backoffice\cBackoffice::class);
App::RegisterControllerGet('/users/', helena\controllers\backoffice\cBackoffice::class);
App::RegisterControllerGet('/users/{any}', helena\controllers\backoffice\cBackoffice::class)->assert("any", ".*");

App::RegisterControllerGet('/admins', helena\controllers\admins\cAdmins::class);
App::RegisterControllerGet('/admins/{any}', helena\controllers\admins\cAdmins::class)->assert("any", ".*");

App::RegisterControllerGet('/packs', helena\controllers\admins\cPacks::class);
App::RegisterControllerGet('/packs/{any}', helena\controllers\admins\cPacks::class)->assert("any", ".*");

require_once('backoffice/permission.php');

if (App::Settings()->Servers()->IsMainServerRequest())
{
	require_once('backoffice/mainServer.php');
}

if (App::Settings()->Servers()->IsTransactionServerRequest())
{
	require_once('backoffice/work.php');
	require_once('backoffice/metric.php');
	require_once('backoffice/dataset.php');
	require_once('backoffice/user.php');
	require_once('backoffice/datasetColumns.php');
	require_once('backoffice/metadata.php');
	require_once('backoffice/georeference.php');
	require_once('backoffice/import.php');
	require_once('backoffice/test.php');

	require_once('admin/review.php');
	require_once('admin/metadata.php');
	require_once('admin/admin.php');

	require_once('packs/boundary.php');
	require_once('packs/metadata.php');
	require_once('packs/clipping.php');
	require_once('packs/geography.php');
	require_once('packs/gradient.php');
	require_once('packs/metricCatalog.php');
	require_once('packs/geographyTuple.php');

}

