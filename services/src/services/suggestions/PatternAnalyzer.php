<?php
namespace helena\services\suggestions;

use helena\classes\App;
use minga\framework\Str;
use minga\framework\Arr;
use helena\classes\Statistics;
use helena\services\frontend\NavigationService;
/**
 * Clase para extraer y analizar patrones de comportamiento
 */
class PatternAnalyzer {

    private $settings;
    public function __construct() {
        $this->settings = App::Settings()->Suggestions();
    }

    /**
     * Obtener rango de zoom al que pertenece un nivel
     */
    public function getZoomRange($zoomLevel) {
        foreach ($this->settings->getZoomRanges() as $range) {
            if ($zoomLevel >= $range[0] && $zoomLevel <= $range[1]) {
                return [
                    'min' => $range[0],
                    'max' => $range[1],
                    'label' => $range[2]
                ];
            }
        }

        // Por defecto, retornar el rango más alto
        $ranges = $this->settings->getZoomRanges();
        $last = $ranges[count($ranges) - 1];
        return ['min' => $last[0], 'max' => $last[1], 'label' => $last[2]];
    }

    /**
     * Extraer nivel de zoom de un JSON de Bounds
     */
    public function extractZoomLevel($boundsJson) {
        if (empty($boundsJson)) return null;

        $bounds = json_decode($boundsJson, true);
        if (isset($bounds['Zoom'])) {
            return (int)$bounds['Zoom'];
        }
        return null;
    }

    /**
     * Obtener provincia desde IP
     */
    public function getProvinceFromIP($ip) {
        return Statistics::decodeRegion($ip);
    }

    /**
     * Construir secuencia de acciones de una sesión
     * Retorna array de objetos con [type, name, value, time_ms, zoom]
     */
    public function buildSessionSequence($navigationId, $sqliteDb) {
        $stmt = $sqliteDb->prepare("
            SELECT action_type, action_name, action_value, time_ms
            FROM actions
            WHERE navigation_id = :nav_id
            ORDER BY time_ms ASC
        ");
        $stmt->execute(['nav_id' => $navigationId]);
        $actions = $stmt->fetchAll();

        $sequence = [];
        $currentZoom = null;

        foreach ($actions as $action) {
            // Extraer zoom si es acción de Bounds
            if ($action['action_name'] === 'Bounds') {
                $zoom = $this->extractZoomLevel($action['action_value']);
                if ($zoom !== null) {
                    $currentZoom = $zoom;
                }
            }

            // Solo guardar acciones de contenido relevantes
            // Por ahora excluye FEATURE porque no la está usando en las reglas

            if ($action['action_type'] === 'Content' && $action['action_name'] !== 'SelectFeature') {
                $asText = $action['action_value'] . '';
                if ($asText !== NULL && strlen($asText) > 2 && Str::StartsWith($asText, "{") && Str::EndsWith($asText,"}"))
				{
                    $action['action_value'] = json_encode(NavigationService::TrimFloatsRecursive(json_decode($asText)));
				}
                $sequence[] = [
                    'type' => $action['action_type'],
                    'name' => $action['action_name'],
                    'value' => $action['action_value'],
                    'time_ms' => $action['time_ms'],
                    'zoom' => $currentZoom
                ];
            }
        }

        return $sequence;
    }

    /**
     * Generar hash de un patrón de secuencia
     */
    public function hashPattern($pattern) {
        return md5(json_encode($pattern));
    }

    /**
     * Crear sliding windows de una secuencia
     */
    public function createSlidingWindows($sequence, $windowSize = 3) {
        $windows = [];
        $count = count($sequence);

        for ($i = 0; $i <= $count - $windowSize; $i++) {
            $window = array_slice($sequence, $i, $windowSize);
            $windows[] = $window;
        }

        return $windows;
    }

    /**
     * Convertir acción a string simplificado
     */
    public function actionToString($action) {
		if (is_array($action))
		{
			$str = $action['name'];
			$value = $action['value'];
			if (!empty($value) && $value !== 'NULL') {
				if (is_array($value)) {
					$str .= ':' . json_encode($value);
				} else
					$str .= ':' . $value;
			}
			return $str;
		}
        else
		{
			return '' . $action;
		}
    }

    /**
     * Analizar co-ocurrencias de Metrics en una sesión
     * Retorna pares [metric_a, metric_b]
     */
    public function extractMetricPairs($sequence) {
        $metrics = [];

        foreach ($sequence as $action) {
            if ($action['name'] === 'AddMetric' && !empty($action['value'])) {
                $metrics[] = (int)$action['value'];
            }
        }

        // Generar pares únicos
        $pairs = [];
        $count = count($metrics);
        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                // Ordenar para evitar duplicados (A,B) vs (B,A)
                $pair = [$metrics[$i], $metrics[$j]];
                sort($pair);
                $pairs[] = $pair;
            }
        }

        return $pairs;
    }

    /**
     * Extraer Variables seleccionadas junto con su Metric
     */
    public function extractVariablePairs($sequence) {
        $pairs = [];
        $currentMetric = null;
        $variables = [];

        foreach ($sequence as $action) {
            if ($action['name'] === 'AddMetric') {
                // Guardar pares del metric anterior si había
                if ($currentMetric !== null && count($variables) >= 2) {
                    for ($i = 0; $i < count($variables); $i++) {
                        for ($j = $i + 1; $j < count($variables); $j++) {
                            $pairs[] = [
                                'metric' => $currentMetric,
                                'var_a' => $variables[$i],
                                'var_b' => $variables[$j]
                            ];
                        }
                    }
                }

                // Nuevo metric
                $currentMetric = (int)$action['value'];
                $variables = [];

            } elseif ($action['name'] === 'SelectVariable' && $currentMetric !== null) {
                $variables[] = (int)$action['value'];
            }
        }

        // Procesar último metric
        if ($currentMetric !== null && count($variables) >= 2) {
            for ($i = 0; $i < count($variables); $i++) {
                for ($j = $i + 1; $j < count($variables); $j++) {
                    $pairs[] = [
                        'metric' => $currentMetric,
                        'var_a' => $variables[$i],
                        'var_b' => $variables[$j]
                    ];
                }
            }
        }

        return $pairs;
    }

    /**
     * Extraer regiones seleccionadas después de métricas
     */
    public function extractRegionsAfterMetrics($sequence) {
        $results = [];
        $currentMetrics = [];


        foreach ($sequence as $action) {
			if ($action['name'] === 'AddMetric') {
				$currentMetrics[] = (int) $action['value'];
			}
            elseif ($action['name'] === 'RemoveMetric')
			{
                Arr::Remove($currentMetrics, (int)$action['value']);
            }
            elseif ($action['name'] === 'SelectRegions' && !empty($currentMetrics)) {
                // Parsear el JSON de regiones
                $regions = json_decode($action['value'], true);
				if (is_array($regions)) {
					foreach ($currentMetrics as $metric) {
						foreach ($regions as $region) {
                            $results[] = [
                                'metric' => $metric,
                                'region' => (int)$region,
                                'zoom' => $action['zoom']
                            ];
                        }
                    }
                }
            }
        }
		return $results;
    }

    /**
     * Calcular estadísticas de una sesión
     */
    public function getSessionStats($sequence) {
        $stats = [
            'total_actions' => count($sequence),
            'unique_metrics' => [],
            'unique_regions' => [],
            'unique_variables' => [],
            'zoom_levels' => [],
            'action_types' => []
        ];

        foreach ($sequence as $action) {
            // Contar tipos de acciones
            $stats['action_types'][$action['name']] =
                ($stats['action_types'][$action['name']] ?? 0) + 1;

            // Métricas únicas
            if ($action['name'] === 'AddMetric') {
                $stats['unique_metrics'][] = (int)$action['value'];
            }

            // Variables únicas
            if ($action['name'] === 'SelectVariable') {
                $stats['unique_variables'][] = (int)$action['value'];
            }

            // Regiones
            if ($action['name'] === 'SelectRegions' && !empty($action['value'])) {
                $regions = json_decode($action['value'], true);
                if (is_array($regions)) {
                    foreach ($regions as $region) {
                        if (isset($region['Id'])) {
                            $stats['unique_regions'][] = (int)$region['Id'];
                        }
                    }
                }
            }

            // Niveles de zoom
            if ($action['zoom'] !== null) {
                $stats['zoom_levels'][] = $action['zoom'];
            }
        }

        $stats['unique_metrics'] = array_unique($stats['unique_metrics']);
        $stats['unique_regions'] = array_unique($stats['unique_regions']);
        $stats['unique_variables'] = array_unique($stats['unique_variables']);
        $stats['zoom_levels'] = array_unique($stats['zoom_levels']);

        return $stats;
    }
}
