ALTER TABLE `metric`
ADD COLUMN `mtr_tag` VARCHAR(150) NULL COMMENT 'Descripción para servicios y apis' AFTER `mtr_revision`,
ADD UNIQUE INDEX `ix_tag` (`mtr_tag` ASC);
;

ALTER TABLE `draft_metric`
ADD COLUMN `mtr_tag` VARCHAR(150) NULL COMMENT 'Descripción para servicios y apis' AFTER `mtr_caption`,
ADD UNIQUE INDEX `ix2_tag` (`mtr_tag` ASC);
;

-- Función que replica la lógica de WfsTypeName::Sanitize() / sanitizeTag() en JS:
-- minúsculas, sin acentos, : → _, no alfanuméricos → _, colapsa __ consecutivos
DROP FUNCTION IF EXISTS SanitizeTag;
DELIMITER $$


DELIMITER $$

CREATE FUNCTION SanitizeTag(input TEXT, current_id INT, is_draft int)
RETURNS VARCHAR(200)
NOT DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE base_tag VARCHAR(200);
    DECLARE candidate VARCHAR(200);
    DECLARE counter INT DEFAULT 0;
    DECLARE exists_count INT DEFAULT 0;

    -- Parte 1: sanitización (idéntica a la original)
    SET base_tag = LOWER(input);
    SET base_tag = REPLACE(base_tag, 'á', 'a');
    SET base_tag = REPLACE(base_tag, 'é', 'e');
    SET base_tag = REPLACE(base_tag, 'í', 'i');
    SET base_tag = REPLACE(base_tag, 'ó', 'o');
    SET base_tag = REPLACE(base_tag, 'ú', 'u');
    SET base_tag = REPLACE(base_tag, 'à', 'a');
    SET base_tag = REPLACE(base_tag, 'è', 'e');
    SET base_tag = REPLACE(base_tag, 'ì', 'i');
    SET base_tag = REPLACE(base_tag, 'ò', 'o');
    SET base_tag = REPLACE(base_tag, 'ù', 'u');
    SET base_tag = REPLACE(base_tag, 'ä', 'a');
    SET base_tag = REPLACE(base_tag, 'ë', 'e');
    SET base_tag = REPLACE(base_tag, 'ï', 'i');
    SET base_tag = REPLACE(base_tag, 'ö', 'o');
    SET base_tag = REPLACE(base_tag, 'ü', 'u');
    SET base_tag = REPLACE(base_tag, 'â', 'a');
    SET base_tag = REPLACE(base_tag, 'ê', 'e');
    SET base_tag = REPLACE(base_tag, 'î', 'i');
    SET base_tag = REPLACE(base_tag, 'ô', 'o');
    SET base_tag = REPLACE(base_tag, 'û', 'u');
    SET base_tag = REPLACE(base_tag, 'ñ', 'n');
    SET base_tag = REPLACE(base_tag, 'ç', 'c');
    SET base_tag = REPLACE(base_tag, 'ã', 'a');
    SET base_tag = REPLACE(base_tag, 'õ', 'o');

    SET base_tag = REPLACE(base_tag, ':', '_');

    SET base_tag = REPLACE(base_tag, ' ', '_');
    SET base_tag = REPLACE(base_tag, '-', '_');
    SET base_tag = REPLACE(base_tag, '/', '_');
    SET base_tag = REPLACE(base_tag, '\\', '_');
    SET base_tag = REPLACE(base_tag, '.', '_');
    SET base_tag = REPLACE(base_tag, ',', '_');
    SET base_tag = REPLACE(base_tag, ';', '_');
    SET base_tag = REPLACE(base_tag, '(', '_');
    SET base_tag = REPLACE(base_tag, ')', '_');
    SET base_tag = REPLACE(base_tag, '[', '_');
    SET base_tag = REPLACE(base_tag, ']', '_');
    SET base_tag = REPLACE(base_tag, '{', '_');
    SET base_tag = REPLACE(base_tag, '}', '_');
    SET base_tag = REPLACE(base_tag, "'", '_');
    SET base_tag = REPLACE(base_tag, '"', '_');
    SET base_tag = REPLACE(base_tag, '!', '_');
    SET base_tag = REPLACE(base_tag, '?', '_');
    SET base_tag = REPLACE(base_tag, '%', '_');
    SET base_tag = REPLACE(base_tag, '&', '_');
    SET base_tag = REPLACE(base_tag, '+', '_');
    SET base_tag = REPLACE(base_tag, '=', '_');
    SET base_tag = REPLACE(base_tag, '@', '_');
    SET base_tag = REPLACE(base_tag, '#', '_');
    SET base_tag = REPLACE(base_tag, '*', '_');

    SET base_tag = REPLACE(base_tag, '______', '_');
    SET base_tag = REPLACE(base_tag, '_____', '_');
    SET base_tag = REPLACE(base_tag, '____', '_');
    SET base_tag = REPLACE(base_tag, '___', '_');
    SET base_tag = REPLACE(base_tag, '__', '_');
    SET base_tag = TRIM('_' FROM base_tag);
    SET base_tag = LEFT(base_tag, 200);

    -- Parte 2: verificación de unicidad
    SET candidate = base_tag;

   if is_draft THEN
     SELECT COUNT(*) INTO exists_count
    FROM draft_metric
    WHERE mtr_tag = candidate
      AND mtr_id <> current_id;
   ELSE
     SELECT COUNT(*) INTO exists_count
    FROM metric
    WHERE mtr_tag = candidate
      AND mtr_id <> current_id;
   END IF;

    WHILE exists_count > 0 DO
        SET counter = counter + 1;
        SET candidate = CONCAT(base_tag, '_', counter);
        SELECT COUNT(*) INTO exists_count
        FROM metric
        WHERE mtr_tag = candidate
          AND mtr_id <> current_id;
    END WHILE;

    RETURN candidate;
END$$
DELIMITER ;


-- Puebla mtr_tag para todos los registros que aún no tienen tag.
-- Si hay colisiones de unicidad (dos métricas con el mismo nombre sanitizado),
-- el UPDATE fallará en esa fila — revisarlas manualmente con la query de abajo.
UPDATE metric
SET mtr_tag = SanitizeTag(mtr_caption, mtr_id, false)
WHERE mtr_tag IS NULL AND  mtr_metric_group_id is not NULL;

UPDATE `metric` SET `mtr_tag` = 'nbi' WHERE (`mtr_id` = '3401');
UPDATE `metric` SET `mtr_tag` = 'servicio_domestico_con_cama' WHERE (`mtr_id` = '6901');

UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_en_el_hogar', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_la_poblacion_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_la_poblacion', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'riesgo_de_', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_del_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'acceso_al_', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'acceso_a_', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'modo_de_', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_por_', '_x_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_alguna_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_los_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_con_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_en_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_la_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_al_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_a_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'hogares_con_', '');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, '_as_', '_');
UPDATE `metric` SET `mtr_tag` = replace(`mtr_tag`, 'riesgo_de_', '');

UPDATE draft_metric
SET mtr_tag = SanitizeTag(mtr_caption, mtr_id, true)
WHERE mtr_tag IS NULL AND  mtr_metric_group_id is not NULL;


UPDATE `draft_metric` SET `mtr_tag` = 'nbi' WHERE (`mtr_id` = '34');
UPDATE `draft_metric` SET `mtr_tag` = 'servicio_domestico_con_cama' WHERE (`mtr_id` = '69');

UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_en_el_hogar', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_la_poblacion_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_la_poblacion', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'riesgo_de_', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_del_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'acceso_al_', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'acceso_a_', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'modo_de_', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_por_', '_x_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_alguna_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_los_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_con_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_de_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_en_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_la_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_al_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_a_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'hogares_con_', '');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, '_as_', '_');
UPDATE `draft_metric` SET `mtr_tag` = replace(`mtr_tag`, 'riesgo_de_', '');


ALTER TABLE `boundary`
ADD COLUMN `bou_tag` VARCHAR(100) NULL COMMENT 'identificador para WFS' AFTER `bou_caption`,
ADD UNIQUE INDEX `ix_boundary_Tag` (`bou_tag` ASC);
;

UPDATE boundary
SET bou_tag = SanitizeTag(bou_caption, 0)
WHERE bou_tag IS NULL;

DROP FUNCTION IF EXISTS SanitizeTag;

ALTER TABLE `snapshot_metric_version`
ADD COLUMN `mvw_metric_tag` VARCHAR(150) NULL AFTER `mvw_metric_id`,
CHANGE COLUMN `mvw_metric_caption` `mvw_metric_caption` VARCHAR(150) NOT NULL COMMENT 'Nombre del indicador' ;

UPDATE `snapshot_metric_version` SET `mvw_metric_tag` = (SELECT mtr_tag FROM metric WHERE mtr_id = mvw_metric_id);

UPDATE version SET ver_value = '130' WHERE ver_name = 'DB';
