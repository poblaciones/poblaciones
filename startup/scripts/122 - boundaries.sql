ALTER TABLE `boundary`
ADD COLUMN `bou_is_suggestion` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bou_is_private`,
ADD COLUMN `bou_icon` VARCHAR(10000) NULL AFTER `bou_is_suggestion`;

UPDATE `boundary` SET `bou_is_suggestion` = '1', `bou_icon` = 'map' WHERE (`bou_id` = '1');
UPDATE `boundary` SET `bou_is_suggestion` = '1', `bou_icon` = 'public' WHERE (`bou_id` = '3');
UPDATE `boundary` SET `bou_is_suggestion` = '1', `bou_icon` = 'location_city' WHERE (`bou_id` = '9');

ALTER TABLE `boundary`
ADD COLUMN `bou_sort_by` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Valores posibles. \'N\': Nombre, \'P\': Población, \'C\': Código.' AFTER `bou_icon`;

UPDATE `boundary` SET `bou_sort_by` = 'C' WHERE (`bou_id` = '1');
UPDATE `boundary` SET `bou_sort_by` = 'C' WHERE (`bou_id` = '3');
UPDATE `boundary` SET `bou_sort_by` = 'P' WHERE (`bou_id` = '9');

ALTER TABLE `snapshot_lookup_clipping_region_item`
CHANGE COLUMN `clc_clipping_region_item_id` `clc_clipping_region_item_id` INT(11) NOT NULL ;

ALTER TABLE `snapshot_lookup_clipping_region_item`
ADD INDEX `ix_clipping_region_item_id` (`clc_clipping_region_item_id` ASC);
;


UPDATE version SET ver_value = '122' WHERE ver_name = 'DB';

