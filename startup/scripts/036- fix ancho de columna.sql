ALTER TABLE `snapshot_metric_version` CHANGE `mvw_caption` `mvw_caption` VARCHAR(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;

UPDATE version SET ver_value = '035' WHERE ver_name = 'DB';

