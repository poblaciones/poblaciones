-- ==================================================
-- ESQUEMA MYSQL PARA MOTOR DE SUGERENCIAS
-- ==================================================

-- Tabla de co-ocurrencias de Metrics
CREATE TABLE IF NOT EXISTS suggestions_metric_cooccurrence (
  smc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  smc_metric_a INT NOT NULL,
  smc_metric_b INT NOT NULL,
  smc_support FLOAT NOT NULL COMMENT 'Frecuencia conjunta',
  smc_confidence FLOAT NOT NULL COMMENT 'P(B|A)',
  smc_lift FLOAT NOT NULL COMMENT 'lift = confidence / P(B)',
  smc_count INT NOT NULL,
  smc_acceptance_rate FLOAT DEFAULT 0 COMMENT 'Tasa de aceptación cuando se sugiere',
  smc_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_pair (smc_metric_a, smc_metric_b),
  INDEX idx_lift (smc_lift DESC),
  INDEX idx_acceptance (smc_acceptance_rate DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de co-ocurrencias de Variables (dentro de un Metric)
CREATE TABLE IF NOT EXISTS suggestions_variable_cooccurrence (
  svc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  svc_metric_id INT NOT NULL,
  svc_variable_a INT NOT NULL,
  svc_variable_b INT NOT NULL,
  svc_support FLOAT NOT NULL,
  svc_confidence FLOAT NOT NULL,
  svc_count INT NOT NULL,
  svc_acceptance_rate FLOAT DEFAULT 0,
  svc_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_metric_pair (svc_metric_id, svc_variable_a, svc_variable_b),
  INDEX idx_metric (svc_metric_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Secuencias comunes: patrón → siguiente acción
CREATE TABLE IF NOT EXISTS suggestions_sequences (
  ssq_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ssq_pattern_hash VARCHAR(64) NOT NULL COMMENT 'Hash MD5 del patrón',
  ssq_pattern_json TEXT NOT NULL COMMENT 'Array JSON del patrón de acciones',
  ssq_pattern_length TINYINT NOT NULL,
  ssq_next_action_type VARCHAR(50) NOT NULL,
  ssq_next_action_name VARCHAR(50) NOT NULL,
  ssq_next_action_value VARCHAR(255) DEFAULT NULL,
  ssq_probability FLOAT NOT NULL,
  ssq_count INT NOT NULL,
  ssq_avg_zoom_level FLOAT DEFAULT NULL,
  ssq_acceptance_rate FLOAT DEFAULT 0,
  ssq_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_pattern_next (ssq_pattern_hash, ssq_next_action_type, ssq_next_action_name, ssq_next_action_value(100)),
  INDEX idx_pattern (ssq_pattern_hash),
  INDEX idx_probability (ssq_probability DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Acciones por rango de zoom (agrupado)
CREATE TABLE IF NOT EXISTS suggestions_by_zoom_range (
  szr_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  szr_zoom_min TINYINT NOT NULL,
  szr_zoom_max TINYINT NOT NULL,
  szr_action_type VARCHAR(50) NOT NULL,
  szr_action_name VARCHAR(50) NOT NULL,
  szr_action_value VARCHAR(255) DEFAULT NULL,
  szr_frequency FLOAT NOT NULL COMMENT 'Frecuencia normalizada en este rango',
  szr_count INT NOT NULL,
  szr_acceptance_rate FLOAT DEFAULT 0,
  szr_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_zoom_action (szr_zoom_min, szr_zoom_max, szr_action_type, szr_action_name, szr_action_value(100)),
  INDEX idx_zoom_range (szr_zoom_min, szr_zoom_max),
  INDEX idx_frequency (szr_frequency DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Métricas populares por provincia
CREATE TABLE IF NOT EXISTS suggestions_by_province (
  sbp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sbp_province_code VARCHAR(200) NOT NULL,
  sbp_metric_id INT NOT NULL,
  sbp_frequency FLOAT NOT NULL,
  sbp_count INT NOT NULL,
  sbp_avg_session_actions INT NOT NULL COMMENT 'Promedio de acciones en sesión',
  sbp_acceptance_rate FLOAT DEFAULT 0,
  sbp_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_province_metric (sbp_province_code, sbp_metric_id),
  INDEX idx_province (sbp_province_code),
  INDEX idx_frequency (sbp_frequency DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regions más visitadas después de ver un Metric
CREATE TABLE IF NOT EXISTS suggestions_region_after_metric (
  srm_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  srm_metric_id INT NOT NULL,
  srm_region_id INT NOT NULL,
  srm_zoom_min TINYINT NOT NULL,
  srm_zoom_max TINYINT NOT NULL,
  srm_frequency FLOAT NOT NULL,
  srm_count INT NOT NULL,
  srm_acceptance_rate FLOAT DEFAULT 0,
  srm_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_metric_region_zoom (srm_metric_id, srm_region_id, srm_zoom_min, srm_zoom_max),
  INDEX idx_metric_zoom (srm_metric_id, srm_zoom_min, srm_zoom_max),
  INDEX idx_frequency (srm_frequency DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Boundaries más usados en contexto
CREATE TABLE IF NOT EXISTS suggestions_boundary_patterns (
  sbp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sbp_boundary_id INT NOT NULL,
  sbp_context_has_metrics BOOLEAN NOT NULL,
  sbp_context_has_regions BOOLEAN NOT NULL,
  sbp_zoom_min TINYINT NOT NULL,
  sbp_zoom_max TINYINT NOT NULL,
  sbp_frequency FLOAT NOT NULL,
  sbp_count INT NOT NULL,
  sbp_acceptance_rate FLOAT DEFAULT 0,
  sbp_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_boundary_context (sbp_boundary_id, sbp_context_has_metrics, sbp_context_has_regions, sbp_zoom_min, sbp_zoom_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración y metadatos del modelo
CREATE TABLE IF NOT EXISTS suggestions_model_metadata (
  smm_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  smm_key_name VARCHAR(100) NOT NULL,
  smm_value_text TEXT,
  smm_value_numeric FLOAT DEFAULT NULL,
  smm_updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_key (smm_key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de procesamiento mensual
CREATE TABLE IF NOT EXISTS suggestions_processing_log (
  spl_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  spl_year_month VARCHAR(7) NOT NULL COMMENT 'Formato: YYYY-MM',
  spl_sessions_analyzed INT NOT NULL,
  spl_rules_created INT NOT NULL,
  spl_rules_updated INT NOT NULL,
  spl_rules_deleted INT NOT NULL,
  spl_started_at DATETIME NOT NULL,
  spl_completed_at DATETIME NOT NULL,
  spl_status ENUM('completed', 'failed', 'running') NOT NULL,
  spl_error_message TEXT DEFAULT NULL,
  UNIQUE KEY unique_month (spl_year_month),
  INDEX idx_status (spl_status),
  INDEX idx_completed (spl_completed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar metadatos iniciales
INSERT INTO suggestions_model_metadata (smm_key_name, smm_value_text, smm_updated_at)
VALUES
  ('model_version', '1.0', NOW()),
  ('last_training_month', NULL, NOW()),
  ('total_sessions_analyzed', '0', NOW()),
  ('zoom_ranges', '[[1,6],[7,10],[11,13],[14,18]]', NOW()),
  ('decay_factor', '0.95', NOW())
ON DUPLICATE KEY UPDATE smm_updated_at = NOW();

UPDATE version SET ver_value = '127' WHERE ver_name = 'DB';
