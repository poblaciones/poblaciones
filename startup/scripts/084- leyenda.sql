ALTER TABLE `draft_variable`
ADD COLUMN `mvv_legend` VARCHAR(500) NULL COMMENT 'Informaci�n aclaratoria del indicador a mostrar en la presentaci�n de los datos' AFTER `mvv_filter_value`;

ALTER TABLE `variable`
ADD COLUMN `mvv_legend` VARCHAR(500) NULL COMMENT 'Informaci�n aclaratoria del indicador a mostrar en la presentaci�n de los datos' AFTER `mvv_filter_value`;

UPDATE version SET ver_value = '084' WHERE ver_name = 'DB';