ALTER TABLE `dataset` ADD `dat_show_info` TINYINT(1) NOT NULL DEFAULT b'1';
ALTER TABLE `draft_dataset` ADD `dat_show_info` TINYINT(1) NOT NULL DEFAULT b'1';

UPDATE version SET ver_value = '009' WHERE ver_name = 'DB';