DROP function IF EXISTS `EllipseContainsMultiPolygon`;
DELIMITER $$
CREATE FUNCTION `EllipseContainsMultiPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE g GEOMETRY;

SET e = PolygonEnvelope(ele);
IF EllipseContains(center, radius, ST_PointN(e,1)) AND  EllipseContains(center, radius, ST_PointN(e,2)) AND  EllipseContains(center, radius, ST_PointN(e,3)) AND  EllipseContains(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;

  SET n = 0;
  SET c = NumGeometries(ele);

  count_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    IF ST_GeometryType(g) = 'POLYGON' THEN
      IF EllipseContainsPolygon(center, radius, ST_ExteriorRing(g)) = 0 THEN
        RETURN 0;
      END IF;
    ELSEIF EllipseContainsPolygon(center, radius, g) = 0 THEN
        RETURN 0;
    END IF;

    IF n >= c THEN
      LEAVE count_loop;
    END IF;

  END LOOP;

RETURN 1;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CircleContainsSphereGeometry`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
BEGIN
  DECLARE t VARCHAR(12);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
  RETURN CircleContainsSpherePoint(center, radius, ele);
END IF;

IF t = 'LINESTRING'  THEN
  RETURN CircleContainsSpherePolygon(center, radius, ele);
END IF;
IF t = 'POLYGON' THEN
  RETURN CircleContainsSpherePolygon(center, radius, ST_ExteriorRing(ele));
END IF;
IF t = 'MULTIPOLYGON' OR t = 'MULTILINESTRING' THEN
  RETURN CircleContainsSphereMultiPolygon(center, radius, ele);
END IF;

RETURN 2;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CircleContainsSphereMultiPolygon`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE g GEOMETRY;

SET e = PolygonEnvelope(ele);
IF CircleContainsSpherePoint(center, radius, ST_PointN(e,1)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,2)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,3)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;

  SET n = 0;
  SET c = ST_NumGeometries(ele);

  count_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    IF ST_GeometryType(g) = 'POLYGON' THEN
      IF CircleContainsSpherePolygon(center, radius, ST_ExteriorRing(g)) = 0 THEN
        RETURN 0;
      END IF;
    ELSEIF CircleContainsSpherePolygon(center, radius, g) = 0 THEN
        RETURN 0;
    END IF;

    IF n >= c THEN
      LEAVE count_loop;
    END IF;

  END LOOP;

RETURN 1;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CircleContainsSpherePoint`(
		center POINT, sizeM DOUBLE, p POINT) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	RETURN DistanceSphere(center, p) <= sizeM;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CoverageSnapshotGeography`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id
		FROM tmp_calculate_metric
        JOIN geography_item ON gei_id = sna_feature_id

		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)
           AND CircleContainsSphereGeometry(p, sizeM,
                coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1));
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CircleContainsSpherePolygon`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;

SET e = PolygonEnvelope(ele);
if ele is null THEN
  return 0;
end IF;
IF CircleContainsSpherePoint(center, radius, ST_PointN(e,1)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,2)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,3)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;

  SET n = 0;
  SET c = ST_NumPoints(ele);

  count_loop: LOOP
    SET n = n + 1;

  IF CircleContainsSpherePoint(center, radius, ST_PointN(ele,n)) = 0 THEN
    RETURN 0;
  END IF;

  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN 1;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CoverageSnapshotPoint`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id
		FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)
           AND CircleContainsSpherePoint(p, sizeM, sna_location);
	RETURN ROW_COUNT();
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `CoverageSnapshotShape`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	INSERT INTO tmp_calculate_metric_affected(id, ana_id)
        SELECT id, sna_id
		FROM tmp_calculate_metric
        JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id

		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)
           AND CircleContainsSphereGeometry(p, sizeM,
                coalesce(sdi_geometry_r3, sdi_geometry_r2, sdi_geometry_r1));
	RETURN ROW_COUNT();
END$$
DELIMITER ;



UPDATE version SET ver_value = '080' WHERE ver_name = 'DB';