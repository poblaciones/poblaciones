ALTER TABLE `snapshot_metric_version_item_variable` DROP INDEX `ix_layer_version_item_variable_view_caritem`, ADD INDEX `ix_layer_version_item_variable_view_caritem` (`miv_metric_version_id`, `miv_geography_id`) USING BTREE;

ALTER TABLE `snapshot_metric_version_item_variable` ADD SPATIAL `ix_envelope` (`miv_envelope`);

UPDATE version SET ver_value = '017' WHERE ver_name = 'DB';