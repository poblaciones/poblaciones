ALTER TABLE `work_extra_metric` ADD `wmt_start_active` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el indicador debe incorporarse al mapa al abrir el work' AFTER `wmt_metric_id`;

ALTER TABLE `draft_work_extra_metric` ADD `wmt_start_active` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el indicador debe incorporarse al mapa al abrir el work' AFTER `wmt_metric_id`;

ALTER TABLE `work_startup` ADD `wst_active_metrics` VARCHAR(200) NULL COMMENT 'Indicadores del work que deben estar activos (lista separada por comas)' AFTER `wst_zoom`;

ALTER TABLE `draft_work_startup` ADD `wst_active_metrics` VARCHAR(200) NULL COMMENT 'Indicadores del work que deben estar activos (lista separada por comas)' AFTER `wst_zoom`;


ALTER TABLE `draft_variable` CHANGE `mvv_data` `mvv_data` CHAR(1) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)';

ALTER TABLE `variable` CHANGE `mvv_data` `mvv_data` CHAR(1) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)';


UPDATE version SET ver_value = '023' WHERE ver_name = 'DB';