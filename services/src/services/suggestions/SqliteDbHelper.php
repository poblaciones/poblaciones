<?php
namespace helena\services\suggestions;

use helena\classes\Paths;
use PDO;
use PDOException;
use Exception;

/**
 * Helper para gestionar conexiones a bases SQLite mensuales
 */
class SqliteDbHelper {

    private static $sqliteConnections = [];

    /**
     * Obtener conexión SQLite para logs de navegación mensuales
     */
    public static function getNavigationDb($year, $month) {
        $key = "nav-$year-$month";

        if (!isset(self::$sqliteConnections[$key])) {
            $dbFile = Paths::GetNavigationFolder() . sprintf('/%04d-%02d.db', $year, $month);

            if (!file_exists($dbFile)) {
                throw new Exception("No existe el archivo de logs de navegación: $dbFile");
            }

            try {
                self::$sqliteConnections[$key] = new PDO(
                    'sqlite:' . $dbFile,
                    null,
                    null,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]
                );
            } catch (PDOException $e) {
                throw new Exception("Error abriendo SQLite de navegación $dbFile: " . $e->getMessage());
            }
        }

        return self::$sqliteConnections[$key];
    }

    /**
     * Obtener conexión SQLite para sugerencias ofrecidas mensuales
     * Crea automáticamente la base de datos y schema si no existe
     */
    public static function getSuggestionsDb($year, $month) {
        $key = "sugg-$year-$month";

        if (!isset(self::$sqliteConnections[$key])) {
            $dbFile = Paths::GetSuggestionsFolder() . sprintf('/%04d-%02d.db', $year, $month);

            // Crear archivo si no existe
            $needsSchema = !file_exists($dbFile);

            // Asegurar que el directorio existe
            $dir = dirname($dbFile);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            try {
                self::$sqliteConnections[$key] = new PDO(
                    'sqlite:' . $dbFile,
                    null,
                    null,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]
                );

                // Aplicar schema si es nuevo
                if ($needsSchema) {
                    self::createSuggestionsSchema(self::$sqliteConnections[$key]);
                }
            } catch (PDOException $e) {
                throw new Exception("Error con suggestions-$year-$month.db: " . $e->getMessage());
            }
        }

        return self::$sqliteConnections[$key];
    }

    /**
     * Crear schema para SQLite de sugerencias
     * Se ejecuta automáticamente al crear cada base mensual
     */
    private static function createSuggestionsSchema($pdo) {
        $schema = <<<SQL
-- Tabla de sugerencias ofrecidas
CREATE TABLE IF NOT EXISTS suggestions_offered (
  sof_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sof_navigation_id INTEGER NOT NULL,
  sof_session_fingerprint TEXT NOT NULL,
  sof_suggestion_type TEXT NOT NULL,
  sof_suggestion_value TEXT,
  sof_suggestion_rank INTEGER NOT NULL,
  sof_score REAL NOT NULL,
  sof_context_json TEXT NOT NULL,
  sof_trigger_reason TEXT,
  sof_offered_at INTEGER NOT NULL,
  sof_was_accepted INTEGER DEFAULT NULL,
  sof_accepted_at INTEGER DEFAULT NULL,
  sof_time_to_decision_ms INTEGER DEFAULT NULL,
  sof_next_action_type TEXT DEFAULT NULL,
  sof_next_action_value TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_sof_navigation ON suggestions_offered(sof_navigation_id);
CREATE INDEX IF NOT EXISTS idx_sof_fingerprint ON suggestions_offered(sof_session_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sof_offered_at ON suggestions_offered(sof_offered_at);
CREATE INDEX IF NOT EXISTS idx_sof_type_value ON suggestions_offered(sof_suggestion_type, sof_suggestion_value);
CREATE INDEX IF NOT EXISTS idx_sof_accepted ON suggestions_offered(sof_was_accepted);

-- Vista para análisis rápido
CREATE VIEW IF NOT EXISTS v_suggestions_stats AS
SELECT
  sof_suggestion_type,
  sof_suggestion_value,
  sof_trigger_reason,
  COUNT(*) as times_offered,
  SUM(CASE WHEN sof_was_accepted = 1 THEN 1 ELSE 0 END) as times_accepted,
  CAST(SUM(CASE WHEN sof_was_accepted = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as acceptance_rate,
  AVG(sof_time_to_decision_ms) as avg_decision_time_ms
FROM suggestions_offered
WHERE sof_was_accepted IS NOT NULL
GROUP BY sof_suggestion_type, sof_suggestion_value, sof_trigger_reason;
SQL;

        $pdo->exec($schema);
    }
    private static function navigationMonthHasSessions($year, $month)
	{
		$sqliteNav = self::getNavigationDb($year, $month);
        $stmt = $sqliteNav->query("
            SELECT count(*) FROM navigation WHERE ip IS NOT NULL
        ");
        $navigationsCount = $stmt->fetchColumn();
        return $navigationsCount > 0;
	}
    /**
     * Obtener lista de meses disponibles en logs de navegación
     */
    public static function getAvailableNavigationMonths($removeEmptyMonths = false) {
        $files = glob(Paths::GetNavigationFolder() . '/*.db');
        $months = [];

		foreach ($files as $file) {
            if (preg_match('/(\d{4})-(\d{2})\.db$/', basename($file), $matches)) {
				$year = (int) $matches[1];
				$month = (int) $matches[2];
                $months[] = [
                    'year' => $year,
                    'month' => $month,
                    'label' => $year . '-' . $matches[2]
                    ];
            }
        }
		// Ordenar cronológicamente
        usort($months, function($a, $b) {
            return ($a['year'] * 100 + $a['month']) - ($b['year'] * 100 + $b['month']);
        });

        return $months;
    }
    public static function ensureIndex($pdo, $tabla, $columna)
	{
        $indiceExiste = false;
        // Obtener la lista de índices de la tabla
        $stmt = $pdo->query("PRAGMA index_list($tabla)");
        $indices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($indices as $indice) {
            $nombreIndice = $indice['name'];
            // Obtener las columnas del índice
            $stmtCols = $pdo->query("PRAGMA index_info($nombreIndice)");
            $columnasIndice = $stmtCols->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columnasIndice as $col) {
                if ($col['name'] === $columna) {
					return;
                }
            }
        }

        $nombreIndice = "idx_{$tabla}_{$columna}";
        $sql = "CREATE INDEX $nombreIndice ON $tabla ($columna)";
        $pdo->exec($sql);
	}
    /**
     * Obtener lista de meses disponibles en logs de sugerencias
     */
    public static function getAvailableSuggestionMonths() {
        $files = glob(Paths::GetSuggestionsFolder() . '/*.db');
        $months = [];

        foreach ($files as $file) {
            if (preg_match('/suggestions-(\d{4})-(\d{2})\.db$/', basename($file), $matches)) {
                $months[] = [
                    'year' => (int)$matches[1],
                    'month' => (int)$matches[2],
                    'label' => $matches[1] . '-' . $matches[2]
                ];
            }
        }

        usort($months, function($a, $b) {
            return ($a['year'] * 100 + $a['month']) - ($b['year'] * 100 + $b['month']);
        });

        return $months;
    }

    /**
     * Cerrar todas las conexiones SQLite
     */
    public static function closeAll() {
        self::$sqliteConnections = [];
    }
}
