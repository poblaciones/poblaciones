<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\Menu;
use helena\services\suggestions\SqliteDbHelper;

use helena\classes\App;

/**
 * Servicio para Dashboards y Vistas Web
 */
class cSuggestions extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		Menu::RegisterAdmin($this->templateValues);

		$data = $this->getDashboardData();

		$this->AddValues($data);

		return $this->Render('suggestions.html.twig');
	}
    /**
     * Obtener datos para dashboard de estadísticas
     */
    public function getDashboardData() {
        // Metadatos del modelo
        $metadata = $this->getModelMetadata();

        // Evolución mensual
        $evolution = $this->getMonthlyEvolution();

        // Top reglas más efectivas
        $topRules = $this->getTopRules();

        // Estadísticas recientes
        $recentStats = $this->getRecentStatistics();

        return [
            'metadata' => $metadata,
            'evolution' => $evolution,
            'top_rules' => $topRules,
            'recent_stats' => $recentStats
        ];
    }

    /**
     * Obtener metadatos del modelo
     */
    private function getModelMetadata() {
        $sql = "SELECT smm_key_name, smm_value_text, smm_value_numeric
                FROM suggestions_model_metadata";

        $rows = App::Db()->fetchAll($sql);

        $metadata = [];
        foreach ($rows as $row) {
            $metadata[$row['smm_key_name']] = $row['smm_value_text'] ?? $row['smm_value_numeric'];
        }

        // Conteo de reglas
        $metadata['total_rules'] =
            App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_metric_cooccurrence") +
            App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_sequences") +
            App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_by_zoom_range");

        return $metadata;
    }

    /**
     * Obtener evolución mensual de procesamiento
     */
    private function getMonthlyEvolution() {
        $sql = "SELECT spl_year_month, spl_sessions_analyzed, spl_rules_created,
                       spl_rules_updated, spl_rules_deleted, spl_completed_at
                FROM suggestions_processing_log
                WHERE spl_status = 'completed'
                ORDER BY spl_year_month DESC
                LIMIT 12";

        $evolution = App::Db()->fetchAll($sql);

        // Agregar tasas de aceptación mensuales
        foreach ($evolution as &$month) {
            $yearMonth = $month['spl_year_month'];
            list($year, $monthNum) = explode('-', $yearMonth);

            try {
                $sqliteDb = SqliteDbHelper::getSuggestionsDb((int)$year, (int)$monthNum);

                $acceptance = $sqliteDb->query("
                    SELECT
                        CAST(SUM(CASE WHEN sof_was_accepted = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as rate
                    FROM suggestions_offered
                    WHERE sof_was_accepted IS NOT NULL
                ")->fetch();

                $month['acceptance_rate'] = $acceptance['rate'] ?? 0;
            } catch (\Exception $e) {
                $month['acceptance_rate'] = null;
            }
        }

        return $evolution;
    }

    /**
     * Obtener top reglas más efectivas
     */
    private function getTopRules() {
        $topMetrics = App::Db()->fetchAll("
            SELECT smc_metric_a, smc_metric_b, smc_confidence, smc_lift, smc_acceptance_rate, smc_count
            FROM suggestions_metric_cooccurrence
            WHERE smc_acceptance_rate > 0
            ORDER BY smc_acceptance_rate DESC, smc_lift DESC
            LIMIT 10
        ");

        $topSequences = App::Db()->fetchAll("
            SELECT ssq_pattern_json, ssq_next_action_name, ssq_probability, ssq_acceptance_rate, ssq_count
            FROM suggestions_sequences
            WHERE ssq_acceptance_rate > 0
            ORDER BY ssq_acceptance_rate DESC, ssq_probability DESC
            LIMIT 10
        ");

        return [
            'metrics' => $topMetrics,
            'sequences' => $topSequences
        ];
    }

    /**
     * Obtener estadísticas recientes (último mes)
     */
    private function getRecentStatistics() {
        $now = time();
        $year = date('Y', $now);
        $month = date('n', $now);

        try {
            $sqliteDb = SqliteDbHelper::getSuggestionsDb($year, $month);

            $stats = $sqliteDb->query("SELECT * FROM v_suggestions_stats")->fetchAll();

            $overall = $sqliteDb->query("
                SELECT
                    COUNT(*) as total_offered,
                    SUM(CASE WHEN sof_was_accepted = 1 THEN 1 ELSE 0 END) as total_accepted,
                    AVG(sof_time_to_decision_ms) / 1000.0 as avg_decision_seconds
                FROM suggestions_offered
                WHERE sof_was_accepted IS NOT NULL
            ")->fetch();

            return [
                'year_month' => sprintf('%04d-%02d', $year, $month),
                'overall' => $overall,
                'by_type' => $stats
            ];
        } catch (\Exception $e) {
            return [
                'year_month' => sprintf('%04d-%02d', $year, $month),
                'overall' => null,
                'by_type' => [],
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtener detalle de un tipo de regla específico
     */
    public function getRuleDetails($ruleType) {
        switch ($ruleType) {
            case 'metric_cooccurrence':
                return $this->getMetricCooccurrenceDetails();
            case 'sequences':
                return $this->getSequenceDetails();
            case 'zoom_patterns':
                return $this->getZoomPatternDetails();
            default:
                return [];
        }
    }

    private function getMetricCooccurrenceDetails() {
        return App::Db()->fetchAll("
            SELECT smc_metric_a, smc_metric_b, smc_support, smc_confidence,
                   smc_lift, smc_acceptance_rate, smc_count, smc_updated_at
            FROM suggestions_metric_cooccurrence
            ORDER BY smc_lift DESC, smc_acceptance_rate DESC
            LIMIT 100
        ");
    }

    private function getSequenceDetails() {
        return App::Db()->fetchAll("
            SELECT ssq_pattern_json, ssq_next_action_name, ssq_next_action_value,
                   ssq_probability, ssq_acceptance_rate, ssq_count, ssq_updated_at
            FROM suggestions_sequences
            ORDER BY ssq_probability DESC, ssq_acceptance_rate DESC
            LIMIT 100
        ");
    }

    private function getZoomPatternDetails() {
        return App::Db()->fetchAll("
            SELECT szr_zoom_min, szr_zoom_max, szr_action_name, szr_action_value,
                   szr_frequency, szr_acceptance_rate, szr_count, szr_updated_at
            FROM suggestions_by_zoom_range
            ORDER BY szr_frequency DESC, szr_acceptance_rate DESC
            LIMIT 100
        ");
    }
}
