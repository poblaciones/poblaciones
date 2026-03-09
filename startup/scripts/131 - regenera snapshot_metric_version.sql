ALTER TABLE `snapshot_metric_version`
CHANGE COLUMN `mvw_variable_captions` `mvw_variable_captions` VARCHAR(5000) NULL DEFAULT NULL COMMENT 'Descripciones de las variables para los metric_version multimétricos. Los items se separan por un caracter \\\\n.' ,
CHANGE COLUMN `mvw_variable_value_captions` `mvw_variable_value_captions` VARCHAR(5000) NULL DEFAULT NULL COMMENT 'Descripciones de las etiquetas de os valores de las variables. Los valores se encuentran separados por caracteres \\\\r. Para los metric_version multimétricos, los items correspondientes a cada variable se encuentran agrupados entre separadores \\\\n.' ,
CHANGE COLUMN `mvw_level` `mvw_level` VARCHAR(500) NULL DEFAULT NULL ,
CHANGE COLUMN `mvw_work_authors` `mvw_work_authors` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Autores de la cartografía' ;

truncate table snapshot_metric_version ;
SET group_concat_max_len = 102400;
INSERT INTO snapshot_metric_version ( mvw_metric_version_id, mvw_metric_id, mvw_metric_tag, mvw_metric_revision, mvw_metric_caption, mvw_metric_group_id, mvw_metric_provider_id, `mvw_caption`, mvw_partial_coverage, mvw_level,
			mvw_work_id, mvw_work_caption, mvw_work_authors, mvw_work_institutions, mvw_work_type, mvw_work_is_private, mvw_work_is_indexed, mvw_work_access_link, `mvw_variable_captions`, `mvw_variable_value_captions`)

		SELECT mvr_id, mvr_metric_id, mtr_tag, mtr_revision, mtr_caption, mtr_metric_group_id, mtr_metric_provider_id, mvr_caption,
						GROUP_CONCAT(DISTINCT IFNULL(mvl_partial_coverage, geo_partial_coverage) ORDER BY geo_id SEPARATOR ','),
						GROUP_CONCAT(CONCAT(mvl_id, ';',
							(CASE WHEN dat_type != 'D' THEN 'Ubicaciones' ELSE geo_caption END)) ORDER BY geo_id SEPARATOR ','),
						wrk_id, met_title,
						met_authors,
						(SELECT LEFT(GROUP_CONCAT(ins_caption ORDER BY min_order SEPARATOR '\n'), 5000)
							FROM metadata_institution
							JOIN institution i ON min_institution_id = i.ins_id
							WHERE min_metadata_id = wrk_metadata_id
									),
						wrk_type, wrk_is_private,
						wrk_is_indexed, wrk_access_link,

		(SELECT LEFT(GROUP_CONCAT(CONCAT(mvl_id, ';', mvv_caption) ORDER BY mvl_id, mvv_order SEPARATOR '\n'), 5000)
							FROM variable
							JOIN metric_version_level ON mvv_metric_version_level_id = mvl_id
							WHERE mvl_metric_version_id = mvr_id
									),

		(SELECT LEFT(GROUP_CONCAT(SUB.V1 ORDER BY mvv_order SEPARATOR '\n'), 5000)
							FROM
									(SELECT mvr_id, mvv_id, mvv_order,
												GROUP_CONCAT(DISTINCT vvl_caption ORDER BY vvl_variable_id, vvl_order SEPARATOR '\r') AS V1
									FROM metric_version
									JOIN metric_version_level ON mvl_metric_version_id = mvr_id
									JOIN variable ON mvv_metric_version_level_id = mvl_id
									JOIN variable_value_label ON vvl_variable_id = mvv_id
									GROUP BY mvr_id, mvv_id, mvv_order) AS SUB
							 WHERE SUB.mvr_id = metric_version.mvr_id)
						FROM metric_version
						JOIN metric ON mvr_metric_id = mtr_id
						JOIN metric_version_level ON mvl_metric_version_id = mvr_id
						JOIN dataset ON mvl_dataset_id = dat_id
						JOIN geography ON dat_geography_id = geo_id
						JOIN work ON dat_work_id = wrk_id
						JOIN metadata ON wrk_metadata_id = met_id

						GROUP BY mvr_id, mvr_metric_id, mtr_revision, mtr_caption, mtr_metric_group_id, mtr_metric_provider_id, mvr_caption, wrk_id, met_title,
										met_authors, wrk_type, wrk_is_private, wrk_is_indexed, wrk_access_link;

UPDATE version SET ver_value = '131' WHERE ver_name = 'DB';
