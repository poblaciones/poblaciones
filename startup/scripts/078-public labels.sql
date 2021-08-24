
ALTER TABLE `dataset`
ADD COLUMN `dat_public_labels` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.' AFTER `dat_are_segments`,
CHANGE COLUMN `dat_show_info` `dat_show_info` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Define si muestra el panel de resumen para los elementos del dataset' ;

ALTER TABLE `draft_dataset`
ADD COLUMN `dat_public_labels` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.' AFTER `dat_are_segments`,
CHANGE COLUMN `dat_show_info` `dat_show_info` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Define si muestra el panel de resumen para los elementos del dataset' ;


UPDATE version SET ver_value = '078' WHERE ver_name = 'DB';