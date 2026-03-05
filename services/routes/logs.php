<?php
use helena\classes\App;
use helena\controllers\logs as controllers;

App::RegisterControllerGetPost('/logs/traffic', controllers\cTraffic::class);
App::RegisterControllerGetPost('/logs/platform', controllers\cPlatform::class);
App::RegisterControllerGetPost('/logs/caches', controllers\cCaches::class);
App::RegisterControllerGetPost('/logs/plugins', controllers\cPlugins::class);

foreach(controllers\cPlugins::GetPlugins() as $plugin)
	App::RegisterControllerGetPost('/logs/plugins/' . $plugin['key'], controllers\cPlugins::class);

App::RegisterControllerGetPost('/logs/tests', controllers\cTests::class);
App::RegisterControllerGetPost('/logs/performance', controllers\cPerformance::class);
App::RegisterControllerGetPost('/logs/search', controllers\cSearchLog::class);

App::RegisterControllerGetPost('/logs/activity', controllers\cActivity::class);
App::RegisterControllerGetPost('/logs/errors', controllers\cErrors::class);

App::RegisterControllerGet('/logs', controllers\cActivity::class);
App::RegisterControllerGet('/logs/', controllers\cActivity::class);

App::RegisterControllerGet('/logs/suggestions', controllers\cSuggestions::class);
App::RegisterControllerGetPost('/logs/learn', controllers\cLearn::class);


/**
 * Ver detalle de reglas de un tipo específico
 * GET /admin/suggestions/rules/{type}
 */
/*App::$app->get('/services/admin/suggestions/rules/{type}', function (Request $request, $type) {
	$service = new DashboardService();
	$rules = $service->getRuleDetails($type);

	return App::Render('suggestions_rules_detail.html', [
		'rule_type' => $type,
		'rules' => $rules
	]);
});
*/