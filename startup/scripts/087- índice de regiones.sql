ALTER TABLE `snapshot_lookup_clipping_region_item`
ADD FULLTEXT INDEX `ix_lookup_caption_only` (`clc_caption`);
;

UPDATE version SET ver_value = '087' WHERE ver_name = 'DB';