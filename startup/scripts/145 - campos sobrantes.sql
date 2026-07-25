ALTER TABLE `geography`
DROP COLUMN `geo_partial_coverage`,
DROP COLUMN `geo_field_code_type`;


ALTER TABLE `snapshot_metric_version`
DROP COLUMN `mvw_partial_coverage`;

ALTER TABLE `draft_metric_version_level`
DROP COLUMN `mvl_partial_coverage`;

ALTER TABLE `metric_version_level`
DROP COLUMN `mvl_partial_coverage`;


UPDATE version SET ver_value = '145' WHERE ver_name = 'DB';