RENAME TABLE `snapshot_metric_versions` TO `snapshot_metric_version`;

RENAME TABLE `draft_dataset_label` TO `draft_dataset_column_value_label`;
RENAME TABLE `dataset_label` TO `dataset_column_value_label`;

RENAME TABLE `clipping_region_geography_item` TO `clipping_region_item_geography_item`;

UPDATE version SET ver_value = '011' WHERE ver_name = 'DB';