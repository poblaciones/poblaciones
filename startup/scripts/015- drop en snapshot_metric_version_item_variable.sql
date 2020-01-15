ALTER TABLE `snapshot_metric_version_item_variable` DROP INDEX `ix_liv_envelope_rich`;

ALTER TABLE `snapshot_metric_version_item_variable` DROP `miv_rich_envelope`;

ALTER TABLE `variable_value_label` ADD UNIQUE `variableValorPub` (`vvl_variable_id`, `vvl_value`);

UPDATE version SET ver_value = '015' WHERE ver_name = 'DB';

