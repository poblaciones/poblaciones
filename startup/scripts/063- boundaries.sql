

CREATE TABLE `boundary_group` (
  `bgr_id` int(11) NOT NULL,
  `bgr_caption` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de límites.',
  `bgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
ALTER TABLE `boundary_group`
  ADD PRIMARY KEY (`bgr_id`);
ALTER TABLE `boundary_group`
  MODIFY `bgr_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;


INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Políticos', '1');
INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Administrativos', '2');
INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Sociales', '3');
INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Culturales', '4');
INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Naturales', '5');
INSERT INTO `boundary_group` (`bgr_caption`, `bgr_order`) VALUES ('Otros', '6');

CREATE TABLE `boundary` (
  `bou_id` int(11) NOT NULL,
  `bou_group_id` INT(11) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Grupo de límites al que pertenece.',
  `bou_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del límite.',
  `bou_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `bou_visible` tinyint(1) DEFAULT 1 COMMENT 'Visibilidad'

) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
ALTER TABLE `boundary`
  ADD PRIMARY KEY (`bou_id`);
ALTER TABLE `boundary`
  MODIFY `bou_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `boundary`
ADD INDEX `fw_boundary_group_idx` (`bou_group_id` ASC);
;
ALTER TABLE `boundary`
ADD CONSTRAINT `fw_boundary_group`
  FOREIGN KEY (`bou_group_id`)
  REFERENCES `boundary_group` (`bgr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

CREATE TABLE `boundary_clipping_region` (
  `bcr_id` INT NOT NULL AUTO_INCREMENT,
  `bcr_boundary_id` INT NOT NULL COMMENT 'Límite.',
  `bcr_clipping_region_id` INT NOT NULL COMMENT 'Región de clipping',
  PRIMARY KEY (`bcr_id`),
  INDEX `fw_boundary_relat_idx` (`bcr_boundary_id` ASC),
  INDEX `fk_boundary_clipping_idx` (`bcr_clipping_region_id` ASC),
  CONSTRAINT `fk_boundary_relat`
    FOREIGN KEY (`bcr_boundary_id`)
    REFERENCES `boundary` (`bou_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_boundary_clipping`
    FOREIGN KEY (`bcr_clipping_region_id`)
    REFERENCES `clipping_region` (`clr_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);


INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('1', 'Provincias');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('1', 'Municipios');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Regiones');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Departamentos');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Distritos escolares (CABA)');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Regiones y zonas sanitarias');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Circuitos electorales');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('2', 'Códigos postales (4 dígitos)');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('3', 'Aglomerados');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('3 ', 'Barrios');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('3', 'Localidades');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('4', 'Pueblos originarios');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('4', 'Zonas lingüisticas');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('5', 'Climas');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('5', 'Eco-regiones');
INSERT INTO `boundary` (`bou_group_id`, `bou_caption`) VALUES ('5', 'Cuencas y regiones hídricas');

UPDATE `boundary` SET `bou_order` = '1' WHERE (`bou_id` = '1');
UPDATE `boundary` SET `bou_order` = '2' WHERE (`bou_id` = '2');
UPDATE `boundary` SET `bou_order` = '1' WHERE (`bou_id` = '3');
UPDATE `boundary` SET `bou_order` = '2' WHERE (`bou_id` = '4');
UPDATE `boundary` SET `bou_order` = '3' WHERE (`bou_id` = '5');
UPDATE `boundary` SET `bou_order` = '4' WHERE (`bou_id` = '6');
UPDATE `boundary` SET `bou_order` = '5' WHERE (`bou_id` = '7');
UPDATE `boundary` SET `bou_order` = '6' WHERE (`bou_id` = '8');
UPDATE `boundary` SET `bou_order` = '1' WHERE (`bou_id` = '9');
UPDATE `boundary` SET `bou_order` = '2' WHERE (`bou_id` = '10');
UPDATE `boundary` SET `bou_order` = '3' WHERE (`bou_id` = '11');
UPDATE `boundary` SET `bou_order` = '1' WHERE (`bou_id` = '12');
UPDATE `boundary` SET `bou_order` = '2' WHERE (`bou_id` = '13');
UPDATE `boundary` SET `bou_order` = '1' WHERE (`bou_id` = '14');
UPDATE `boundary` SET `bou_order` = '2' WHERE (`bou_id` = '15');
UPDATE `boundary` SET `bou_order` = '3' WHERE (`bou_id` = '16');

ALTER TABLE `boundary_clipping_region`
ADD UNIQUE INDEX `fw_bound_clip_unique` (`bcr_boundary_id` ASC, `bcr_clipping_region_id` ASC);
;


insert into boundary_clipping_region
(bcr_boundary_id, bcr_clipping_region_id)
values ((select bou_id from boundary where bou_caption = 'Municipios'),
(select clr_id from clipping_region where clr_caption = 'Municipios / Departamentos'));

insert into boundary_clipping_region
(bcr_boundary_id, bcr_clipping_region_id)
values ((select bou_id from boundary where bou_caption = 'Departamentos'),
(select clr_id from clipping_region where clr_caption = 'Municipios / Departamentos'));


insert into boundary_clipping_region
(bcr_boundary_id, bcr_clipping_region_id)
values ((select bou_id from boundary where bou_caption = 'Departamentos'),
(select clr_id from clipping_region where clr_caption = 'Comunas / Departamentos'));


insert into boundary_clipping_region
(bcr_boundary_id, bcr_clipping_region_id)
select (select bou_id from boundary where bou_caption = clr_caption), clr_id
from clipping_region where clr_caption in (select bou_caption from boundary);

ALTER TABLE `boundary`
DROP FOREIGN KEY `fw_boundary_group`;
ALTER TABLE `boundary`
ADD COLUMN `bou_metadata_id` INT NULL COMMENT 'Metadatos del límite' AFTER `bou_group_id`,
ADD INDEX `fk_metadata_boundary_idx` (`bou_metadata_id` ASC);
;
ALTER TABLE `boundary`
ADD CONSTRAINT `fk_boundary_group`
  FOREIGN KEY (`bou_group_id`)
  REFERENCES `boundary_group` (`bgr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_boundary`
  FOREIGN KEY (`bou_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

INSERT INTO `version` (`ver_name`, `ver_value`) VALUES ('BOUNDARY_VIEW', '1');

CREATE TABLE `snapshot_boundary_item` (
  `biw_id` int(11) NOT NULL AUTO_INCREMENT,
  `biw_boundary_id` int(11) NOT NULL COMMENT 'Límite al que pertenece el ítem (ej. Catamarca puede pertenecer a \r\n\r\nProvincias).',
  `biw_clipping_region_item_id` int(11) NOT NULL,
  `biw_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `biw_centroid` point NOT NULL,
  `biw_geometry_r1` geometry NOT NULL,
  PRIMARY KEY (`biw_id`),
  UNIQUE KEY `ix_cai_b_id` (`biw_boundary_id`,`biw_clipping_region_item_id`),
  SPATIAL KEY `ix_g_b_1` (`biw_geometry_r1`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

UPDATE `boundary_group` SET `bgr_caption` = 'Límites políticos' WHERE (`bgr_id` = '1');
UPDATE `boundary_group` SET `bgr_caption` = 'Áreas administrativas' WHERE (`bgr_id` = '2');
UPDATE `boundary_group` SET `bgr_caption` = 'Regiones naturales' WHERE (`bgr_id` = '5');
UPDATE `boundary_group` SET `bgr_caption` = 'Zonas culturales' WHERE (`bgr_id` = '4');
UPDATE `boundary_group` SET `bgr_caption` = 'Conglomerados' WHERE (`bgr_id` = '3');

ALTER TABLE `boundary`
ADD COLUMN `bou_geography_id` INT(11) NULL AFTER `bou_group_id`,
ADD INDEX `fk_boundary_geography_idx` (`bou_geography_id` ASC);
;
ALTER TABLE `boundary`
ADD CONSTRAINT `fk_boundary_geography`
  FOREIGN KEY (`bou_geography_id`)
  REFERENCES `geography` (`geo_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


UPDATE version SET ver_value = '063' WHERE ver_name = 'DB';