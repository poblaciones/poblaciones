CREATE TABLE `statistic` (
  `sta_id` INT NOT NULL AUTO_INCREMENT,
  `sta_month` CHAR(7) NOT NULL COMMENT 'Mes al que corresponde la información.',
  `sta_type` CHAR(1) NOT NULL COMMENT 'Tipo de registro. W: cartografía. M: métrica',
  `sta_element_id` INT NOT NULL COMMENT 'Id de la obra o la métrica',
  `sta_hits` INT NOT NULL DEFAULT 0 COMMENT 'Consultas',
  `sta_downloads` INT NOT NULL DEFAULT 0 COMMENT 'Descargas',
  `sta_google` INT NOT NULL DEFAULT 0 COMMENT 'Ingresos por una búsqueda desde google.',
  `sta_backoffice` INT NOT NULL DEFAULT 0 COMMENT 'Ingresos por backoffice',
  PRIMARY KEY (`sta_id`),
  INDEX `sta_month` (`sta_month` ASC, sta_type ASC));


UPDATE version SET ver_value = '053' WHERE ver_name = 'DB';