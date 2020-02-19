ALTER TABLE `snapshot_metric_version_item_variable` ADD `miv_rich_envelope` POLYGON NULL COMMENT 'Envolvente con datos de versión y geografía para acceso por índice' AFTER `miv_envelope`;

UPDATE snapshot_metric_version_item_variable SET miv_rich_envelope = RichEnvelope(miv_envelope, miv_metric_version_id, miv_geography_id);


ALTER TABLE `snapshot_metric_version_item_variable` CHANGE `miv_rich_envelope` `miv_rich_envelope` POLYGON NOT NULL COMMENT 'Envolvente con datos de versión y geografía para acceso por índice';

ALTER TABLE `snapshot_metric_version_item_variable`
  ADD SPATIAL KEY `ix_rich_envelope` (`miv_rich_envelope`);

UPDATE version SET ver_value = '019' WHERE ver_name = 'DB';