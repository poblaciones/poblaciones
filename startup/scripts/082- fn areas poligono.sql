DROP function IF EXISTS `ContentOfSnapshotShape`;
DELIMITER $$

CREATE FUNCTION `ContentOfSnapshotShape`(sessionId VARCHAR(20),
id INT, g GEOMETRY, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
        JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
		WHERE ST_CONTAINS(g, coalesce(sdi_geometry_r3, sdi_geometry_r2, sdi_geometry_r1));
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DROP function IF EXISTS `ContentOfSnapshotGeography`;
DELIMITER $$
CREATE FUNCTION `ContentOfSnapshotGeography`(
			sessionId VARCHAR(20),
            id INT, g GEOMETRY,
            sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
        JOIN geography_item ON gei_id = sna_feature_id
        WHERE ST_CONTAINS(g, coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1));
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DROP function IF EXISTS `ContentOfSnapshotPoint`;
DELIMITER $$
CREATE FUNCTION `ContentOfSnapshotPoint`(
			sessionId VARCHAR(20),
            id INT, g GEOMETRY,
            sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_location
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
        WHERE ST_CONTAINS(g, sna_location);
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DROP function IF EXISTS `CoverageSnapshotGeography`;
DELIMITER $$
CREATE FUNCTION `CoverageSnapshotGeography`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)) as t
        JOIN geography_item ON gei_id = sna_feature_id
		WHERE CircleContainsSphereGeometry(p, sizeM,
                coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1));
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DROP function IF EXISTS `CoverageSnapshotPoint`;
DELIMITER $$
CREATE FUNCTION `CoverageSnapshotPoint`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_location
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)) as T
		WHERE CircleContainsSpherePoint(p, sizeM, sna_location);
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DROP function IF EXISTS `CoverageSnapshotShape`;
DELIMITER $$
CREATE FUNCTION `CoverageSnapshotShape`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sdi_feature_id
		FROM tmp_calculate_metric
        WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)) as t
		JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
		WHERE CircleContainsSphereGeometry(p, sizeM,
                coalesce(sdi_geometry_r3, sdi_geometry_r2, sdi_geometry_r1));
	RETURN ROW_COUNT();
END$$

DELIMITER ;

DROP function IF EXISTS `ContentOfSnapshotShape`;

DELIMITER $$
CREATE FUNCTION `ContentOfSnapshotShape`(
sessionId VARCHAR(20),
id INT, g GEOMETRY, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
        JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
		WHERE ST_CONTAINS(g, sdi_geometry);
	RETURN ROW_COUNT();
END
$$

DELIMITER ;

DROP function IF EXISTS `CoverageSnapshotShape`;
DELIMITER $$

CREATE FUNCTION `CoverageSnapshotShape`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
		FROM tmp_calculate_metric
        WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)) as t
		JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
		WHERE CircleContainsSphereGeometry(p, sizeM, sdi_geometry);
	RETURN ROW_COUNT();
END
$$

DELIMITER ;

DROP function IF EXISTS `NearestSnapshotRangeShape`;

DELIMITER $$

CREATE FUNCTION `NearestSnapshotRangeShape`(sessionId VARCHAR(20), p POINT,
						buffer DOUBLE, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphereGeometry(p, sna_location, sdi_geometry) d
				FROM tmp_calculate_metric
                JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
				WHERE MBRCONTAINS(SquareBuffer(p, buffer), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphereGeometry(p, sna_location, sdi_geometry) LIMIT 1) as candidate WHERE d <= sizeM);
END
$$

DELIMITER ;
UPDATE version SET ver_value = '082' WHERE ver_name = 'DB';