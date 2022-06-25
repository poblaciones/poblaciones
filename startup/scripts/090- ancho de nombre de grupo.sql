ALTER TABLE `metric_group` CHANGE `lgr_caption` `lgr_caption` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de métricas.';


UPDATE version SET ver_value = '090' WHERE ver_name = 'DB';