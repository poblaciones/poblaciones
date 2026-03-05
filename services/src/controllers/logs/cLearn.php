<?php
namespace helena\controllers\logs;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\Menu;
use helena\services\suggestions\MonthlyAnalyzer;
use helena\services\suggestions\SqliteDbHelper;
use helena\classes\App;
use Exception;

/**
 * Servicio de Procesamiento Manual
 * Permite ejecutar el análisis mensual desde la interfaz web
 */
class cLearn extends cController {

	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		Menu::RegisterAdmin($this->templateValues);

		$processingStatus = $this->getProcessingStatus();
		$modelMetadata = $this->getModelMetadata();

		$this->templateValues['processing_status'] = $processingStatus;
		$this->templateValues['model_metadata'] = $modelMetadata;

		return $this->Render('learn.html.twig');
	}

    /**
     * Obtener estado de procesamiento de todos los meses
     */
    public function getProcessingStatus() {
        // Obtener meses disponibles en navegación
        $availableMonths = SqliteDbHelper::getAvailableNavigationMonths(true);

        // Obtener meses ya procesados
        $sql = "SELECT spl_year_month, spl_sessions_analyzed, spl_rules_created,
                       spl_rules_updated, spl_rules_deleted, spl_completed_at,
                       spl_status, spl_error_message
                FROM suggestions_processing_log
                ORDER BY spl_year_month DESC";

        $processed = App::Db()->fetchAll($sql);
        $processedMap = [];
        foreach ($processed as $p) {
            $processedMap[$p['spl_year_month']] = $p;
        }

        // Combinar información
        $months = [];
        foreach ($availableMonths as $month) {
            $key = $month['label'];
            $info = [
                'year' => $month['year'],
                'month' => $month['month'],
                'label' => $key,
                'has_data' => true,
                'is_processed' => isset($processedMap[$key]),
                'status' => $processedMap[$key]['spl_status'] ?? 'pending',
                'sessions_analyzed' => $processedMap[$key]['spl_sessions_analyzed'] ?? null,
                'rules_created' => $processedMap[$key]['spl_rules_created'] ?? null,
                'rules_updated' => $processedMap[$key]['spl_rules_updated'] ?? null,
                'rules_deleted' => $processedMap[$key]['spl_rules_deleted'] ?? null,
                'completed_at' => $processedMap[$key]['spl_completed_at'] ?? null,
                'error_message' => $processedMap[$key]['spl_error_message'] ?? null
            ];

            $months[] = $info;
        }

        return [
            'success' => true,
            'months' => $months,
            'total_available' => count($availableMonths),
            'total_processed' => count($processedMap)
        ];
    }
    /**
     * Procesar
     */
	public function Post()
	{
		if (array_key_exists('clearAll', $_POST))
		{
			$this->clearAll();
		}
        else if (array_key_exists('m', $_POST))
		{
            $year = $_POST['y'];
            $month = $_POST['m'];
			$this->processMonth($year, $month);
		}
        else
		{
			$this->processAllPending();
		}
		return $this->Show();
	}
    /**
     * Procesar un mes específico
     */
    public function processMonth($year, $month) {
        $analyzer = new MonthlyAnalyzer($year, $month);
        $result = $analyzer->run();

        return [
            'success' => true,
            'year' => $year,
            'month' => $month,
            'stats' => $result['stats']
        ];
    }

	public function clearAll()
	{
		App::Db()->exec("SET FOREIGN_KEY_CHECKS = 0");

		App::Db()->exec("TRUNCATE TABLE suggestions_metric_cooccurrence");
		App::Db()->exec("TRUNCATE TABLE suggestions_variable_cooccurrence");
		App::Db()->exec("TRUNCATE TABLE suggestions_sequences");
		App::Db()->exec("TRUNCATE TABLE suggestions_by_zoom_range");
		App::Db()->exec("TRUNCATE TABLE suggestions_by_province");
		App::Db()->exec("TRUNCATE TABLE suggestions_region_after_metric");
		App::Db()->exec("TRUNCATE TABLE suggestions_boundary_patterns");
		App::Db()->exec("TRUNCATE TABLE suggestions_processing_log");

		// Si desea reiniciar también la configuración del modelo, descomente esta línea:
         App::Db()->exec("TRUNCATE TABLE suggestions_model_metadata");
		App::Db()->exec("SET FOREIGN_KEY_CHECKS = 1");
		App::Db()->exec("
                INSERT INTO suggestions_model_metadata (smm_key_name, smm_value_text, smm_updated_at)
                VALUES
                  ('model_version', '1.0', NOW()),
                  ('last_training_month', NULL, NOW()),
                  ('total_sessions_analyzed', '0', NOW()),
                  ('zoom_ranges', '[[1,6],[7,10],[11,13],[14,18]]', NOW()),
                  ('decay_factor', '0.95', NOW())
                ON DUPLICATE KEY UPDATE smm_updated_at = NOW()
        ");
	}
    /**
     * Procesar todos los meses pendientes
     */
    public function processAllPending() {
        $status = $this->getProcessingStatus();
        $pending = array_filter($status['months'], function($m) {
            return !$m['is_processed'] || $m['status'] === 'failed';
        });
        $results = [];
        foreach ($pending as $month) {
            $result = $this->processMonth($month['year'], $month['month']);
            $results[] = [
                'month' => $month['label'],
                'success' => $result['success'],
                'stats' => $result['stats'] ?? null,
                'error' => $result['error'] ?? null
            ];
            // Evitar timeout en procesamiento masivo
            if (count($results) >= 10) {
                break; // Procesar máximo 3 meses a la vez
            }
        }

        return [
            'success' => true,
            'processed_count' => count($results),
            'results' => $results
        ];
    }

    /**
     * Obtener metadatos del modelo actual
     */
    public function getModelMetadata() {
        $sql = "SELECT smm_key_name, smm_value_text, smm_value_numeric, smm_updated_at
                FROM suggestions_model_metadata";

        $rows = App::Db()->fetchAll($sql);

        $metadata = [];
        foreach ($rows as $row) {
            $metadata[$row['smm_key_name']] = [
                'text' => $row['smm_value_text'],
                'numeric' => $row['smm_value_numeric'],
                'updated_at' => $row['smm_updated_at']
            ];
        }

        // Obtener conteos de reglas actuales
        $ruleCounts = [
            'metric_cooccurrences' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_metric_cooccurrence"),
            'variable_cooccurrences' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_variable_cooccurrence"),
            'sequences' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_sequences"),
            'zoom_patterns' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_by_zoom_range"),
            'province_patterns' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_by_province"),
            'region_patterns' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_region_after_metric"),
            'boundary_patterns' => App::Db()->fetchScalar("SELECT COUNT(*) FROM suggestions_boundary_patterns")
        ];

        return [
            'success' => true,
            'metadata' => $metadata,
            'rule_counts' => $ruleCounts,
            'total_rules' => array_sum($ruleCounts)
        ];
    }
}
