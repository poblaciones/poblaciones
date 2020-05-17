ALTER TABLE `metric` ADD `mtr_revision` INT NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador' AFTER `mtr_caption`;

ALTER TABLE `snapshot_metric_versions` ADD `mvw_metric_revision` INT NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador' AFTER `mvw_metric_caption`;

INSERT INTO `version` (`ver_name`, `ver_value`) VALUES ('FAB_METRICS', '1');

INSERT INTO `version` (`ver_name`, `ver_value`) VALUES ('LOOKUP_REGIONS', '1');

UPDATE version SET ver_value = '006' WHERE ver_name = 'DB';