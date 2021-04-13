ALTER TABLE `draft_dataset_marker`
CHANGE COLUMN `dmk_symbol` `dmk_symbol` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.' ;

ALTER TABLE `dataset_marker`
CHANGE COLUMN `dmk_symbol` `dmk_symbol` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.' ;

ALTER TABLE `draft_variable_value_label`
ADD COLUMN `vvl_symbol` VARCHAR(100) NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.' AFTER `vvl_visible`;

ALTER TABLE `variable_value_label`
ADD COLUMN `vvl_symbol` VARCHAR(100) NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.' AFTER `vvl_visible`;

UPDATE version SET ver_value = '067' WHERE ver_name = 'DB';