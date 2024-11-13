ALTER TABLE `geography`
ADD COLUMN `geo_caption_short` VARCHAR(100) NOT NULL DEFAULT '' AFTER `geo_caption`;

UPDATE `geography` SET `geo_caption` = 'Departamentos/Dist.Esc.' WHERE (`geo_id` = '113');

update `geography` SET `geo_caption_short`  =  replace( replace(replace(`geo_caption`, 'Departamentos/Circ.Elec.', 'Departamentos'), 'Departamentos/Dist.Esc.', 'Departamentos'), 'Departamentos/Comunas', 'Departamentos');

UPDATE version SET ver_value = '114' WHERE ver_name = 'DB';

