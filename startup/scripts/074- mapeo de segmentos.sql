ALTER TABLE `draft_dataset`
ADD COLUMN `dat_are_segments` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la georreferenciación fue por segmentos.' AFTER `dat_show_info`;

ALTER TABLE `dataset`
ADD COLUMN `dat_are_segments` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la georreferenciación fue por segmentos.' AFTER `dat_show_info`;


ALTER TABLE `draft_dataset`
ADD COLUMN `dat_latitude_column_segment_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.' AFTER `dat_longitude_column_id`,
ADD COLUMN `dat_longitude_column_segment_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.' AFTER `dat_latitude_column_segment_id`,
ADD INDEX `fk_draft_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id` ASC),
ADD INDEX `fk_draft_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id` ASC);
;
ALTER TABLE `draft_dataset`
ADD CONSTRAINT `fk_draft_datasets_columns_lat_segment`
  FOREIGN KEY (`dat_latitude_column_segment_id`)
  REFERENCES `draft_dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_draft_datasets_columns_lon_segment`
  FOREIGN KEY (`dat_longitude_column_segment_id`)
  REFERENCES `draft_dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `dataset`
ADD COLUMN `dat_latitude_column_segment_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.' AFTER `dat_longitude_column_id`,
ADD COLUMN `dat_longitude_column_segment_id` INT(11) NULL DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.' AFTER `dat_latitude_column_segment_id`,
ADD INDEX `fk_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id` ASC),
ADD INDEX `fk_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id` ASC);
;
ALTER TABLE `dataset`
ADD CONSTRAINT `fk_datasets_columns_lat_segment`
  FOREIGN KEY (`dat_latitude_column_segment_id`)
  REFERENCES `dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_datasets_columns_lon_segment`
  FOREIGN KEY (`dat_longitude_column_segment_id`)
  REFERENCES `dataset_column` (`dco_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;




/* EN TODAS LAS TABLAS */

ALTER TABLE `work_dataset_draft_000486`
ADD COLUMN `geography_item_segment_id` INT(11) NULL AFTER `geography_item_id`;


UPDATE version SET ver_value = '074' WHERE ver_name = 'DB';