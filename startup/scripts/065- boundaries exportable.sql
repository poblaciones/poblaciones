ALTER TABLE `clipping_region_item`
CHANGE COLUMN `cli_code` `cli_code` VARCHAR(20) NOT NULL COMMENT 'Código para el ítem (ej. 020).' ,
CHANGE COLUMN `cli_caption` `cli_caption` VARCHAR(100) NOT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).' ;

ALTER TABLE `snapshot_boundary_item`
ADD COLUMN `biw_code` VARCHAR(20) NOT NULL COMMENT 'Código de la región' AFTER `biw_caption`,
CHANGE COLUMN `biw_clipping_region_item_id` `biw_clipping_region_item_id` INT(11) NOT NULL COMMENT 'Región de recorte representada por la fila' ,
CHANGE COLUMN `biw_caption` `biw_caption` VARCHAR(100) NOT NULL COMMENT 'Etiqueta de la región' ,
CHANGE COLUMN `biw_centroid` `biw_centroid` POINT NOT NULL COMMENT 'Centroide de la región de recorte' ,
CHANGE COLUMN `biw_geometry_r1` `biw_geometry_r1` GEOMETRY NOT NULL COMMENT 'Polígono de la región' ;

truncate snapshot_boundary_item;

ALTER TABLE `clipping_region_item`
ADD COLUMN `cli_area_m2` DOUBLE NULL COMMENT 'Area en m2.' AFTER `cli_centroid`;

ALTER TABLE `snapshot_boundary_item`
ADD COLUMN `biw_area_m2` DOUBLE NOT NULL COMMENT 'Area en m2.' AFTER `biw_centroid`;

update clipping_region_item
set cli_area_m2 = GeometryAreaSphere(cli_geometry);

ALTER TABLE `clipping_region_item`
CHANGE COLUMN `cli_area_m2` `cli_area_m2` DOUBLE NOT NULL COMMENT 'Area en m2.' ;

INSERT INTO snapshot_boundary_item (`biw_boundary_id`,`biw_clipping_region_item_id`, `biw_caption`,	`biw_code`,`biw_centroid`, `biw_area_m2`,`biw_geometry_r1`)

SELECT bcr_boundary_id, cli_id, cli_caption, cli_code, cli_centroid, cli_area_m2, cli_geometry_r1
										FROM boundary_clipping_region
									INNER JOIN  boundary ON bou_id = bcr_boundary_id
									INNER JOIN  clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id
									WHERE bou_visible = 1;

ALTER TABLE `boundary`
CHANGE COLUMN `bou_is_visible` `bou_is_private` TINYINT(1) NOT NULL DEFAULT '1' ;

update boundary SET bou_is_private = (bou_is_private - 1) * -1;

UPDATE version SET ver_value = '065' WHERE ver_name = 'DB';