ALTER TABLE `snapshot_lookup_clipping_region_item`
ADD COLUMN `clc_code` VARCHAR(20) NULL COMMENT 'Código del item' AFTER `clc_caption`,
DROP INDEX `ix_lookup_caption` ,
ADD FULLTEXT INDEX `ix_lookup_caption` (`clc_caption`, `clc_tooltip`, `clc_full_parent`, `clc_code`);
;

ALTER TABLE `clipping_region`
ADD COLUMN `clr_index_code` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se indexa el código de los elementos.' AFTER `clr_field_code_name`;


update clipping_region SET clr_index_code = 1 WHERE clr_caption in ('Municipios / Departamentos', 'Departamentos', 'Provincias', 'Distritos', 'Comunas / Departamentos');

UPDATE version SET ver_value = '070' WHERE ver_name = 'DB';