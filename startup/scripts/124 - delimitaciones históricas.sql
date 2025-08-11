rename table boundary to boundary_version;

CREATE TABLE `boundary` (
  `bou_id` int(11) NOT NULL AUTO_INCREMENT,
  `bou_group_id` int(11) NOT NULL COMMENT 'Grupo de límites al que pertenece.',
  `bou_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del límite.',
  `bou_order` int(11) DEFAULT NULL,
  `bou_is_private` tinyint(1) NOT NULL DEFAULT '1',
  `bou_is_suggestion` tinyint(1) NOT NULL DEFAULT '0',
  `bou_icon` varchar(10000) DEFAULT NULL,
  `bou_sort_by` char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`bou_id`),
  KEY `fw_boundary_group_idx` (`bou_group_id`),
  CONSTRAINT `fk_boundary_group2` FOREIGN KEY (`bou_group_id`) REFERENCES `boundary_group` (`bgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION)
  ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT INTO boundary (
  bou_id,
  bou_group_id,
  bou_caption,
  bou_order,
  bou_is_private,
  bou_is_suggestion,
  bou_icon,
  bou_sort_by
)
SELECT
  bou_id,
  bou_group_id,
  bou_caption,
  bou_order,
  bou_is_private,
  bou_is_suggestion,
  bou_icon,
  bou_sort_by
FROM boundary_version;

ALTER TABLE `boundary_version`
DROP FOREIGN KEY `fk_boundary_geography`,
DROP FOREIGN KEY `fk_metadata_boundary`,
DROP FOREIGN KEY `fk_boundary_group`;

ALTER TABLE `boundary_version`
DROP COLUMN `bou_is_private`,
DROP COLUMN `bou_order`,
DROP COLUMN `bou_icon`,
DROP COLUMN `bou_sort_by`,
DROP COLUMN `bou_is_suggestion`,
DROP COLUMN `bou_group_id`;

ALTER TABLE `boundary_version`
ADD COLUMN `bvr_boundary_id` INT NULL AFTER `bvr_caption`;

ALTER TABLE `boundary_version`
CHANGE COLUMN `bou_id` `bvr_id` INT(11) NOT NULL AUTO_INCREMENT ,
CHANGE COLUMN `bou_geography_id` `bvr_geography_id` INT(11) NULL DEFAULT NULL ,
CHANGE COLUMN `bou_metadata_id` `bvr_metadata_id` INT(11) NULL DEFAULT NULL COMMENT 'Metadatos del límite' ,
CHANGE COLUMN `bou_caption` `bvr_caption` VARCHAR(20) NOT NULL COMMENT 'Nombre a mostrar del límite.';

ALTER TABLE `boundary_version`
DROP INDEX `fw_boundary_group_idx` ;

ALTER TABLE `boundary_version`
ADD CONSTRAINT `fk_boundary_geography`
  FOREIGN KEY (`bvr_geography_id`)
  REFERENCES `geography` (`geo_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_boundary`
  FOREIGN KEY (`bvr_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

update boundary_version set bvr_boundary_id = bvr_id;

update boundary_version set bvr_caption = '2010' where bvr_id IN (1, 4, 9, 11); -- Provincias, Departamentos, Aglomerados, Localidades
update boundary_version set bvr_caption = '2017' where bvr_id = 2; -- Municipios
update boundary_version set bvr_caption = '2018' where bvr_id IN (3, 8); -- Regiones, Códigos postales
update boundary_version set bvr_caption = '2020' where bvr_id  IN (6, 10, 14, 15, 16, 17, 18); -- Regiones sanitarias, barrios, Climas, eco-regiones, cuencas, climas agrupados, sistemas de cuencas


ALTER TABLE `boundary_version`
CHANGE COLUMN `bvr_boundary_id` `bvr_boundary_id` INT(11) NOT NULL ,
CHANGE COLUMN `bvr_caption` `bvr_caption` VARCHAR(20) NOT NULL ;

ALTER TABLE `boundary_version`
ADD CONSTRAINT `fk_boundary`
  FOREIGN KEY (`bvr_boundary_id`)
  REFERENCES `boundary` (`bou_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `boundary_clipping_region`
DROP FOREIGN KEY `fk_boundary_relat`;
ALTER TABLE `boundary_clipping_region`
CHANGE COLUMN `bcr_boundary_id` `bcr_boundary_version_id` INT(11) NOT NULL COMMENT 'Límite.' ;
ALTER TABLE `boundary_clipping_region`
ADD CONSTRAINT `fk_boundary_relat`
  FOREIGN KEY (`bcr_boundary_version_id`)
  REFERENCES `boundary_version` (`bvr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


ALTER TABLE `snapshot_boundary_item`
ADD COLUMN `biw_boundary_version_id` INT NULL AFTER `biw_id`, RENAME TO  `snapshot_boundary_version_item` ;

update  `snapshot_boundary_version_item` set biw_boundary_version_id = biw_boundary_id;

ALTER TABLE `snapshot_boundary_version_item`
CHANGE COLUMN `biw_boundary_version_id` `biw_boundary_version_id` INT(11) NOT NULL ;

ALTER TABLE `snapshot_boundary_version_item`
DROP INDEX `ix_cai_b_id` ,
ADD INDEX `ix_cai_b_id` (`biw_boundary_id` ASC, `biw_clipping_region_item_id` ASC),
ADD UNIQUE INDEX `ix_ver` (`biw_boundary_version_id` ASC, `biw_clipping_region_item_id` ASC);
;

ALTER TABLE `boundary_clipping_region`
RENAME TO  `boundary_version_clipping_region` ;

UPDATE metadata
JOIN boundary_version ON bvr_metadata_id = met_id
SET met_title = CONCAT(met_title, ', ', bvr_caption);

UPDATE metadata
join clipping_region on clr_metadata_id = met_id
join boundary_version_clipping_region on bcr_clipping_region_id = clr_id
join boundary_version on bcr_boundary_version_id = bvr_id
SET met_title = CONCAT(met_title, ', ', bvr_caption);

UPDATE version SET ver_value = '124' WHERE ver_name = 'DB';
