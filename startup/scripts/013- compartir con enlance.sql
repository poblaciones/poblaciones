ALTER TABLE `draft_work` CHANGE `wrk_access_link` `wrk_access_link` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link';

ALTER TABLE `work` CHANGE `wrk_access_link` `wrk_access_link` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link';

ALTER TABLE `draft_work` ADD `wrk_last_access_link` VARCHAR(50) NULL COMMENT 'Resguarda el valor del último enlace cuando deja de usarse este modo de visibilidad.' AFTER `wrk_access_link`;

UPDATE version SET ver_value = '013' WHERE ver_name = 'DB';