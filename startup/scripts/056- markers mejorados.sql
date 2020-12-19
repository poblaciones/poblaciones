CREATE TABLE `dataset_marker` (
  `dmk_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador.',
  `dmk_type` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` CHAR(1) NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` CHAR(1) NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` CHAR(1) NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` INT NULL COMMENT 'Columna conteniendo la columna para los marcadores basado en variable (columna).',
  `dmk_symbol` VARCHAR(4096) NULL COMMENT 'Valor seleccionado para los marcadores con ícono fijo.',
  `dmk_text` VARCHAR(4096) NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` VARCHAR(4096) NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.',
  PRIMARY KEY (`dmk_id`),
  INDEX `fp_dataset_marker_column1_idx` (`dmk_content_column_id` ASC),
  CONSTRAINT `fp_dataset_marker_column1`
    FOREIGN KEY (`dmk_content_column_id`)
    REFERENCES `dataset_column` (`dco_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT);

CREATE TABLE `draft_dataset_marker` (
  `dmk_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador.',
  `dmk_type` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` CHAR(1) NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` CHAR(1) NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` CHAR(1) NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` INT NULL COMMENT 'Columna conteniendo la columna para los marcadores basados en variable (columna).',
  `dmk_symbol` VARCHAR(4096) NULL COMMENT 'Valor seleccionado para los marcadores con ícono fijo.',
  `dmk_text` VARCHAR(4) NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` VARCHAR(4096) NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.',
  PRIMARY KEY (`dmk_id`),
  INDEX `fp_draft_dataset_marker_column1_idx` (`dmk_content_column_id` ASC),
  CONSTRAINT `fp_draft_dataset_marker_column1`
    FOREIGN KEY (`dmk_content_column_id`)
    REFERENCES `draft_dataset_column` (`dco_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT);

-- Crea los valores
insert into draft_dataset_marker (dmk_type)
select 'N' FROM draft_dataset;

insert into dataset_marker (dmk_type)
select 'N' FROM dataset;

update dataset_marker set dmk_id = dmk_id  * 100000;
update dataset_marker set dmk_id = dmk_id  / 1000;

-- Crea las columnas en dataset y draft_dataset
ALTER TABLE `dataset`
ADD COLUMN `dat_marker_id` INT NULL COMMENT 'Descripción de las características de los marcadores.' AFTER `dat_texture_id`,
ADD INDEX `fk_dataset_marker_idx` (`dat_marker_id` ASC);
;
ALTER TABLE `dataset`
ADD CONSTRAINT `fk_dataset_marker`
  FOREIGN KEY (`dat_marker_id`)
  REFERENCES `dataset_marker` (`dmk_id`)
  ON DELETE CASCADE
  ON UPDATE RESTRICT;

ALTER TABLE `draft_dataset`
ADD COLUMN `dat_marker_id` INT NULL COMMENT 'Descripción de las características de los marcadores.' AFTER `dat_texture_id`,
ADD INDEX `fk_draft_dataset_marker_idx` (`dat_marker_id` ASC);
;
ALTER TABLE `draft_dataset`
ADD CONSTRAINT `fk_draft_dataset_marker`
  FOREIGN KEY (`dat_marker_id`)
  REFERENCES `draft_dataset_marker` (`dmk_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;

-- Les actualiza los valores a esas columnas
create table matchRows(c1 int, c2 int);
insert into matchRows
SELECT @rowid:=@rowid+1 as rowid, dat_id
FROM draft_dataset, (SELECT @rowid:=0) as init
ORDER BY dat_id;

update draft_dataset join matchRows on dat_id = c2
set dat_marker_id = c1 ;
drop table matchRows;

create table matchRows(c1 int, c2 int);
insert into matchRows
SELECT @rowid:=@rowid+1* 100 as rowid, dat_id
FROM dataset, (SELECT @rowid:=0) as init
ORDER BY dat_id;

update dataset join matchRows on dat_id = c2
set dat_marker_id = c1 ;
drop table matchRows;

-- Saca el nullable
ALTER TABLE dataset MODIFY COLUMN dat_marker_id INT NOT NULL;
ALTER TABLE draft_dataset MODIFY COLUMN dat_marker_id INT NOT NULL;

-- Muda los valores a los child
update dataset_marker join dataset on dat_marker_id = dmk_id
set dmk_size = 'S',
dmk_type = (case when dat_symbol is null then 'N' ELSE 'I' end),
dmk_frame = 'P',
dmk_auto_scale = dat_scale_symbol,
dmk_symbol = dat_symbol;

update draft_dataset_marker join draft_dataset on dat_marker_id = dmk_id
set dmk_size = 'S',
dmk_type = (case when dat_symbol is null then 'N' ELSE 'I' end),
dmk_frame = 'P',
dmk_auto_scale = dat_scale_symbol,
dmk_symbol = dat_symbol;

-- Saca las columnas del parent
ALTER TABLE `dataset`
DROP COLUMN `dat_scale_symbol`,
DROP COLUMN `dat_symbol`;

ALTER TABLE `draft_dataset`
DROP COLUMN `dat_scale_symbol`,
DROP COLUMN `dat_symbol`;

UPDATE version SET ver_value = '056' WHERE ver_name = 'DB';