ALTER TABLE `draft_metric_version` ADD UNIQUE `ix_metric_metric_version_caption` (`mvr_metric_id`, `mvr_caption`);
ALTER TABLE `metric_version` ADD UNIQUE `ixp_metric_metric_version_caption` (`mvr_metric_id`, `mvr_caption`);


ALTER TABLE `draft_metric_version` CHANGE `mvr_caption` `mvr_caption` VARCHAR(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010).';
ALTER TABLE `metric_version` CHANGE `mvr_caption` `mvr_caption` VARCHAR(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). ';

UPDATE version SET ver_value = '007' WHERE ver_name = 'DB';