ALTER TABLE `snapshot_shape_dataset_item`
DROP COLUMN `sdi_geometry_r5`,
DROP COLUMN `sdi_geometry_r4`,
DROP COLUMN `sdi_geometry_r3`,
DROP COLUMN `sdi_geometry_r2`,
DROP COLUMN `sdi_geometry_r1`,
ADD COLUMN `sdi_centroid` POINT NULL AFTER `sdi_geometry`,
CHANGE COLUMN `sdi_geometry_r6` `sdi_geometry` GEOMETRY NOT NULL ,
DROP INDEX `geor5` ,
DROP INDEX `geor4` ,
DROP INDEX `geor3` ,
DROP INDEX `geor2` ,
DROP INDEX `geor1` ;
;

UPDATE snapshot_shape_dataset_item SET sdi_centroid = ST_centroid(sdi_geometry);

UPDATE version SET ver_value = '046' WHERE ver_name = 'DB';