ALTER TABLE `dataset`
ADD COLUMN `dat_partition_column_id` INT(11) NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.' AFTER `dat_images_column_id`;

ALTER TABLE `draft_dataset`
ADD COLUMN `dat_partition_column_id` INT(11) NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.' AFTER `dat_images_column_id`;


UPDATE version SET ver_value = '096' WHERE ver_name = 'DB';