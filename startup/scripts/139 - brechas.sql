ALTER TABLE `draft_variable`
ADD COLUMN `mvv_gap_data` CHAR(1) NULL DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)' AFTER `mvv_normalization_column_id`,
ADD COLUMN `mvv_gap_data_column_id` INT(11) NULL DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.' AFTER `mvv_gap_data`,
ADD COLUMN `mvv_gap_normalization` CHAR(1) NULL DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.' AFTER `mvv_gap_data_column_id`,
ADD COLUMN `mvv_gap_normalization_column_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato' AFTER `mvv_gap_normalization`,
ADD INDEX `fk_draft_metriv_variable_gap_idx` (`mvv_gap_data_column_id` ASC),
ADD INDEX `fk_draft_metric_variable_normalization_gap_idx` (`mvv_gap_normalization_column_id` ASC);
;
ALTER TABLE `draft_variable`
ADD CONSTRAINT `fk_draft_metriv_variable_gap`
  FOREIGN KEY (`mvv_gap_data_column_id`)
  REFERENCES `draft_dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_draft_metric_variable_normalization_gap`
  FOREIGN KEY (`mvv_gap_normalization_column_id`)
  REFERENCES `draft_dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `variable`
ADD COLUMN `mvv_gap_data` CHAR(1) NULL DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)' AFTER `mvv_normalization_column_id`,
ADD COLUMN `mvv_gap_data_column_id` INT(11) NULL DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.' AFTER `mvv_gap_data`,
ADD COLUMN `mvv_gap_normalization` CHAR(1) NULL DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.' AFTER `mvv_gap_data_column_id`,
ADD COLUMN `mvv_gap_normalization_column_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato' AFTER `mvv_gap_normalization`,
ADD INDEX `fk_metriv_variable_gap_idx` (`mvv_gap_data_column_id` ASC),
ADD INDEX `fk_metric_variable_normalization_gap_idx` (`mvv_gap_normalization_column_id` ASC);
;
ALTER TABLE `variable`
ADD CONSTRAINT `fk_metriv_variable_gap`
  FOREIGN KEY (`mvv_gap_data_column_id`)
  REFERENCES `dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metric_variable_normalization_gap`
  FOREIGN KEY (`mvv_gap_normalization_column_id`)
  REFERENCES `dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `variable`
ADD COLUMN `mvv_is_gap` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Columna para identificar si la variable refleja una brecha' AFTER `mvv_normalization_column_id`;

ALTER TABLE `draft_variable`
ADD COLUMN `mvv_is_gap` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Columna para identificar si la variable refleja una brecha' AFTER `mvv_normalization_column_id`;

ALTER TABLE `draft_variable`
ADD COLUMN `mvv_has_gap_same_total` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Columna para identificar los totales de los gaps deben sumarse para calcular el peso' AFTER `mvv_normalization_column_id`;

ALTER TABLE `variable`
ADD COLUMN `mvv_has_gap_same_total` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Columna para identificar los totales de los gaps deben sumarse para calcular el peso' AFTER `mvv_normalization_column_id`;

UPDATE version SET ver_value = '139' WHERE ver_name = 'DB';
