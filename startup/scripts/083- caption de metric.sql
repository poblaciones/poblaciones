ALTER TABLE `draft_metric`
CHANGE COLUMN `mtr_caption` `mtr_caption` VARCHAR(150) NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).' ;

ALTER TABLE `metric`
CHANGE COLUMN `mtr_caption` `mtr_caption` VARCHAR(150) NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).' ;

UPDATE version SET ver_value = '083' WHERE ver_name = 'DB';