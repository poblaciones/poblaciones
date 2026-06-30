ALTER TABLE `draft_metric_version_level`
ADD UNIQUE INDEX `ix_unique_version_data_draft` (`mvl_metric_version_id` ASC, `mvl_dataset_id` ASC);
;

ALTER TABLE `metric_version_level`
ADD UNIQUE INDEX `ix_unique_version_data` (`mvl_metric_version_id` ASC, `mvl_dataset_id` ASC);
;

UPDATE version SET ver_value = '141' WHERE ver_name = 'DB';
