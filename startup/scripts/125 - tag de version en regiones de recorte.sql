ALTER TABLE `clipping_region`
ADD COLUMN `clr_version` VARCHAR(100) NULL AFTER `clr_caption`;


UPDATE version SET ver_value = '125' WHERE ver_name = 'DB';
