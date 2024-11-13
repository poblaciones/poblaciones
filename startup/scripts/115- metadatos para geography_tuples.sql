ALTER TABLE `geography_tuple`
ADD COLUMN `gtu_metadata_id` INT NULL AFTER `gtu_previous_lower_geography_id`;
ALTER TABLE `geography_tuple`
ADD INDEX `fw_metadata_id_idx` (`gtu_metadata_id` ASC);
ALTER TABLE `geography_tuple`
ADD CONSTRAINT `fw_metadata_id`
  FOREIGN KEY (`gtu_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


INSERT INTO `metadata` (`met_id`,`met_title`,`met_publication_date`,`met_last_online_user_id`,`met_online_since`,`met_last_online`,`met_abstract`,`met_status`,`met_authors`,`met_institution_id`,`met_coverage_caption`,`met_period_caption`,`met_frequency`,`met_group_id`,`met_license`,`met_type`,`met_abstract_long`,`met_methods`,`met_references`,`met_language`,`met_wiki`,`met_url`,`met_contact_id`,`met_extents`,`met_create`,`met_update`) VALUES (30,'Correspondencias intercensales de polígonos','12/11/2024',NULL,NULL,NULL,'Tablas de correspondencia de entidades geográficas para los censos de 1980, 2001, 2010 y 2022 de Argentina. ','C','Pablo De Grande',2901,'Total país','1980-2022','',NULL,'{\"licenseType\":1,\"licenseOpen\":\"always\",\"licenseCommercial\":1,\"licenseVersion\":\"4.0/deed.es\"}','C','Las tablas de correspondencia intercensales de entidades geográficas permiten realizar comparaciones entre información censal de los censos de población de Argentina realizados en el período 1980-2022. \r\nLas correspondencias fueron calculadas para los niveles de provincia, departamento (en todo el período) y radio (a partir de 1991), con el fin de relacionar cada elemento de la cartografía censal con las entidades que se ocupan el mismo lugar en el espacio en las demás cartografías, con independencia a posibles cambios en sus códigos o denominaciones.\r\nEstas tablas de correspondencias son utilizadas por Poblaciones para calcular las variaciones entre elementos de series relacionadas a los espacios geográficos respresentados por cartografía censal. \r\nEl procedimiento para el cálculo vincula cada elemento de cada ronda censal con los elementos de censos previos que pudieran haber exisitdo en su ubicación. Para esto establece como requerimiento para incluir la relación en la tabla que la entidad de la ronda censal previa haya ocupado al menos el 50% de la superficie de la entidad actual. De esta forma, al comparar el cambio de cualquier indicar en una entidad censal (ej. un departamento, un radio) se tomará como referencia de la ronda anterior a entidades que abarcaran la mitad o más de la superficie actual. Con este procedimiento, en el caso de subdivisiones de departamentos o radios, todas las partes subdivididas toman como valor de referencia para comparaciones al valor de la entidad tal como existía antes de ser dividida.\r\nAplicando este criterio, 98,48% de las entidades de nivel departamental obtienen su entidad de correspondencia (1980-2022), siendo la jurisdicción más afectada la Ciudad de Buenos Aires, la cual adoptó en la delimitación departamental para INDEC a partir del censo de 2010 los límites de comunas, abandonando las delimitaciones de distritos escolares utilizados previamente.\r\nLos radios una  cobertura en las correspondencia de 99.48% de los entidades, y las provincias un 100%.',NULL,NULL,'es; Español',NULL,NULL,1,NULL,'2024-05-04 11:55:43','2024-05-04 11:55:43');


update geography_tuple set gtu_metadata_id = 30;

ALTER TABLE `geography_tuple`
DROP FOREIGN KEY `fw_metadata_id`;
ALTER TABLE `geography_tuple`
CHANGE COLUMN `gtu_metadata_id` `gtu_metadata_id` INT(11) NOT NULL ;
ALTER TABLE `geography_tuple`
ADD CONSTRAINT `fw_metadata_id`
  FOREIGN KEY (`gtu_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


UPDATE version SET ver_value = '115' WHERE ver_name = 'DB';

