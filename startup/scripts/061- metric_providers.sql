CREATE TABLE `metric_provider` (
  `lpr_id` int(11) NOT NULL AUTO_INCREMENT,
  `lpr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del origen de las métricas.',
  `lpr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  PRIMARY KEY (`lpr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `metric`
ADD COLUMN `mtr_metric_provider_id` INT(11) NULL DEFAULT NULL COMMENT 'Origen del que proviene la métrica.' AFTER `mtr_metric_group_id`,
ADD INDEX `fk_metrics_provider_g_idx` (`mtr_metric_provider_id` ASC);
;
ALTER TABLE `metric`
ADD CONSTRAINT `fk_metrics_provider_g`
  FOREIGN KEY (`mtr_metric_provider_id`)
  REFERENCES `metric_provider` (`lpr_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;

ALTER TABLE `draft_metric`
ADD COLUMN `mtr_metric_provider_id` INT(11) NULL DEFAULT NULL COMMENT 'Origen del que proviene la métrica.' AFTER `mtr_metric_group_id`,
ADD INDEX `fk_draft_metrics_provider_g_idx` (`mtr_metric_provider_id` ASC);
;
ALTER TABLE `draft_metric`
ADD CONSTRAINT `fk_draft_metrics_provider_g`
  FOREIGN KEY (`mtr_metric_provider_id`)
  REFERENCES `metric_provider` (`lpr_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;

ALTER TABLE `snapshot_metric_version`
ADD COLUMN `mvw_metric_provider_id` INT(11) NULL DEFAULT NULL AFTER `mvw_metric_group_id`;

UPDATE version SET ver_value = '061' WHERE ver_name = 'DB';