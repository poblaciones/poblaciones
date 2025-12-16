DELIMITER $$

CREATE PROCEDURE clone_clipping_region(IN p_old_clr_id INT)
BEGIN
    DECLARE v_new_clr_id INT;

    -- 1. Tablas temporales de mapeo
    CREATE TEMPORARY TABLE tmp_cli_map (
        old_cli_id INT NOT NULL,
        new_cli_id INT NOT NULL
    );

    CREATE TEMPORARY TABLE tmp_crg_map (
        old_crg_id INT NOT NULL,
        new_crg_id INT NOT NULL
    );

    -- 2. Clonar la región principal
    INSERT INTO clipping_region (
        clr_country_id,
        clr_parent_id,
        clr_caption,
        clr_version,
        clr_symbol,
        clr_priority,
        clr_is_crawler_indexer,
        clr_field_code_name,
        clr_index_code,
        clr_no_autocomplete,
        clr_labels_min_zoom,
        clr_labels_max_zoom,
        clr_metadata_id
    )
    SELECT
        clr_country_id,
        clr_parent_id,
        clr_caption,
        clr_version,
        clr_symbol,
        clr_priority,
        clr_is_crawler_indexer,
        clr_field_code_name,
        clr_index_code,
        clr_no_autocomplete,
        clr_labels_min_zoom,
        clr_labels_max_zoom,
        clr_metadata_id
    FROM clipping_region
    WHERE clr_id = p_old_clr_id;

    SET v_new_clr_id = LAST_INSERT_ID();

    -- 3. Clonar geografías y registrar mapeo
    INSERT INTO clipping_region_geography (crg_geography_id, crg_clipping_region_id)
    SELECT crg_geography_id, v_new_clr_id
    FROM clipping_region_geography
    WHERE crg_clipping_region_id = p_old_clr_id;

    INSERT INTO tmp_crg_map (old_crg_id, new_crg_id)
    SELECT old.crg_id, new.crg_id
    FROM clipping_region_geography AS old
    JOIN clipping_region_geography AS new
      ON new.crg_geography_id = old.crg_geography_id
    WHERE old.crg_clipping_region_id = p_old_clr_id
      AND new.crg_clipping_region_id = v_new_clr_id;

    -- 4. Clonar ítems de región
    INSERT INTO clipping_region_item (
        cli_parent_id,
        cli_clipping_region_id,
        cli_code,
        cli_caption,
        cli_geometry,
        cli_geometry_r1,
        cli_geometry_r2,
        cli_geometry_r3,
        cli_centroid,
        cli_area_m2,
        cli_wiki
    )
    SELECT
        cli_parent_id,
        v_new_clr_id,
        cli_code,
        cli_caption,
        cli_geometry,
        cli_geometry_r1,
        cli_geometry_r2,
        cli_geometry_r3,
        cli_centroid,
        cli_area_m2,
        cli_wiki
    FROM clipping_region_item
    WHERE cli_clipping_region_id = p_old_clr_id;

    -- Guardar mapeo cli
    INSERT INTO tmp_cli_map (old_cli_id, new_cli_id)
    SELECT old.cli_id, new.cli_id
    FROM clipping_region_item AS old
    JOIN clipping_region_item AS new
      ON new.cli_code = old.cli_code
    WHERE old.cli_clipping_region_id = p_old_clr_id
      AND new.cli_clipping_region_id = v_new_clr_id;

    -- 5. Clonar relaciones ítem ↔ geografía
    INSERT INTO clipping_region_item_geography_item (
        cgi_clipping_region_item_id,
        cgi_geography_item_id,
        cgi_clipping_region_geography_id,
        cgi_intersection_percent
    )
    SELECT
        mcli.new_cli_id,
        cgi.cgi_geography_item_id,
        mcrg.new_crg_id,
        cgi.cgi_intersection_percent
    FROM clipping_region_item_geography_item AS cgi
    JOIN clipping_region_item AS ci
      ON cgi.cgi_clipping_region_item_id = ci.cli_id
    JOIN clipping_region_geography AS crg
      ON cgi.cgi_clipping_region_geography_id = crg.crg_id
    JOIN tmp_cli_map AS mcli
      ON ci.cli_id = mcli.old_cli_id
    JOIN tmp_crg_map AS mcrg
      ON crg.crg_id = mcrg.old_crg_id
    WHERE ci.cli_clipping_region_id = p_old_clr_id;

    -- Resultado
    SELECT CONCAT('Nueva región clonada con ID ', v_new_clr_id) AS resultado;
END$$

DELIMITER ;


UPDATE version SET ver_value = '125' WHERE ver_name = 'DB';
