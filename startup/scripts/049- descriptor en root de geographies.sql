ALTER TABLE `geography`
ADD COLUMN `geo_root_caption` VARCHAR(100) NULL DEFAULT NULL AFTER `geo_caption`;

UPDATE geography SET `geo_root_caption` = 'Censo 2010 (INDEC)' WHERE (`geo_id` = '85');
UPDATE `geography` SET `geo_root_caption` = 'Censo 2001 (INDEC)' WHERE (`geo_id` = '88');
UPDATE `geography` SET `geo_root_caption` = 'Censo 1991 (INDEC)' WHERE (`geo_id` = '91');

UPDATE version SET ver_value = '049' WHERE ver_name = 'DB';