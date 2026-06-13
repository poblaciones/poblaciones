ALTER TABLE `boundary`
ADD COLUMN `bou_gropup_by_parent` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permite indicar si al mostrarlas para selección sus items deben filtrarse por el nivel padre de la jerarquía de clipping_region' AFTER `bou_sort_by`;


UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '2');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '4');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '6');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '7');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '10');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '11');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '19');
UPDATE `boundary` SET `bou_gropup_by_parent` = '1' WHERE (`bou_id` = '21');

ALTER TABLE `boundary_group`
ADD UNIQUE INDEX `bgrp_unique_caption` (`bgr_caption` ASC);
;


UPDATE version SET ver_value = '137' WHERE ver_name = 'DB';
