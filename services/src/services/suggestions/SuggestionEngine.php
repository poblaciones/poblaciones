<?php
namespace helena\services\suggestions;

use helena\classes\App;

/**
 * Motor de Sugerencias en Tiempo Real
 */
class SuggestionEngine
{

	private $settings;
	private $patternAnalyzer;

	public function __construct()
	{
		$this->settings = App::Settings()->Suggestions();
		$this->patternAnalyzer = new PatternAnalyzer();
	}

	/**
	 * Generar sugerencias para un contexto dado (con filtro de duplicados)
	 */
	public function suggest($context)
	{
		$suggestions = [];

		// 1. Sugerencias basadas en co-ocurrencia de Metrics
		if (!empty($context['current_metrics'])) {
			$suggestions = array_merge($suggestions, $this->suggestMetricsByCooccurrence($context));
		}

		// 2. Sugerencias basadas en secuencias
		if (!empty($context['recent_actions'])) {
			$suggestions = array_merge($suggestions, $this->suggestBySequence($context));
		}

		// 3. Sugerencias por rango de zoom
		if (isset($context['current_zoom'])) {
			$suggestions = array_merge($suggestions, $this->suggestByZoomRange($context));
		}

		// 4. Sugerencias por provincia
		if (!empty($context['province'])) {
			$suggestions = array_merge($suggestions, $this->suggestByProvince($context));
		}

		// 5. Sugerencias de regiones después de métricas
		if (!empty($context['current_metrics'])) {
			$suggestions = array_merge($suggestions, $this->suggestRegions($context));
		}
		/*
		// 6. Sugerencias de variables para métricas actuales
		if (!empty($context['current_metrics'])) {
			$suggestions = array_merge($suggestions, $this->suggestVariables($context));
		}*/

		// FILTRAR duplicados antes de rankear
		$suggestions = $this->filterDuplicates($suggestions, $context);

		// Rankear y filtrar
		$ranked = $this->rankSuggestions($suggestions, $context);

		$filtered = array_filter($ranked, function ($s) {
			return $s['score'] >= $this->settings->getMinScoreToSuggest();
		});

		$final = array_slice($filtered, 0, $this->settings->getMaxSuggestionsPerTrigger());

		return $final;
	}

	// =========================================================================
	// FUNCIONES HELPER PARA QUERIES (reducir duplicación)
	// =========================================================================

	/**
	 * Ejecutar query simple con threshold de confidence/probability
	 */
	private function queryWithThreshold($sql, $params)
	{
		return App::Db()->fetchAll($sql, $params);
	}

	/**
	 * Construir sugerencia estándar desde row de DB
	 */
	private function buildSuggestion($type, $value, $baseScore, $acceptanceRate, $count, $reason, $extraFields = [])
	{
		return array_merge([
			'type' => $type,
			'value' => $value,
			'base_score' => $baseScore,
			'acceptance_rate' => $acceptanceRate,
			'count' => $count,
			'reason' => $reason
		], $extraFields);
	}

	/**
	 * Construir placeholder IN (?, ?, ?)
	 */
	private function buildPlaceholders($array)
	{
		return implode(',', array_fill(0, count($array), '?'));
	}

	// =========================================================================
	// MÉTODOS DE SUGERENCIA ESPECÍFICOS
	// =========================================================================

	/**
	 * Sugerir Metrics basado en co-ocurrencia
	 */
	private function suggestMetricsByCooccurrence($context)
	{
		$currentMetrics = $context['current_metrics'];
		$placeholders = $this->buildPlaceholders($currentMetrics);
		$minConfidence = $this->settings->getMinConfidence();

		$sql = "SELECT smc_metric_b as value, smc_confidence, smc_lift, smc_acceptance_rate, smc_count
                FROM suggestions_metric_cooccurrence
                WHERE smc_metric_a IN ($placeholders)
                AND smc_confidence >= ?
                ORDER BY smc_lift DESC, smc_acceptance_rate DESC
                LIMIT 10";

		$params = array_merge($currentMetrics, [$minConfidence]);
		$rows = $this->queryWithThreshold($sql, $params);

		$suggestions = [];
		foreach ($rows as $row) {
			if (in_array($row['value'], $currentMetrics))
				continue;

			$suggestions[] = $this->buildSuggestion(
				'metric',
				$row['value'],
				$row['smc_confidence'],
				$row['smc_acceptance_rate'],
				$row['smc_count'],
				'cooccurrence',
				['lift' => $row['smc_lift']]
			);
		}

		return $suggestions;
	}

	/**
	 * Sugerir basado en patrones de secuencia
	 */
	private function suggestBySequence($context)
	{
		$recentActions = $context['recent_actions'];

		$patternLength = min(3, count($recentActions));
		if ($patternLength < 2)
			return [];

		$pattern = array_slice($recentActions, -$patternLength);
		$patternStr = array_map([$this->patternAnalyzer, 'actionToString'], $pattern);
		$patternHash = $this->patternAnalyzer->hashPattern($patternStr);

		$minConfidence = $this->settings->getMinConfidence();

		$sql = "SELECT ssq_next_action_name, ssq_next_action_value, ssq_probability, ssq_acceptance_rate, ssq_count
                FROM suggestions_sequences
                WHERE ssq_pattern_hash = ?
                AND ssq_probability >= ?
                ORDER BY ssq_probability DESC, ssq_acceptance_rate DESC
                LIMIT 10";

		$rows = $this->queryWithThreshold($sql, [$patternHash, $minConfidence]);

		$suggestions = [];
		foreach ($rows as $row) {
			$type = $this->actionNameToType($row['ssq_next_action_name']);

			$suggestions[] = $this->buildSuggestion(
				$type,
				$row['ssq_next_action_value'],
				$row['ssq_probability'],
				$row['ssq_acceptance_rate'],
				$row['ssq_count'],
				'sequence',
				['action_name' => $row['ssq_next_action_name']]
			);
		}

		return $suggestions;
	}

	/**
	 * Sugerir por rango de zoom
	 */
	private function suggestByZoomRange($context)
	{
		$currentZoom = $context['current_zoom'];
		$zoomRange = $this->patternAnalyzer->getZoomRange($currentZoom);

		$sql = "SELECT szr_action_name, szr_action_value, szr_frequency, szr_acceptance_rate, szr_count
                FROM suggestions_by_zoom_range
                WHERE szr_zoom_min = ? AND szr_zoom_max = ?
                ORDER BY szr_frequency DESC, szr_acceptance_rate DESC
                LIMIT 10";

		$rows = $this->queryWithThreshold($sql, [$zoomRange['min'], $zoomRange['max']]);

		$suggestions = [];
		foreach ($rows as $row) {
			$type = $this->actionNameToType($row['szr_action_name']);

			$suggestions[] = $this->buildSuggestion(
				$type,
				$row['szr_action_value'],
				$row['szr_frequency'],
				$row['szr_acceptance_rate'],
				$row['szr_count'],
				'zoom_range',
				['action_name' => $row['szr_action_name']]
			);
		}

		return $suggestions;
	}

	/**
	 * Sugerir por provincia
	 */
	private function suggestByProvince($context)
	{
		$province = $context['province'];
		if (empty($province))
			return [];

		$sql = "SELECT sbp_metric_id as value, sbp_frequency, sbp_acceptance_rate, sbp_count
                FROM suggestions_by_province
                WHERE sbp_province_code = ?
                ORDER BY sbp_frequency DESC, sbp_acceptance_rate DESC
                LIMIT 10";

		$rows = $this->queryWithThreshold($sql, [$province]);

		$suggestions = [];
		foreach ($rows as $row) {
			$suggestions[] = $this->buildSuggestion(
				'metric',
				$row['value'],
				$row['sbp_frequency'],
				$row['sbp_acceptance_rate'],
				$row['sbp_count'],
				'province'
			);
		}

		return $suggestions;
	}

	/**
	 * Sugerir regiones asociadas a métricas actuales
	 */
	private function suggestRegions($context)
	{
		$currentMetrics = $context['current_metrics'];
		$currentZoom = $context['current_zoom'];

		if (empty($currentMetrics) || $currentZoom === null)
			return [];

		$zoomRange = $this->patternAnalyzer->getZoomRange($currentZoom);
		$placeholders = $this->buildPlaceholders($currentMetrics);

		$sql = "SELECT srm_region_id as value, srm_frequency, srm_acceptance_rate, srm_count
                FROM suggestions_region_after_metric
                WHERE srm_metric_id IN ($placeholders)
                AND srm_zoom_min = ? AND srm_zoom_max = ?
                ORDER BY srm_frequency DESC, srm_acceptance_rate DESC
                LIMIT 10";

		$params = array_merge($currentMetrics, [$zoomRange['min'], $zoomRange['max']]);
		$rows = $this->queryWithThreshold($sql, $params);

		$suggestions = [];
		foreach ($rows as $row) {
			$suggestions[] = $this->buildSuggestion(
				'region',
				$row['value'],
				$row['srm_frequency'],
				$row['srm_acceptance_rate'],
				$row['srm_count'],
				'region_after_metric'
			);
		}

		return $suggestions;
	}

	/**
	 * Sugerir variables para métricas actuales
	 */
	private function suggestVariables($context)
	{
		$currentMetrics = $context['current_metrics'];
		$currentVariables = $context['current_variables'];

		if (empty($currentMetrics))
			return [];

		$placeholders = $this->buildPlaceholders($currentMetrics);
		$minConfidence = $this->settings->getMinConfidence();

		$sql = "SELECT svc_metric_id, svc_variable_b as value, svc_confidence, svc_acceptance_rate, svc_count
                FROM suggestions_variable_cooccurrence
                WHERE svc_metric_id IN ($placeholders)
                AND svc_confidence >= ?
                ORDER BY svc_confidence DESC, svc_acceptance_rate DESC
                LIMIT 10";

		$rows = $this->queryWithThreshold($sql, array_merge($currentMetrics, [$minConfidence]));

		$suggestions = [];
		foreach ($rows as $row) {
			// No sugerir variables ya seleccionadas para esta métrica
			$metricId = $row['svc_metric_id'];
			if (isset($currentVariables[$metricId]) && in_array($row['value'], $currentVariables[$metricId])) {
				continue;
			}

			$suggestions[] = $this->buildSuggestion(
				'variable',
				$row['value'],
				$row['svc_confidence'],
				$row['svc_acceptance_rate'],
				$row['svc_count'],
				'variable_cooccurrence',
				['metric_id' => $metricId]
			);
		}

		return $suggestions;
	}

	// =========================================================================
	// FILTRADO Y RANKING
	// =========================================================================

	/**
	 * Filtrar sugerencias que ya están activas en el mapa
	 */
	private function filterDuplicates($suggestions, $context)
	{
		$currentMetrics = $context['current_metrics'];
		$currentBoundaries = $context['current_boundaries'];
		$currentClippingRegions = $context['current_clipping_regions'];
		$currentVariables = $context['current_variables'];
		$ret = array_filter($suggestions, function ($sugg) use ($currentMetrics, $currentBoundaries, $currentClippingRegions, $currentVariables) {
			switch ($sugg['type']) {
				case 'metric':
					return !in_array($sugg['value'], $currentMetrics);
				case 'boundary':
					return !in_array($sugg['value'], $currentBoundaries);
				case 'region':
					return !in_array($sugg['value'], $currentClippingRegions);
				case 'variable':
					$metricId = $sugg['metric_id'] ?? null;
					if ($metricId && isset($currentVariables[$metricId])) {
						return !in_array($sugg['value'], $currentVariables[$metricId]);
					}
					return true;

				default:
					return true;
			}
		});
		return $ret;
	}

	/**
	 * Rankear sugerencias combinando múltiples señales
	 */
	private function rankSuggestions($suggestions, $context)
	{
		$scored = [];

		foreach ($suggestions as $sugg) {
			$score = $sugg['base_score'];

			// Boost por acceptance_rate
			if (!empty($sugg['acceptance_rate']) && $sugg['acceptance_rate'] > 0) {
				$score *= (1 + $sugg['acceptance_rate']);
			}

			// Boost por lift (solo si existe)
			if (!empty($sugg['lift']) && $sugg['lift'] > 1) {
				$score *= min($sugg['lift'], 3);
			}

			// Penalty por bajo count
			if ($sugg['count'] < 10) {
				$score *= 0.7;
			}

			// Boost por tipo de razón
			if ($sugg['reason'] === 'sequence') {
				$score *= 1.3;
			} elseif ($sugg['reason'] === 'cooccurrence') {
				$score *= 1.2;
			}

			// Evitar duplicados (mayor score gana)
			$key = $sugg['type'] . ':' . $sugg['value'];
			if (isset($scored[$key])) {
				if ($score > $scored[$key]['score']) {
					$scored[$key]['score'] = $score;
					$scored[$key]['reason'] .= '+' . $sugg['reason'];
				}
				continue;
			}

			$sugg['score'] = $score;
			$scored[$key] = $sugg;
		}

		// Ordenar por score descendente
		usort($scored, function ($a, $b) {
			return $b['score'] <=> $a['score'];
		});

		// Agregar rank
		foreach ($scored as $i => &$sugg) {
			$sugg['rank'] = $i + 1;
		}

		return $scored;
	}

	// =========================================================================
	// LOGGING Y FEEDBACK
	// =========================================================================

	/**
	 * Registrar sugerencia ofrecida en SQLite mensual
	 */
	public function logSuggestion($navigationId, $sessionFingerprint, $suggestion, $rank, $context, $triggerReason)
	{
		$now = time();
		$year = date('Y', $now);
		$month = date('n', $now);

		$sqliteDb = SqliteDbHelper::getSuggestionsDb($year, $month);

		$stmt = $sqliteDb->prepare("
            INSERT INTO suggestions_offered
            (sof_navigation_id, sof_session_fingerprint, sof_suggestion_type, sof_suggestion_value,
             sof_suggestion_rank, sof_score, sof_context_json, sof_trigger_reason, sof_offered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

		$stmt->execute([
			$navigationId,
			$sessionFingerprint,
			$suggestion['type'],
			$suggestion['value'],
			$rank,
			$suggestion['score'],
			json_encode($context),
			$triggerReason,
			$now
		]);

		return $sqliteDb->lastInsertId();
	}

	/**
	 * Registrar feedback (aceptó o rechazó)
	 */
	public function logFeedback($year, $month, $suggestionOfferedId, $wasAccepted, $timeToDecisionMs = null, $nextAction = null)
	{
		$sqliteDb = SqliteDbHelper::getSuggestionsDb($year, $month);

		$sql = "UPDATE suggestions_offered
                SET sof_was_accepted = ?,
                    sof_accepted_at = ?,
                    sof_time_to_decision_ms = ?,
                    sof_next_action_type = ?,
                    sof_next_action_value = ?
                WHERE sof_id = ?";

		$sqliteDb->prepare($sql)->execute([
			$wasAccepted ? 1 : 0,
			$wasAccepted ? time() : null,
			$timeToDecisionMs,
			$nextAction['type'] ?? null,
			$nextAction['value'] ?? null,
			$suggestionOfferedId
		]);
	}

	/**
	 * Decidir si debe sugerir
	 */
	public function shouldSuggest($context)
	{
		if (($context['content_actions_count'] ?? 0) >= $this->settings->getSuggestAfterNActions()) {
			return ['should_suggest' => true, 'reason' => 'after_n_actions'];
		}

		if (
			!empty($context['time_since_last_action_ms']) &&
			$context['time_since_last_action_ms'] >= $this->settings->getSuggestAfterPauseMs()
		) {
			return ['should_suggest' => true, 'reason' => 'pause_detected'];
		}

		if (
			!empty($context['inactivity_ms']) &&
			$context['inactivity_ms'] >= $this->settings->getAbandonmentInactivityMs()
		) {
			return ['should_suggest' => true, 'reason' => 'abandonment_risk'];
		}

		return ['should_suggest' => false, 'reason' => 'no_trigger'];
	}

	/**
	 * Mapear nombre de acción a tipo de sugerencia
	 */
	private function actionNameToType($actionName)
	{
		$map = [
			'AddMetric' => 'metric',
			'SelectVariable' => 'variable',
			'SelectRegions' => 'region',
			'AddBoundary' => 'boundary',
			'Zoom' => 'zoom'
		];

		return $map[$actionName] ?? 'action';
	}
}