ALTER TABLE `draft_metric`
CHANGE COLUMN `mtr_caption` `mtr_caption` VARCHAR(150) NOT NULL COMMENT 'Nombre de la m�trica de datos (sin incluir ni el a�o ni la fuente de informaci�n).' ;

ALTER TABLE `metric`
CHANGE COLUMN `mtr_caption` `mtr_caption` VARCHAR(150) NOT NULL COMMENT 'Nombre de la m�trica de datos (sin incluir ni el a�o ni la fuente de informaci�n).' ;

UPDATE version SET ver_value = '083' WHERE ver_name = 'DB';