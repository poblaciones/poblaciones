ALTER TABLE `draft_institution` ADD `ins_watermark_id` INT NULL COMMENT 'Imagen de marca de agua institucional' AFTER `ins_public_data_editor`;

ALTER TABLE `institution` ADD `ins_watermark_id` INT NULL COMMENT 'Imagen de marca de agua institucional' AFTER `ins_public_data_editor`;


ALTER TABLE `draft_institution` ADD CONSTRAINT `fw_draft_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `draft_file`(`fil_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `institution` ADD CONSTRAINT `fw_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `file`(`fil_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `draft_dataset` ADD `dat_scale_symbol` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Indica si los markers en el mapa deben variar de tamaño al cambiar el zoom' AFTER `dat_symbol`;

ALTER TABLE `dataset` ADD `dat_scale_symbol` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Indica si los markers en el mapa deben variar de tamaño al cambiar el zoom' AFTER `dat_symbol`;

UPDATE version SET ver_value = '038' WHERE ver_name = 'DB';

