DROP FUNCTION IF EXISTS DistanceSphere;
DROP FUNCTION IF EXISTS DistanceSphereGeometry;
DROP FUNCTION IF EXISTS NearestSnapshotRangeShape;
DROP FUNCTION IF EXISTS NearestSnapshotRangeGeography;
DROP FUNCTION IF EXISTS NearestSnapshotGeography;
DROP FUNCTION IF EXISTS NearestSnapshotShape;
DROP FUNCTION IF EXISTS NearestSnapshotRangePoint;
DROP FUNCTION IF EXISTS NearestSnapshotPoint;
DROP FUNCTION IF EXISTS MultiPolygonIsValid;
DROP FUNCTION IF EXISTS EllipseContainsMultiPolygon;

DELIMITER ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
DELIMITER ;;


DELIMITER $$
CREATE FUNCTION `DistanceSphere`(`pt1` POINT, `pt2` POINT) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	RETURN 12742000 * ASIN(SQRT(
			POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * 0.0087266472), 2)
			+ COS(ST_Y(pt1) * 0.0174532944) * COS(ST_Y(pt2)
			* 0.0174532944) * POWER(
			SIN((ST_X(pt2) - ST_X(pt1)) * 0.0087266472), 2)));
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `DistanceSphereGeometry`(`pt1` POINT, `pt2` POINT, g GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	if (ST_CONTAINS(g, pt1)) THEN
       RETURN 0;
	END IF;

	RETURN 12742000 * ASIN(SQRT(
			POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * 0.0087266472), 2)
			+ COS(ST_Y(pt1) * 0.0174532944) * COS(ST_Y(pt2)
			* 0.0174532944) * POWER(
			SIN((ST_X(pt2) - ST_X(pt1)) * 0.0087266472), 2)));
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `NearestSnapshotPoint`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	SET ret = NULL;

	IF sizeM > 1000 THEN
		SET ret = NearestSnapshotRangePoint(sessionId, p, 1000, sizeM, r);
	END IF;
	IF ret IS NULL AND sizeM > 10000 THEN
		SET ret = NearestSnapshotRangePoint(sessionId, p, 10000, sizeM, r);
	END IF;

	IF ret IS NULL THEN
		SET ret = NearestSnapshotRangePoint(sessionId, p, sizeM, sizeM, r);
	END IF;

	RETURN ret;
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `NearestSnapshotRangeShape`(sessionId VARCHAR(20), p POINT,
						buffer DOUBLE, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphereGeometry(p, sna_location,
				coalesce(sdi_geometry_r3, sdi_geometry_r2, sdi_geometry_r1)) d
				FROM tmp_calculate_metric
                JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
				WHERE MBRCONTAINS(SquareBuffer(p, buffer), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphereGeometry(p, sna_location,
                coalesce(sdi_geometry_r3,
					sdi_geometry_r2, sdi_geometry_r1)) LIMIT 1) as candidate
                WHERE d <= sizeM);
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `NearestSnapshotGeography`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	SET ret = NULL;

	IF sizeM > 1000 THEN
		SET ret = NearestSnapshotRangeGeography(sessionId, p, 1000, sizeM, r);
	END IF;
	IF ret IS NULL AND sizeM > 10000 THEN
		SET ret = NearestSnapshotRangeGeography(sessionId, p, 10000, sizeM, r);
	END IF;

	IF ret IS NULL THEN
		SET ret = NearestSnapshotRangeGeography(sessionId, p, sizeM, sizeM, r);
	END IF;

	RETURN ret;
END$$
DELIMITER ;



DELIMITER $$
CREATE FUNCTION `NearestSnapshotRangeGeography`(sessionId VARCHAR(20),
				p POINT, buffer DOUBLE, sizeM DOUBLE,r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphereGeometry(p, sna_location,
				coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)) d
				FROM tmp_calculate_metric
                JOIN geography_item ON gei_id = sna_feature_id
				WHERE MBRCONTAINS(SquareBuffer(p, buffer), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphereGeometry(p, sna_location,
                coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)) LIMIT 1) as candidate
                WHERE d <= sizeM);
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION `NearestSnapshotRangePoint`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d
				FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, 1000), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `NearestSnapshotShape`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	SET ret = NULL;

	IF sizeM > 1000 THEN
		SET ret = NearestSnapshotRangeShape(sessionId, p, 1000, sizeM, r);
	END IF;
	IF ret IS NULL AND sizeM > 10000 THEN
		SET ret = NearestSnapshotRangeShape(sessionId, p, 10000, sizeM, r);
	END IF;

	IF ret IS NULL THEN
		SET ret = NearestSnapshotRangeShape(sessionId, p, sizeM, sizeM, r);
	END IF;

	RETURN ret;
END$$

DELIMITER ;

DELIMITER ;;
CREATE  FUNCTION `EllipseContainsMultiPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
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
  SET c = ST_NumGeometries(ele);

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
END ;;
DELIMITER ;


DELIMITER ;

DELIMITER ;;
CREATE  FUNCTION `MultiPolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;

  SET n = 0;
  SET c = ST_NumGeometries(ele);
  IF c = 0 THEN
    RETURN 120;
  END IF;

  count_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    SET res = PolygonIsValid(g);
    IF res != 100 THEN
      RETURN res;
    END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

  IF PolygonsOverlap(ele) THEN
    RETURN 110;
  END IF;

RETURN 100;
END ;;
DELIMITER ;

UPDATE version SET ver_value = '034' WHERE ver_name = 'DB';
