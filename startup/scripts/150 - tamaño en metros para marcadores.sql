ALTER TABLE `draft_dataset_marker`
ADD COLUMN `dmk_fixed_size` FLOAT NULL DEFAULT '100' COMMENT 'Tamaño en metros de los marcados definidos con tamaño fijo (en metros).' AFTER `dmk_image`,
CHANGE COLUMN `dmk_size` `dmk_size` CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande. F: Fijo (en metros)' ,
CHANGE COLUMN `dmk_frame` `dmk_frame` CHAR(1) NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.H: Hexagonal' ;

ALTER TABLE `dataset_marker`
ADD COLUMN `dmk_fixed_size` FLOAT NULL DEFAULT '100' COMMENT 'Tamaño en metros de los marcados definidos con tamaño fijo (en metros).' AFTER `dmk_image`,
CHANGE COLUMN `dmk_size` `dmk_size` CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande. F: Fijo (en metros)' ,
CHANGE COLUMN `dmk_frame` `dmk_frame` CHAR(1) NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.H: Hexagonal' ;

ALTER TABLE dataset_marker
    ADD COLUMN dmk_source_central_meridian FLOAT NULL
    COMMENT 'Meridiano central (grados) del CRS en que se generó la grilla de tamaño fijo; nulo = sin corrección de rotación';

ALTER TABLE draft_dataset_marker
    ADD COLUMN dmk_source_central_meridian FLOAT NULL
    COMMENT 'Meridiano central (grados) del CRS en que se generó la grilla de tamaño fijo; nulo = sin corrección de rotación';

UPDATE version SET ver_value = '150' WHERE ver_name = 'DB';