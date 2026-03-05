<?php
namespace helena\services\suggestions;

use helena\classes\App;
use Exception;
use helena\caches\SuggestionLabelsCache;


/**
 * Servicio de Sugerencias
 * Maneja la lógica de negocio para solicitar y registrar sugerencias
 */
class SuggestionsService {

    private $engine;

    public function __construct() {
        $this->engine = new SuggestionEngine();
    }

    /**
     * Obtener sugerencias para un contexto
     *
     * @param array $context Contexto de la sesión actual
     * @return array Resultado con sugerencias
     */
    public function getSuggestions($context) {
		//print_r($context);
	//	exit;

        // Validar contexto
        $this->validateContext($context);

		//$shouldSuggest = ['reason' => 'always suggests'];
        // Decidir si debe sugerir
        $shouldSuggest = $this->engine->shouldSuggest($context);

        if (!$shouldSuggest['should_suggest']) {
            return [
                'success' => true,
                'should_suggest' => false,
                'reason' => $shouldSuggest['reason'],
                'suggestions' => []
            ];
        }


        // Generar sugerencias
        $suggestions = $this->engine->suggest($context);

		/* $suggestions[] = [
			'type' => 'metric',
			'value' => 12201,
			'score' => .8,
			'lift' => 1,
			'acceptance_rate' => 1,
			'count' => 100,
			'reason' => 'cooccurrence'
		];
		$suggestions[] = [
			'type' => 'metric',
			'value' => 12201,
			'score' => .8,
			'lift' => 1,
			'acceptance_rate' => 1,
			'count' => 100,
			'reason' => 'cooccurrence'
		];*/
        // Registrar en log
        $offeredIds = [];
        foreach ($suggestions as $rank => $suggestion) {
            $id = $this->engine->logSuggestion(
                $context['navigation_id'],
                $context['session_fingerprint'],
                $suggestion,
                $rank + 1,
                $context,
                $shouldSuggest['reason']
            );
            $offeredIds[] = $id;
        }

        // Preparar respuesta
        $response = [];
        foreach ($suggestions as $i => $sugg) {
            $response[] = [
                'Id' => $offeredIds[$i],
                'Caption' => $this->resolveCaption($sugg['type'], $sugg['value'], $sugg['metric_id'] ?? null),
                'Type' => $sugg['type'],
                'Value' => $sugg['value'],
                'MetricId' => $sugg['metric_id'] ?? null,
                'ActionName' => $sugg['action_name'] ?? null,
                'Score' => round($sugg['score'], 3),
                'Reason' => $sugg['reason'],
                'Rank' => $i + 1
            ];
        }

        return [
            'success' => true,
            'should_suggest' => true,
            'trigger_reason' => $shouldSuggest['reason'],
            'suggestions' => $response,
            'count' => count($response)
        ];
    }

    private function resolveCaption($type, $id, $metricId = null)
	{
		$res = '';
		$key = SuggestionLabelsCache::CreateKey($type, $id);
		// Prueba si lo tiene en el caché...
		if (!SuggestionLabelsCache::Cache()->HasData($key, $res)) {
			// Lo busca...
			switch ($type) {
				case 'metric':
					$res = App::Db()->fetchScalarNullable("SELECT mtr_caption FROM metric WHERE mtr_id = ?", array($id));
					break;
				case 'variable':
					$res = App::Db()->fetchScalarNullable("SELECT mvv_caption FROM variable WHERE mvv_id = ?", array($id));
					if ($res == "Conteo" || $res == "N" || $res == "")
						$res = $this->resolveCaption("metric", $metricId);
					break;
				case 'region':
					$caption = App::Db()->fetchAssoc("SELECT cli_caption Caption, clr_caption CaptionType FROM clipping_region_item, clipping_region WHERE cli_clipping_region_id = clr_id AND cli_id = ?", array($id));
					if ($caption) {
						$res = $caption['Caption'] . ' (' . $caption['CaptionType'] . ')';
					} else {
						$res = null;
					}
                    break;
				case 'boundary':
					$res = App::Db()->fetchScalarNullable("SELECT bou_caption FROM boundary WHERE bou_id = ?", array($id));
					break;
				case 'zoom':
					$res = $id;
			}
			if ($res === null)
				$res = "#" . $id;
			// Lo guarda y sale...
			SuggestionLabelsCache::Cache()->PutData($key, $res);
		}
		return $res;
	}
    /**
     * Registrar feedback de una sugerencia
     *
     * @param int $suggestionId ID de la sugerencia
     * @param bool $accepted Si fue aceptada o no
     * @param int|null $timeToDecisionMs Tiempo que tardó en decidir
     * @param array|null $nextAction Próxima acción que hizo
     * @return array Resultado
     */
    public function registerFeedback($suggestionId, $accepted, $timeToDecisionMs = null, $nextAction = null) {
        // El suggestionId es de este mes
        $now = time();
        $year = date('Y', $now);
        $month = date('n', $now);

        try {
            $this->engine->logFeedback(
                $year,
                $month,
                $suggestionId,
                $accepted,
                $timeToDecisionMs,
                $nextAction
            );

            return [
                'success' => true,
                'message' => 'Feedback registrado'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Error registrando feedback: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validar que el contexto tenga los campos necesarios
     */
    private function validateContext($context) {
        if (empty($context['navigation_id'])) {
            throw new Exception('navigation_id es requerido');
        }

        if (empty($context['session_fingerprint'])) {
            throw new Exception('session_fingerprint es requerido');
        }
    }

    /**
     * Obtener estadísticas de sugerencias
     */
    public function getStatistics($year = null, $month = null) {
        if ($year === null) {
            $year = date('Y');
            $month = date('n');
        }

        try {
            $sqliteDb = SqliteDbHelper::getSuggestionsDb($year, $month);

            $stats = $sqliteDb->query("SELECT * FROM v_suggestions_stats")->fetchAll();

            $total = $sqliteDb->query("
                SELECT
                    COUNT(*) as total_offered,
                    SUM(CASE WHEN sof_was_accepted = 1 THEN 1 ELSE 0 END) as total_accepted,
                    AVG(sof_time_to_decision_ms) as avg_decision_time
                FROM suggestions_offered
                WHERE sof_was_accepted IS NOT NULL
            ")->fetch();

            return [
                'success' => true,
                'year_month' => sprintf('%04d-%02d', $year, $month),
                'overall' => $total,
                'by_type' => $stats
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'No hay datos para este mes: ' . $e->getMessage()
            ];
        }
    }
}
