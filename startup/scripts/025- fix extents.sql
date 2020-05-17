ALTER TABLE `draft_metadata` ADD `met_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del emento' AFTER `met_contact_id`;

ALTER TABLE `draft_metric_version_level` ADD `mvl_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel' AFTER `mvl_dataset_id`;


-- Calcula los extents de lo preexistente (si tarda demasiado, poner rangos para dat_work_id)
UPDATE metric_version_level
JOIN dataset ON dat_id = mvl_dataset_id
SET mvl_extents =
 (SELECT ST_Envelope(LineString(
POINT(MIN(ST_X(ST_POINTN(ST_ExteriorRing(miv_envelope), 1))),
MIN(ST_Y(ST_POINTN(ST_ExteriorRing(miv_envelope), 1)))),
POINT(MAX(ST_X(ST_POINTN(ST_ExteriorRing(miv_envelope), 3))),
MAX(ST_Y(ST_POINTN(ST_ExteriorRing(miv_envelope), 3))))))
FROM  snapshot_metric_version_item_variable
WHERE miv_metric_version_id = mvl_metric_version_id AND miv_geography_id = dat_geography_id)
WHERE mvl_extents IS NULL;

UPDATE metadata
		JOIN work ON wrk_metadata_id = met_id
		JOIN dataset ON wrk_id = dat_work_id
		SET met_extents =
		 (SELECT
			ST_Envelope(LineString(
			POINT(MIN(ST_X(ST_POINTN(ST_ExteriorRing(mvl_extents), 1))),
			MIN(ST_Y(ST_POINTN(ST_ExteriorRing(mvl_extents), 1)))),
			POINT(MAX(ST_X(ST_POINTN(ST_ExteriorRing(mvl_extents), 3))),
			MAX(ST_Y(ST_POINTN(ST_ExteriorRing(mvl_extents), 3))))))
			FROM  metric_version_level
			WHERE dat_id = mvl_dataset_id);


UPDATE draft_metadata SET draft_metadata.met_extents = (
            SELECT metadata.met_extents FROM metadata WHERE draft_metadata.met_id * 100 + 1 = metadata.met_id);


UPDATE draft_metric_version_level SET draft_metric_version_level.mvl_extents = (
            select metric_version_level.mvl_extents from metric_version_level WHERE draft_metric_version_level.mvl_id * 100 + 1 = metric_version_level.mvl_id);


UPDATE version SET ver_value = '025' WHERE ver_name = 'DB';
