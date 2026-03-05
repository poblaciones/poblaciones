-- =============================================
-- Función para eliminar un work y todos sus registros dependientes
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_delete_draft_work_cascade$$

CREATE PROCEDURE sp_delete_draft_work_cascade(IN p_wrk_id INT)
proc_label: BEGIN
    DECLARE v_error_message TEXT;
    DECLARE v_sql_state VARCHAR(5);
    DECLARE v_error_number INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Capturar información del error
        GET DIAGNOSTICS CONDITION 1
            v_sql_state = RETURNED_SQLSTATE,
            v_error_number = MYSQL_ERRNO,
            v_error_message = MESSAGE_TEXT;

        -- En caso de error, hacer rollback
        ROLLBACK;

        -- Mostrar información detallada del error
        SELECT
            'ERROR' AS status,
            v_error_number AS error_code,
            v_sql_state AS sql_state,
            v_error_message AS error_message;
    END;

    -- Iniciar transacción
    START TRANSACTION;

    -- Verificar que el work existe
    IF NOT EXISTS (SELECT 1 FROM draft_work WHERE wrk_id = p_wrk_id) THEN
        SELECT
            'ERROR' AS status,
            CONCAT('El work ID ', p_wrk_id, ' no existe') AS error_message;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- 1. Eliminar anotaciones y sus items
    DELETE ani FROM draft_annotation_item ani
    INNER JOIN draft_annotation ann ON ani.ani_annotation_id = ann.ann_id
    WHERE ann.ann_work_id = p_wrk_id;

	delete from work_space_usage where wdu_work_id = p_wrk_id;

    DELETE FROM draft_annotation
    WHERE ann_work_id = p_wrk_id;

    -- 2. Eliminar onboarding steps y onboarding
    DELETE obs FROM draft_onboarding_step obs
    INNER JOIN draft_onboarding onb ON obs.obs_onboarding_id = onb.onb_id
    WHERE onb.onb_work_id = p_wrk_id;

    DELETE FROM draft_onboarding
    WHERE onb_work_id = p_wrk_id;

    -- 3. Eliminar work icons
    DELETE FROM draft_work_icon
    WHERE wic_work_id = p_wrk_id;

    -- 4. Eliminar permisos de work
    DELETE FROM draft_work_permission
    WHERE wkp_work_id = p_wrk_id;

    -- 5. Eliminar métricas extra del work
    DELETE FROM draft_work_extra_metric
    WHERE wmt_work_id = p_wrk_id;

    -- 6. Eliminar variables y sus value labels
    DELETE vvl FROM draft_variable_value_label vvl
    INNER JOIN draft_variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
    INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
    INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 7. Eliminar variables
    DELETE mvv FROM draft_variable mvv
    INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
    INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 8. Eliminar metric version levels
    DELETE mvl FROM draft_metric_version_level mvl
    INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 9. Eliminar metric versions del work
    DELETE FROM draft_metric_version
    WHERE mvr_work_id = p_wrk_id;

    -- 10. Eliminar dataset column value labels
    DELETE dla FROM draft_dataset_column_value_label dla
    INNER JOIN draft_dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
    INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 11. Eliminar dataset columns
    DELETE dco FROM draft_dataset_column dco
    INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 12. Eliminar dataset markers
    DELETE dmk FROM draft_dataset_marker dmk
    INNER JOIN draft_dataset dat ON dmk.dmk_id = dat.dat_marker_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 13. Eliminar datasets
    DELETE FROM draft_dataset
    WHERE dat_work_id = p_wrk_id;

    -- 14. Obtener el metadata_id y startup_id antes de eliminar el work
    SET @metadata_id = (SELECT wrk_metadata_id FROM draft_work WHERE wrk_id = p_wrk_id);
    SET @startup_id = (SELECT wrk_startup_id FROM draft_work WHERE wrk_id = p_wrk_id);

    -- 15. Eliminar el work
    DELETE FROM draft_work
    WHERE wrk_id = p_wrk_id;

    -- 16. Eliminar startup del work (DESPUÉS de eliminar el work)
    DELETE FROM draft_work_startup
    WHERE wst_id = @startup_id;

    -- 17. Eliminar metadata files
    DELETE FROM draft_metadata_file
    WHERE mfi_metadata_id = @metadata_id;

    -- 18. Eliminar metadata institutions
    DELETE FROM draft_metadata_institution
    WHERE min_metadata_id = @metadata_id;

    -- 19. Eliminar metadata sources
    DELETE FROM draft_metadata_source
    WHERE msc_metadata_id = @metadata_id;

    -- 20. Obtener el contact_id antes de eliminar metadata
    SET @contact_id = (SELECT met_contact_id FROM draft_metadata WHERE met_id = @metadata_id);

    -- 21. Eliminar metadata
    DELETE FROM draft_metadata
    WHERE met_id = @metadata_id;

    -- 22. Eliminar contact (si no está siendo usado por otros registros)
    DELETE FROM draft_contact
    WHERE con_id = @contact_id
    AND con_id NOT IN (SELECT met_contact_id FROM draft_metadata WHERE met_contact_id IS NOT NULL)
    AND con_id NOT IN (SELECT src_contact_id FROM draft_source WHERE src_contact_id IS NOT NULL);

    -- Confirmar transacción
    COMMIT;

    SELECT
        'SUCCESS' AS status,
        CONCAT('Work ID ', p_wrk_id, ' eliminado exitosamente con todos sus registros dependientes') AS message;

END$$

DELIMITER ;

-- =============================================
-- Ejemplo de uso:
-- CALL sp_delete_work_cascade(123);
-- =============================================
-- =============================================
-- Función para eliminar un work y todos sus registros dependientes
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_delete_work_cascade$$

CREATE PROCEDURE sp_delete_work_cascade(IN p_wrk_id INT)
proc_label: BEGIN
    DECLARE v_error_message TEXT;
    DECLARE v_sql_state VARCHAR(5);
    DECLARE v_error_number INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Capturar información del error
        GET DIAGNOSTICS CONDITION 1
            v_sql_state = RETURNED_SQLSTATE,
            v_error_number = MYSQL_ERRNO,
            v_error_message = MESSAGE_TEXT;

        -- En caso de error, hacer rollback
        ROLLBACK;

        -- Mostrar información detallada del error
        SELECT
            'ERROR' AS status,
            v_error_number AS error_code,
            v_sql_state AS sql_state,
            v_error_message AS error_message;
    END;

    -- Iniciar transacción
    START TRANSACTION;

    -- Verificar que el work existe
    IF NOT EXISTS (SELECT 1 FROM work WHERE wrk_id = p_wrk_id) THEN
        SELECT
            'ERROR' AS status,
            CONCAT('El work ID ', p_wrk_id, ' no existe') AS error_message;
        ROLLBACK;
        LEAVE proc_label;
    END IF;


    -- 2. Eliminar onboarding steps y onboarding
    DELETE obs FROM onboarding_step obs
    INNER JOIN onboarding onb ON obs.obs_onboarding_id = onb.onb_id
    WHERE onb.onb_work_id = p_wrk_id;

    DELETE FROM onboarding
    WHERE onb_work_id = p_wrk_id;

    -- 3. Eliminar work icons
    DELETE FROM work_icon
    WHERE wic_work_id = p_wrk_id;

    -- 5. Eliminar métricas extra del work
    DELETE FROM work_extra_metric
    WHERE wmt_work_id = p_wrk_id;

    -- 6. Eliminar variables y sus value labels
    DELETE vvl FROM variable_value_label vvl
    INNER JOIN variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
    INNER JOIN metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
    INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 7. Eliminar variables
    DELETE mvv FROM variable mvv
    INNER JOIN metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
    INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 8. Eliminar metric version levels
    DELETE mvl FROM metric_version_level mvl
    INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 9. Eliminar metric versions del work
    DELETE FROM metric_version
    WHERE mvr_work_id = p_wrk_id;

    -- 10. Eliminar dataset column value labels
    DELETE dla FROM dataset_column_value_label dla
    INNER JOIN dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
    INNER JOIN dataset dat ON dco.dco_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 11. Eliminar dataset columns
    DELETE dco FROM dataset_column dco
    INNER JOIN dataset dat ON dco.dco_dataset_id = dat.dat_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 12. Eliminar dataset markers
    DELETE dmk FROM dataset_marker dmk
    INNER JOIN dataset dat ON dmk.dmk_id = dat.dat_marker_id
    WHERE dat.dat_work_id = p_wrk_id;

    -- 13. Eliminar datasets
    DELETE FROM dataset
    WHERE dat_work_id = p_wrk_id;

    -- 14. Obtener el metadata_id y startup_id antes de eliminar el work
    SET @metadata_id = (SELECT wrk_metadata_id FROM work WHERE wrk_id = p_wrk_id);
    SET @startup_id = (SELECT wrk_startup_id FROM work WHERE wrk_id = p_wrk_id);

    -- 15. Eliminar el work
    DELETE FROM work
    WHERE wrk_id = p_wrk_id;

    -- 16. Eliminar startup del work (DESPUÉS de eliminar el work)
    DELETE FROM work_startup
    WHERE wst_id = @startup_id;

    -- 17. Eliminar metadata files
    DELETE FROM metadata_file
    WHERE mfi_metadata_id = @metadata_id;

    -- 18. Eliminar metadata institutions
    DELETE FROM metadata_institution
    WHERE min_metadata_id = @metadata_id;

    -- 19. Eliminar metadata sources
    DELETE FROM metadata_source
    WHERE msc_metadata_id = @metadata_id;

    -- 20. Obtener el contact_id antes de eliminar metadata
    SET @contact_id = (SELECT met_contact_id FROM metadata WHERE met_id = @metadata_id);

    -- 21. Eliminar metadata
    DELETE FROM metadata
    WHERE met_id = @metadata_id;

    -- 22. Eliminar contact (si no está siendo usado por otros registros)
    DELETE FROM contact
    WHERE con_id = @contact_id
    AND con_id NOT IN (SELECT met_contact_id FROM metadata WHERE met_contact_id IS NOT NULL)
    AND con_id NOT IN (SELECT src_contact_id FROM source WHERE src_contact_id IS NOT NULL);

    -- Confirmar transacción
    COMMIT;

    SELECT
        'SUCCESS' AS status,
        CONCAT('Work ID ', p_wrk_id, ' eliminado exitosamente con todos sus registros dependientes') AS message;

END$$

DELIMITER ;

-- =============================================
-- Ejemplo de uso:
-- CALL sp_delete_work_cascade(123);
-- =============================================
-- Ejemplo de uso:
-- CALL sp_delete_work_cascade(123);
-- =============================================
UPDATE version SET ver_value = '128' WHERE ver_name = 'DB';
