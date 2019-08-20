ALTER TABLE `draft_work` ADD `wrk_is_private` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados' AFTER `wrk_comments`, ADD `wrk_is_indexed` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador' AFTER `wrk_is_private`, ADD `wrk_access_link` VARCHAR(255) NULL COMMENT 'Ruta creada para el acceso vía link' AFTER `wrk_is_indexed`;

ALTER TABLE `work` ADD `wrk_is_private` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados' AFTER `wrk_comments`, ADD `wrk_is_indexed` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador' AFTER `wrk_is_private`, ADD `wrk_access_link` VARCHAR(255) NULL COMMENT 'Ruta creada para el acceso vía link' AFTER `wrk_is_indexed`;

update draft_work set wrk_is_indexed = 1 where wrk_type = 'P';
update work set wrk_is_indexed = 1 where wrk_type = 'P';

ALTER TABLE `snapshot_metric_versions` ADD `mvw_metric_caption` VARCHAR(100) NULL COMMENT 'Nombre del indicador' AFTER `mvw_metric_id`, ADD `mvw_metric_group_id` INT NULL AFTER `mvw_metric_caption`;

UPDATE `snapshot_metric_versions` JOIN snapshot_metric ON mvw_metric_id = myv_metric_id SET mvw_metric_caption = myv_caption, mvw_metric_group_id = myv_metric_group_id;

ALTER TABLE `snapshot_metric_versions` CHANGE `mvw_metric_caption` `mvw_metric_caption` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del indicador';

ALTER TABLE `snapshot_metric_versions` CHANGE `mvw_metric_group_id` `mvw_metric_group_id` INT(11) NULL DEFAULT NULL;

ALTER TABLE `snapshot_metric_versions` DROP `mvw_environment`;

ALTER TABLE `snapshot_metric_versions` ADD `mvw_work_is_private` TINYINT NOT NULL DEFAULT '0' AFTER `mvw_work_type`, ADD `mvw_work_is_indexed` TINYINT NOT NULL DEFAULT '0' AFTER `mvw_work_is_private`, ADD `mvw_work_access_link` VARCHAR(100) NULL AFTER `mvw_work_is_indexed`;

update snapshot_metric_versions set mvw_work_is_indexed = 1 where mvw_work_type = 'P';

ALTER TABLE `snapshot_metric_versions` ADD FULLTEXT `ix_version_fulltext` (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`, `mvw_variable_value_captions`, `mvw_work_caption`);

ALTER TABLE `metric_group` DROP `lgr_visible`;

DROP TABLE snapshot_metric;

UPDATE version SET ver_value = '001' WHERE ver_name = 'DB';