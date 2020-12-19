
/*
Este script falla con el siguiente error si se ejecuta directo a la base:

#1283 - Column 'mvw_caption' cannot be part of FULLTEXT index

pero si se modifica a mano el tamaño de la columna en phpmyadmin
no da error y genera el mismo script. Misterio...
*/

ALTER TABLE `snapshot_metric_version` CHANGE `mvw_caption` `mvw_caption` VARCHAR(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;

UPDATE version SET ver_value = '036' WHERE ver_name = 'DB';
