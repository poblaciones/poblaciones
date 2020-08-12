DROP FUNCTION IF EXISTS deg2radLatitude;
DELIMITER $$

CREATE FUNCTION `deg2radLatitude`(latitude DOUBLE) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN
	-- deg2rad: coord * (Math.PI * 2) / 360
	RETURN (90 - latitude) * 6.2831852 / 360;

END$$
DELIMITER ;

DROP FUNCTION IF EXISTS deg2radLongitude;
DELIMITER $$

CREATE FUNCTION `deg2radLongitude`(longitude DOUBLE) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN
	-- deg2rad: coord * (Math.PI * 2) / 360
	IF longitude > 0 THEN
		return longitude * 6.2831852 / 360;
	ELSE
		RETURN (longitude + 360) * 6.2831852 / 360;
	END IF;

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS RingDouglasPeuckerSimplify;
DELIMITER $$
CREATE FUNCTION `RingDouglasPeuckerSimplify`(ls LINESTRING, tolerance DOUBLE) RETURNS linestring
    NO SQL
    SQL SECURITY INVOKER
BEGIN
-- Ported from https://git.codificar.com.br/packages-php/phpgeo
DECLARE index_start INT;
DECLARE index_end INT;
DECLARE last_id INT;
DECLARE lineSize INT;
DECLARE outMost INT;
DECLARE pointsTexts TEXT;

SET lineSize = ST_NumPoints(ls);
if (lineSize < 4) THEN
	RETURN ls;
END IF;

DROP TEMPORARY TABLE IF EXISTS ranges;
DROP TEMPORARY TABLE IF EXISTS results;

CREATE TEMPORARY TABLE ranges (id INT primary key auto_increment, fromPoint INT, toPoint INT) ENGINE=MEMORY;
CREATE TEMPORARY TABLE results (p POINT);

-- Inicializa ambas tablas
IF ST_IsClosed(ls) THEN
	INSERT INTO ranges(fromPoint, toPoint) VALUES (2, lineSize);
	INSERT INTO results VALUES (ST_PointN(ls, 1)), (ST_PointN(ls, 2));
ELSE
	INSERT INTO ranges(fromPoint, toPoint) VALUES (1, lineSize);
	INSERT INTO results VALUES (ST_PointN(ls, 1));
END IF;

SET last_id = (SELECT MAX(id) FROM ranges);

master_loop: LOOP
	SELECT fromPoint, toPoint INTO index_start, index_end FROM ranges WHERE id = last_id;
	DELETE FROM ranges WHERE id = last_id;

	IF (index_end - index_start > 1) THEN
		SET outMost = getOutMostVertexPoint(ls, index_start, index_end, tolerance);
	ELSE
		SET outMost = NULL;
    END IF;

	if outMost IS NOT NULL THEN
		INSERT INTO ranges(fromPoint, toPoint) VALUES (outMost, index_end);
		INSERT INTO ranges(fromPoint, toPoint) VALUES (index_start, outMost);
	ELSE
		INSERT INTO results VALUES (ST_PointN(ls, index_end));
	END IF;

	SET last_id = (SELECT MAX(id) FROM ranges);

	IF last_id IS NULL THEN
		LEAVE master_loop;
	END IF;
END LOOP;

SET group_concat_max_len = 4294967295;
SET pointsTexts = (SELECT GROUP_CONCAT(CONCAT(ST_X(p), " ", ST_Y(p)) SEPARATOR ',') FROM results);

DROP TEMPORARY TABLE ranges;
IF ST_IsClosed(ls) AND (SELECT COUNT(*) FROM results) = 3 THEN
	DROP TEMPORARY TABLE results;
	RETURN NULL;
END IF;
DROP TEMPORARY TABLE results;

RETURN GeomFromText(CONCAT("LINESTRING(", pointsTexts, ")"));

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS GeometrySimplifySphere;
DELIMITER $$

CREATE FUNCTION `GeometrySimplifySphere`(`ele` GEOMETRY, threshold DOUBLE) RETURNS geometry
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
  RETURN ele;
END IF;
IF t = 'LINESTRING' THEN
  RETURN RingDouglasPeuckerSimplify(ele, threshold);
END IF;
IF t = 'MULTILINESTRING' THEN
  RETURN MultiLineStringSimplifySphere(ele, threshold);
END IF;
IF t = 'POLYGON' THEN
  RETURN PolygonSimplifySphere(ele, threshold);
END IF;
IF t = 'MULTIPOLYGON' THEN
  RETURN MultiPolygonSimplifySphere(ele, threshold);
END IF;

RETURN NULL;

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS MultiPolygonSimplifySphere;
DELIMITER $$

CREATE FUNCTION `MultiPolygonSimplifySphere`(ele MULTIPOLYGON, threshold DOUBLE) RETURNS multipolygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE comma VARCHAR(1);

SET res = "MULTIPOLYGON(";
SET comma = "";
SET n = 0;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
  RETURN ele;
END IF;

count_loop: LOOP
    SET n = n + 1;
	SET l = PolygonSimplifySphere(ST_GeometryN(ele, n), threshold);
    IF l IS NOT NULL THEN
		SET res = CONCAT(res, comma , REPLACE(AsText(l), "POLYGON", ""));
		SET comma = ",";
	END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN ST_MultiPolygonFromText(CONCAT(res, ")"));

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS PolygonSimplifySphere;
DELIMITER $$

CREATE FUNCTION `PolygonSimplifySphere`(p POLYGON, threshold DOUBLE) RETURNS polygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l LINESTRING;
DECLARE c INT;
DECLARE n INT;

SET l = RingDouglasPeuckerSimplify(ST_ExteriorRing(p), threshold);
SET res = REPLACE(AsText(l), "LINESTRING", "POLYGON(");

SET n = 0;
SET c = ST_NumInteriorRings(p);
IF c = 0 THEN
  RETURN ST_PolygonFromText(CONCAT(res, ")"));
END IF;

count_loop: LOOP
    SET n = n + 1;
	SET l = RingDouglasPeuckerSimplify(ST_InteriorRingN(p, n), threshold);
    IF l IS NOT NULL THEN
		SET res = CONCAT(res, REPLACE(AsText(l), "LINESTRING", ","));
    END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN ST_PolygonFromText(CONCAT(res, ")"));

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS getOutMostVertexPoint;
DELIMITER $$

CREATE FUNCTION `getOutMostVertexPoint`(ls LINESTRING, index_start INT, index_end INT, tolerance DOUBLE) RETURNS int(11)
    NO SQL
    SQL SECURITY INVOKER
BEGIN

DECLARE distanceMax DOUBLE;
DECLARE distance DOUBLE;
DECLARE index_ INT;
DECLARE n INT;
DECLARE c INT;

SET distanceMax = 0;
SET index_ = 0;

SET n = index_start + 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
	SET distance = PerpendicularDistance(ST_PointN(ls, index_start), ST_PointN(ls, index_end), ST_PointN(ls,n));
    if (distance > distanceMax) THEN
		SET index_ = n;
		SET distanceMax = distance;
	END IF;
	SET n = n + 1;
	IF n >= index_end THEN
		LEAVE count_loop;
	END IF;
END LOOP;

if (distanceMax > tolerance) THEN
	RETURN index_;
ELSE
	RETURN NULL;
END IF;

END$$
DELIMITER ;


DROP FUNCTION IF EXISTS PerpendicularDistance;
DELIMITER $$

CREATE FUNCTION `PerpendicularDistance`(line_start POINT, line_end POINT, p POINT) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN
DECLARE firstLinePointLat DOUBLE;
DECLARE firstLinePointLng DOUBLE;
DECLARE ellipsoidRadius DOUBLE;
DECLARE firstLinePointX DOUBLE;
DECLARE firstLinePointY DOUBLE;
DECLARE firstLinePointZ DOUBLE;
DECLARE secondLinePointLat DOUBLE;
DECLARE secondLinePointLng DOUBLE;
DECLARE secondLinePointX DOUBLE;
DECLARE secondLinePointY DOUBLE;
DECLARE secondLinePointZ DOUBLE;
DECLARE pointLat DOUBLE;
DECLARE pointLng DOUBLE;
DECLARE pointX DOUBLE;
DECLARE pointY DOUBLE;
DECLARE pointZ DOUBLE;
DECLARE normalizedX DOUBLE;
DECLARE normalizedY DOUBLE;
DECLARE normalizedZ DOUBLE;
DECLARE length DOUBLE;
DECLARE thetaPoint DOUBLE;
DECLARE distance DOUBLE;

-- 'WGS-84' => [ 'a' => 6378137.0, 'f'    => 298.257223563, getArithmeticMeanRadius => a * (1 - 1 / f / 3);
-- eq. radios  6378137
-- mean radius 6371009
-- 6371008.7714151
SET ellipsoidRadius = 6371008.7714151;

	SET firstLinePointLat = deg2radLatitude(ST_Y(line_start));
    SET firstLinePointLng = deg2radLongitude(ST_X(line_start));

	SET firstLinePointX = ellipsoidRadius * cos(firstLinePointLng) * sin(firstLinePointLat);
	SET firstLinePointY = ellipsoidRadius * sin(firstLinePointLng) * sin(firstLinePointLat);
	SET firstLinePointZ = ellipsoidRadius * cos(firstLinePointLat);

	SET secondLinePointLat = deg2radLatitude(ST_Y(line_end));
	SET secondLinePointLng = deg2radLongitude(ST_X(line_end));

	SET secondLinePointX = ellipsoidRadius * cos(secondLinePointLng) * sin(secondLinePointLat);
	SET secondLinePointY = ellipsoidRadius * sin(secondLinePointLng) * sin(secondLinePointLat);
	SET secondLinePointZ = ellipsoidRadius * cos(secondLinePointLat);

	SET pointLat = deg2radLatitude(ST_Y(p));
	SET pointLng = deg2radLongitude(ST_X(p));

	SET pointX = ellipsoidRadius * cos(pointLng) * sin(pointLat);
	SET pointY = ellipsoidRadius * sin(pointLng) * sin(pointLat);
	SET pointZ = ellipsoidRadius * cos(pointLat);

	SET normalizedX = firstLinePointY * secondLinePointZ - firstLinePointZ * secondLinePointY;
	SET normalizedY = firstLinePointZ * secondLinePointX - firstLinePointX * secondLinePointZ;
	SET normalizedZ = firstLinePointX * secondLinePointY - firstLinePointY * secondLinePointX;

	SET length = sqrt(normalizedX * normalizedX + normalizedY * normalizedY + normalizedZ * normalizedZ);

	if (length > 0) THEN
		SET normalizedX = normalizedX / length;
		SET normalizedY = normalizedY / length;
		SET normalizedZ = normalizedZ / length;
	END IF;

	SET thetaPoint = normalizedX * pointX + normalizedY * pointY + normalizedZ * pointZ;

	SET length = sqrt(pointX * pointX + pointY * pointY + pointZ * pointZ);

	if (length > 0) THEN
		SET thetaPoint = thetaPoint / length;
	END IF;
	SET distance = abs((3.1415926 / 2) - acos(thetaPoint));

	return distance * ellipsoidRadius;
END$$
DELIMITER ;



DROP FUNCTION IF EXISTS MultiLineStringSimplifySphere;
DELIMITER $$

CREATE FUNCTION `MultiLineStringSimplifySphere`(ele GEOMETRY, threshold DOUBLE) RETURNS geometry
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l LINESTRING;
DECLARE c INT;
DECLARE n INT;
DECLARE comma VARCHAR(1);

SET res = "MULTILINESTRING(";
SET comma = "";
SET n = 0;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
  RETURN ele;
END IF;

count_loop: LOOP
    SET n = n + 1;
	SET l = RingDouglasPeuckerSimplify(ST_GeometryN(ele, n), threshold);
    IF l IS NOT NULL THEN
		SET res = CONCAT(res, comma , REPLACE(AsText(l), "LINESTRING", ""));
		SET comma = ",";
	END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN GeomFromText(CONCAT(res, ")"));
END$$
DELIMITER ;


UPDATE version SET ver_value = '045' WHERE ver_name = 'DB';