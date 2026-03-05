-- =============================================
-- Script para corregir work_startup compartidos
-- Crea copias individuales para cada work que comparte un startup
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_fix_shared_draft_work_startup$$

CREATE PROCEDURE sp_fix_shared_draft_work_startup()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_wrk_id INT;
    DECLARE v_shared_startup_id INT;
    DECLARE v_new_startup_id INT;
    DECLARE v_count INT;
    DECLARE v_total_fixed INT DEFAULT 0;

    -- Cursor para obtener todos los works que comparten startup (excepto el primero)
    DECLARE cur_works CURSOR FOR
        SELECT w.wrk_id, w.wrk_startup_id
        FROM draft_work w
        INNER JOIN (
            SELECT wrk_startup_id, COUNT(*) as uso_count
            FROM draft_work
            GROUP BY wrk_startup_id
            HAVING COUNT(*) > 1
        ) shared ON w.wrk_startup_id = shared.wrk_startup_id
        WHERE w.wrk_id NOT IN (
            -- Excluir el primer work de cada grupo (ese mantendrá el startup original)
            SELECT MIN(wrk_id)
            FROM draft_work
            GROUP BY wrk_startup_id
        )
        ORDER BY w.wrk_startup_id, w.wrk_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Verificar cuántos works tienen startup compartido
    SELECT COUNT(*) INTO v_count
    FROM draft_work w
    INNER JOIN (
        SELECT wrk_startup_id, COUNT(*) as uso_count
        FROM draft_work
        GROUP BY wrk_startup_id
        HAVING COUNT(*) > 1
    ) shared ON w.wrk_startup_id = shared.wrk_startup_id
    WHERE w.wrk_id NOT IN (
        SELECT MIN(wrk_id)
        FROM draft_work
        GROUP BY wrk_startup_id
    );

    SELECT CONCAT('Se encontraron ', v_count, ' works que necesitan un nuevo work_startup') AS info;

    -- Mostrar detalles de los startups compartidos
    SELECT
        wst.wst_id AS startup_id,
        COUNT(*) AS works_usando_este_startup,
        GROUP_CONCAT(w.wrk_id ORDER BY w.wrk_id) AS work_ids
    FROM draft_work w
    INNER JOIN draft_work_startup wst ON w.wrk_startup_id = wst.wst_id
    GROUP BY wst.wst_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;

    -- Iniciar transacción
    START TRANSACTION;

    OPEN cur_works;

    read_loop: LOOP
        FETCH cur_works INTO v_wrk_id, v_shared_startup_id;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Crear una copia del startup compartido
        INSERT INTO draft_work_startup (
            wst_type,
            wst_clipping_region_item_id,
            wst_clipping_region_item_selected,
            wst_center,
            wst_zoom,
            wst_active_metrics
        )
        SELECT
            wst_type,
            wst_clipping_region_item_id,
            wst_clipping_region_item_selected,
            wst_center,
            wst_zoom,
            wst_active_metrics
        FROM draft_work_startup
        WHERE wst_id = v_shared_startup_id;

        -- Obtener el ID del nuevo startup
        SET v_new_startup_id = LAST_INSERT_ID();

        -- Actualizar el work para que use el nuevo startup
        UPDATE draft_work
        SET wrk_startup_id = v_new_startup_id
        WHERE wrk_id = v_wrk_id;

        SET v_total_fixed = v_total_fixed + 1;

        -- Mostrar progreso cada 10 registros
        IF v_total_fixed % 10 = 0 THEN
            SELECT CONCAT('Procesados: ', v_total_fixed, ' works...') AS progreso;
        END IF;

    END LOOP;

    CLOSE cur_works;

    -- Confirmar transacción
    COMMIT;

    SELECT CONCAT('✓ COMPLETADO: Se crearon ', v_total_fixed, ' nuevos work_startup') AS resultado;

    -- Verificar que ya no haya startups compartidos
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT wrk_startup_id, COUNT(*) as uso_count
        FROM draft_work
        GROUP BY wrk_startup_id
        HAVING COUNT(*) > 1
    ) shared;

    IF v_count = 0 THEN
        SELECT '✓ VERIFICACIÓN: Ahora todos los works tienen su propio startup único' AS verificacion;
    ELSE
        SELECT CONCAT('⚠ ADVERTENCIA: Aún quedan ', v_count, ' startups compartidos') AS verificacion;
    END IF;

END$$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_fix_shared_work_startup$$

CREATE PROCEDURE sp_fix_shared_work_startup()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_wrk_id INT;
    DECLARE v_shared_startup_id INT;
    DECLARE v_new_startup_id INT;
    DECLARE v_count INT;
    DECLARE v_total_fixed INT DEFAULT 0;

    -- Cursor para obtener todos los works que comparten startup (excepto el primero)
    DECLARE cur_works CURSOR FOR
        SELECT w.wrk_id, w.wrk_startup_id
        FROM work w
        INNER JOIN (
            SELECT wrk_startup_id, COUNT(*) as uso_count
            FROM work
            GROUP BY wrk_startup_id
            HAVING COUNT(*) > 1
        ) shared ON w.wrk_startup_id = shared.wrk_startup_id
        WHERE w.wrk_id NOT IN (
            -- Excluir el primer work de cada grupo (ese mantendrá el startup original)
            SELECT MIN(wrk_id)
            FROM work
            GROUP BY wrk_startup_id
        )
        ORDER BY w.wrk_startup_id, w.wrk_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Verificar cuántos works tienen startup compartido
    SELECT COUNT(*) INTO v_count
    FROM work w
    INNER JOIN (
        SELECT wrk_startup_id, COUNT(*) as uso_count
        FROM work
        GROUP BY wrk_startup_id
        HAVING COUNT(*) > 1
    ) shared ON w.wrk_startup_id = shared.wrk_startup_id
    WHERE w.wrk_id NOT IN (
        SELECT MIN(wrk_id)
        FROM work
        GROUP BY wrk_startup_id
    );

    SELECT CONCAT('Se encontraron ', v_count, ' works que necesitan un nuevo work_startup') AS info;

    -- Mostrar detalles de los startups compartidos
    SELECT
        wst.wst_id AS startup_id,
        COUNT(*) AS works_usando_este_startup,
        GROUP_CONCAT(w.wrk_id ORDER BY w.wrk_id) AS work_ids
    FROM work w
    INNER JOIN work_startup wst ON w.wrk_startup_id = wst.wst_id
    GROUP BY wst.wst_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;

    -- Iniciar transacción
    START TRANSACTION;

    OPEN cur_works;

    read_loop: LOOP
        FETCH cur_works INTO v_wrk_id, v_shared_startup_id;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Crear una copia del startup compartido
        INSERT INTO work_startup (
            wst_type,
            wst_clipping_region_item_id,
            wst_clipping_region_item_selected,
            wst_center,
            wst_zoom,
            wst_active_metrics
        )
        SELECT
            wst_type,
            wst_clipping_region_item_id,
            wst_clipping_region_item_selected,
            wst_center,
            wst_zoom,
            wst_active_metrics
        FROM work_startup
        WHERE wst_id = v_shared_startup_id;

        -- Obtener el ID del nuevo startup
        SET v_new_startup_id = LAST_INSERT_ID();

        -- Actualizar el work para que use el nuevo startup
        UPDATE work
        SET wrk_startup_id = v_new_startup_id
        WHERE wrk_id = v_wrk_id;

        SET v_total_fixed = v_total_fixed + 1;

        -- Mostrar progreso cada 10 registros
        IF v_total_fixed % 10 = 0 THEN
            SELECT CONCAT('Procesados: ', v_total_fixed, ' works...') AS progreso;
        END IF;

    END LOOP;

    CLOSE cur_works;

    -- Confirmar transacción
    COMMIT;

    SELECT CONCAT('✓ COMPLETADO: Se crearon ', v_total_fixed, ' nuevos work_startup') AS resultado;

    -- Verificar que ya no haya startups compartidos
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT wrk_startup_id, COUNT(*) as uso_count
        FROM work
        GROUP BY wrk_startup_id
        HAVING COUNT(*) > 1
    ) shared;

    IF v_count = 0 THEN
        SELECT '✓ VERIFICACIÓN: Ahora todos los works tienen su propio startup único' AS verificacion;
    ELSE
        SELECT CONCAT('⚠ ADVERTENCIA: Aún quedan ', v_count, ' startups compartidos') AS verificacion;
    END IF;

END$$

DELIMITER ;



-- =============================================
-- Ejecutar el procedimiento
-- =============================================
CALL sp_fix_shared_work_startup();
CALL sp_fix_shared_draft_work_startup();

ALTER TABLE draft_work
ADD UNIQUE INDEX uk_draft_work_startup_id (wrk_startup_id);

ALTER TABLE work
ADD UNIQUE INDEX uk_work_startup_id (wrk_startup_id);

UPDATE version SET ver_value = '129' WHERE ver_name = 'DB';
