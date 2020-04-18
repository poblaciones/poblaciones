ALTER TABLE `draft_metadata` ADD `met_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del emento' AFTER `met_contact_id`;

ALTER TABLE `draft_metric_version_level` ADD `mvl_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel' AFTER `mvl_dataset_id`;


-- Calcula los extents de lo preexistente (si tarda demasiado, poner rangos para dat_work_id)
update metric_version_level
JOIN dataset ON dat_id = mvl_dataset_id
set mvl_extents =
 (SELECT Envelope(LineString(
POINT(Min(X(PointN(ExteriorRing(miv_envelope), 1))),
min(Y(PointN(ExteriorRing(miv_envelope), 1)))),
POINT(Max(X(PointN(ExteriorRing(miv_envelope), 3))),
Max(Y(PointN(ExteriorRing(miv_envelope), 3))))))
FROM  snapshot_metric_version_item_variable
WHERE miv_metric_version_id = mvl_metric_version_id AND miv_geography_id = dat_geography_id)
WHERE mvl_extents is null;

update metadata
		JOIN work ON wrk_metadata_id = met_id
		JOIN dataset ON wrk_id = dat_work_id
		set met_extents =
		 (SELECT
			Envelope(LineString(
			POINT(Min(X(PointN(ExteriorRing(mvl_extents), 1))),
			min(Y(PointN(ExteriorRing(mvl_extents), 1)))),
			POINT(Max(X(PointN(ExteriorRing(mvl_extents), 3))),
			Max(Y(PointN(ExteriorRing(mvl_extents), 3))))))
			FROM  metric_version_level
			WHERE dat_id = mvl_dataset_id);


update draft_metadata SET draft_metadata.met_extents = (
            select metadata.met_extents from metadata WHERE draft_metadata.met_id * 100 + 1 = metadata.met_id);


update draft_metric_version_level SET draft_metric_version_level.mvl_extents = (
            select metric_version_level.mvl_extents from metric_version_level WHERE draft_metric_version_level.mvl_id * 100 + 1 = metric_version_level.mvl_id);


UPDATE version SET ver_value = '025' WHERE ver_name = 'DB';