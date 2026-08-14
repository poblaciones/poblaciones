ALTER TABLE `draft_variable`
CHANGE COLUMN `mvv_legend` `mvv_legend` VARCHAR(1000) NULL DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos' ;
ALTER TABLE `variable`
CHANGE COLUMN `mvv_legend` `mvv_legend` VARCHAR(1000) NULL DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos' ;

UPDATE version SET ver_value = '148' WHERE ver_name = 'DB';