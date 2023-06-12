
CREATE TABLE `geography_item_2` (
  `gei_id` int(11) NOT NULL AUTO_INCREMENT,
  `gei_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias 2010).',
  `gei_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia al ítem de geografía ''padre''. En el caso por ejemplo de Morón, su parent_id refiere a la provincia de Buenos Aires.',
  `gei_code` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `gei_code_as_number` decimal(12,0) DEFAULT NULL,
  `gei_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `gei_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `gei_geometry_is_null` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Permite indicar qué elementos no poseen geografía.',
  `gei_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `gei_area_m2` double DEFAULT NULL COMMENT 'Area en m2.',
  `gei_population` int(11) NOT NULL COMMENT 'Población total registrada en el ítem.',
  `gei_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en el ítem.',
  `gei_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en el ítem.',
  `gei_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, D: Urbano disperso,  R: Rural, L: Rural disperso, N: No corresponde. R y L corresponden a las categorias 2 y 3 la variable URP del Censo. U y D corresponden a la categoría 1 de URP, siendo D aquellas con < de 250 habitantes por km2.',
  `gei_geometry_r1` geometry NOT NULL,
  `gei_geometry_r2` geometry NOT NULL,
  `gei_geometry_r3` geometry NOT NULL,
  `gei_geometry_r4` geometry NOT NULL,
  `gei_geometry_r5` geometry NOT NULL,
  `gei_geometry_r6` geometry NOT NULL,
  PRIMARY KEY (`gei_id`),
  UNIQUE KEY `carto_codes_2` (`gei_geography_id`,`gei_code`),
  UNIQUE KEY `carto_codes_numbered_2` (`gei_geography_id`,`gei_code_as_number`),
  KEY `fk_geographies_items_geographies1_idx_2` (`gei_geography_id`),
  KEY `fk_geographies_items_geographies_items1_idx_2` (`gei_parent_id`),
  CONSTRAINT `fk_geographies_items_geographies1_2` FOREIGN KEY (`gei_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_geographies_items_geographies_items1_2` FOREIGN KEY (`gei_parent_id`) REFERENCES `geography_item_2` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=958807 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1 ROW_FORMAT=COMPRESSED;
;

insert into geography_item_2 select * from geography_item;

-- mueve las claves foráneas
SELECT CONCAT(
  'ALTER TABLE ',
  TABLE_NAME,
  ' DROP FOREIGN KEY ',
  CONSTRAINT_NAME,
  ';'
) AS 'Sentencia DROP',
CONCAT(
  'ALTER TABLE ',
  TABLE_NAME,
  ' ADD CONSTRAINT ',
  CONSTRAINT_NAME,
  ' FOREIGN KEY (',
  COLUMN_NAME,
  ') REFERENCES geography_item_2(gei_id)  ',
  ';'
) AS 'Sentencia ADD'
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_NAME = 'geography_item_2'
  AND CONSTRAINT_SCHEMA = 'poblaci1_maps_prod' -- Reemplaza 'tu_base_de_datos' con el nombre de tu base de datos
  AND TABLE_NAME != 'geography_item_2';




drop table geography_item;

RENAME TABLE
    geography_item_2 TO geography_item;


//////////////////////

CREATE TABLE `clipping_region_item_2` (
  `cli_id` int(11) NOT NULL AUTO_INCREMENT,
  `cli_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la cartografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a  al registro Provincias.',
  `cli_clipping_region_id` int(11) NOT NULL COMMENT 'Región a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias).',
  `cli_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `cli_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `cli_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `cli_geometry_r1` geometry NOT NULL,
  `cli_geometry_r2` geometry NOT NULL,
  `cli_geometry_r3` geometry NOT NULL,
  `cli_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `cli_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `cli_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli_id`),
  KEY `fk_clipping_regions_items_clipping_regions1_2_idx` (`cli_clipping_region_id`),
  KEY `fk_clipping_regions_items_clipping_regions_items1_2_idx` (`cli_parent_id`),
  CONSTRAINT `fk_clipping_items_g_2` FOREIGN KEY (`cli_clipping_region_id`) REFERENCES clipping_region (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=25023 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1  ROW_FORMAT=COMPRESSED;

insert into `clipping_region_item_2` select * from clipping_region_item;

-- mueve las claves foráneas
SELECT CONCAT(
  'ALTER TABLE ',
  TABLE_NAME,
  ' DROP FOREIGN KEY ',
  CONSTRAINT_NAME,
  ';'
) AS 'Sentencia DROP',
CONCAT(
  'ALTER TABLE ',
  TABLE_NAME,
  ' ADD CONSTRAINT ',
  CONSTRAINT_NAME,
  ' FOREIGN KEY (',
  COLUMN_NAME,
  ') REFERENCES clipping_region_item_2(cli_id)  ',
  ';'
) AS 'Sentencia ADD'
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_NAME = `clipping_region_item`
  AND CONSTRAINT_SCHEMA = 'poblaci1_maps_prod' -- Reemplaza 'tu_base_de_datos' con el nombre de tu base de datos
  AND TABLE_NAME != `clipping_region_item_2` ;

drop table clipping_region_item;

RENAME TABLE
    clipping_region_item_2 TO clipping_region_item;

UPDATE version SET ver_value = '100' WHERE ver_name = 'DB';