<?php
use helena\classes\App;

use helena\controllers\logs as controllers;

App::RegisterControllerGetPost('/logs/traffic', controllers\cTraffic::class);
App::RegisterControllerGetPost('/logs/platform', controllers\cPlatform::class);
App::RegisterControllerGetPost('/logs/caches', controllers\cCaches::class);
App::RegisterControllerGetPost('/logs/performance', controllers\cPerformance::class);
App::RegisterControllerGetPost('/logs/search', controllers\cSearchLog::class);

App::RegisterControllerGetPost('/logs/activity', controllers\cActivity::class);
App::RegisterControllerGetPost('/logs/errors', controllers\cErrors::class);

App::RegisterControllerGet('/logs', controllers\cActivity::class);
App::RegisterControllerGet('/logs/', controllers\cActivity::class);
App::RegisterCRUDRoute('/logs/publicData', controllers\cPublicData::class);

App::RegisterCRUDRoute('/logs/publicData', controllers\cPublicData::class);
App::RegisterCRUDRoute('/logs/cartographies', controllers\cCartographies::class);
App::RegisterCRUDRoute('/logs/publicDataDraft', controllers\cPublicDataDraft::class);
App::RegisterCRUDRoute('/logs/cartographiesDraft', controllers\cCartographiesDraft::class);

App::RegisterCRUDRoute('/logs/institutions', controllers\cInstitutions::class);
App::RegisterCRUDRoute('/logs/sources', controllers\cSources::class);
App::RegisterCRUDRoute('/logs/categories', controllers\cMetricGroups::class);
App::RegisterControllerGetPost('/logs/contact', controllers\cContactItem::class);

App::RegisterCRUDRoute('/logs/institutionsDraft', controllers\cInstitutionsDraft::class);
App::RegisterCRUDRoute('/logs/sourcesDraft', controllers\cSourcesDraft::class);
App::RegisterCRUDRoute('/logs/categoriesDraft', controllers\cMetricGroupsDraft::class);
App::RegisterControllerGetPost('/logs/contactDraft', controllers\cContactItemDraft::class);
