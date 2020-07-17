ALTER TABLE `draft_variable` ADD `mvv_data_column_is_categorical` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.' AFTER `mvv_data_column_id`;

ALTER TABLE `variable` ADD `mvv_data_column_is_categorical` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.' AFTER `mvv_data_column_id`;


UPDATE version SET ver_value = '039' WHERE ver_name = 'DB';

