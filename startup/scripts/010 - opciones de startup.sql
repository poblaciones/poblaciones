ALTER TABLE `draft_work` DROP `wrk_start_args`;
ALTER TABLE `work` DROP `wrk_start_args`;


ALTER TABLE `draft_work` ADD `wrk_start_clipping_region_id` INT NULL COMMENT 'Referencia a la región que debe enfocarse al abrir la cartografía'
AFTER `wrk_access_link`, ADD `wrk_start_clipping_region_selected` TINYINT(1) NOT NULL DEFAULT '1'
COMMENT 'Indica si la región debe aparecer seleccionada' AFTER `wrk_start_clipping_region_id`,
ADD `wrk_start_center` POINT NOT NULL COMMENT 'Valor de latitud y longitud si el inicio se indica por coordenada',
ADD `wrk_start_zoom` POINT NOT NULL COMMENT 'Valor de zoom si el inicio se indica por coordenada'
AFTER `wrk_start_clipping_region_selected`;

ALTER TABLE `draft_work` ADD CONSTRAINT `fk_draft_work_region`
FOREIGN KEY (`wrk_start_clipping_region_id`)
REFERENCES `clipping_region_item`(`cli_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `draft_metric_version` ADD `mvr_start_enabled` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía' AFTER `mvr_multilevel`;

ALTER TABLE `work` ADD `wrk_start_clipping_region_id` INT NULL COMMENT 'Referencia a la región que debe enfocarse al abrir la cartografía'
AFTER `wrk_access_link`, ADD `wrk_start_clipping_region_selected` TINYINT(1) NOT NULL DEFAULT '1'
COMMENT 'Indica si la región debe aparecer seleccionada' AFTER `wrk_start_clipping_region_id`,
ADD `wrk_start_center` POINT NOT NULL COMMENT 'Valor de latitud y longitud si el inicio se indica por coordenada',
ADD `wrk_start_zoom` POINT NOT NULL COMMENT 'Valor de zoom si el inicio se indica por coordenada'
AFTER `wrk_start_clipping_region_selected`;

ALTER TABLE `work` ADD CONSTRAINT `fk_work_region`
FOREIGN KEY (`wrk_start_clipping_region_id`)
REFERENCES `clipping_region_item`(`cli_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `metric_version` ADD `mvr_start_enabled` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía' AFTER `mvr_multilevel`;

CREATE TABLE `draft_work_extra_metric` ( `wmt_id` INT NOT NULL AUTO_INCREMENT , `wmt_work_id` INT NOT NULL COMMENT 'Cartografía de la que indica la métrica adicional' , `wmt_metric_id` INT NOT NULL COMMENT 'Métrica adicional' , `wmt_order` INT NULL COMMENT 'Orden de aparición' , PRIMARY KEY (`wmt_id`)) ENGINE = InnoDB;

CREATE TABLE `work_extra_metric` ( `wmt_id` INT NOT NULL AUTO_INCREMENT , `wmt_work_id` INT NOT NULL COMMENT 'Cartografía de la que indica la métrica adicional' , `wmt_metric_id` INT NOT NULL COMMENT 'Métrica adicional' , `wmt_order` INT NULL COMMENT 'Orden de aparición' , PRIMARY KEY (`wmt_id`)) ENGINE = InnoDB;

ALTER TABLE `draft_work_extra_metric` ADD CONSTRAINT `fk_draft_work_metric_work`
FOREIGN KEY (`wmt_work_id`) REFERENCES `draft_work`(`wrk_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `draft_work_extra_metric` ADD CONSTRAINT `fk_draft_work_metric_metric`
FOREIGN KEY (`wmt_metric_id`) REFERENCES `draft_metric`(`mtr_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `work_extra_metric` ADD CONSTRAINT `fk_work_metric_work`
FOREIGN KEY (`wmt_work_id`) REFERENCES `work`(`wrk_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `work_extra_metric` ADD CONSTRAINT `fk_work_metric_metric`
FOREIGN KEY (`wmt_metric_id`) REFERENCES `metric`(`mtr_id`) ON DELETE CASCADE ON UPDATE RESTRICT;


UPDATE version SET ver_value = '010' WHERE ver_name = 'DB';