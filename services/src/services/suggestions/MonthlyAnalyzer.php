<?php
namespace helena\services\suggestions;

use helena\classes\App;
use Exception;

/**
 * Analizador Mensual de Patrones
 * Procesa logs mensuales y actualiza el modelo de sugerencias
 */
class MonthlyAnalyzer {

    private $year;
    private $month;
    private $patternAnalyzer;
    private $settings;
    private $verbose;
    private $stats;
    private $excluded = ['RemoveMetric', 'SelectCircle', 'SelectVariable', 'ClearRegiones', 'ClearCircle', 'RemoveBoundary'];

	public function __construct($year, $month, $verbose = false) {
        $this->year = $year;
        $this->month = $month;
        $this->verbose = $verbose;
        $this->patternAnalyzer = new PatternAnalyzer();
        $this->settings = App::Settings()->Suggestions();
        $this->stats = [
            'sessions_analyzed' => 0,
            'rules_created' => 0,
            'rules_updated' => 0,
            'rules_deleted' => 0
        ];
    }

    /**
     * Ejecutar análisis completo del mes
     */
    public function run() {
        $this->log("=== Iniciando análisis para {$this->year}-{$this->month} ===");

		ini_set('memory_limit', '2G'); // 2GB de RAM
		ini_set('max_execution_time', 7200); // 2 horas
		set_time_limit(7200);

        $startTime = date('Y-m-d H:i:s');

        try {
            // Registrar inicio
            $this->logProcessingStart();

            // 1. Extraer sesiones de navegación
            $this->log("Extrayendo sesiones...");
            $sqliteNav = SqliteDbHelper::getNavigationDb($this->year, $this->month);
            $sessions = $this->extractSessions($sqliteNav);
            $this->stats['sessions_analyzed'] = count($sessions);
            $this->log("Sesiones extraídas: " . count($sessions));

			if (count($sessions) > 0) {

				// 2. Extraer feedback del mes (si existe)
				$this->log("Extrayendo feedback del mes...");
				$feedback = $this->extractFeedback();

				// 3. Aplicar decaimiento a reglas existentes ANTES de agregar nuevas
				$this->log("Aplicando decaimiento a reglas existentes...");
				$this->applyDecay();

				// 4. Analizar y actualizar reglas con datos nuevos
				$this->log("Analizando co-ocurrencias de Metrics...");
				$this->analyzeMetricCooccurrences($sessions);
                /*
				$this->log("Analizando co-ocurrencias de Variables...");
				$this->analyzeVariableCooccurrences($sessions);
                */
				$this->log("Analizando secuencias comunes...");
				$this->analyzeSequences($sessions);

				$this->log("Analizando patrones por rango de zoom...");
				$this->analyzeByZoom($sessions);

				$this->log("Analizando patrones por provincia...");
				$this->analyzeByProvince($sessions);

				$this->log("Analizando regiones asociadas a métricas...");
				$this->analyzeRegionsAfterMetrics($sessions);

				$this->log("Analizando uso de boundaries...");
				$this->analyzeBoundaryPatterns($sessions);

				// 5. Aplicar feedback para actualizar acceptance_rate
				$this->log("Aplicando feedback de aceptación...");
				$this->applyFeedbackToModel($feedback);

				// 6. Limpiar reglas de bajo rendimiento
				$this->log("Limpiando reglas de bajo rendimiento...");
				$this->cleanLowPerformanceRules();
			}

            // 7. Actualizar metadatos
            $this->updateMetadata();

            // 8. Registrar éxito
            $this->logProcessingComplete($startTime);

            $this->log("=== Análisis completado exitosamente ===");

            return [
                'success' => true,
                'stats' => $this->stats
            ];

        } catch (Exception $e) {
            $this->logProcessingError($startTime, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Aplicar decaimiento exponencial a todas las reglas existentes
     *
     * Estrategia: count_nuevo = count_viejo * decayFactor
     *
     * Esto hace que reglas antiguas "pesen menos" que las nuevas,
     * permitiendo que el sistema se adapte a cambios de comportamiento
     * sin olvidar completamente el pasado.
     */
    private function applyDecay() {
        $decayFactor = $this->settings->getDecayFactor();

        if ($decayFactor >= 1.0) {
            $this->log("Decaimiento deshabilitado (factor = 1.0)");
            return;
        }

        $tables = [
            'suggestions_metric_cooccurrence' => 'smc',
            'suggestions_variable_cooccurrence' => 'svc',
            'suggestions_sequences' => 'ssq',
            'suggestions_by_zoom_range' => 'szr',
            'suggestions_by_province' => 'sbp',
            'suggestions_region_after_metric' => 'srm',
            'suggestions_boundary_patterns' => 'sbp'
        ];

        foreach ($tables as $table => $prefix) {
            $sql = "UPDATE $table SET {$prefix}_count = ROUND({$prefix}_count * ?)";
            $affected = App::Db()->exec($sql, [$decayFactor]);

            if ($this->verbose && $affected > 0) {
                $this->log("  Decaimiento aplicado a $table: $affected filas");
            }
        }
    }

    /**
     * Extraer sesiones del mes
     */
	private function extractSessions($sqliteDb)
	{
		SqliteDbHelper::ensureIndex($sqliteDb, 'actions', 'navigation_id');

		// Contar total primero
		$total = $sqliteDb->query("SELECT COUNT(*) FROM navigation WHERE ip IS NOT NULL")->fetchColumn();
		$this->log("Total navegaciones a procesar: " . number_format($total));

		if ($total === 0) {
			return [];
		}

		$sessions = [];
		$batchSize = 20000; // Procesar de a 5k navegaciones para controlar memoria
		$offset = 0;
		$processed = 0;

		while ($offset < $total) {
			$stmt = $sqliteDb->prepare("
            SELECT id, ip, day_week, day_hour, screen_width, screen_height, is_mobile
            FROM navigation
            WHERE ip IS NOT NULL
            LIMIT :limit OFFSET :offset
        ");
			$stmt->bindValue(':limit', $batchSize, \PDO::PARAM_INT);
			$stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
			$stmt->execute();
			$navigations = $stmt->fetchAll();

			foreach ($navigations as $nav) {
				$sequence = $this->patternAnalyzer->buildSessionSequence($nav['id'], $sqliteDb);

				// Solo guardar sesiones con contenido
				if (count($sequence) > 0) {
					$sessions[] = [
						'navigation_id' => $nav['id'],
						'ip' => $nav['ip'],
						'province' => $this->patternAnalyzer->getProvinceFromIP($nav['ip']),
						'day_week' => $nav['day_week'],
						'day_hour' => $nav['day_hour'],
						'is_mobile' => $nav['is_mobile'],
						'sequence' => $sequence,
						'stats' => $this->patternAnalyzer->getSessionStats($sequence)
					];
				}


				// Log de progreso cada 2500 navegaciones
				if ($processed % 2500 == 0) {
					$percent = round(($processed / $total) * 100, 1);
					$memoryMB = round(memory_get_usage(true) / 1024 / 1024, 1);
					$this->log("Progreso: " . number_format($processed) . " / " . number_format($total) . " ($percent%) - Memoria: {$memoryMB}MB");
				}
				$processed++;
			}

			$offset += $batchSize;

			// Liberar memoria del batch
			unset($navigations);
			unset($stmt);

			// Forzar recolección de basura cada 50k navegaciones
			if ($processed % 50000 == 0) {
				gc_collect_cycles();
			}
		}

		$this->log("Sesiones con contenido: " . number_format(count($sessions)) . " de " . number_format($total) . " navegaciones");
		return $sessions;
	} /**
	  * Extraer feedback del mes desde SQLite de sugerencias
	  */
	private function extractFeedback() {
        try {
            $sqliteSugg = SqliteDbHelper::getSuggestionsDb($this->year, $this->month);

            $stats = $sqliteSugg->query("SELECT * FROM v_suggestions_stats")->fetchAll();

            $this->log("Feedback extraído: " . count($stats) . " combinaciones únicas");

            return $stats;
        } catch (Exception $e) {
            $this->log("No hay feedback para este mes: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Analizar co-ocurrencias de Metrics
     * ESTRATEGIA DE MERGE: Si existe, suma counts; si no, crea nueva
     */
    private function analyzeMetricCooccurrences($sessions) {
        $pairCounts = [];
        $metricCounts = [];

        foreach ($sessions as $session) {
            $pairs = $this->patternAnalyzer->extractMetricPairs($session['sequence']);

            foreach ($pairs as $pair) {
                $key = $pair[0] . '-' . $pair[1];
                $pairCounts[$key] = ($pairCounts[$key] ?? 0) + 1;

                $metricCounts[$pair[0]] = ($metricCounts[$pair[0]] ?? 0) + 1;
                $metricCounts[$pair[1]] = ($metricCounts[$pair[1]] ?? 0) + 1;
            }
        }

        $totalSessions = count($sessions);
        $minSupport = $this->settings->getMinSupport();
        $minConfidence = $this->settings->getMinConfidence();

        $created = 0;
        $updated = 0;

        foreach ($pairCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($metricA, $metricB) = explode('-', $key);

            $support = $count / $totalSessions;
            $confidence = $count / $metricCounts[$metricA];
            $pB = $metricCounts[$metricB] / $totalSessions;
            $lift = $confidence / $pB;

            if ($confidence < $minConfidence) continue;

            // Intentar actualizar primero (merge)
            $sql = "UPDATE suggestions_metric_cooccurrence
                    SET smc_support = ?,
                        smc_confidence = ?,
                        smc_lift = ?,
                        smc_count = smc_count + ?,
                        smc_updated_at = NOW()
                    WHERE smc_metric_a = ? AND smc_metric_b = ?";

            $affected = App::Db()->exec($sql, [
                $support, $confidence, $lift, $count, $metricA, $metricB
            ]);

            if ($affected > 0) {
                $updated++;
            } else {
                // No existía, crear nueva
                $sql = "INSERT INTO suggestions_metric_cooccurrence
                        (smc_metric_a, smc_metric_b, smc_support, smc_confidence,
                         smc_lift, smc_count, smc_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())";

                App::Db()->exec($sql, [
                    $metricA, $metricB, $support, $confidence, $lift, $count
                ]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Metrics: $created creadas, $updated actualizadas");
    }

    // Las demás funciones de análisis siguen el mismo patrón UPDATE/INSERT...
    // Por brevedad, muestro solo una más completa y el resto las simplifico

    private function analyzeVariableCooccurrences($sessions) {
        $pairCounts = [];
        $varCounts = [];

        foreach ($sessions as $session) {
            $pairs = $this->patternAnalyzer->extractVariablePairs($session['sequence']);

            foreach ($pairs as $pair) {
                $m = $pair['metric'];
                $key = "$m-{$pair['var_a']}-{$pair['var_b']}";
                $pairCounts[$key] = ($pairCounts[$key] ?? 0) + 1;

                $varKey = "$m-{$pair['var_a']}";
                $varCounts[$varKey] = ($varCounts[$varKey] ?? 0) + 1;
            }
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();
        $minConfidence = $this->settings->getMinConfidence();

        foreach ($pairCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($metricId, $varA, $varB) = explode('-', $key);

            $varKeyA = "$metricId-$varA";
            $support = $count / count($sessions);
            $confidence = $count / $varCounts[$varKeyA];

            if ($confidence < $minConfidence) continue;

            $sql = "UPDATE suggestions_variable_cooccurrence
                    SET svc_support = ?, svc_confidence = ?, svc_count = svc_count + ?, svc_updated_at = NOW()
                    WHERE svc_metric_id = ? AND svc_variable_a = ? AND svc_variable_b = ?";

            $affected = App::Db()->exec($sql, [$support, $confidence, $count, $metricId, $varA, $varB]);

            if ($affected > 0) {
                $updated++;
            } else {
                $sql = "INSERT INTO suggestions_variable_cooccurrence
                        (svc_metric_id, svc_variable_a, svc_variable_b, svc_support, svc_confidence, svc_count, svc_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())";
                App::Db()->exec($sql, [$metricId, $varA, $varB, $support, $confidence, $count]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Variables: $created creadas, $updated actualizadas");
    }

    private function analyzeSequences($sessions) {
        $sequenceCounts = [];
        foreach ($sessions as $session) {
            $windows = $this->patternAnalyzer->createSlidingWindows($session['sequence'], 3);

            foreach ($windows as $window) {
                $pattern = array_slice($window, 0, -1);
                $next = $window[count($window) - 1];

                $patternStr = array_map([$this->patternAnalyzer, 'actionToString'], $pattern);
                $patternHash = $this->patternAnalyzer->hashPattern($patternStr);

                $key = $patternHash . '|' . $next['name'] . '|' . ($next['value'] ?? '');
                if (!in_array($next['name'], $this->excluded))
				{
                    if (!isset($sequenceCounts[$key])) {
                        $sequenceCounts[$key] = [
                            'pattern_hash' => $patternHash,
                            'pattern_json' => json_encode($patternStr),
                            'pattern_length' => count($pattern),
                            'next_type' => $next['type'],
                            'next_name' => $next['name'],
                            'next_value' => $next['value'] ?? null,
                            'count' => 0,
                            'zoom_levels' => []
                        ];
                    }
                    $sequenceCounts[$key]['count']++;
                    if ($next['zoom'] !== null) {
                        $sequenceCounts[$key]['zoom_levels'][] = $next['zoom'];
                    }
				}
            }
        }

        $patternTotals = [];
        foreach ($sequenceCounts as $data) {
            $h = $data['pattern_hash'];
            $patternTotals[$h] = ($patternTotals[$h] ?? 0) + $data['count'];
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();
        $minConfidence = $this->settings->getMinConfidence();

        foreach ($sequenceCounts as $data) {
            if ($data['count'] < $minSupport) continue;

            $probability = $data['count'] / $patternTotals[$data['pattern_hash']];

            if ($probability < $minConfidence) continue;

            $avgZoom = count($data['zoom_levels']) > 0
                ? array_sum($data['zoom_levels']) / count($data['zoom_levels'])
                : null;

            $sql = "UPDATE suggestions_sequences
                    SET ssq_probability = ?, ssq_count = ssq_count + ?, ssq_avg_zoom_level = ?, ssq_updated_at = NOW()
                    WHERE ssq_pattern_hash = ? AND ssq_next_action_name = ? AND ssq_next_action_value <=> ?";

            $affected = App::Db()->exec($sql, [
                $probability, $data['count'], $avgZoom,
                $data['pattern_hash'], $data['next_name'], $data['next_value']
            ]);

            if ($affected > 0) {
                $updated++;
            } else {
                $sql = "INSERT INTO suggestions_sequences
                        (ssq_pattern_hash, ssq_pattern_json, ssq_pattern_length, ssq_next_action_type,
                         ssq_next_action_name, ssq_next_action_value, ssq_probability, ssq_count,
                         ssq_avg_zoom_level, ssq_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                App::Db()->exec($sql, [
                    $data['pattern_hash'], $data['pattern_json'], $data['pattern_length'],
                    $data['next_type'], $data['next_name'], $data['next_value'],
                    $probability, $data['count'], $avgZoom
                ]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Secuencias: $created creadas, $updated actualizadas");
    }

    private function analyzeByZoom($sessions) {
        $zoomCounts = [];

        foreach ($sessions as $session) {
            foreach ($session['sequence'] as $action) {
                if ($action['zoom'] !== null && !in_array($action['name'], $this->excluded))
				{
                    $range = $this->patternAnalyzer->getZoomRange($action['zoom']);
                    $key = "{$range['min']}-{$range['max']}|{$action['type']}|{$action['name']}|{$action['value']}";

                    $zoomCounts[$key] = ($zoomCounts[$key] ?? 0) + 1;
				}
            }
        }

        $rangeTotals = [];
        foreach ($zoomCounts as $key => $count) {
            list($rangeKey, ) = explode('|', $key, 2);
            $rangeTotals[$rangeKey] = ($rangeTotals[$rangeKey] ?? 0) + $count;
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();

        foreach ($zoomCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($rangeKey, $type, $name, $value) = explode('|', $key);
            list($zmin, $zmax) = explode('-', $rangeKey);

            $frequency = $count / $rangeTotals[$rangeKey];

            $sql = "UPDATE suggestions_by_zoom_range
                    SET szr_frequency = ?, szr_count = szr_count + ?, szr_updated_at = NOW()
                    WHERE szr_zoom_min = ? AND szr_zoom_max = ? AND szr_action_type = ?
                    AND szr_action_name = ? AND szr_action_value <=> ?";

            $affected = App::Db()->exec($sql, [$frequency, $count, $zmin, $zmax, $type, $name, $value ?: null]);

            if ($affected > 0) {
                $updated++;
            } else {
                $sql = "INSERT INTO suggestions_by_zoom_range
                        (szr_zoom_min, szr_zoom_max, szr_action_type, szr_action_name, szr_action_value,
                         szr_frequency, szr_count, szr_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
                App::Db()->exec($sql, [$zmin, $zmax, $type, $name, $value ?: null, $frequency, $count]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Zoom: $created creadas, $updated actualizadas");
    }

    private function analyzeByProvince($sessions) {
        $provinceCounts = [];
        $provinceSessionCounts = [];

        foreach ($sessions as $session) {
            $province = $session['province'];
            $provinceSessionCounts[$province] = ($provinceSessionCounts[$province] ?? 0) + 1;

            foreach ($session['stats']['unique_metrics'] as $metric) {
                $key = "$province|$metric";
                $provinceCounts[$key] = ($provinceCounts[$key] ?? 0) + 1;
            }
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();

        foreach ($provinceCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($province, $metric) = explode('|', $key);
			$sessionCount = $provinceSessionCounts[$province] ?? 0;

			if ($sessionCount > 0) {
				$frequency = $count / $provinceSessionCounts[$province];

				$totalActions = 0;
				$sessionsCount = 0;
				foreach ($sessions as $session) {
					if ($session['province'] === $province && in_array($metric, $session['stats']['unique_metrics'])) {
						$totalActions += $session['stats']['total_actions'];
						$sessionsCount++;
					}
				}
				$avgActions = $sessionsCount > 0 ? round($totalActions / $sessionsCount) : 0;

				$sql = "UPDATE suggestions_by_province
                    SET sbp_frequency = ?, sbp_count = sbp_count + ?, sbp_avg_session_actions = ?, sbp_updated_at = NOW()
                    WHERE sbp_province_code = ? AND sbp_metric_id = ?";

				$affected = App::Db()->exec($sql, [$frequency, $count, $avgActions, $province, $metric]);

				if ($affected > 0) {
					$updated++;
				} else {
					$sql = "INSERT INTO suggestions_by_province
                        (sbp_province_code, sbp_metric_id, sbp_frequency, sbp_count, sbp_avg_session_actions, sbp_updated_at)
                        VALUES (?, ?, ?, ?, ?, NOW())";
					App::Db()->exec($sql, [$province, $metric, $frequency, $count, $avgActions]);
					$created++;
				}
			}
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Provincias: $created creadas, $updated actualizadas");
    }

    private function analyzeRegionsAfterMetrics($sessions) {
        $regionCounts = [];

        foreach ($sessions as $session) {
            $pairs = $this->patternAnalyzer->extractRegionsAfterMetrics($session['sequence']);

            foreach ($pairs as $pair) {
                if ($pair['zoom'] === null) continue;

                $range = $this->patternAnalyzer->getZoomRange($pair['zoom']);
                $key = "{$pair['metric']}|{$pair['region']}|{$range['min']}-{$range['max']}";

                $regionCounts[$key] = ($regionCounts[$key] ?? 0) + 1;
            }
        }

        $metricZoomTotals = [];
        foreach ($regionCounts as $key => $count) {
            list($metric, , $zoomRange) = explode('|', $key);
            $mk = "$metric|$zoomRange";
            $metricZoomTotals[$mk] = ($metricZoomTotals[$mk] ?? 0) + $count;
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();

        foreach ($regionCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($metric, $region, $zoomRange) = explode('|', $key);
            list($zmin, $zmax) = explode('-', $zoomRange);

            $mk = "$metric|$zoomRange";
            $frequency = $count / $metricZoomTotals[$mk];

            $sql = "UPDATE suggestions_region_after_metric
                    SET srm_frequency = ?, srm_count = srm_count + ?, srm_updated_at = NOW()
                    WHERE srm_metric_id = ? AND srm_region_id = ? AND srm_zoom_min = ? AND srm_zoom_max = ?";

            $affected = App::Db()->exec($sql, [$frequency, $count, $metric, $region, $zmin, $zmax]);

            if ($affected > 0) {
                $updated++;
            } else {
                $sql = "INSERT INTO suggestions_region_after_metric
                        (srm_metric_id, srm_region_id, srm_zoom_min, srm_zoom_max, srm_frequency, srm_count, srm_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())";
                App::Db()->exec($sql, [$metric, $region, $zmin, $zmax, $frequency, $count]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Regiones: $created creadas, $updated actualizadas");
    }

    private function analyzeBoundaryPatterns($sessions) {
        $boundaryCounts = [];

        foreach ($sessions as $session) {
            $hasMetrics = count($session['stats']['unique_metrics']) > 0;
            $hasRegions = count($session['stats']['unique_regions']) > 0;

            foreach ($session['sequence'] as $action) {
                if ($action['name'] === 'AddBoundary' && $action['zoom'] !== null) {
                    $range = $this->patternAnalyzer->getZoomRange($action['zoom']);
                    $key = "{$action['value']}|$hasMetrics|$hasRegions|{$range['min']}-{$range['max']}";

                    $boundaryCounts[$key] = ($boundaryCounts[$key] ?? 0) + 1;
                }
            }
        }

        $created = 0;
        $updated = 0;
        $minSupport = $this->settings->getMinSupport();

        foreach ($boundaryCounts as $key => $count) {
            if ($count < $minSupport) continue;

            list($boundary, $hasMetrics, $hasRegions, $zoomRange) = explode('|', $key);
            list($zmin, $zmax) = explode('-', $zoomRange);

            $frequency = $count / count($sessions);

            $sql = "UPDATE suggestions_boundary_patterns
                    SET sbp_frequency = ?, sbp_count = sbp_count + ?, sbp_updated_at = NOW()
                    WHERE sbp_boundary_id = ? AND sbp_context_has_metrics = ?
                    AND sbp_context_has_regions = ? AND sbp_zoom_min = ? AND sbp_zoom_max = ?";

            $affected = App::Db()->exec($sql, [
                $frequency, $count, $boundary, $hasMetrics ? 1 : 0, $hasRegions ? 1 : 0, $zmin, $zmax
            ]);

            if ($affected > 0) {
                $updated++;
            } else {
                $sql = "INSERT INTO suggestions_boundary_patterns
                        (sbp_boundary_id, sbp_context_has_metrics, sbp_context_has_regions,
                         sbp_zoom_min, sbp_zoom_max, sbp_frequency, sbp_count, sbp_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
                App::Db()->exec($sql, [
                    $boundary, $hasMetrics ? 1 : 0, $hasRegions ? 1 : 0, $zmin, $zmax, $frequency, $count
                ]);
                $created++;
            }
        }

        $this->stats['rules_created'] += $created;
        $this->stats['rules_updated'] += $updated;
        $this->log("  Boundaries: $created creadas, $updated actualizadas");
    }

    /**
     * Aplicar feedback del mes al modelo
     */
    private function applyFeedbackToModel($feedback) {
        if (empty($feedback)) return;

        foreach ($feedback as $stat) {
            $acceptanceRate = $stat['acceptance_rate'];

            switch ($stat['sof_suggestion_type']) {
                case 'metric':
                    $sql = "UPDATE suggestions_metric_cooccurrence
                            SET smc_acceptance_rate = ?
                            WHERE smc_metric_b = ?";
                    App::Db()->exec($sql, [$acceptanceRate, $stat['sof_suggestion_value']]);
                    break;

                case 'region':
                    $sql = "UPDATE suggestions_region_after_metric
                            SET srm_acceptance_rate = ?
                            WHERE srm_region_id = ?";
                    App::Db()->exec($sql, [$acceptanceRate, $stat['sof_suggestion_value']]);
                    break;

                // ... otros tipos
            }
        }

        $this->log("  Feedback aplicado a " . count($feedback) . " reglas");
    }

    /**
     * Limpiar reglas con bajo rendimiento
     */
    private function cleanLowPerformanceRules() {
        $minRate = $this->settings->getMinAcceptanceRate();
        $minSamples = 20;

        $tables = [
            'suggestions_metric_cooccurrence' => 'smc',
            'suggestions_variable_cooccurrence' => 'svc',
            'suggestions_sequences' => 'ssq',
            'suggestions_by_zoom_range' => 'szr',
            'suggestions_region_after_metric' => 'srm',
            'suggestions_boundary_patterns' => 'sbp'
        ];

        $totalDeleted = 0;
        foreach ($tables as $table => $prefix) {
            $sql = "DELETE FROM $table
                    WHERE {$prefix}_acceptance_rate < ?
                    AND {$prefix}_count >= ?";

            $deleted = App::Db()->exec($sql, [$minRate, $minSamples]);
            $totalDeleted += $deleted;
        }

        $this->stats['rules_deleted'] = $totalDeleted;

        if ($totalDeleted > 0) {
            $this->log("  Eliminadas: $totalDeleted reglas de bajo rendimiento");
        }
    }

    /**
     * Actualizar metadatos del modelo
     */
    private function updateMetadata() {
        $yearMonth = sprintf('%04d-%02d', $this->year, $this->month);

        $sql = "INSERT INTO suggestions_model_metadata
                (smm_key_name, smm_value_text, smm_value_numeric, smm_updated_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    smm_value_text = VALUES(smm_value_text),
                    smm_value_numeric = VALUES(smm_value_numeric),
                    smm_updated_at = NOW()";

        App::Db()->exec($sql, ['last_training_month', $yearMonth, null]);

        // Incrementar total de sesiones
        $currentTotal = App::Db()->fetchScalarIntNullable(
            "SELECT smm_value_numeric FROM suggestions_model_metadata
             WHERE smm_key_name = 'total_sessions_analyzed'"
        );
		if ($currentTotal == null)
			$currentTotal = 0;

         $newTotal = ($currentTotal ?? 0) + $this->stats['sessions_analyzed'];

        App::Db()->exec($sql, ['total_sessions_analyzed', (string)$newTotal, $newTotal]);
    }

    /**
     * Registrar inicio de procesamiento
     */
    private function logProcessingStart() {
        $yearMonth = sprintf('%04d-%02d', $this->year, $this->month);

        $sql = "INSERT INTO suggestions_processing_log
                (spl_year_month, spl_sessions_analyzed, spl_rules_created,
                 spl_rules_updated, spl_rules_deleted, spl_started_at,
                 spl_completed_at, spl_status)
                VALUES (?, 0, 0, 0, 0, NOW(), NOW(), 'running')
                ON DUPLICATE KEY UPDATE
                    spl_started_at = NOW(),
                    spl_status = 'running'";

        App::Db()->exec($sql, [$yearMonth]);
    }

    /**
     * Registrar éxito de procesamiento
     */
    private function logProcessingComplete($startTime) {
        $yearMonth = sprintf('%04d-%02d', $this->year, $this->month);

        $sql = "UPDATE suggestions_processing_log
                SET spl_sessions_analyzed = ?,
                    spl_rules_created = ?,
                    spl_rules_updated = ?,
                    spl_rules_deleted = ?,
                    spl_completed_at = NOW(),
                    spl_status = 'completed',
                    spl_error_message = NULL
                WHERE spl_year_month = ?";

        App::Db()->exec($sql, [
            $this->stats['sessions_analyzed'],
            $this->stats['rules_created'],
            $this->stats['rules_updated'],
            $this->stats['rules_deleted'],
            $yearMonth
        ]);
    }

    /**
     * Registrar error de procesamiento
     */
    private function logProcessingError($startTime, $errorMessage) {
        $yearMonth = sprintf('%04d-%02d', $this->year, $this->month);

        $sql = "UPDATE suggestions_processing_log
                SET spl_completed_at = NOW(),
                    spl_status = 'failed',
                    spl_error_message = ?
                WHERE spl_year_month = ?";

        App::Db()->exec($sql, [$errorMessage, $yearMonth]);
    }

    /**
     * Helper para logging
     */
    private function log($message) {
		if ($this->verbose) {
            echo "[" . date('Y-m-d H:i:s') . "] $message\n";
        }
    }
}
