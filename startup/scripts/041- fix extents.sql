UPDATE metric_version_level m JOIN dataset ON
dat_id = m.mvl_dataset_id SET mvl_extents =
(SELECT d.mvl_extents FROM draft_metric_version_level d WHERE m.mvl_id = (d.mvl_id * 100 + 1))
WHERE mvl_extents  IS NULL;

UPDATE metadata
			JOIN work ON wrk_metadata_id = met_id
				JOIN dataset ON wrk_id = dat_work_id
				SET met_extents =
					(SELECT
								Envelope(LineString(
				POINT(Min(ST_X(PointN(ExteriorRing(mvl_extents), 1))),
				MIN(ST_Y(PointN(ExteriorRing(mvl_extents), 1)))),
				POINT(Max(ST_X(PointN(ExteriorRing(mvl_extents), 3))),
				MAX(ST_Y(PointN(ExteriorRing(mvl_extents), 3))))))
				FROM  metric_version_level
				WHERE dat_id = mvl_dataset_id);


UPDATE version SET ver_value = '041' WHERE ver_name = 'DB';
