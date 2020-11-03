ALTER TABLE `draft_symbology`
ADD COLUMN `vsy_sequence_column_id` INT NULL COMMENT 'Columna que define el orden de la secuencia' AFTER `vsy_cut_column_id`,
ADD COLUMN `vsy_is_sequence` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Define si el indicador debe mostrar secuencialmente.' AFTER `vsy_show_empty_categories`,
ADD INDEX `fk_draft_sym_sequence_idx` (`vsy_sequence_column_id` ASC);
;
ALTER TABLE `draft_symbology`
ADD CONSTRAINT `fk_draft_sym_sequence`
  FOREIGN KEY (`vsy_sequence_column_id`)
  REFERENCES `draft_dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;

ALTER TABLE `symbology`
ADD COLUMN `vsy_sequence_column_id` INT NULL COMMENT 'Columna que define el orden de la secuencia' AFTER `vsy_cut_column_id`,
ADD COLUMN `vsy_is_sequence` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Define si el indicador debe mostrar secuencialmente.' AFTER `vsy_show_empty_categories`,
ADD INDEX `fk_sym_sequence_idx` (`vsy_sequence_column_id` ASC);
;
ALTER TABLE `symbology`
ADD CONSTRAINT `fk_sym_sequence`
  FOREIGN KEY (`vsy_sequence_column_id`)
  REFERENCES `dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

UPDATE version SET ver_value = '057' WHERE ver_name = 'DB';