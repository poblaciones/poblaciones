ALTER TABLE `dataset`
ADD COLUMN `dat_skip_empty_fields` TINYINT(1) NOT NULL DEFAULT '0' AFTER `dat_show_info`;
ALTER TABLE `draft_dataset`
ADD COLUMN `dat_skip_empty_fields` TINYINT(1) NOT NULL DEFAULT '0' AFTER `dat_show_info`;


UPDATE version SET ver_value = '098' WHERE ver_name = 'DB';