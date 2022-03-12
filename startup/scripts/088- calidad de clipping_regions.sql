ALTER TABLE `clipping_region_item`
ADD `cli_geometry_r2` GEOMETRY NOT NULL AFTER `cli_geometry_r1`,
ADD `cli_geometry_r3` GEOMETRY NOT NULL AFTER `cli_geometry_r2`;

ALTER TABLE snapshot_boundary_item
ADD `biw_geometry_r2` GEOMETRY NOT NULL AFTER `biw_geometry_r1`,
ADD `biw_geometry_r3` GEOMETRY NOT NULL AFTER `biw_geometry_r2`;

UPDATE version SET ver_value = '088' WHERE ver_name = 'DB';