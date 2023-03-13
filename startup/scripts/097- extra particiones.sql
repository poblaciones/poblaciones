ALTER TABLE `dataset`
ADD COLUMN `dat_partition_mandatory` TINYINT(1) NOT NULL DEFAULT '1' AFTER `dat_partition_column_id`,
ADD COLUMN `dat_partition_all_label` VARCHAR(50) NOT NULL DEFAULT 'Todos' AFTER `dat_partition_mandatory`;

ALTER TABLE `draft_dataset`
ADD COLUMN `dat_partition_mandatory` TINYINT(1) NOT NULL DEFAULT '1' AFTER `dat_partition_column_id`,
ADD COLUMN `dat_partition_all_label` VARCHAR(50) NOT NULL DEFAULT 'Todos' AFTER `dat_partition_mandatory`;

UPDATE version SET ver_value = '097' WHERE ver_name = 'DB';