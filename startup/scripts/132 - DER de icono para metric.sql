ALTER TABLE `draft_metric`
ADD COLUMN `mtr_icon` VARCHAR(50) NULL AFTER `mtr_tag`;

ALTER TABLE `metric`
ADD COLUMN `mtr_icon` VARCHAR(50) NULL AFTER `mtr_tag`;

ALTER TABLE `snapshot_metric_version`
ADD COLUMN `mvw_metric_icon` VARCHAR(150) NULL AFTER `mvw_metric_id`;





UPDATE version SET ver_value = '132' WHERE ver_name = 'DB';
