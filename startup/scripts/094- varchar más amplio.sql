ALTER TABLE `draft_symbology`
CHANGE COLUMN `vsy_custom_colors` `vsy_custom_colors`
VARCHAR(60000)
CHARACTER SET 'ascii'
NULL DEFAULT
NULL COMMENT 'Colores definidos como override paleta o background' ;

ALTER TABLE `symbology`
CHANGE COLUMN `vsy_custom_colors` `vsy_custom_colors`
VARCHAR(60000)
CHARACTER SET 'ascii'
NULL DEFAULT
NULL COMMENT 'Colores definidos como override paleta o background' ;


UPDATE version SET ver_value = '094' WHERE ver_name = 'DB';