ALTER TABLE `clipping_region_item`
ADD `cli_geometry_r2` GEOMETRY  NULL AFTER `cli_geometry_r1`,
ADD `cli_geometry_r3` GEOMETRY  NULL AFTER `cli_geometry_r2`;

update clipping_region_item set cli_geometry_r2 = cli_geometry_r1,
cli_geometry_r3 = cli_geometry_r1;

ALTER TABLE `clipping_region_item`
CHANGE COLUMN `cli_geometry_r2` `cli_geometry_r2` GEOMETRY NOT NULL ,
CHANGE COLUMN `cli_geometry_r3` `cli_geometry_r3` GEOMETRY NOT NULL ;


ALTER TABLE snapshot_boundary_item
ADD `biw_geometry_r2` GEOMETRY  NULL AFTER `biw_geometry_r1`,
ADD `biw_geometry_r3` GEOMETRY  NULL AFTER `biw_geometry_r2`;

update snapshot_boundary_item set biw_geometry_r2 = biw_geometry_r1,
biw_geometry_r3 = biw_geometry_r1;

ALTER TABLE `snapshot_boundary_item`
CHANGE COLUMN `biw_geometry_r2` `biw_geometry_r2` GEOMETRY NOT NULL ,
CHANGE COLUMN `biw_geometry_r3` `biw_geometry_r3` GEOMETRY NOT NULL ;


UPDATE version SET ver_value = '088' WHERE ver_name = 'DB';