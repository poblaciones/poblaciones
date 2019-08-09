<?php
use helena\classes\App;

use helena\controllers\admin as controllers;

App::RegisterControllerGetPost('/admin/traffic', controllers\cTraffic::class);
App::RegisterControllerGetPost('/admin/platform', controllers\cPlatform::class);
App::RegisterControllerGetPost('/admin/caches', controllers\cCaches::class);
App::RegisterControllerGetPost('/admin/performance', controllers\cPerformance::class);
App::RegisterControllerGetPost('/admin/search', controllers\cSearchLog::class);

App::RegisterControllerGetPost('/admin/activity', controllers\cActivity::class);
App::RegisterControllerGetPost('/admin/errors', controllers\cErrors::class);

App::RegisterControllerGet('/admin', controllers\cActivity::class);
App::RegisterControllerGet('/admin/', controllers\cActivity::class);
App::RegisterCRUDRoute('/admin/publicData', controllers\cPublicData::class);

App::RegisterCRUDRoute('/admin/publicData', controllers\cPublicData::class);
App::RegisterCRUDRoute('/admin/cartographies', controllers\cCartographies::class);
App::RegisterCRUDRoute('/admin/publicDataDraft', controllers\cPublicDataDraft::class);
App::RegisterCRUDRoute('/admin/cartographiesDraft', controllers\cCartographiesDraft::class);

App::RegisterCRUDRoute('/admin/institutions', controllers\cInstitutions::class);
App::RegisterCRUDRoute('/admin/sources', controllers\cSources::class);
App::RegisterCRUDRoute('/admin/categories', controllers\cMetricGroups::class);
App::RegisterControllerGetPost('/admin/contact', controllers\cContactItem::class);

App::RegisterCRUDRoute('/admin/institutionsDraft', controllers\cInstitutionsDraft::class);
App::RegisterCRUDRoute('/admin/sourcesDraft', controllers\cSourcesDraft::class);
App::RegisterCRUDRoute('/admin/categoriesDraft', controllers\cMetricGroupsDraft::class);
App::RegisterControllerGetPost('/admin/contactDraft', controllers\cContactItemDraft::class);
