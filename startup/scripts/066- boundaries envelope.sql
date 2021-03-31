truncate table snapshot_boundary_item;

ALTER TABLE `snapshot_boundary_item`
ADD COLUMN `biw_envelope` POLYGON NOT NULL COMMENT 'Rectángulo envolvente del polígono' AFTER `biw_geometry_r1`,
ADD SPATIAL INDEX `ix_envelope` (`biw_envelope`);
;


INSERT INTO snapshot_boundary_item (`biw_boundary_id`,`biw_clipping_region_item_id`, `biw_caption`,	`biw_code`,`biw_centroid`, `biw_area_m2`,`biw_geometry_r1`, biw_envelope)

SELECT bcr_boundary_id, cli_id, cli_caption, cli_code, cli_centroid, cli_area_m2, cli_geometry_r1, PolygonEnvelope(cli_geometry_r1)
										FROM boundary_clipping_region
									INNER JOIN  boundary ON bou_id = bcr_boundary_id
									INNER JOIN  clipping_region_item ON cli_clipping_region_id = bcr_clipping_region_id;


UPDATE version SET ver_value = '066' WHERE ver_name = 'DB';