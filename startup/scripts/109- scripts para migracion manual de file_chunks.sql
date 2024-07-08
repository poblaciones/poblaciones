DELIMITER //

CREATE PROCEDURE create_draft_work_file_chunk_tables()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_id VARCHAR(7);
    DECLARE cur CURSOR FOR
        SELECT LPAD(wrk_id, 6, '0') AS ID
        FROM draft_work;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO current_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @sql = CONCAT(
            'CREATE TABLE IF NOT EXISTS `work_file_chunk_draft_', current_id, '` (
                `chu_id` int(11) NOT NULL AUTO_INCREMENT,
                `chu_file_id` int(11) NOT NULL,
                `chu_content` longblob,
                PRIMARY KEY (`chu_id`),
                KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`),
                CONSTRAINT `fk_draft_file_chunk_', current_id, '`
                FOREIGN KEY (`chu_file_id`)
                REFERENCES `draft_file` (`fil_id`)
                ON DELETE CASCADE
                ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Ejecutar el procedimiento almacenado
CALL create_draft_work_file_chunk_tables();

-- Eliminar el procedimiento almacenado después de usarlo
DROP PROCEDURE create_draft_work_file_chunk_tables;

-- AHORA PARA PUBLISHED

DELIMITER //

CREATE PROCEDURE create_work_file_chunk_tables()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_id VARCHAR(7);
    DECLARE cur CURSOR FOR
        SELECT LPAD(wrk_id, 6, '0') AS ID
        FROM draft_work;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO current_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @sql = CONCAT(
            'CREATE TABLE IF NOT EXISTS `work_file_chunk_shard_1_', current_id, '` (
                `chu_id` int(11) NOT NULL AUTO_INCREMENT,
                `chu_file_id` int(11) NOT NULL,
                `chu_content` longblob,
                PRIMARY KEY (`chu_id`),
                KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`),
                CONSTRAINT `fk_file_chunk_', current_id, '`
                FOREIGN KEY (`chu_file_id`)
                REFERENCES `file` (`fil_id`)
                ON DELETE CASCADE
                ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Ejecutar el procedimiento almacenado
CALL create_work_file_chunk_tables();

-- Eliminar el procedimiento almacenado después de usarlo
DROP PROCEDURE create_work_file_chunk_tables;



-- Tablas para excel draft
SELECT distinct lpad(lpad(wrk_id, 6, '0'),7,"'") as ID FROM draft_work join draft_metadata
	on wrk_metadata_id = met_id
	join draft_metadata_file on mfi_metadata_id = met_id
	join draft_file on mfi_file_id = fil_id
	join draft_file_chunk on chu_file_id = fil_id
UNION
	SELECT distinct lpad(lpad(wrk_id, 6, '0'),7,"'") as ID FROM draft_work WHERE wrk_image_id IS NOT NULL OR wrk_preview_file_id IS NOT NULL
UNION
	SELECT distinct lpad(lpad(wic_work_id, 6, '0'),7,"'") as ID FROM draft_work_icon WHERE wic_file_id IS NOT NULL
UNION
    SELECT distinct lpad(lpad(onb_work_id, 6, '0'),7,"'") as ID FROM draft_onboarding
    JOIN draft_onboarding_step ON obs_onboarding_id = onb_id WHERE obs_image_id IS NOT NULL

-- Tablas para excel published
SELECT distinct lpad(left(lpad(wrk_id, 8, '0'),6),7,"'") FROM work join metadata
	on wrk_metadata_id = met_id
	join metadata_file on mfi_metadata_id = met_id
	join `file` on mfi_file_id = fil_id
	join file_chunk on chu_file_id = fil_id
UNION
	SELECT distinct lpad(left(lpad(wrk_id, 8, '0'),6),7,"'")  as ID FROM `work` WHERE wrk_image_id IS NOT NULL
UNION
	SELECT distinct lpad(left(lpad(wic_work_id, 8, '0'),6),7,"'") FROM work_icon WHERE wic_file_id IS NOT NULL
UNION
	SELECT distinct lpad(left(lpad(onb_work_id, 8, '0'),6),7,"'")  FROM onboarding
    JOIN onboarding_step ON obs_onboarding_id = onb_id WHERE obs_image_id IS NOT NULL

-- USAR LA SALIDA DE AMBAS TABLAS CON EL EXCEL MIGRACION FILE_CHUNKS

UPDATE version SET ver_value = '110' WHERE ver_name = 'DB';
