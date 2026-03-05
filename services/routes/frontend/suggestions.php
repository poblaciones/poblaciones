<?php
/**
 * Rutas de API para Sugerencias
 * Ubicación: /routes/suggestions.php
 */

use helena\classes\App;
use minga\framework\Params;
use helena\services\suggestions\SuggestionsService;

/**
 * Obtener sugerencias para el contexto actual
 */
App::$app->post('/services/suggestions/GetSuggestions', function () {
	$service = new SuggestionsService();

	// Parsear contexto del request
	$context = [
		'navigation_id' => Params::GetIntMandatory('navigation_id'),
		'session_fingerprint' => Params::GetMandatory('session_fingerprint'),
		'current_metrics' => Params::GetIntArray('current_metrics', []),
		'current_variables' => Params::GetIntArray('current_variables', []),
		'current_clipping_regions' => Params::GetIntArray('current_clipping_regions', []),
		'current_boundaries' => Params::GetIntArray('current_boundaries', []),
		'current_zoom' => Params::GetInt('current_zoom'),
		'province' => Params::Get('province'),
		'recent_actions' => Params::GetArray('recent_actions', []),
		'content_actions_count' => Params::GetInt('content_actions_count', 0),
		'time_since_last_action_ms' => Params::GetInt('time_since_last_action_ms'),
		'inactivity_ms' => Params::GetInt('inactivity_ms'),
		'is_mobile' => Params::GetBool('is_mobile', false),
		'screen_width' => Params::GetInt('screen_width')
	];

	$result = $service->getSuggestions($context);

	return App::Json($result);
});


/**
 * Registrar feedback de una sugerencia
 * POST /services/suggestions/RegisterFeedback
 */
App::$app->post('/services/suggestions/RegisterFeedbackMany', function (Request $request) {
    $service = new SuggestionsService();

    $suggestionIds = Params::GetIntArray('suggestion_ids');
    $accepted = Params::GetBoolMandatory('accepted');
    $timeToDecision = Params::GetInt('time_to_decision_ms');
    $nextAction = Params::GetJson('next_action');
	$result = [];
	foreach($suggestionIds as $suggestionId)
	{
	    $result = $service->registerFeedback($suggestionId, $accepted, $timeToDecision, $nextAction);
	}
    return App::Json($result);
});

/**
 * Registrar feedback de una sugerencia
 * POST /services/suggestions/RegisterFeedback
 */
App::$app->post('/services/suggestions/RegisterFeedback', function () {
    $service = new SuggestionsService();

    $suggestionId = Params::GetIntMandatory('suggestion_id');
    $accepted = Params::GetBoolMandatory('accepted');
    $timeToDecision = Params::GetInt('time_to_decision_ms');
    $nextAction = Params::GetJson('next_action');

    $result = $service->registerFeedback($suggestionId, $accepted, $timeToDecision, $nextAction);

    return App::Json($result);
});

/**
 * Obtener estadísticas de sugerencias
 * GET /services/suggestions/GetStatistics
 */
App::$app->get('/services/suggestions/GetStatistics', function (Request $request) {
    $service = new SuggestionsService();

    $year = Params::GetInt('year');
    $month = Params::GetInt('month');

    $result = $service->getStatistics($year, $month);

    return App::Json($result);
});
