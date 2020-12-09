ALTER TABLE `snapshot_lookup_clipping_region_item`
DROP INDEX `ix_lookup_caption` ,
ADD FULLTEXT INDEX `ix_lookup_caption` (`clc_caption`, `clc_tooltip`, `clc_full_parent`);
;

UPDATE version SET ver_value = '060' WHERE ver_name = 'DB';