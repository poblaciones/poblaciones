-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 28, 2023 at 01:29 PM
-- Server version: 10.3.36-MariaDB-cll-lve
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

SET GLOBAL log_bin_trust_function_creators = 1;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `poblaci1_maps_prod`
--

DELIMITER $$
--
-- Functions
--
CREATE FUNCTION `CircleContainsSphereGeometry` (`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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

CREATE FUNCTION `CircleContainsSphereMultiPolygon` (`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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

CREATE FUNCTION `CircleContainsSpherePoint` (`center` POINT, `sizeM` DOUBLE, `p` POINT) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	RETURN DistanceSphere(center, p) <= sizeM;
END$$

CREATE FUNCTION `CircleContainsSpherePolygon` (`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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

CREATE FUNCTION `ContentOfSnapshotGeography` (`sessionId` VARCHAR(20), `id` INT, `g` GEOMETRY, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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

CREATE FUNCTION `ContentOfSnapshotPoint` (`sessionId` VARCHAR(20), `id` INT, `g` GEOMETRY, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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

CREATE FUNCTION `ContentOfSnapshotShape` (`sessionId` VARCHAR(20), `id` INT, `g` GEOMETRY, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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
END$$

CREATE FUNCTION `CoverageSnapshotGeography` (`sessionId` VARCHAR(20), `id` INT, `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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

CREATE FUNCTION `CoverageSnapshotPoint` (`sessionId` VARCHAR(20), `id` INT, `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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

CREATE FUNCTION `CoverageSnapshotShape` (`sessionId` VARCHAR(20), `id` INT, `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) MODIFIES SQL DATA
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
END$$

CREATE FUNCTION `deg2radLatitude` (`latitude` DOUBLE) RETURNS DOUBLE NO SQL
    SQL SECURITY INVOKER
BEGIN

	RETURN (90 - latitude) * 6.2831852 / 360;

END$$

CREATE FUNCTION `deg2radLongitude` (`longitude` DOUBLE) RETURNS DOUBLE NO SQL
    SQL SECURITY INVOKER
BEGIN

	IF longitude > 0 THEN
		return longitude * 6.2831852 / 360;
	ELSE
		RETURN (longitude + 360) * 6.2831852 / 360;
	END IF;

END$$

CREATE FUNCTION `DistanceSphere` (`pt1` POINT, `pt2` POINT) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	RETURN 12742000 * ASIN(SQRT(
			POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * 0.0087266472), 2)
			+ COS(ST_Y(pt1) * 0.0174532944) * COS(ST_Y(pt2)
			* 0.0174532944) * POWER(
			SIN((ST_X(pt2) - ST_X(pt1)) * 0.0087266472), 2)));
END$$

CREATE FUNCTION `DistanceSphereGeometry` (`pt1` POINT, `pt2` POINT, `g` GEOMETRY) RETURNS DOUBLE NO SQL
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

CREATE FUNCTION `DmsToDecimal` (`dms` VARCHAR(50)) RETURNS DECIMAL(20,9) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    DECLARE deg decimal(20,9);
    DECLARE mins decimal(20,9);
    DECLARE secs decimal(20 ,9);
    DECLARE sign integer;
    IF dms IS NULL OR dms = "" THEN
      RETURN null;
    END IF;
    SET dms = UPPER(TRIM(REPLACE(dms, ",", ".")));
    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(20,9));
    END IF;
return null;

    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(20,9));
    END IF;

    SET deg = CAST(  SUBSTRING_INDEX(dms, '°', 1) AS decimal(20,9));
    SET mins = CAST( (SUBSTR(dms, POSITION('°' IN dms) + 1, POSITION("'" IN dms) -  POSITION("°" IN dms) - 1)) AS decimal(20,9));
    SET secs = CAST( (SUBSTR(dms, POSITION("'" IN dms) + 1, POSITION("""" IN dms) -  POSITION("'" IN dms) - 1)) AS decimal(20,9));

    SET sign = 1 - 2 * (RIGHT(dms, 1) = "W" OR RIGHT(dms, 1) = "S" OR RIGHT(dms, 1) = "O");

    RETURN  sign * (deg + mins / 60 + secs / 3600);
END$$

CREATE FUNCTION `EllipseContains` (`center` POINT, `radius` POINT, `location` POINT) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE normalized POINT;
  if (ST_X(radius) <= 0.0 || ST_Y(radius) <= 0.0) THEN
    return false;
  END IF;
  SET normalized = Point(ST_X(location) - ST_X(center), ST_Y(location) - ST_Y(center));

  RETURN ((ST_X(normalized) * ST_X(normalized)) / (ST_X(radius) * ST_X(radius))) + ((ST_Y(normalized) * ST_Y(normalized)) / (ST_Y(radius) * ST_Y(radius))) <= 1.0;
END$$

CREATE FUNCTION `EllipseContainsGeometry` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
BEGIN
  DECLARE t VARCHAR(12);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
  RETURN EllipseContains(center, radius, ele);
END IF;

IF t = 'LINESTRING'  THEN
  RETURN EllipseContainsPolygon(center, radius, ele);
END IF;
IF t = 'POLYGON' THEN
  RETURN EllipseContainsPolygon(center, radius, ST_ExteriorRing(ele));
END IF;
IF t = 'MULTIPOLYGON' OR t = 'MULTILINESTRING' THEN
  RETURN EllipseContainsMultiPolygon(center, radius, ele);
END IF;

RETURN 2;
END$$

CREATE FUNCTION `EllipseContainsMultiPolygon` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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

CREATE FUNCTION `EllipseContainsPolygon` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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
IF EllipseContains(center, radius, ST_PointN(e,1)) AND  EllipseContains(center, radius, ST_PointN(e,2)) AND  EllipseContains(center, radius, ST_PointN(e,3)) AND  EllipseContains(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;


  SET n = 0;
  SET c = ST_NumPoints(ele);

  count_loop: LOOP
    SET n = n + 1;

  IF EllipseContains(center, radius, ST_PointN(ele,n)) = 0 THEN
    RETURN 0;
  END IF;

  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN 1;
END$$

CREATE FUNCTION `FixEncoding` (`cad` TEXT) RETURNS TEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

SET cad = REPLACE(cad, 'Ã‚Â¡', 'Ã¡');
SET cad = REPLACE(cad, 'Ã‚Â¢', 'Ã¢');
SET cad = REPLACE(cad, 'Ã‚Â£', 'Ã£');
SET cad = REPLACE(cad, 'Ã‚Â¤', 'Ã¤');
SET cad = REPLACE(cad, 'Ã‚Â¥', 'Ã¥');
SET cad = REPLACE(cad, 'Ã‚Â¦', 'Ã¦');
SET cad = REPLACE(cad, 'Ã‚Â§', 'Ã§');
SET cad = REPLACE(cad, 'Ã‚Â¨', 'Ã¨');
SET cad = REPLACE(cad, 'Ã‚Â©', 'Ã©');
SET cad = REPLACE(cad, 'Ã‚Âª', 'Ãª');
SET cad = REPLACE(cad, 'Ã‚Â«', 'Ã«');
SET cad = REPLACE(cad, 'Ã‚Â­', 'Ã­');
SET cad = REPLACE(cad, 'Ã‚Â®', 'Ã®');
SET cad = REPLACE(cad, 'Ã‚Â¯', 'Ã¯');
SET cad = REPLACE(cad, 'Ã‚Â°', 'Ã°');
SET cad = REPLACE(cad, 'Ã‚Â±', 'Ã±');
SET cad = REPLACE(cad, 'Ã‚Â²', 'Ã²');
SET cad = REPLACE(cad, 'Ã‚Â³', 'Ã³');
SET cad = REPLACE(cad, 'Ã‚Â´', 'Ã´');
SET cad = REPLACE(cad, 'Ã‚Âµ', 'Ãµ');
SET cad = REPLACE(cad, 'Ã‚Â·', 'Ã·');
SET cad = REPLACE(cad, 'Ã‚Â¸', 'Ã¸');
SET cad = REPLACE(cad, 'Ã‚Â¹', 'Ã¹');
SET cad = REPLACE(cad, 'Ã‚Âº', 'Ãº');
SET cad = REPLACE(cad, 'Ã‚Â»', 'Ã»');
SET cad = REPLACE(cad, 'Ã‚Â¼', 'Ã¼');
SET cad = REPLACE(cad, 'Ã‚Â½', 'Ã½');
SET cad = REPLACE(cad, 'Ã‚Â¾', 'Ã¾');
SET cad = REPLACE(cad, 'Ã‚Â¿', 'Ã¿');
SET cad = REPLACE(cad, 'Ãƒâ‚¬', 'Ã€');
SET cad = REPLACE(cad, 'ÃƒÂ', 'Ã');
SET cad = REPLACE(cad, 'Ãƒâ€š', 'Ã‚');
SET cad = REPLACE(cad, 'ÃƒÆ’', 'Ãƒ');
SET cad = REPLACE(cad, 'Ãƒâ€ž', 'Ã„');
SET cad = REPLACE(cad, 'Ãƒâ€¦', 'Ã…');
SET cad = REPLACE(cad, 'Ãƒâ€ ', 'Ã†');
SET cad = REPLACE(cad, 'Ãƒâ€¡', 'Ã‡');
SET cad = REPLACE(cad, 'ÃƒË†', 'Ãˆ');
SET cad = REPLACE(cad, 'Ãƒâ€°', 'Ã‰');
SET cad = REPLACE(cad, 'ÃƒÅ ', 'ÃŠ');
SET cad = REPLACE(cad, 'Ãƒâ€¹', 'Ã‹');
SET cad = REPLACE(cad, 'ÃƒÅ’', 'ÃŒ');
SET cad = REPLACE(cad, 'ÃƒÅ½', 'ÃŽ');
SET cad = REPLACE(cad, 'Ãƒâ€˜', 'Ã‘');
SET cad = REPLACE(cad, 'Ãƒâ€™', 'Ã’');
SET cad = REPLACE(cad, 'Ãƒâ€œ', 'Ã“');
SET cad = REPLACE(cad, 'Ãƒâ€', 'Ã”');
SET cad = REPLACE(cad, 'Ãƒâ€¢', 'Ã•');
SET cad = REPLACE(cad, 'Ãƒâ€“', 'Ã–');
SET cad = REPLACE(cad, 'Ãƒâ€”', 'Ã—');
SET cad = REPLACE(cad, 'ÃƒËœ', 'Ã˜');
SET cad = REPLACE(cad, 'Ãƒâ„¢', 'Ã™');
SET cad = REPLACE(cad, 'ÃƒÅ¡', 'Ãš');
SET cad = REPLACE(cad, 'Ãƒâ€º', 'Ã›');
SET cad = REPLACE(cad, 'ÃƒÅ“', 'Ãœ');
SET cad = REPLACE(cad, 'ÃƒÅ¾', 'Ãž');
SET cad = REPLACE(cad, 'ÃƒÅ¸', 'ÃŸ');
SET cad = REPLACE(cad, 'ÃƒÂ¡', 'Ã¡');
SET cad = REPLACE(cad, 'ÃƒÂ¢', 'Ã¢');
SET cad = REPLACE(cad, 'ÃƒÂ£', 'Ã£');
SET cad = REPLACE(cad, 'ÃƒÂ¤', 'Ã¤');
SET cad = REPLACE(cad, 'ÃƒÂ¥', 'Ã¥');
SET cad = REPLACE(cad, 'ÃƒÂ¦', 'Ã¦');
SET cad = REPLACE(cad, 'ÃƒÂ§', 'Ã§');
SET cad = REPLACE(cad, 'ÃƒÂ¨', 'Ã¨');
SET cad = REPLACE(cad, 'ÃƒÂ©', 'Ã©');
SET cad = REPLACE(cad, 'ÃƒÂª', 'Ãª');
SET cad = REPLACE(cad, 'ÃƒÂ«', 'Ã«');
SET cad = REPLACE(cad, 'ÃƒÂ­', 'Ã­');
SET cad = REPLACE(cad, 'ÃƒÂ®', 'Ã®');
SET cad = REPLACE(cad, 'ÃƒÂ¯', 'Ã¯');
SET cad = REPLACE(cad, 'ÃƒÂ°', 'Ã°');
SET cad = REPLACE(cad, 'ÃƒÂ±', 'Ã±');
SET cad = REPLACE(cad, 'ÃƒÂ²', 'Ã²');
SET cad = REPLACE(cad, 'ÃƒÂ³', 'Ã³');
SET cad = REPLACE(cad, 'ÃƒÂ´', 'Ã´');
SET cad = REPLACE(cad, 'ÃƒÂµ', 'Ãµ');
SET cad = REPLACE(cad, 'ÃƒÂ·', 'Ã·');
SET cad = REPLACE(cad, 'ÃƒÂ¸', 'Ã¸');
SET cad = REPLACE(cad, 'ÃƒÂ¹', 'Ã¹');
SET cad = REPLACE(cad, 'ÃƒÂº', 'Ãº');
SET cad = REPLACE(cad, 'ÃƒÂ»', 'Ã»');
SET cad = REPLACE(cad, 'ÃƒÂ¼', 'Ã¼');
SET cad = REPLACE(cad, 'ÃƒÂ½', 'Ã½');
SET cad = REPLACE(cad, 'ÃƒÂ¾', 'Ã¾');
SET cad = REPLACE(cad, 'ÃƒÂ¿', 'Ã¿');

RETURN cad;
END$$

CREATE FUNCTION `GeoJsonOrWktToWkt` (`cad` LONGTEXT) RETURNS LONGTEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

IF LOCATE('{', cad) = 0 THEN
 SET cad = TRIM(cad);
 SET cad = IF(cad = '', null, cad);
 RETURN cad;
END IF;

SET cad = REPLACE(cad, '\n', '');
SET cad = REPLACE(cad, '\r', '');
SET cad = REPLACE(cad, ' ', '');
IF LEFT(cad, 1) != "{" THEN
  SET cad = TRIM(cad);
  SET cad = IF(cad = '', null, cad);
  RETURN cad;
END IF;


IF RIGHT(cad, 15) = '"type":"Point"}' THEN
   SET cad = CONCAT('{"type":"Point",', MID(cad, 2, length(cad) - 15 - 2), '}');
END IF;
IF RIGHT(cad, 17) = '"type":"Polygon"}' THEN
   SET cad = CONCAT('{"type":"Polygon",', MID(cad, 2, length(cad) - 17 - 2), '}');
END IF;
IF RIGHT(cad, 20) = '"type":"LineString"}' THEN
   SET cad = CONCAT('{"type":"LineString",', MID(cad, 2, length(cad) - 20 - 2), '}');
END IF;
IF RIGHT(cad, 20) = '"type":"MultiPoint"}' THEN
   SET cad = CONCAT('{"type":"MultiPoint",', MID(cad, 2, length(cad) - 20 - 2), '}');
END IF;
IF RIGHT(cad, 22) = '"type":"MultiPolygon"}' THEN
   SET cad = CONCAT('{"type":"MultiPolygon",', MID(cad, 2, length(cad) - 22 - 2), '}');
END IF;
IF RIGHT(cad, 25) = '"type":"MultiLineString"}' THEN
   SET cad = CONCAT('{"type":"MultiLineString",', MID(cad, 2, length(cad) - 25 - 2), '}');
END IF;

IF LEFT(cad, 15) = '{"type":"Point"' THEN
 SET cad = REPLACE(cad, ']', ']]');
 SET cad = REPLACE(cad, '[', '[[');
END IF;

SET cad = REPLACE(cad, ', ', ',');
SET cad = REPLACE(cad, '{"type":"', '');
SET cad = REPLACE(cad, '","coordinates":', '');
SET cad = REPLACE(cad, '],', ']@');
SET cad = REPLACE(cad, ',', ' ');
SET cad = REPLACE(cad, '[[[[', '~3');
SET cad = REPLACE(cad, '[[[', '~2');
SET cad = REPLACE(cad, '[[', '~1');
SET cad = REPLACE(cad, '[', '');
SET cad = REPLACE(cad, '~3', '(((');
SET cad = REPLACE(cad, '~2', '((');
SET cad = REPLACE(cad, '~1', '(');
SET cad = REPLACE(cad, ']]]]', '~3');
SET cad = REPLACE(cad, ']]]', '~2');
SET cad = REPLACE(cad, ']]', '~1');
SET cad = REPLACE(cad, '~3', ')))');
SET cad = REPLACE(cad, '~2', '))');
SET cad = REPLACE(cad, '~1', ')');
SET cad = REPLACE(cad, ']', '');
SET cad = REPLACE(cad, '@', ',');
SET cad = REPLACE(cad, '}', '');
SET cad = TRIM(cad);
SET cad = IF(cad = '', null, cad);
RETURN cad;
END$$

CREATE FUNCTION `GeometryAreaSphere` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' OR t = 'LINESTRING' OR t = 'MULTILINESTRING' THEN
  RETURN 0;
END IF;

IF t = 'POLYGON' THEN
  RETURN PolygonAreaSphere(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
  RETURN MultiPolygonAreaSphere(ele);
END IF;

RETURN 0;
END$$

CREATE FUNCTION `GeometryCentroid` (`ele` GEOMETRY) RETURNS POINT NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
DECLARE nPoints INT;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;

  SET t = ST_GeometryType(ele);

  IF t = 'POLYGON' OR t = 'MULTIPOLYGON' THEN
    RETURN ST_CENTROID(ele);
  END IF;

IF t = 'LINESTRING' THEN
	RETURN LineStringCentroid(ele);
END IF;

IF t = 'MULTILINESTRING' THEN
	RETURN MultiLineStringCentroid(ele);
END IF;

IF t = 'POINT' THEN
    RETURN ele;
  END IF;

RETURN NULL;

END$$

CREATE FUNCTION `GeometryIsMinSize` (`geom` GEOMETRY, `width` DOUBLE, `height` DOUBLE) RETURNS TINYINT(1) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE envelope LINESTRING;
DECLARE p1 POINT;
DECLARE p2 POINT;
SET envelope = ST_ExteriorRing(PolygonEnvelope(geom));
SET p1 = ST_PointN(envelope, 1);
SET p2 = ST_PointN(envelope, 3);
RETURN ST_X(p2)-ST_X(p1) > width AND ST_Y(p2) - ST_Y(p1) > height;
END$$

CREATE FUNCTION `GeometryIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' THEN
  RETURN 100;
END IF;
IF t = 'LINESTRING' THEN
  IF ST_NumPoints(ele) > 0 THEN
    RETURN 100;
  ELSE
    RETURN 101;
  END IF;
END IF;

IF t = 'MULTILINESTRING' THEN
  IF ST_NumPoints(ST_GeometryN(ele, 1)) > 0 THEN
    RETURN 100;
  ELSE
    RETURN 101;
  END IF;
END IF;

IF t = 'POLYGON' THEN
  RETURN PolygonIsValid(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
  RETURN MultiPolygonIsValid(ele);
END IF;

RETURN 2;
END$$

CREATE FUNCTION `GeometryPerimeterSphere` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' THEN
  RETURN 0;
END IF;
IF t = 'LINESTRING' THEN
   RETURN RingPerimeterSphere(ele);
END IF;

IF t = 'MULTILINESTRING' THEN
  RETURN MultiLineStringPerimeterSphere(ele);
END IF;

IF t = 'POLYGON' THEN
  RETURN PolygonPerimeterSphere(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
  RETURN MultiPolygonPerimeterSphere(ele);
END IF;

RETURN 0;
END$$

CREATE FUNCTION `GeometrySimplifySphere` (`ele` GEOMETRY, `threshold` DOUBLE) RETURNS GEOMETRY NO SQL
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

CREATE FUNCTION `GeoreferenceErrorCode` (`error_code` INT) RETURNS VARCHAR(255) CHARSET utf8 NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE ret VARCHAR(255);

SET ret = (CASE error_code
WHEN 1 THEN 'La latitud o la longitud no están en un rango válido (-90 a 90 y -180 a 180).'
WHEN 2 THEN 'La coordenada indicada no se encuentra dentro de ningún elemento de la geografía seleccionada.'
WHEN 3 THEN 'El valor para el código no puede ser nulo'
WHEN 4 THEN 'El valor para el código no fue encontrado en la geografía indicada.'
WHEN 5 THEN 'El valor para el polígono no puede ser nulo'
WHEN 6 THEN 'El valor indicado en la columna del polígono no es un texto WKT o GeoJson correcto.'
WHEN 7 THEN 'El polígono reconocido no es una geometría válida.'
WHEN 8 THEN 'El centroide del polígono indicado no se encuentra dentro de ningún elemento de la geografía seleccionada.'
WHEN 9 THEN 'La latitud o la longitud contienen valores vacíos.'

WHEN 10 THEN 'La geometría no tiene signos de cierre. Es posible que se encuentre incompleta.'
WHEN 101 THEN 'El perímetro exterior del polígono no posee puntos.'
WHEN 102 THEN 'El perímetro exterior del polígono no está cerrado. El último punto debe coincidir con el primero.'
WHEN 103 THEN 'El perímetro exterior del polígono debe tener sus puntos ordenados en el sentido de las agujas del reloj (clockwise).'
WHEN 104 THEN 'El perímetro exterior del polígono se intersecta consigo mismo.'
WHEN 105 THEN 'Uno de los huecos del polígono no posee puntos.'
WHEN 106 THEN 'Uno de los huecos del polígono no está cerrado. El último punto debe coincidir con el primero.'
WHEN 107 THEN 'Los huecos del polígono deben tener sus puntos ordenados en el sentido contrario a las agujas del reloj (counter-clockwise).'
WHEN 108 THEN 'Uno de los huecos del polígono se intersecta consigo mismo.'
WHEN 109 THEN 'Un hueco del polígono excede los límites de su perímetro.'
WHEN 110 THEN 'Los polígonos de un polígono múltiple no pueden superponerse.'
WHEN 111 THEN 'Los huecos de un polígono no pueden superponerse.'
WHEN 120 THEN 'El polígono múltiple no contiene polígonos.'

ELSE 'Código no identificado'

END);

RETURN ret;

END$$

CREATE FUNCTION `GeoreferenceErrorWithCode` (`error_code` INT) RETURNS VARCHAR(255) CHARSET utf8 NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE ret VARCHAR(255);

SET ret = CONCAT('E', error_code, '. ' , GeoreferenceErrorCode(error_code));
RETURN ret;

END$$

CREATE FUNCTION `GetDatasetOf` (`column_id` INT) RETURNS INT(11) READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF column_id IS NULL THEN
  RETURN null;
END IF;

RETURN (SELECT dco_dataset_id FROM draft_dataset_column WHERE dco_id = column_id);
END$$

CREATE FUNCTION `GetGeographyByPoint` (`geography_id` INT, `p` POINT) RETURNS INT(11) SQL SECURITY INVOKER
BEGIN

DECLARE ret INTEGER;

SET ret = (SELECT giw_geography_item_id FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id LIMIT 1);

RETURN ret;

END$$

CREATE FUNCTION `GetGeoText` (`cad` LONGTEXT) RETURNS LONGTEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
SET cad = REPLACE(cad, '\n', '');
SET cad = REPLACE(cad, '\r', '');

IF LEFT(cad, 1) != "{" THEN
  RETURN cad;
END IF;

SET cad = REPLACE(cad, ' ', '');
SET cad = REPLACE(cad, '{"type":"', '');
SET cad = REPLACE(cad, '","coordinates":[', '');
SET cad = REPLACE(cad, '],', ']@');
SET cad = REPLACE(cad, ',', ' ');
SET cad = REPLACE(cad, '[', '(');
SET cad = REPLACE(cad, ']', ')');
SET cad = REPLACE(cad, '@', ',');
SET cad = REPLACE(cad, ']}', '');

RETURN cad;
END$$

CREATE FUNCTION `GetNonSingleGeographyByPoint` (`geography_id` INT, `p` POINT) RETURNS INT(11) SQL SECURITY INVOKER
BEGIN

DECLARE ret INTEGER;

SET ret = (SELECT Count(giw_geography_item_id) FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id);

RETURN ret > 1;

END$$

CREATE FUNCTION `getOutMostVertexPoint` (`ls` LINESTRING, `index_start` INT, `index_end` INT, `tolerance` DOUBLE) RETURNS INT(11) NO SQL
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

CREATE FUNCTION `InnerRingsOverlap` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;

SET n = 0;
SET c = ST_NumInteriorRings(ele);

  count2_loop: LOOP
    SET n = n + 1;
    SET g = Polygon(ST_InteriorRingN(ele, n));
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      IF ST_Intersects(g, ST_InteriorRingN(ele, i)) THEN
        RETURN 1;
      END IF;
      IF i >= c THEN
        LEAVE count3_loop;
      END IF;
    END LOOP;

    IF n >= c THEN
        LEAVE count2_loop;
      END IF;
 END LOOP;

 RETURN 0;
END$$

CREATE FUNCTION `IsAccessibleWork` (`userId` INT, `workId` INT, `workIsIndexed` TINYINT, `workIsPrivate` TINYINT) RETURNS TINYINT(1) READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE unshardified INT;

IF (workIsIndexed = 1 AND workIsPrivate = 0) THEN
	RETURN 1;
END IF;

IF (userId IS NULL) THEN
	RETURN 0;
END IF;

SET unshardified = CAST(workId / 100 AS SIGNED);

IF EXISTS(SELECT * FROM draft_work_permission
		WHERE wkp_user_id = userId AND wkp_work_id = unshardified) THEN
	RETURN 1;
ELSE
	RETURN 0;
END IF;

END$$

CREATE FUNCTION `LineStringCentroid` (`ele` GEOMETRY) RETURNS POINT NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE n INT;
DECLARE ttl INT;
DECLARE totalLength DOUBLE;
DECLARE length DOUBLE;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;
DECLARE p1 POINT;
DECLARE p2 POINT;

SET ttl = ST_NumPoints(ele);

IF ttl = 0 THEN
  RETURN NULL;
END IF;
IF ttl = 1 THEN
  RETURN ST_PointN(ele, 1);
END IF;
IF ttl = 2 THEN
  SET p1 = ST_PointN(ele, 1);
  SET p2 = ST_PointN(ele, 2);
  RETURN POINT((ST_X(p1)+ST_X(p2)) / 2,
                  (ST_Y(p1)+ST_Y(p2)) / 2);
END IF;

 SET n = 1;
 SET totalLength = 0;
 SET nX = 0;
 SET nY = 0;

 count_loop: LOOP
    IF n >= ttl THEN
      LEAVE count_loop;
    END IF;
    SET n = n + 1;
    SET p1 = ST_PointN(ele, n-1);
    SET p2 = ST_PointN(ele, n);
    SET length = ST_DISTANCE(p1, p2);
    SET nX = nX + (ST_X(p1) + ST_X(p2)) / 2 * length;
    SET nY = nY + (ST_Y(p1) + ST_Y(p2)) / 2 * length;
    SET totalLength = totalLength + length;
  END LOOP;

RETURN POINT(nX / totalLength, nY / totalLength);

END$$

CREATE FUNCTION `MultiLineStringCentroid` (`ele` GEOMETRY) RETURNS POINT NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE n INT;
DECLARE ttl INT;
DECLARE totalLength DOUBLE;
DECLARE length DOUBLE;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;
DECLARE p1 POINT;
DECLARE p2 POINT;
DECLARE currentLine INT;
DECLARE totalLines INT;

DECLARE line LINESTRING;

SET totalLength = 0;
SET nX = 0;
SET nY = 0;

SET currentLine = 0;
SET totalLines = ST_NumGeometries(ele);

lines_loop: LOOP
    IF currentLine >= totalLines THEN
      LEAVE lines_loop;
    END IF;
	SET currentLine = currentLine + 1;
    SET line = ST_GeometryN(ele, currentLine);
    SET ttl = ST_NumPoints(line);
	IF ttl > 1 THEN
		SET n = 1;
		count_loop: LOOP
			IF n >= ttl THEN
			  LEAVE count_loop;
			END IF;
			SET n = n + 1;
			SET p1 = ST_PointN(line, n-1);
			SET p2 = ST_PointN(line, n);
			SET length = ST_DISTANCE(p1, p2);
			SET nX = nX + (ST_X(p1) + ST_X(p2)) / 2 * length;
			SET nY = nY + (ST_Y(p1) + ST_Y(p2)) / 2 * length;
			SET totalLength = totalLength + length;
		END LOOP;
    END IF;
  END LOOP;

RETURN POINT(nX / totalLength, nY / totalLength);

END$$

CREATE FUNCTION `MultiLineStringPerimeterSphere` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;

SET sum = 0;

  SET n = 1;
  SET c = ST_NumGeometries(ele);
  IF c = 0 THEN
    RETURN 0;
  END IF;

  count_loop: LOOP
    SET g = ST_GeometryN(ele, n);
    SET sum = sum + RingPerimeterSphere(g);

    SET n = n + 1;
    IF n > c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;
END$$

CREATE FUNCTION `MultiLineStringSimplifySphere` (`ele` GEOMETRY, `threshold` DOUBLE) RETURNS GEOMETRY NO SQL
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

CREATE FUNCTION `MultiPolygonAreaSphere` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;
SET sum = 0;

  SET n = 1;
  SET c = ST_NumGeometries(ele);
  IF c = 0 THEN
    RETURN 0;
  END IF;

  count_loop: LOOP
    SET g = ST_GeometryN(ele, n);
    SET sum = sum + PolygonAreaSphere(g);

    SET n = n + 1;
    IF n > c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;
END$$

CREATE FUNCTION `MultiPolygonIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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
END$$

CREATE FUNCTION `MultiPolygonPerimeterSphere` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;
SET sum = 0;

  SET n = 1;
  SET c = ST_NumGeometries(ele);
  IF c = 0 THEN
    RETURN 0;
  END IF;

  count_loop: LOOP
    SET g = ST_GeometryN(ele, n);
    SET sum = sum + PolygonPerimeterSphere(g);

    SET n = n + 1;
    IF n > c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;
END$$

CREATE FUNCTION `MultiPolygonSimplifySphere` (`ele` MULTIPOLYGON, `threshold` DOUBLE) RETURNS MULTIPOLYGON NO SQL
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

CREATE FUNCTION `NearestSnapshot` (`sessionId` VARCHAR(20), `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	SET ret = NULL;

	IF sizeM > 1000 THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, 1000), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	IF ret IS NULL AND sizeM > 10000 THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, 10000), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	IF ret IS NULL THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	RETURN ret;
END$$

CREATE FUNCTION `NearestSnapshotGeography` (`sessionId` VARCHAR(20), `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
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

CREATE FUNCTION `NearestSnapshotPoint` (`sessionId` VARCHAR(20), `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
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

CREATE FUNCTION `NearestSnapshotRangeGeography` (`sessionId` VARCHAR(20), `p` POINT, `buffer` DOUBLE, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
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

CREATE FUNCTION `NearestSnapshotRangePoint` (`sessionId` VARCHAR(20), `p` POINT, `mbrSize` DOUBLE, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d
				FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, mbrSize ), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
END$$

CREATE FUNCTION `NearestSnapshotRangeShape` (`sessionId` VARCHAR(20), `p` POINT, `buffer` DOUBLE, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
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
END$$

CREATE FUNCTION `NearestSnapshotShape` (`sessionId` VARCHAR(20), `p` POINT, `sizeM` DOUBLE, `r` INT) RETURNS INT(11) READS SQL DATA
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

CREATE FUNCTION `PerpendicularDistance` (`line_start` POINT, `line_end` POINT, `p` POINT) RETURNS DOUBLE NO SQL
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

CREATE FUNCTION `PolygonAreaSphere` (`p` POLYGON) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE c INT;
DECLARE n INT;

SET sum = RingAreaSphere(ST_ExteriorRing(p));

SET n = 0;
SET c = ST_NumInteriorRings(p);
IF c = 0 THEN
  RETURN sum;
END IF;

count_loop: LOOP
    SET n = n + 1;
    SET sum = sum - ABS(RingAreaSphere(ST_InteriorRingN(p, n)));

    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;

END$$

CREATE FUNCTION `PolygonEnvelope` (`g` GEOMETRY) RETURNS POLYGON NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE x1 DOUBLE;
  DECLARE y1 DOUBLE;
  DECLARE x2 DOUBLE;
  DECLARE y2 DOUBLE;
  DECLARE envelope GEOMETRY;

SET envelope = ST_Envelope(g);

RETURN CASE ST_GeometryType(envelope)
		WHEN 'POLYGON' THEN envelope
		WHEN 'LINESTRING' THEN POLYGON(LINESTRING(ST_PointN(envelope, 1), ST_PointN(envelope, 1), ST_PointN(envelope, 2), ST_PointN(envelope, 2)))
		WHEN 'POINT' THEN POLYGON(LINESTRING(envelope, envelope, envelope, envelope))
		END;

END$$

CREATE FUNCTION `PolygonIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g LINESTRING;
DECLARE e LINESTRING;
DECLARE p POLYGON;

SET e = ST_ExteriorRing(ele);
SET res = RingIsValid(e,1);
IF res != 100 THEN
  RETURN res;
END IF;

  SET n = 0;
  SET c = ST_NumInteriorRings(ele);
  IF c = 0 THEN
    RETURN 100;
  END IF;
 SET p = Polygon(e);

count_loop: LOOP
    SET n = n + 1;
    SET g = ST_InteriorRingN(ele, n);
    SET res = RingIsValid(g, -1);
    IF res != 100 THEN
      RETURN res + 4;
    END IF;
    IF NOT ST_Contains(p, g) THEN
    	RETURN 109;
    END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;

  END LOOP;


  IF InnerRingsOverlap(ele) THEN
    RETURN 111;
  END IF;

RETURN 100;
END$$

CREATE FUNCTION `PolygonPerimeterSphere` (`p` POLYGON) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

RETURN RingPerimeterSphere(ST_ExteriorRing(p));

END$$

CREATE FUNCTION `PolygonSimplifySphere` (`p` POLYGON, `threshold` DOUBLE) RETURNS POLYGON NO SQL
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

CREATE FUNCTION `PolygonsOverlap` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;
DECLARE g2 POLYGON;
SET n = 0;
SET c = NumGeometries(ele);

  count2_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      SET g2 = ST_GeometryN(ele, i);
      IF ST_Intersects(g, g2) AND ST_Area(ST_Intersection(g, g2)) > 0 THEN
        RETURN 1;
      END IF;
      IF i >= c THEN
        LEAVE count3_loop;
      END IF;
    END LOOP;

    IF n >= c THEN
        LEAVE count2_loop;
      END IF;
 END LOOP;

 RETURN 0;
END$$

CREATE FUNCTION `RichEnvelope` (`g` GEOMETRY, `xDelta` INT, `yDelta` INT) RETURNS POLYGON NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE x1 DOUBLE;
  DECLARE y1 DOUBLE;
  DECLARE x2 DOUBLE;
  DECLARE y2 DOUBLE;
  DECLARE envelopeLine LINESTRING;

SET envelopeLine = ST_ExteriorRing(PolygonEnvelope(g));

SET x1 = ST_X(ST_PointN(envelopeLine, 1)) + (xDelta * 1000);
SET x2 = ST_X(ST_PointN(envelopeLine, 3)) + (xDelta * 1000);
SET y1 = ST_Y(ST_PointN(envelopeLine, 1)) + (yDelta * 1000);
SET y2 = ST_Y(ST_PointN(envelopeLine, 3)) + (yDelta * 1000);

RETURN Polygon(LineString(Point(x1, y1), Point(x1, y2), Point(x2, y2),
Point(x2, y1),  Point(x1, y1)));

END$$

CREATE FUNCTION `RingAreaSphere` (`ls` LINESTRING) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE prevcolat DOUBLE;
DECLARE prevaz DOUBLE;
DECLARE colat0 DOUBLE;
DECLARE az0 DOUBLE;
DECLARE az DOUBLE;
DECLARE PI DOUBLE;
DECLARE lat DOUBLE;
DECLARE lon DOUBLE;
DECLARE colat DOUBLE;
DECLARE n INT;
DECLARE c INT;

IF ST_NumPoints(ls) = 0 THEN
  RETURN 0;
END IF;
IF ST_IsClosed(ls) = 0 THEN
  RETURN 0;
END IF;

SET sum=0;
SET prevcolat=0;
SET prevaz=0;
SET colat0=0;
SET az0=0;
SET PI=3.1415269;

SET n = 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
	SET lat = ST_Y(ST_PointN(ls,n));
    SET lon = ST_X(ST_PointN(ls,n));

    SET colat=2*ATAN2(SQRT(POW(SIN(lat*PI/180/2), 2)+ COS(lat*PI/180)*POW(SIN(lon*PI/180/2), 2)),SQRT(1-  POW(SIN(lat*PI/180/2), 2)- COS(lat*PI/180)*POW(SIN(lon*PI/180/2), 2)));
	SET az=0;
	IF lat>=90 THEN
		SET az=0;
	ELSEIF lat<=-90 THEN
		SET az=PI;
	ELSE
		SET az=ATAN2(COS(lat*PI/180) * SIN(lon*PI/180),SIN(lat*PI/180))% (2*PI);
    END IF;

    IF n = 1 THEN
		 SET colat0=colat;
		 SET az0=az;
    ELSE
		SET sum=sum+(1-COS(prevcolat  + (colat-prevcolat)/2))*PI*((ABS(az-prevaz)/PI)-2*CEIL(((ABS(az-prevaz)/PI)-1)/2))* SIGN(az-prevaz);
    END IF;
    SET prevcolat=colat;
	SET prevaz=az;

  SET n = n + 1;
  IF n > c THEN
    LEAVE count_loop;
  END IF;

END LOOP;

SET sum=sum+(1-COS(prevcolat  + (colat0-prevcolat)/2))*(az0-prevaz);

RETURN 5.10072e+14 * LEAST(ABS(sum)/4/PI, 1-ABS(sum)/4/PI);

END$$

CREATE FUNCTION `RingDouglasPeuckerSimplify` (`ls` LINESTRING, `tolerance` DOUBLE) RETURNS LINESTRING NO SQL
    SQL SECURITY INVOKER
BEGIN

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

CREATE FUNCTION `RingIsValid` (`ele` GEOMETRY, `direction` TINYINT(4)) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN



IF ST_NumPoints(ele) = 0 THEN
  RETURN 101;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN 102;
END IF;

IF ST_IsSimple(ele) = 0 THEN
  RETURN 104;
END IF;

RETURN 100;
END$$

CREATE FUNCTION `RingPerimeterSphere` (`ls` LINESTRING) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE n INT;
DECLARE c INT;

IF ST_NumPoints(ls) < 2 THEN
  RETURN 0;
END IF;

SET sum=0;

SET n = 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
	SET sum = sum + DistanceSphere(ST_PointN(ls,n), ST_PointN(ls,n+1));

  SET n = n + 1;
  IF n >= c THEN
    LEAVE count_loop;
  END IF;

END LOOP;

RETURN sum;
END$$

CREATE FUNCTION `Signature` () RETURNS BIGINT(20) NO SQL
    SQL SECURITY INVOKER
BEGIN
RETURN UNIX_TIMESTAMP(NOW(6))* 1000 & 0xFFFFFFFF;
END$$

CREATE FUNCTION `SignedArea` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE c INT;
DECLARE n INT;
DECLARE ret DOUBLE;

IF ST_NumPoints(ele) = 0 THEN
  RETURN -1;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN -1;
END IF;
  SET n = 1;
  SET c = ST_NumPoints(ele);
  SET ret = 0;
  count_loop: LOOP

     SET ret = RET +
            (ST_X(ST_PointN(ele,n + 1)) - ST_X(ST_PointN(ele,n))) *
            (ST_Y(ST_PointN(ele,n + 1)) + ST_Y(ST_PointN(ele,n))) / 2;

      SET n = n + 1;
  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN ret;
END$$

CREATE FUNCTION `SquareBuffer` (`p` POINT, `sizeM` DOUBLE) RETURNS POLYGON NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	DECLARE offsetX DOUBLE;
	DECLARE offsetY DOUBLE;
	SET offsetX = sizeM / (100000 * COS(ST_Y(p) / PI() / 180));
	SET offsetY = sizeM / 100000;

	RETURN POLYGON(LINESTRING(
		POINT(ST_X(p) - offsetX, ST_Y(p) - offsetY),
		POINT(ST_X(p) + offsetX, ST_Y(p) - offsetY),
		POINT(ST_X(p) + offsetX, ST_Y(p) + offsetY),
		POINT(ST_X(p) - offsetX, ST_Y(p) + offsetY),
		POINT(ST_X(p) - offsetX, ST_Y(p) - offsetY)
	));
END$$

CREATE FUNCTION `UserFullNameById` (`id` INT) RETURNS VARCHAR(100) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF id IS NULL THEN
  RETURN null;
END IF;

RETURN (SELECT TRIM(CONCAT(usr_firstname, ' ', usr_lastname)) FROM `user` WHERE usr_id = 1);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `boundary`
--

CREATE TABLE `boundary` (
  `bou_id` int(11) NOT NULL,
  `bou_group_id` int(11) NOT NULL COMMENT 'Grupo de límites al que pertenece.',
  `bou_geography_id` int(11) DEFAULT NULL,
  `bou_metadata_id` int(11) DEFAULT NULL COMMENT 'Metadatos del límite',
  `bou_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del límite.',
  `bou_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `bou_is_private` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boundary_clipping_region`
--

CREATE TABLE `boundary_clipping_region` (
  `bcr_id` int(11) NOT NULL,
  `bcr_boundary_id` int(11) NOT NULL COMMENT 'Límite.',
  `bcr_clipping_region_id` int(11) NOT NULL COMMENT 'Región de clipping'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boundary_group`
--

CREATE TABLE `boundary_group` (
  `bgr_id` int(11) NOT NULL,
  `bgr_caption` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de límites.',
  `bgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region`
--

CREATE TABLE `clipping_region` (
  `clr_id` int(11) NOT NULL,
  `clr_country_id` int(11) DEFAULT NULL,
  `clr_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la región ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere al registro Provincias.',
  `clr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `clr_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clr_priority` int(11) NOT NULL DEFAULT 0,
  `clr_is_crawler_indexer` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Indica si debe usarse como criterio de segmentación hacia crawlers',
  `clr_field_code_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la región (ej. ''codProv'')',
  `clr_index_code` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si se indexa el código de los elementos.',
  `clr_no_autocomplete` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si debe ofrecerse este nivel de regiones al hacerse un autocompletado para el ingreso de regiones.',
  `clr_labels_min_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clr_labels_max_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clr_metadata_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_geography`
--

CREATE TABLE `clipping_region_geography` (
  `crg_id` int(11) NOT NULL,
  `crg_geography_id` int(11) NOT NULL COMMENT 'Geografía',
  `crg_clipping_region_id` int(11) NOT NULL COMMENT 'Región.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_item`
--

CREATE TABLE `clipping_region_item` (
  `cli_id` int(11) NOT NULL,
  `cli_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la cartografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a  al registro Provincias.',
  `cli_clipping_region_id` int(11) NOT NULL COMMENT 'Región a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias).',
  `cli_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `cli_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `cli_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `cli_geometry_r1` geometry NOT NULL,
  `cli_geometry_r2` geometry NOT NULL,
  `cli_geometry_r3` geometry NOT NULL,
  `cli_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `cli_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `cli_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_item_geography_item`
--

CREATE TABLE `clipping_region_item_geography_item` (
  `cgi_id` int(11) NOT NULL,
  `cgi_clipping_region_item_id` int(11) NOT NULL COMMENT 'Ítem de la región de clipping.',
  `cgi_geography_item_id` int(11) NOT NULL COMMENT 'Ítem de la geografía.',
  `cgi_clipping_region_geography_id` int(11) NOT NULL COMMENT 'Referencia a la relación entre las entidades contenedoras de ambos ítems.',
  `cgi_intersection_percent` double NOT NULL COMMENT 'Área de intersección en m2.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact`
--

CREATE TABLE `contact` (
  `con_id` int(11) NOT NULL,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset`
--

CREATE TABLE `dataset` (
  `dat_id` int(11) NOT NULL,
  `dat_geography_id` int(11) NOT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_geography_segment_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del final del segment en dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_latitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.',
  `dat_longitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_partition_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_texture_id` int(11) DEFAULT NULL COMMENT 'Referencia al gradiente para generar rellenos',
  `dat_marker_id` int(11) NOT NULL,
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` bit(1) NOT NULL DEFAULT b'0',
  `dat_show_info` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si muestra el panel de resumen para los elementos del dataset',
  `dat_are_segments` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la georreferenciación fue por segmentos.',
  `dat_public_labels` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset_column`
--

CREATE TABLE `dataset_column` (
  `dco_id` int(11) NOT NULL,
  `dco_dataset_id` int(11) NOT NULL COMMENT 'Dataset al que pertenece la columna.',
  `dco_field` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Campo en la tabla importada.',
  `dco_variable` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `dco_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta a mostrar: si dco_label es nulo, es igual a dco_variable. Si no es igual a dco_label.',
  `dco_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Etiqueta original del campo.',
  `dco_column_width` int(11) NOT NULL,
  `dco_field_width` int(11) NOT NULL,
  `dco_decimals` int(11) NOT NULL,
  `dco_format` int(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Numérico.',
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset_column_value_label`
--

CREATE TABLE `dataset_column_value_label` (
  `dla_id` int(11) NOT NULL,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset_marker`
--

CREATE TABLE `dataset_marker` (
  `dmk_id` int(11) NOT NULL,
  `dmk_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` int(11) DEFAULT NULL COMMENT 'Columna conteniendo la columna para los marcadores basado en variable (columna).',
  `dmk_symbol` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.',
  `dmk_text` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_contact`
--

CREATE TABLE `draft_contact` (
  `con_id` int(11) NOT NULL,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset`
--

CREATE TABLE `draft_dataset` (
  `dat_id` int(11) NOT NULL,
  `dat_geography_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_geography_segment_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del final del segment en dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_latitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.',
  `dat_longitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_partition_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_texture_id` int(11) DEFAULT NULL COMMENT 'Referencia al gradiente para generar rellenos',
  `dat_marker_id` int(11) NOT NULL,
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` tinyint(1) NOT NULL DEFAULT 0,
  `dat_georeference_attributes` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dat_georeference_status` int(11) NOT NULL DEFAULT 0,
  `dat_show_info` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si muestra el panel de resumen para los elementos del dataset',
  `dat_are_segments` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la georreferenciación fue por segmentos.',
  `dat_public_labels` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset_column`
--

CREATE TABLE `draft_dataset_column` (
  `dco_id` int(11) NOT NULL,
  `dco_dataset_id` int(11) NOT NULL COMMENT 'Dataset al que pertenece la columna.',
  `dco_field` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Campo en la tabla importada.',
  `dco_variable` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `dco_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta a mostrar: si dco_label es nulo, es igual a dco_variable. Si no es igual a dco_label.',
  `dco_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Etiqueta original del campo.',
  `dco_column_width` int(11) NOT NULL,
  `dco_field_width` int(11) NOT NULL,
  `dco_decimals` int(11) NOT NULL,
  `dco_format` int(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Numérico.',
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_value_labels_are_dirty` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que los valores de texto correspondientes a etiquetas automáticas fueron modificados'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset_column_value_label`
--

CREATE TABLE `draft_dataset_column_value_label` (
  `dla_id` int(11) NOT NULL,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset_marker`
--

CREATE TABLE `draft_dataset_marker` (
  `dmk_id` int(11) NOT NULL COMMENT 'Identificador.',
  `dmk_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` int(11) DEFAULT NULL COMMENT 'Columna conteniendo la columna para los marcadores basados en variable (columna).',
  `dmk_symbol` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.',
  `dmk_text` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_file`
--

CREATE TABLE `draft_file` (
  `fil_id` int(11) NOT NULL,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_file_chunk`
--

CREATE TABLE `draft_file_chunk` (
  `chu_id` int(11) NOT NULL,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_institution`
--

CREATE TABLE `draft_institution` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.',
  `ins_watermark_id` int(11) DEFAULT NULL COMMENT 'Imagen de marca de agua institucional',
  `ins_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Color primario institucional'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata`
--

CREATE TABLE `draft_metadata` (
  `met_id` int(11) NOT NULL,
  `met_title` varchar(150) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_last_online_user_id` int(11) DEFAULT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(400) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto con descripción extendida de los metadatos',
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del emento',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata_file`
--

CREATE TABLE `draft_metadata_file` (
  `mfi_id` int(11) NOT NULL,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata_source`
--

CREATE TABLE `draft_metadata_source` (
  `msc_id` int(11) NOT NULL,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric`
--

CREATE TABLE `draft_metric` (
  `mtr_id` int(11) NOT NULL,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT 0,
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_metric_provider_id` int(11) DEFAULT NULL COMMENT 'Origen del que proviene la métrica.',
  `mtr_caption` varchar(150) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric_version`
--

CREATE TABLE `draft_metric_version` (
  `mvr_id` int(11) NOT NULL,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(20) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010).',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador al que pertenece la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.',
  `mvr_start_enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Triggers `draft_metric_version`
--
DELIMITER $$
CREATE TRIGGER `draft_metric_no_versions` AFTER DELETE ON `draft_metric_version` FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `draft_metric_no_versions_update` AFTER UPDATE ON `draft_metric_version` FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric_version_level`
--

CREATE TABLE `draft_metric_version_level` (
  `mvl_id` int(11) NOT NULL,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Triggers `draft_metric_version_level`
--
DELIMITER $$
CREATE TRIGGER `draft_metric_version_no_levels` AFTER DELETE ON `draft_metric_version_level` FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `draft_metric_version_no_levels_update` AFTER UPDATE ON `draft_metric_version_level` FOR EACH ROW BEGIN
		IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `draft_source`
--

CREATE TABLE `draft_source` (
  `src_id` int(11) NOT NULL,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_symbology`
--

CREATE TABLE `draft_symbology` (
  `vsy_id` int(11) NOT NULL,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_sequence_column_id` int(11) DEFAULT NULL COMMENT 'Columna que define el orden de la secuencia',
  `vsy_categories` int(11) NOT NULL DEFAULT 4 COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT 5 COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT 1 COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_custom_colors` varchar(60000) CHARACTER SET ascii DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo',
  `vsy_gradient_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado',
  `vsy_pattern` int(11) NOT NULL DEFAULT 0 COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT 1,
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores',
  `vsy_is_sequence` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si el indicador debe mostrar secuencialmente.',
  `vsy_id_ex` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_variable`
--

CREATE TABLE `draft_variable` (
  `mvv_id` int(11) NOT NULL,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Descripción autocalculada de la variable',
  `mvv_order` int(11) NOT NULL COMMENT 'Orden de presentación',
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_data_column_is_categorical` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT 100 COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato',
  `mvv_filter_value` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Expresión a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un número, un ''texto'', o una [columna]',
  `mvv_legend` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos',
  `mvv_perimeter` float DEFAULT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_variable_value_label`
--

CREATE TABLE `draft_variable_value_label` (
  `vvl_id` int(11) NOT NULL,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT 1,
  `vvl_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work`
--

CREATE TABLE `draft_work` (
  `wrk_id` int(11) NOT NULL,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_preview_file_id` int(11) DEFAULT NULL COMMENT 'Referencia a la vista previa para la cartografía',
  `wrk_is_private` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados',
  `wrk_is_indexed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador',
  `wrk_segmented_crawling` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si se segmenta al indexarse para crawlers',
  `wrk_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link',
  `wrk_last_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Resguarda el valor del último enlace cuando deja de usarse este modo de visibilidad.',
  `wrk_startup_id` int(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía',
  `wrk_metadata_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que cambiaron los metadatos de una obra.',
  `wrk_dataset_labels_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que cambió el nombre de una columna o las etiquetas de un dataset.',
  `wrk_dataset_data_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que cambiaron la cantidad de datasets, los valores de un dataset o sus agregaciones.',
  `wrk_metric_labels_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que se modificó el color o los textos de las variables o categorías, sin cambiar su cantidad o puntos de corte.',
  `wrk_metric_data_changed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica que se modificó la cantidad de variables o categorías de un metric.',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT 1,
  `wrk_unfinished` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la obra es el resultado de un clone interrumpido',
  `wrk_update` datetime DEFAULT NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.',
  `wrk_update_user_id` int(11) DEFAULT NULL COMMENT 'Indica el usuario que realizó la útlima modificación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work_extra_metric`
--

CREATE TABLE `draft_work_extra_metric` (
  `wmt_id` int(11) NOT NULL,
  `wmt_work_id` int(11) NOT NULL COMMENT 'Cartografía de la que indica la métrica adicional',
  `wmt_metric_id` int(11) NOT NULL COMMENT 'Métrica adicional',
  `wmt_start_active` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el indicador debe incorporarse al mapa al abrir el work'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work_icon`
--

CREATE TABLE `draft_work_icon` (
  `wic_id` int(11) NOT NULL,
  `wic_work_id` int(11) NOT NULL COMMENT 'Obra.',
  `wic_file_id` int(11) NOT NULL COMMENT 'Archivo.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work_permission`
--

CREATE TABLE `draft_work_permission` (
  `wkp_id` int(11) NOT NULL,
  `wkp_user_id` int(11) NOT NULL COMMENT 'Usuario al que se asigna el permiso',
  `wkp_work_id` int(11) NOT NULL COMMENT 'Obra sobre la que se asigna',
  `wkp_permission` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de permiso: ''V'': puede ver el backoffice. ''E'': puede editar. ''A'': puede administrar la obra'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work_startup`
--

CREATE TABLE `draft_work_startup` (
  `wst_id` int(11) NOT NULL,
  `wst_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=interactivo, R=región, L=ubicación, E=extensión (predeterminado)',
  `wst_clipping_region_item_id` int(11) DEFAULT NULL COMMENT 'Región de referencia',
  `wst_clipping_region_item_selected` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la región debe iniciarse como selección activa',
  `wst_center` point DEFAULT NULL COMMENT 'Ubicación del dentro de la vista',
  `wst_zoom` tinyint(1) DEFAULT NULL COMMENT 'Nivel de acercamiento para la vista',
  `wst_active_metrics` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indicadores del work que deben estar activos (lista separada por comas)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `file`
--

CREATE TABLE `file` (
  `fil_id` int(11) NOT NULL,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `file_chunk`
--

CREATE TABLE `file_chunk` (
  `chu_id` int(11) NOT NULL,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geography`
--

CREATE TABLE `geography` (
  `geo_id` int(11) NOT NULL,
  `geo_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la geografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a al registro Provincias.',
  `geo_country_id` int(11) NOT NULL,
  `geo_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `geo_root_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `geo_revision` varchar(10) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Permite complementar el caption en casos de geografías que mapean una misma unidad geográfica. En el caso de mapas censales, en geo_revision debe indicarse el año (ej. 2010, 2001).',
  `geo_area_avg_m2` double NOT NULL DEFAULT 0 COMMENT 'Tamaño promedio de las áreas de la geografía.',
  `geo_max_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Máximo zoom sugerido a utilizar ante la disponibilidad de niveles de menor desagregación (rango: 0 a 22).',
  `geo_min_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Mínimo zoom sugerido a utilizar ante la disponibilidad de niveles de mayor desagregación (rango: 0 a 22).',
  `geo_field_code_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la entidad (ej. ''codProv'')',
  `geo_field_code_size` int(11) NOT NULL COMMENT 'Tamaño de los valores de los códigos',
  `geo_field_code_type` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de dato del campo en el archivo dbf provisto por el usuario que indica el código de la entidad. Los valores posibles son: ''T'': texto, ''N'': numérico entero.',
  `geo_field_caption_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica la descripción de la entidad (ej. ''Descripcion'')',
  `geo_field_urbanity_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica si las zonas son de tipo urbano (1) o rural (0) (ej. ''urbano'')',
  `geo_is_tracking_level` tinyint(1) NOT NULL DEFAULT 0,
  `geo_use_for_clipping` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la geografía se debe considerar como serie para el cálculo de totales poblaciones. ',
  `geo_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `geo_metadata_id` int(11) DEFAULT NULL,
  `geo_gradient_id` int(11) DEFAULT NULL COMMENT 'Gradiente con el cual suavizar la información',
  `geo_gradient_luminance` float DEFAULT NULL COMMENT 'Intensidad predeterminada del gradiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geography_item`
--

CREATE TABLE `geography_item` (
  `gei_id` int(11) NOT NULL,
  `gei_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias 2010).',
  `gei_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia al ítem de geografía ''padre''. En el caso por ejemplo de Morón, su parent_id refiere a la provincia de Buenos Aires.',
  `gei_code` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `gei_code_as_number` decimal(12,0) DEFAULT NULL,
  `gei_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `gei_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `gei_geometry_is_null` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Permite indicar qué elementos no poseen geografía.',
  `gei_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `gei_area_m2` double DEFAULT NULL COMMENT 'Area en m2.',
  `gei_population` int(11) NOT NULL COMMENT 'Población total registrada en el ítem.',
  `gei_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en el ítem.',
  `gei_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en el ítem.',
  `gei_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, D: Urbano disperso,  R: Rural, L: Rural disperso, N: No corresponde. R y L corresponden a las categorias 2 y 3 la variable URP del Censo. U y D corresponden a la categoría 1 de URP, siendo D aquellas con < de 250 habitantes por km2.',
  `gei_geometry_r1` geometry NOT NULL,
  `gei_geometry_r2` geometry NOT NULL,
  `gei_geometry_r3` geometry NOT NULL,
  `gei_geometry_r4` geometry NOT NULL,
  `gei_geometry_r5` geometry NOT NULL,
  `gei_geometry_r6` geometry NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gradient`
--

CREATE TABLE `gradient` (
  `grd_id` int(11) NOT NULL COMMENT 'Id',
  `grd_country_id` int(11) NOT NULL COMMENT 'País de pertenencia',
  `grd_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Descripción del gradiente. Ej. AR-2010',
  `grd_image_type` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de imágenes. image/jpeg o image/png',
  `grd_max_zoom_level` int(11) NOT NULL COMMENT 'Nivel zoom hasta el que dispone de datos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Cabecera de gradientes para ajustar polígonos';

-- --------------------------------------------------------

--
-- Table structure for table `gradient_item`
--

CREATE TABLE `gradient_item` (
  `gri_id` int(11) NOT NULL COMMENT 'Id',
  `gri_gradient_id` int(11) NOT NULL COMMENT 'Gradiente de pertenencia',
  `gri_x` int(11) NOT NULL COMMENT 'Coordenada X',
  `gri_y` int(11) NOT NULL COMMENT 'Coordenada Y',
  `gri_z` int(11) NOT NULL COMMENT 'Coordenada Z',
  `gri_content` longblob NOT NULL COMMENT 'Contenido'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Detalle de los rasters por tile';

-- --------------------------------------------------------

--
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.',
  `ins_watermark_id` int(11) DEFAULT NULL COMMENT 'Imagen de marca de agua institucional',
  `ins_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Color primario institucional'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata`
--

CREATE TABLE `metadata` (
  `met_id` int(11) NOT NULL,
  `met_title` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_last_online_user_id` int(11) DEFAULT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(4096) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto con descripción extendida de los metadatos',
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del emento',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata_file`
--

CREATE TABLE `metadata_file` (
  `mfi_id` int(11) NOT NULL,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata_source`
--

CREATE TABLE `metadata_source` (
  `msc_id` int(11) NOT NULL,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric`
--

CREATE TABLE `metric` (
  `mtr_id` int(11) NOT NULL,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT 0,
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_metric_provider_id` int(11) DEFAULT NULL COMMENT 'Origen del que proviene la métrica.',
  `mtr_coverage_id` int(11) DEFAULT NULL,
  `mtr_caption` varchar(150) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).',
  `mtr_revision` bigint(20) NOT NULL DEFAULT 1 COMMENT 'Versión para el cacheo cliente del indicador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric_group`
--

CREATE TABLE `metric_group` (
  `lgr_id` int(11) NOT NULL,
  `lgr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de métricas.',
  `lgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `lgr_icon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono de la categoría.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric_provider`
--

CREATE TABLE `metric_provider` (
  `lpr_id` int(11) NOT NULL,
  `lpr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del origen de las métricas.',
  `lpr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric_version`
--

CREATE TABLE `metric_version` (
  `mvr_id` int(11) NOT NULL,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(20) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). ',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador de la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.',
  `mvr_start_enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Triggers `metric_version`
--
DELIMITER $$
CREATE TRIGGER `metric_no_versions` AFTER DELETE ON `metric_version` FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `metric_no_versions_update` AFTER UPDATE ON `metric_version` FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `metric_version_level`
--

CREATE TABLE `metric_version_level` (
  `mvl_id` int(11) NOT NULL,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Triggers `metric_version_level`
--
DELIMITER $$
CREATE TRIGGER `metric_version_no_levels` AFTER DELETE ON `metric_version_level` FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `metric_version_no_levels_update` AFTER UPDATE ON `metric_version_level` FOR EACH ROW BEGIN
		IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
			NOT EXISTS (SELECT * FROM metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `rev_id` int(11) NOT NULL,
  `rev_work_id` int(11) NOT NULL COMMENT 'Cartografía a la que refiere la revisión',
  `rev_submission_time` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha/hora en la que fue solicitada la revisión',
  `rev_resolution_time` timestamp NULL DEFAULT NULL COMMENT 'Fecha/hora en que fue dada la decisión de la revisión',
  `rev_decision` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Resultado de la revisión. A: Publicable, C: Cambios solicitados, R: Rechazada',
  `rev_reviewer_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios de los revisores',
  `rev_editor_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios del editor',
  `rev_extra_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos del proceso de revisión',
  `rev_user_submission_id` int(11) DEFAULT NULL COMMENT 'Usuario que solicitó la revisión',
  `rev_user_submission_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email del usuario que solicitó la revisión (toma un valor solamente si el usuario fue eliminado)',
  `rev_user_decision_id` int(11) DEFAULT NULL COMMENT 'Usuario que registró la decisión'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_boundary`
--

CREATE TABLE `snapshot_boundary` (
  `bow_id` int(11) NOT NULL,
  `bow_boundary_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bow_caption` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del límite',
  `bow_group` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Grupo del límite'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_boundary_item`
--

CREATE TABLE `snapshot_boundary_item` (
  `biw_id` int(11) NOT NULL,
  `biw_boundary_id` int(11) NOT NULL COMMENT 'Límite al que pertenece el ítem (ej. Catamarca puede pertenecer a \r\n\r\nProvincias).',
  `biw_clipping_region_item_id` int(11) NOT NULL COMMENT 'Región de recorte representada por la fila',
  `biw_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta de la región',
  `biw_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código de la región',
  `biw_centroid` point NOT NULL COMMENT 'Centroide de la región de recorte',
  `biw_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `biw_geometry_r1` geometry NOT NULL COMMENT 'Polígono de la región',
  `biw_geometry_r2` geometry NOT NULL,
  `biw_geometry_r3` geometry NOT NULL,
  `biw_envelope` polygon NOT NULL COMMENT 'Rectángulo envolvente del polígono'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_clipping_region_item_geography_item`
--

CREATE TABLE `snapshot_clipping_region_item_geography_item` (
  `cgv_id` int(11) NOT NULL,
  `cgv_clipping_region_id` int(11) NOT NULL,
  `cgv_clipping_region_priority` int(11) NOT NULL DEFAULT 0,
  `cgv_clipping_region_item_id` int(11) NOT NULL,
  `cgv_geography_id` int(11) NOT NULL,
  `cgv_geography_item_id` int(11) NOT NULL,
  `cgv_level` int(11) NOT NULL,
  `cgv_area_m2` double NOT NULL COMMENT 'Area de la geografía.',
  `cgv_population` int(11) NOT NULL COMMENT 'Cantidad total de personas en la geografía.',
  `cgv_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en la geografía.',
  `cgv_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en la geografía.',
  `cgv_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento de la geografía según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural: N: No corresponde.'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_geography_item`
--

CREATE TABLE `snapshot_geography_item` (
  `giw_id` int(11) NOT NULL,
  `giw_geography_item_id` int(11) NOT NULL,
  `giw_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `giw_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a \r\n\r\nProvincias 2010).',
  `giw_centroid` point NOT NULL,
  `giw_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `giw_population` int(11) NOT NULL COMMENT 'Población total registrada en el ítem.',
  `giw_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en el ítem.',
  `giw_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en el ítem.',
  `giw_geography_is_tracking_level` tinyint(1) DEFAULT NULL,
  `giw_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural, D: Urbano disperso, N: No corresponde.',
  `giw_geometry_r1` geometry NOT NULL,
  `giw_geometry_r2` geometry NOT NULL,
  `giw_geometry_r3` geometry NOT NULL,
  `giw_geometry_r4` geometry NOT NULL,
  `giw_geometry_r5` geometry NOT NULL,
  `giw_geometry_r6` geometry NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_lookup_clipping_region_item`
--

CREATE TABLE `snapshot_lookup_clipping_region_item` (
  `clc_id` int(11) NOT NULL,
  `clc_clipping_region_item_id` int(11) DEFAULT NULL,
  `clc_level` int(11) DEFAULT NULL,
  `clc_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clc_full_ids` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_code` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Código del item',
  `clc_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clc_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clc_population` int(11) NOT NULL DEFAULT 0 COMMENT 'Población declarada en la región de clippping',
  `clc_min_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clc_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clc_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clc_max_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clc_shard` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_lookup_feature`
--

CREATE TABLE `snapshot_lookup_feature` (
  `clf_id` int(11) NOT NULL,
  `clf_dataset_id` int(11) DEFAULT NULL,
  `clf_level` int(11) DEFAULT NULL,
  `clf_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clf_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clf_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clf_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clf_min_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clf_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clf_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clf_max_zoom` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clf_shard` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_metric_version`
--

CREATE TABLE `snapshot_metric_version` (
  `mvw_id` int(11) NOT NULL,
  `mvw_metric_id` int(11) NOT NULL,
  `mvw_metric_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del indicador',
  `mvw_metric_revision` bigint(20) NOT NULL DEFAULT 1 COMMENT 'Versión para el cacheo cliente del indicador',
  `mvw_metric_group_id` int(11) DEFAULT NULL,
  `mvw_metric_provider_id` int(11) DEFAULT NULL,
  `mvw_metric_version_id` int(11) NOT NULL,
  `mvw_caption` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `mvw_partial_coverage` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_level` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_work_id` int(11) NOT NULL COMMENT 'Identificador de la obra.',
  `mvw_work_caption` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tìtulo de la obra.',
  `mvw_work_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Autores de la cartografía',
  `mvw_work_institution` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Institución de la cartografía',
  `mvw_work_type` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de la obra',
  `mvw_work_is_private` tinyint(4) NOT NULL DEFAULT 0,
  `mvw_work_is_indexed` tinyint(4) NOT NULL DEFAULT 0,
  `mvw_work_access_link` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_variable_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las variables para los metric_version multimétricos. Los items se separan por un caracter \\n.',
  `mvw_variable_value_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las etiquetas de os valores de las variables. Los valores se encuentran separados por caracteres \\r. Para los metric_version multimétricos, los items correspondientes a cada variable se encuentran agrupados entre separadores \\n.'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_shape_dataset_item`
--

CREATE TABLE `snapshot_shape_dataset_item` (
  `sdi_id` int(11) NOT NULL,
  `sdi_dataset_id` int(11) NOT NULL,
  `sdi_dataset_item_id` int(11) NOT NULL,
  `sdi_feature_id` bigint(11) NOT NULL,
  `sdi_geometry` geometry NOT NULL,
  `sdi_centroid` point DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `source`
--

CREATE TABLE `source` (
  `src_id` int(11) NOT NULL,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `statistic`
--

CREATE TABLE `statistic` (
  `sta_id` int(11) NOT NULL,
  `sta_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mes al que corresponde la información.',
  `sta_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de registro. W: cartografía. M: métrica',
  `sta_element_id` int(11) NOT NULL COMMENT 'Id de la obra o la métrica',
  `sta_hits` int(11) NOT NULL DEFAULT 0 COMMENT 'Consultas',
  `sta_downloads` int(11) NOT NULL DEFAULT 0 COMMENT 'Descargas',
  `sta_google` int(11) NOT NULL DEFAULT 0 COMMENT 'Ingresos por una búsqueda desde google.',
  `sta_backoffice` int(11) NOT NULL DEFAULT 0 COMMENT 'Ingresos por backoffice'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `statistic_embedding`
--

CREATE TABLE `statistic_embedding` (
  `emb_id` int(11) NOT NULL,
  `emb_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_host_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_map_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_hits` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `symbology`
--

CREATE TABLE `symbology` (
  `vsy_id` int(11) NOT NULL,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_sequence_column_id` int(11) DEFAULT NULL COMMENT 'Columna que define el orden de la secuencia',
  `vsy_categories` int(11) NOT NULL DEFAULT 4 COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT 5 COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT 1 COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_custom_colors` varchar(60000) CHARACTER SET ascii DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo',
  `vsy_gradient_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado',
  `vsy_pattern` int(11) NOT NULL DEFAULT 0 COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT 0,
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT 1,
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores',
  `vsy_is_sequence` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si el indicador debe mostrar secuencialmente.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `usr_id` int(11) NOT NULL,
  `usr_email` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Dirección de correo con la que se identifica el usuario.',
  `usr_firstname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre completo de la persona.',
  `usr_lastname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `usr_facebook_oauth_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Identificación de ingreso integrado a Facebook',
  `usr_google_oauth_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indentificación de ingreso integrado a Google',
  `usr_password` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Contraseña.',
  `usr_create_time` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación del usuario.',
  `usr_privileges` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nivel de acceso del usuario (A=Administrador, L=Lector,E=Editor de capas, P=Usuario público)',
  `usr_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `usr_is_active` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el usuario ha sido activado.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_link`
--

CREATE TABLE `user_link` (
  `lnk_id` int(11) NOT NULL,
  `lnk_user_id` int(11) NOT NULL,
  `lnk_type` varchar(1) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_token` int(11) NOT NULL,
  `lnk_to` varchar(512) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_message` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lnk_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_session`
--

CREATE TABLE `user_session` (
  `ses_id` int(11) NOT NULL,
  `ses_user_id` int(11) NOT NULL,
  `ses_token` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `ses_create` datetime NOT NULL,
  `ses_last_login` datetime NOT NULL,
  `ses_last_ip` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `ses_user_agent` varchar(512) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_setting`
--

CREATE TABLE `user_setting` (
  `ust_id` int(11) NOT NULL,
  `ust_user_id` int(11) NOT NULL COMMENT 'Usuario al que pertenece el valor',
  `ust_key` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tag de identificación',
  `ust_value` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor plano o en format json'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variable`
--

CREATE TABLE `variable` (
  `mvv_id` int(11) NOT NULL,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `mvv_order` int(11) NOT NULL,
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_data_column_is_categorical` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT 100 COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato',
  `mvv_filter_value` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Expresión a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un número, un ''texto'', o una [columna]',
  `mvv_legend` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos',
  `mvv_perimeter` float DEFAULT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variable_value_label`
--

CREATE TABLE `variable_value_label` (
  `vvl_id` int(11) NOT NULL,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT 1,
  `vvl_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `version`
--

CREATE TABLE `version` (
  `ver_id` int(11) NOT NULL,
  `ver_name` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del ítem de versionado.',
  `ver_value` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Número de versión vigente.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work`
--

CREATE TABLE `work` (
  `wrk_id` int(11) NOT NULL,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_is_private` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados',
  `wrk_is_indexed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador',
  `wrk_segmented_crawling` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si se segmenta al indexarse para crawlers',
  `wrk_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link',
  `wrk_startup_id` int(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía',
  `wrk_published_by` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Usuario (direccion de email) que publicó la obra',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT 1,
  `wrk_update` datetime DEFAULT NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.',
  `wrk_update_user_id` int(11) DEFAULT NULL COMMENT 'Indica el usuario que realizó la útlima modificación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_extra_metric`
--

CREATE TABLE `work_extra_metric` (
  `wmt_id` int(11) NOT NULL,
  `wmt_work_id` int(11) NOT NULL COMMENT 'Cartografía de la que indica la métrica adicional',
  `wmt_metric_id` int(11) NOT NULL COMMENT 'Métrica adicional',
  `wmt_start_active` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el indicador debe incorporarse al mapa al abrir el work'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_icon`
--

CREATE TABLE `work_icon` (
  `wic_id` int(11) NOT NULL,
  `wic_work_id` int(11) NOT NULL COMMENT 'Obra.',
  `wic_file_id` int(11) NOT NULL COMMENT 'Archivo.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_space_usage`
--

CREATE TABLE `work_space_usage` (
  `wdu_id` int(11) NOT NULL,
  `wdu_work_id` int(11) NOT NULL COMMENT 'Obra referida',
  `wdu_draft_attachment_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en adjuntos de metadatos',
  `wdu_draft_data_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en tablas de datasets',
  `wdu_draft_index_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en índices de datasets',
  `wdu_attachment_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en adjuntos de metadatos publicados',
  `wdu_data_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en tablas de datasets publicados',
  `wdu_index_bytes` bigint(20) NOT NULL COMMENT 'Cantidad de espacio en índices de datasets publicados',
  `wdu_update_time` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_startup`
--

CREATE TABLE `work_startup` (
  `wst_id` int(11) NOT NULL,
  `wst_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=interactivo, R=región, L=ubicación, E=extensión (predeterminado)',
  `wst_clipping_region_item_id` int(11) DEFAULT NULL COMMENT 'Región de referencia',
  `wst_clipping_region_item_selected` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la región debe iniciarse como selección activa',
  `wst_center` point DEFAULT NULL COMMENT 'Ubicación del dentro de la vista',
  `wst_zoom` tinyint(1) DEFAULT NULL COMMENT 'Nivel de acercamiento para la vista',
  `wst_active_metrics` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indicadores del work que deben estar activos (lista separada por comas)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `boundary`
--
ALTER TABLE `boundary`
  ADD PRIMARY KEY (`bou_id`),
  ADD KEY `fw_boundary_group_idx` (`bou_group_id`),
  ADD KEY `fk_metadata_boundary_idx` (`bou_metadata_id`),
  ADD KEY `fk_boundary_geography_idx` (`bou_geography_id`);

--
-- Indexes for table `boundary_clipping_region`
--
ALTER TABLE `boundary_clipping_region`
  ADD PRIMARY KEY (`bcr_id`),
  ADD UNIQUE KEY `fw_bound_clip_unique` (`bcr_boundary_id`,`bcr_clipping_region_id`),
  ADD KEY `fw_boundary_relat_idx` (`bcr_boundary_id`),
  ADD KEY `fk_boundary_clipping_idx` (`bcr_clipping_region_id`);

--
-- Indexes for table `boundary_group`
--
ALTER TABLE `boundary_group`
  ADD PRIMARY KEY (`bgr_id`);

--
-- Indexes for table `clipping_region`
--
ALTER TABLE `clipping_region`
  ADD PRIMARY KEY (`clr_id`),
  ADD KEY `fk_geographies_geographies1_idx` (`clr_parent_id`),
  ADD KEY `fk_clipping_region_clipping_region_item1` (`clr_country_id`),
  ADD KEY `clipping_region_ibfk_1` (`clr_metadata_id`);

--
-- Indexes for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  ADD PRIMARY KEY (`crg_id`),
  ADD UNIQUE KEY `crg_cartography_id` (`crg_geography_id`,`crg_clipping_region_id`),
  ADD KEY `fk_clipping_regions_geographies_geographies1_idx` (`crg_geography_id`),
  ADD KEY `fk_clipping_regions_geographies_clipping_regions1_idx` (`crg_clipping_region_id`);

--
-- Indexes for table `clipping_region_item`
--
ALTER TABLE `clipping_region_item`
  ADD PRIMARY KEY (`cli_id`),
  ADD KEY `fk_clipping_regions_items_clipping_regions1_idx` (`cli_clipping_region_id`),
  ADD KEY `fk_clipping_regions_items_clipping_regions_items1_idx` (`cli_parent_id`);

--
-- Indexes for table `clipping_region_item_geography_item`
--
ALTER TABLE `clipping_region_item_geography_item`
  ADD PRIMARY KEY (`cgi_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx` (`cgi_clipping_region_item_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_geographies_items_idx` (`cgi_geography_item_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx1` (`cgi_clipping_region_geography_id`);

--
-- Indexes for table `contact`
--
ALTER TABLE `contact`
  ADD PRIMARY KEY (`con_id`);

--
-- Indexes for table `dataset`
--
ALTER TABLE `dataset`
  ADD PRIMARY KEY (`dat_id`),
  ADD UNIQUE KEY `datTable` (`dat_table`),
  ADD KEY `fk_datasets_methodology1_idx` (`dat_work_id`),
  ADD KEY `fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  ADD KEY `fk_datasets_geographies1_idx` (`dat_geography_id`),
  ADD KEY `dat_latitude_column_id` (`dat_latitude_column_id`),
  ADD KEY `dat_longitude_column_id` (`dat_longitude_column_id`),
  ADD KEY `fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  ADD KEY `dat_images_column_id` (`dat_images_column_id`) USING BTREE,
  ADD KEY `ft_dataset_gradient_idx` (`dat_texture_id`),
  ADD KEY `fk_dataset_marker_idx` (`dat_marker_id`),
  ADD KEY `fk_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id`),
  ADD KEY `fk_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id`),
  ADD KEY `fk_datasets_geograph_segment_idx` (`dat_geography_segment_id`);

--
-- Indexes for table `dataset_column`
--
ALTER TABLE `dataset_column`
  ADD PRIMARY KEY (`dco_id`),
  ADD KEY `fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  ADD KEY `fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`);

--
-- Indexes for table `dataset_column_value_label`
--
ALTER TABLE `dataset_column_value_label`
  ADD PRIMARY KEY (`dla_id`),
  ADD KEY `fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`);

--
-- Indexes for table `dataset_marker`
--
ALTER TABLE `dataset_marker`
  ADD PRIMARY KEY (`dmk_id`),
  ADD KEY `fp_dataset_marker_column1_idx` (`dmk_content_column_id`);

--
-- Indexes for table `draft_contact`
--
ALTER TABLE `draft_contact`
  ADD PRIMARY KEY (`con_id`);

--
-- Indexes for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  ADD PRIMARY KEY (`dat_id`),
  ADD UNIQUE KEY `draftDatTable` (`dat_table`),
  ADD KEY `draft_fk_datasets_methodology1_idx` (`dat_work_id`),
  ADD KEY `draft_fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  ADD KEY `draft_fk_datasets_geographies1_idx` (`dat_geography_id`),
  ADD KEY `draft_dat_latitude_column_id` (`dat_latitude_column_id`),
  ADD KEY `draft_dat_longitude_column_id` (`dat_longitude_column_id`),
  ADD KEY `draft_fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  ADD KEY `draft_dat_images_column_id` (`dat_images_column_id`) USING BTREE,
  ADD KEY `ft_draftdataset_gradient_idx` (`dat_texture_id`),
  ADD KEY `fk_draft_dataset_marker_idx` (`dat_marker_id`),
  ADD KEY `fk_draft_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id`),
  ADD KEY `fk_draft_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id`),
  ADD KEY `fk_draft_datasets_geograph_segment_idx` (`dat_geography_segment_id`);

--
-- Indexes for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  ADD PRIMARY KEY (`dco_id`),
  ADD KEY `draft_fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  ADD KEY `draft_fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`);

--
-- Indexes for table `draft_dataset_column_value_label`
--
ALTER TABLE `draft_dataset_column_value_label`
  ADD PRIMARY KEY (`dla_id`),
  ADD KEY `draft_fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`);

--
-- Indexes for table `draft_dataset_marker`
--
ALTER TABLE `draft_dataset_marker`
  ADD PRIMARY KEY (`dmk_id`),
  ADD KEY `fp_draft_dataset_marker_column1_idx` (`dmk_content_column_id`);

--
-- Indexes for table `draft_file`
--
ALTER TABLE `draft_file`
  ADD PRIMARY KEY (`fil_id`);

--
-- Indexes for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  ADD PRIMARY KEY (`chu_id`),
  ADD KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`);

--
-- Indexes for table `draft_institution`
--
ALTER TABLE `draft_institution`
  ADD PRIMARY KEY (`ins_id`),
  ADD KEY `fw_draft_ins_water` (`ins_watermark_id`);

--
-- Indexes for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  ADD PRIMARY KEY (`met_id`),
  ADD UNIQUE KEY `draft_metadata_ibfk_1` (`met_contact_id`) USING BTREE,
  ADD KEY `draft_metadata_ibfk_2` (`met_institution_id`),
  ADD KEY `fk_draft_publish_user_idx` (`met_last_online_user_id`);

--
-- Indexes for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  ADD PRIMARY KEY (`mfi_id`),
  ADD UNIQUE KEY `draft_unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  ADD UNIQUE KEY `draft_fk_work_file_file1_idx` (`mfi_file_id`) USING BTREE,
  ADD KEY `draft_fk_work_file_work1_idx` (`mfi_metadata_id`);

--
-- Indexes for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  ADD PRIMARY KEY (`msc_id`),
  ADD UNIQUE KEY `uniquemetasource` (`msc_metadata_id`,`msc_source_id`),
  ADD KEY `draft_metadata_source_source` (`msc_source_id`),
  ADD KEY `draft_metadata_source_metadata` (`msc_metadata_id`);

--
-- Indexes for table `draft_metric`
--
ALTER TABLE `draft_metric`
  ADD PRIMARY KEY (`mtr_id`),
  ADD KEY `draft_fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  ADD KEY `fk_draft_metric_symbology1` (`mtr_symbology_id`),
  ADD KEY `fk_draft_metrics_provider_g_idx` (`mtr_metric_provider_id`);

--
-- Indexes for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  ADD PRIMARY KEY (`mvr_id`),
  ADD UNIQUE KEY `ix_metric_metric_version_caption` (`mvr_metric_id`,`mvr_caption`),
  ADD KEY `fk_draft_metric_version_draft_metric1_idx` (`mvr_metric_id`),
  ADD KEY `fk_draft_work_id` (`mvr_work_id`);

--
-- Indexes for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  ADD PRIMARY KEY (`mvl_id`),
  ADD KEY `fk_draft_version_dataset` (`mvl_dataset_id`),
  ADD KEY `fk_draft_metric_version_level_draft_metric_version1_idx` (`mvl_metric_version_id`);

--
-- Indexes for table `draft_source`
--
ALTER TABLE `draft_source`
  ADD PRIMARY KEY (`src_id`),
  ADD UNIQUE KEY `draft_srcUnique2` (`src_caption`,`src_version`),
  ADD KEY `draft_source_ibfk_3` (`src_contact_id`),
  ADD KEY `draft_source_ibfk_5` (`src_institution_id`);

--
-- Indexes for table `draft_symbology`
--
ALTER TABLE `draft_symbology`
  ADD PRIMARY KEY (`vsy_id`),
  ADD KEY `fk_draft_sym_sequence_idx` (`vsy_sequence_column_id`);

--
-- Indexes for table `draft_variable`
--
ALTER TABLE `draft_variable`
  ADD PRIMARY KEY (`mvv_id`),
  ADD UNIQUE KEY `levelorder` (`mvv_metric_version_level_id`,`mvv_order`),
  ADD KEY `draft_fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  ADD KEY `draft_fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  ADD KEY `fk_draft_variable_norm_col` (`mvv_normalization_column_id`),
  ADD KEY `fk_draft_variable_symbology` (`mvv_symbology_id`);

--
-- Indexes for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  ADD PRIMARY KEY (`vvl_id`),
  ADD UNIQUE KEY `variableValor` (`vvl_variable_id`,`vvl_value`),
  ADD KEY `fk_draft_variable_value_label_draft_metric_version_variable_idx` (`vvl_variable_id`);

--
-- Indexes for table `draft_work`
--
ALTER TABLE `draft_work`
  ADD PRIMARY KEY (`wrk_id`),
  ADD KEY `draft_fk_work_file1_idx` (`wrk_image_id`),
  ADD KEY `draft_wk_type` (`wrk_type`),
  ADD KEY `draft_wrk_type` (`wrk_type`),
  ADD KEY `draft_work_ibfk_1` (`wrk_metadata_id`),
  ADD KEY `fk_draft_work_work_startup` (`wrk_startup_id`),
  ADD KEY `fk_draft_work_updated_user_idx` (`wrk_update_user_id`),
  ADD KEY `fk_preview_file_jd_idx` (`wrk_preview_file_id`);

--
-- Indexes for table `draft_work_extra_metric`
--
ALTER TABLE `draft_work_extra_metric`
  ADD PRIMARY KEY (`wmt_id`),
  ADD UNIQUE KEY `u_draft_work_extra_metric` (`wmt_work_id`,`wmt_metric_id`),
  ADD KEY `fk_draft_extra_work_metric_metric` (`wmt_metric_id`);

--
-- Indexes for table `draft_work_icon`
--
ALTER TABLE `draft_work_icon`
  ADD PRIMARY KEY (`wic_id`),
  ADD KEY `fw_draft_work_ico_idx` (`wic_work_id`),
  ADD KEY `fw_draft_ico_file_idx` (`wic_file_id`);

--
-- Indexes for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  ADD PRIMARY KEY (`wkp_id`),
  ADD KEY `fk_draft_work_permission_user1` (`wkp_user_id`),
  ADD KEY `fk_draft_work_permission_work1` (`wkp_work_id`);

--
-- Indexes for table `draft_work_startup`
--
ALTER TABLE `draft_work_startup`
  ADD PRIMARY KEY (`wst_id`),
  ADD KEY `fk_draft_work_startup_region` (`wst_clipping_region_item_id`);

--
-- Indexes for table `file`
--
ALTER TABLE `file`
  ADD PRIMARY KEY (`fil_id`);

--
-- Indexes for table `file_chunk`
--
ALTER TABLE `file_chunk`
  ADD PRIMARY KEY (`chu_id`),
  ADD KEY `fk_file_chunk_file1_idx` (`chu_file_id`);

--
-- Indexes for table `geography`
--
ALTER TABLE `geography`
  ADD PRIMARY KEY (`geo_id`),
  ADD KEY `fk_geographies_geographies1_idx` (`geo_parent_id`),
  ADD KEY `fk_cartography_clipping_region_item1` (`geo_country_id`),
  ADD KEY `geography_ibfk_1` (`geo_metadata_id`),
  ADD KEY `fk_geography_gradient` (`geo_gradient_id`);

--
-- Indexes for table `geography_item`
--
ALTER TABLE `geography_item`
  ADD PRIMARY KEY (`gei_id`),
  ADD UNIQUE KEY `carto_codes` (`gei_geography_id`,`gei_code`),
  ADD UNIQUE KEY `carto_codes_numbered` (`gei_geography_id`,`gei_code_as_number`),
  ADD KEY `fk_geographies_items_geographies1_idx` (`gei_geography_id`),
  ADD KEY `fk_geographies_items_geographies_items1_idx` (`gei_parent_id`);

--
-- Indexes for table `gradient`
--
ALTER TABLE `gradient`
  ADD PRIMARY KEY (`grd_id`),
  ADD KEY `fk_gradient_country` (`grd_country_id`);

--
-- Indexes for table `gradient_item`
--
ALTER TABLE `gradient_item`
  ADD PRIMARY KEY (`gri_id`),
  ADD UNIQUE KEY `gradient_item` (`gri_gradient_id`,`gri_x`,`gri_y`,`gri_z`);

--
-- Indexes for table `institution`
--
ALTER TABLE `institution`
  ADD PRIMARY KEY (`ins_id`),
  ADD KEY `fw_ins_water` (`ins_watermark_id`);

--
-- Indexes for table `metadata`
--
ALTER TABLE `metadata`
  ADD PRIMARY KEY (`met_id`),
  ADD KEY `metadata_ibfk_1` (`met_contact_id`),
  ADD KEY `metadata_ibfk_2` (`met_institution_id`),
  ADD KEY `fk_publish_user_idx` (`met_last_online_user_id`);

--
-- Indexes for table `metadata_file`
--
ALTER TABLE `metadata_file`
  ADD PRIMARY KEY (`mfi_id`),
  ADD UNIQUE KEY `unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  ADD KEY `fk_work_file_work1_idx` (`mfi_metadata_id`),
  ADD KEY `fk_work_file_file1_idx` (`mfi_file_id`);

--
-- Indexes for table `metadata_source`
--
ALTER TABLE `metadata_source`
  ADD UNIQUE KEY `uniquemetasource2` (`msc_metadata_id`,`msc_source_id`) USING BTREE,
  ADD KEY `metadata_source_source` (`msc_source_id`),
  ADD KEY `metadata_source_metadata` (`msc_metadata_id`);

--
-- Indexes for table `metric`
--
ALTER TABLE `metric`
  ADD PRIMARY KEY (`mtr_id`),
  ADD KEY `fk_metric_symbology1` (`mtr_symbology_id`),
  ADD KEY `fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  ADD KEY `fk_layer_clipping_region_item1` (`mtr_coverage_id`),
  ADD KEY `fk_metrics_provider_g_idx` (`mtr_metric_provider_id`);

--
-- Indexes for table `metric_group`
--
ALTER TABLE `metric_group`
  ADD PRIMARY KEY (`lgr_id`);

--
-- Indexes for table `metric_provider`
--
ALTER TABLE `metric_provider`
  ADD PRIMARY KEY (`lpr_id`);

--
-- Indexes for table `metric_version`
--
ALTER TABLE `metric_version`
  ADD PRIMARY KEY (`mvr_id`),
  ADD UNIQUE KEY `ixp_metric_metric_version_caption` (`mvr_metric_id`,`mvr_caption`),
  ADD KEY `fk_metric_version_metric1_idx` (`mvr_metric_id`),
  ADD KEY `fk_work_id2` (`mvr_work_id`);

--
-- Indexes for table `metric_version_level`
--
ALTER TABLE `metric_version_level`
  ADD PRIMARY KEY (`mvl_id`),
  ADD KEY `fk_version_dataset` (`mvl_dataset_id`),
  ADD KEY `fk_metric_version_level_metric_version1_idx` (`mvl_metric_version_id`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`rev_id`),
  ADD KEY `createdate` (`rev_submission_time`),
  ADD KEY `fw_rev_work_idx` (`rev_work_id`),
  ADD KEY `fw_rev_user_submission_idx` (`rev_user_submission_id`),
  ADD KEY `fw_rev_user_decision_idx` (`rev_user_decision_id`);

--
-- Indexes for table `snapshot_boundary`
--
ALTER TABLE `snapshot_boundary`
  ADD PRIMARY KEY (`bow_id`),
  ADD UNIQUE KEY `bow_boundary_id_UNIQUE` (`bow_boundary_id`);
ALTER TABLE `snapshot_boundary` ADD FULLTEXT KEY `bow_full_text` (`bow_caption`,`bow_group`);

--
-- Indexes for table `snapshot_boundary_item`
--
ALTER TABLE `snapshot_boundary_item`
  ADD PRIMARY KEY (`biw_id`),
  ADD UNIQUE KEY `ix_cai_b_id` (`biw_boundary_id`,`biw_clipping_region_item_id`),
  ADD SPATIAL KEY `ix_g_b_1` (`biw_geometry_r1`),
  ADD SPATIAL KEY `ix_envelope` (`biw_envelope`);

--
-- Indexes for table `snapshot_clipping_region_item_geography_item`
--
ALTER TABLE `snapshot_clipping_region_item_geography_item`
  ADD PRIMARY KEY (`cgv_id`),
  ADD KEY `ix_cliregion_carto` (`cgv_clipping_region_item_id`,`cgv_geography_id`),
  ADD KEY `ix_carto` (`cgv_geography_item_id`);

--
-- Indexes for table `snapshot_geography_item`
--
ALTER TABLE `snapshot_geography_item`
  ADD PRIMARY KEY (`giw_id`),
  ADD UNIQUE KEY `ix_cai_id` (`giw_geography_item_id`),
  ADD SPATIAL KEY `ix_g1` (`giw_geometry_r1`),
  ADD SPATIAL KEY `ix_g2` (`giw_geometry_r2`),
  ADD SPATIAL KEY `ix_g3` (`giw_geometry_r3`),
  ADD SPATIAL KEY `ix_g4` (`giw_geometry_r4`),
  ADD SPATIAL KEY `ix_g5` (`giw_geometry_r5`),
  ADD SPATIAL KEY `ix_g6` (`giw_geometry_r6`),
  ADD KEY `geography` (`giw_geography_id`);

--
-- Indexes for table `snapshot_lookup_clipping_region_item`
--
ALTER TABLE `snapshot_lookup_clipping_region_item`
  ADD PRIMARY KEY (`clc_id`),
  ADD SPATIAL KEY `lookup_spatial` (`clc_location`);
ALTER TABLE `snapshot_lookup_clipping_region_item` ADD FULLTEXT KEY `ix_lookup_caption` (`clc_caption`,`clc_tooltip`,`clc_full_parent`,`clc_code`);
ALTER TABLE `snapshot_lookup_clipping_region_item` ADD FULLTEXT KEY `ix_lookup_caption_only` (`clc_caption`);

--
-- Indexes for table `snapshot_lookup_feature`
--
ALTER TABLE `snapshot_lookup_feature`
  ADD PRIMARY KEY (`clf_id`),
  ADD UNIQUE KEY `ux_fid` (`clf_feature_ids`),
  ADD SPATIAL KEY `lookup_spatial` (`clf_location`),
  ADD KEY `snap_item_dataset` (`clf_dataset_id`);
ALTER TABLE `snapshot_lookup_feature` ADD FULLTEXT KEY `ix_lookup_caption` (`clf_caption`);

--
-- Indexes for table `snapshot_metric_version`
--
ALTER TABLE `snapshot_metric_version`
  ADD PRIMARY KEY (`mvw_id`),
  ADD KEY `ix_layer_version_view` (`mvw_metric_version_id`);
ALTER TABLE `snapshot_metric_version` ADD FULLTEXT KEY `ix_version_fulltext` (`mvw_metric_caption`,`mvw_caption`,`mvw_variable_captions`,`mvw_variable_value_captions`,`mvw_work_caption`,`mvw_work_authors`,`mvw_work_institution`);

--
-- Indexes for table `snapshot_shape_dataset_item`
--
ALTER TABLE `snapshot_shape_dataset_item`
  ADD PRIMARY KEY (`sdi_id`),
  ADD UNIQUE KEY `uniquenormal` (`sdi_dataset_id`,`sdi_dataset_item_id`),
  ADD UNIQUE KEY `unique` (`sdi_feature_id`),
  ADD SPATIAL KEY `geor6` (`sdi_geometry`);

--
-- Indexes for table `source`
--
ALTER TABLE `source`
  ADD PRIMARY KEY (`src_id`),
  ADD KEY `source_ibfk_3` (`src_contact_id`),
  ADD KEY `source_ibfk_5` (`src_institution_id`);

--
-- Indexes for table `statistic`
--
ALTER TABLE `statistic`
  ADD PRIMARY KEY (`sta_id`),
  ADD KEY `sta_month` (`sta_month`,`sta_type`);

--
-- Indexes for table `statistic_embedding`
--
ALTER TABLE `statistic_embedding`
  ADD PRIMARY KEY (`emb_id`),
  ADD UNIQUE KEY `ix_sta` (`emb_month`,`emb_host_url`,`emb_map_url`);

--
-- Indexes for table `symbology`
--
ALTER TABLE `symbology`
  ADD PRIMARY KEY (`vsy_id`),
  ADD KEY `fk_sym_sequence_idx` (`vsy_sequence_column_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`usr_id`),
  ADD UNIQUE KEY `idx_email` (`usr_email`);

--
-- Indexes for table `user_link`
--
ALTER TABLE `user_link`
  ADD PRIMARY KEY (`lnk_id`),
  ADD KEY `fk_user_user_link` (`lnk_user_id`);

--
-- Indexes for table `user_session`
--
ALTER TABLE `user_session`
  ADD PRIMARY KEY (`ses_id`),
  ADD UNIQUE KEY `ix_session_unique` (`ses_user_id`,`ses_token`);

--
-- Indexes for table `user_setting`
--
ALTER TABLE `user_setting`
  ADD PRIMARY KEY (`ust_id`),
  ADD UNIQUE KEY `uk_setting` (`ust_user_id`,`ust_key`);

--
-- Indexes for table `variable`
--
ALTER TABLE `variable`
  ADD PRIMARY KEY (`mvv_id`),
  ADD KEY `fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  ADD KEY `fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  ADD KEY `fk_variable_norm_col` (`mvv_normalization_column_id`),
  ADD KEY `fk_variable_symbology` (`mvv_symbology_id`);

--
-- Indexes for table `variable_value_label`
--
ALTER TABLE `variable_value_label`
  ADD PRIMARY KEY (`vvl_id`),
  ADD UNIQUE KEY `variableValorPub` (`vvl_variable_id`,`vvl_value`);

--
-- Indexes for table `version`
--
ALTER TABLE `version`
  ADD PRIMARY KEY (`ver_id`),
  ADD UNIQUE KEY `upt_name_UNIQUE` (`ver_name`);

--
-- Indexes for table `work`
--
ALTER TABLE `work`
  ADD PRIMARY KEY (`wrk_id`),
  ADD KEY `fk_work_file1_idx` (`wrk_image_id`),
  ADD KEY `wk_type` (`wrk_type`),
  ADD KEY `wrk_type` (`wrk_type`),
  ADD KEY `work_ibfk_1` (`wrk_metadata_id`),
  ADD KEY `fk_work_work_startup` (`wrk_startup_id`),
  ADD KEY `fk_work_updated_user_idx` (`wrk_update_user_id`);

--
-- Indexes for table `work_extra_metric`
--
ALTER TABLE `work_extra_metric`
  ADD PRIMARY KEY (`wmt_id`),
  ADD UNIQUE KEY `u_work_extra_metric` (`wmt_work_id`,`wmt_metric_id`),
  ADD KEY `fk_extra_work_metric_metric` (`wmt_metric_id`);

--
-- Indexes for table `work_icon`
--
ALTER TABLE `work_icon`
  ADD PRIMARY KEY (`wic_id`),
  ADD KEY `fw_work_ico_idx` (`wic_work_id`),
  ADD KEY `fw_ico_file_idx` (`wic_file_id`);

--
-- Indexes for table `work_space_usage`
--
ALTER TABLE `work_space_usage`
  ADD PRIMARY KEY (`wdu_id`),
  ADD KEY `wskpace_work_idx` (`wdu_work_id`);

--
-- Indexes for table `work_startup`
--
ALTER TABLE `work_startup`
  ADD PRIMARY KEY (`wst_id`),
  ADD KEY `fk_work_startup_region` (`wst_clipping_region_item_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `boundary`
--
ALTER TABLE `boundary`
  MODIFY `bou_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boundary_clipping_region`
--
ALTER TABLE `boundary_clipping_region`
  MODIFY `bcr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boundary_group`
--
ALTER TABLE `boundary_group`
  MODIFY `bgr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region`
--
ALTER TABLE `clipping_region`
  MODIFY `clr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  MODIFY `crg_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_item`
--
ALTER TABLE `clipping_region_item`
  MODIFY `cli_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_item_geography_item`
--
ALTER TABLE `clipping_region_item_geography_item`
  MODIFY `cgi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_contact`
--
ALTER TABLE `draft_contact`
  MODIFY `con_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  MODIFY `dat_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  MODIFY `dco_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset_column_value_label`
--
ALTER TABLE `draft_dataset_column_value_label`
  MODIFY `dla_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset_marker`
--
ALTER TABLE `draft_dataset_marker`
  MODIFY `dmk_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador.';

--
-- AUTO_INCREMENT for table `draft_file`
--
ALTER TABLE `draft_file`
  MODIFY `fil_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  MODIFY `chu_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_institution`
--
ALTER TABLE `draft_institution`
  MODIFY `ins_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  MODIFY `met_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  MODIFY `mfi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  MODIFY `msc_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric`
--
ALTER TABLE `draft_metric`
  MODIFY `mtr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  MODIFY `mvr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  MODIFY `mvl_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_source`
--
ALTER TABLE `draft_source`
  MODIFY `src_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_symbology`
--
ALTER TABLE `draft_symbology`
  MODIFY `vsy_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_variable`
--
ALTER TABLE `draft_variable`
  MODIFY `mvv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  MODIFY `vvl_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work`
--
ALTER TABLE `draft_work`
  MODIFY `wrk_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work_extra_metric`
--
ALTER TABLE `draft_work_extra_metric`
  MODIFY `wmt_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work_icon`
--
ALTER TABLE `draft_work_icon`
  MODIFY `wic_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  MODIFY `wkp_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work_startup`
--
ALTER TABLE `draft_work_startup`
  MODIFY `wst_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `geography`
--
ALTER TABLE `geography`
  MODIFY `geo_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `geography_item`
--
ALTER TABLE `geography_item`
  MODIFY `gei_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gradient`
--
ALTER TABLE `gradient`
  MODIFY `grd_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id';

--
-- AUTO_INCREMENT for table `gradient_item`
--
ALTER TABLE `gradient_item`
  MODIFY `gri_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id';

--
-- AUTO_INCREMENT for table `metric_group`
--
ALTER TABLE `metric_group`
  MODIFY `lgr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `metric_provider`
--
ALTER TABLE `metric_provider`
  MODIFY `lpr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `rev_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_boundary`
--
ALTER TABLE `snapshot_boundary`
  MODIFY `bow_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_boundary_item`
--
ALTER TABLE `snapshot_boundary_item`
  MODIFY `biw_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_clipping_region_item_geography_item`
--
ALTER TABLE `snapshot_clipping_region_item_geography_item`
  MODIFY `cgv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_geography_item`
--
ALTER TABLE `snapshot_geography_item`
  MODIFY `giw_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_lookup_clipping_region_item`
--
ALTER TABLE `snapshot_lookup_clipping_region_item`
  MODIFY `clc_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_lookup_feature`
--
ALTER TABLE `snapshot_lookup_feature`
  MODIFY `clf_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_metric_version`
--
ALTER TABLE `snapshot_metric_version`
  MODIFY `mvw_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_shape_dataset_item`
--
ALTER TABLE `snapshot_shape_dataset_item`
  MODIFY `sdi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `statistic`
--
ALTER TABLE `statistic`
  MODIFY `sta_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `statistic_embedding`
--
ALTER TABLE `statistic_embedding`
  MODIFY `emb_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `usr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_link`
--
ALTER TABLE `user_link`
  MODIFY `lnk_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_session`
--
ALTER TABLE `user_session`
  MODIFY `ses_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_setting`
--
ALTER TABLE `user_setting`
  MODIFY `ust_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `version`
--
ALTER TABLE `version`
  MODIFY `ver_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_extra_metric`
--
ALTER TABLE `work_extra_metric`
  MODIFY `wmt_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_icon`
--
ALTER TABLE `work_icon`
  MODIFY `wic_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_space_usage`
--
ALTER TABLE `work_space_usage`
  MODIFY `wdu_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_startup`
--
ALTER TABLE `work_startup`
  MODIFY `wst_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `boundary`
--
ALTER TABLE `boundary`
  ADD CONSTRAINT `fk_boundary_geography` FOREIGN KEY (`bou_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_boundary_group` FOREIGN KEY (`bou_group_id`) REFERENCES `boundary_group` (`bgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_metadata_boundary` FOREIGN KEY (`bou_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `boundary_clipping_region`
--
ALTER TABLE `boundary_clipping_region`
  ADD CONSTRAINT `fk_boundary_clipping` FOREIGN KEY (`bcr_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_boundary_relat` FOREIGN KEY (`bcr_boundary_id`) REFERENCES `boundary` (`bou_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `clipping_region`
--
ALTER TABLE `clipping_region`
  ADD CONSTRAINT `clipping_region_ibfk_1` FOREIGN KEY (`clr_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_region_clipping_region_item1` FOREIGN KEY (`clr_country_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geographies_geographies10` FOREIGN KEY (`clr_parent_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  ADD CONSTRAINT `fk_clipping_regions_geographies_clipping_regions1` FOREIGN KEY (`crg_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_regions_geographies_geographies1` FOREIGN KEY (`crg_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `dataset`
--
ALTER TABLE `dataset`
  ADD CONSTRAINT `dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_dataset_marker` FOREIGN KEY (`dat_marker_id`) REFERENCES `dataset_marker` (`dmk_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_datasets_columns_lat_segment` FOREIGN KEY (`dat_latitude_column_segment_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_columns_lon_segment` FOREIGN KEY (`dat_longitude_column_segment_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_geograph_segment` FOREIGN KEY (`dat_geography_segment_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `ft_dataset_gradient` FOREIGN KEY (`dat_texture_id`) REFERENCES `gradient` (`grd_id`) ON DELETE NO ACTION;

--
-- Constraints for table `dataset_column`
--
ALTER TABLE `dataset_column`
  ADD CONSTRAINT `fk_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `dataset_column_value_label`
--
ALTER TABLE `dataset_column_value_label`
  ADD CONSTRAINT `fk_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `dataset_marker`
--
ALTER TABLE `dataset_marker`
  ADD CONSTRAINT `fp_dataset_marker_column1` FOREIGN KEY (`dmk_content_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  ADD CONSTRAINT `draft_dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `draft_dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_dataset_marker` FOREIGN KEY (`dat_marker_id`) REFERENCES `draft_dataset_marker` (`dmk_id`) ON DELETE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_columns_lat_segment` FOREIGN KEY (`dat_latitude_column_segment_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_columns_lon_segment` FOREIGN KEY (`dat_longitude_column_segment_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_geograph_segment` FOREIGN KEY (`dat_geography_segment_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `ft_draft_dataset_gradient` FOREIGN KEY (`dat_texture_id`) REFERENCES `gradient` (`grd_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  ADD CONSTRAINT `fk_draft_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `draft_dataset` (`dat_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_dataset_column_value_label`
--
ALTER TABLE `draft_dataset_column_value_label`
  ADD CONSTRAINT `fk_draft_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_dataset_marker`
--
ALTER TABLE `draft_dataset_marker`
  ADD CONSTRAINT `fp_draft_dataset_marker_column1` FOREIGN KEY (`dmk_content_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  ADD CONSTRAINT `fk_draft_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `draft_institution`
--
ALTER TABLE `draft_institution`
  ADD CONSTRAINT `fw_draft_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `draft_file` (`fil_id`);

--
-- Constraints for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  ADD CONSTRAINT `draft_metadata_ibfk_1b` FOREIGN KEY (`met_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_ibfk_2` FOREIGN KEY (`met_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_publish_user` FOREIGN KEY (`met_last_online_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  ADD CONSTRAINT `draft_metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  ADD CONSTRAINT `draft_metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `draft_source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metric`
--
ALTER TABLE `draft_metric`
  ADD CONSTRAINT `fk_draft_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_metrics_provider_g` FOREIGN KEY (`mtr_metric_provider_id`) REFERENCES `metric_provider` (`lpr_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  ADD CONSTRAINT `fk_draft_metric_version_draft_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `draft_metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_id` FOREIGN KEY (`mvr_work_id`) REFERENCES `draft_work` (`wrk_id`);

--
-- Constraints for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  ADD CONSTRAINT `fk_draft_metric_version_level_draft_metric_version1` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `draft_metric_version` (`mvr_id`),
  ADD CONSTRAINT `fk_draft_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `draft_dataset` (`dat_id`);

--
-- Constraints for table `draft_source`
--
ALTER TABLE `draft_source`
  ADD CONSTRAINT `draft_source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_symbology`
--
ALTER TABLE `draft_symbology`
  ADD CONSTRAINT `fk_draft_sym_sequence` FOREIGN KEY (`vsy_sequence_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_variable`
--
ALTER TABLE `draft_variable`
  ADD CONSTRAINT `fk_draft_metric_version_data_col` FOREIGN KEY (`mvv_data_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_variable_norm_col` FOREIGN KEY (`mvv_normalization_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_variable_symbology` FOREIGN KEY (`mvv_symbology_id`) REFERENCES `draft_symbology` (`vsy_id`),
  ADD CONSTRAINT `fk_version_level_variable` FOREIGN KEY (`mvv_metric_version_level_id`) REFERENCES `draft_metric_version_level` (`mvl_id`);

--
-- Constraints for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  ADD CONSTRAINT `fw_draft_variable` FOREIGN KEY (`vvl_variable_id`) REFERENCES `draft_variable` (`mvv_id`);

--
-- Constraints for table `draft_work`
--
ALTER TABLE `draft_work`
  ADD CONSTRAINT `draft_work_ibfk_1` FOREIGN KEY (`wrk_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_file1` FOREIGN KEY (`wrk_image_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_updated_user` FOREIGN KEY (`wrk_update_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_preview_file_jd` FOREIGN KEY (`wrk_preview_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_work_extra_metric`
--
ALTER TABLE `draft_work_extra_metric`
  ADD CONSTRAINT `fk_draft_extra_work_metric_metric` FOREIGN KEY (`wmt_metric_id`) REFERENCES `draft_metric` (`mtr_id`),
  ADD CONSTRAINT `fk_draft_extra_work_metric_work` FOREIGN KEY (`wmt_work_id`) REFERENCES `draft_work` (`wrk_id`);

--
-- Constraints for table `draft_work_icon`
--
ALTER TABLE `draft_work_icon`
  ADD CONSTRAINT `fw_draft_ico_file` FOREIGN KEY (`wic_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION,
  ADD CONSTRAINT `fw_draft_work_ico` FOREIGN KEY (`wic_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION;

--
-- Constraints for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  ADD CONSTRAINT `fk_draft_work_permission_user1` FOREIGN KEY (`wkp_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_permission_work1` FOREIGN KEY (`wkp_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_work_startup`
--
ALTER TABLE `draft_work_startup`
  ADD CONSTRAINT `fk_draft_work_startup_region` FOREIGN KEY (`wst_clipping_region_item_id`) REFERENCES `clipping_region_item` (`cli_id`);

--
-- Constraints for table `file_chunk`
--
ALTER TABLE `file_chunk`
  ADD CONSTRAINT `fk_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `geography`
--
ALTER TABLE `geography`
  ADD CONSTRAINT `fk_geographies_geographies1` FOREIGN KEY (`geo_parent_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geography_clipping_region_item1` FOREIGN KEY (`geo_country_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geography_gradient` FOREIGN KEY (`geo_gradient_id`) REFERENCES `gradient` (`grd_id`),
  ADD CONSTRAINT `geography_ibfk_1` FOREIGN KEY (`geo_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `geography_item`
--
ALTER TABLE `geography_item`
  ADD CONSTRAINT `fk_geographies_items_geographies1` FOREIGN KEY (`gei_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geographies_items_geographies_items1` FOREIGN KEY (`gei_parent_id`) REFERENCES `geography_item` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `gradient`
--
ALTER TABLE `gradient`
  ADD CONSTRAINT `fk_gradient_country` FOREIGN KEY (`grd_country_id`) REFERENCES `clipping_region_item` (`cli_id`);

--
-- Constraints for table `gradient_item`
--
ALTER TABLE `gradient_item`
  ADD CONSTRAINT `fk_gradient_item` FOREIGN KEY (`gri_gradient_id`) REFERENCES `gradient` (`grd_id`);

--
-- Constraints for table `institution`
--
ALTER TABLE `institution`
  ADD CONSTRAINT `fw_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE;

--
-- Constraints for table `metadata`
--
ALTER TABLE `metadata`
  ADD CONSTRAINT `fk_publish_user` FOREIGN KEY (`met_last_online_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_ibfk_1` FOREIGN KEY (`met_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_ibfk_2` FOREIGN KEY (`met_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metadata_file`
--
ALTER TABLE `metadata_file`
  ADD CONSTRAINT `metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `metadata_source`
--
ALTER TABLE `metadata_source`
  ADD CONSTRAINT `metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metric`
--
ALTER TABLE `metric`
  ADD CONSTRAINT `fk_metric_clipping_region_item1` FOREIGN KEY (`mtr_coverage_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_metrics_provider_g` FOREIGN KEY (`mtr_metric_provider_id`) REFERENCES `metric_provider` (`lpr_id`) ON DELETE NO ACTION;

--
-- Constraints for table `metric_version`
--
ALTER TABLE `metric_version`
  ADD CONSTRAINT `fk_metric_version_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_work_id2` FOREIGN KEY (`mvr_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `metric_version_level`
--
ALTER TABLE `metric_version_level`
  ADD CONSTRAINT `fk_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fw_metric_version` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `metric_version` (`mvr_id`) ON DELETE CASCADE;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `fw_rev_user_decision` FOREIGN KEY (`rev_user_decision_id`) REFERENCES `user` (`usr_id`),
  ADD CONSTRAINT `fw_rev_user_submission` FOREIGN KEY (`rev_user_submission_id`) REFERENCES `user` (`usr_id`),
  ADD CONSTRAINT `fw_rev_work` FOREIGN KEY (`rev_work_id`) REFERENCES `draft_work` (`wrk_id`);

--
-- Constraints for table `source`
--
ALTER TABLE `source`
  ADD CONSTRAINT `source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `symbology`
--
ALTER TABLE `symbology`
  ADD CONSTRAINT `fk_sym_sequence` FOREIGN KEY (`vsy_sequence_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `user_setting`
--
ALTER TABLE `user_setting`
  ADD CONSTRAINT `setting_user` FOREIGN KEY (`ust_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `variable`
--
ALTER TABLE `variable`
  ADD CONSTRAINT `fk_metric_version_data_col` FOREIGN KEY (`mvv_data_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_variable_norm_col` FOREIGN KEY (`mvv_normalization_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_variable_symbology` FOREIGN KEY (`mvv_symbology_id`) REFERENCES `symbology` (`vsy_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_version_level_variable2` FOREIGN KEY (`mvv_metric_version_level_id`) REFERENCES `metric_version_level` (`mvl_id`) ON DELETE CASCADE;

--
-- Constraints for table `variable_value_label`
--
ALTER TABLE `variable_value_label`
  ADD CONSTRAINT `fw_variable` FOREIGN KEY (`vvl_variable_id`) REFERENCES `variable` (`mvv_id`) ON DELETE CASCADE;

--
-- Constraints for table `work`
--
ALTER TABLE `work`
  ADD CONSTRAINT `fk_work_updated_user` FOREIGN KEY (`wrk_update_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `work_extra_metric`
--
ALTER TABLE `work_extra_metric`
  ADD CONSTRAINT `fk_extra_work_metric_metric` FOREIGN KEY (`wmt_metric_id`) REFERENCES `metric` (`mtr_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_extra_work_metric_work` FOREIGN KEY (`wmt_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE;

--
-- Constraints for table `work_icon`
--
ALTER TABLE `work_icon`
  ADD CONSTRAINT `fw_ico_file` FOREIGN KEY (`wic_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fw_work_ico` FOREIGN KEY (`wic_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE;

--
-- Constraints for table `work_space_usage`
--
ALTER TABLE `work_space_usage`
  ADD CONSTRAINT `wskpace_work` FOREIGN KEY (`wdu_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `work_startup`
--
ALTER TABLE `work_startup`
  ADD CONSTRAINT `fk_work_startup_region` FOREIGN KEY (`wst_clipping_region_item_id`) REFERENCES `clipping_region_item` (`cli_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


--
-- Dumping data for table `version`
--

INSERT INTO `version` (`ver_id`, `ver_name`, `ver_value`) VALUES
(1, 'DB', '096'),
(2, 'APP', '-'),
(3, 'CARTO_GEO', '1095'),
(4, 'LOOKUP_VIEW', '261'),
(5, 'CARTOGRAPHY_VIEW', '251'),
(6, 'CARTOGRAPHY_REGION_VIEW', '291'),
(7, 'SHAPE_VIEW', '210'),
(8, 'FAB_METRICS', '1299'),
(9, 'LOOKUP_REGIONS', '1629'),
(10, 'BOUNDARY_VIEW', '65');

INSERT INTO `user` VALUES (1,'admin','Administrador','Administrador',NULL,NULL,'$2y$10$3ZM..N0URJfcwxgeL7QHQepGCbbbWYxrWsDk4yS.MfmMJB53UE6Zi','2019-07-12 21:19:02','A',0,1),(181,'test','Test','User',NULL,NULL,'$NO_INTERACTIVE','2020-01-01 14:00:00','A',0,1);

ALTER TABLE `dataset`
ADD COLUMN `dat_partition_mandatory` TINYINT(1) NOT NULL DEFAULT '1' AFTER `dat_partition_column_id`,
ADD COLUMN `dat_partition_all_label` VARCHAR(50) NOT NULL DEFAULT 'Todos' AFTER `dat_partition_mandatory`;

ALTER TABLE `draft_dataset`
ADD COLUMN `dat_partition_mandatory` TINYINT(1) NOT NULL DEFAULT '1' AFTER `dat_partition_column_id`,
ADD COLUMN `dat_partition_all_label` VARCHAR(50) NOT NULL DEFAULT 'Todos' AFTER `dat_partition_mandatory`;

UPDATE version SET ver_value = '097' WHERE ver_name = 'DB';

ALTER TABLE `dataset`
ADD COLUMN `dat_skip_empty_fields` TINYINT(1) NOT NULL DEFAULT '0' AFTER `dat_show_info`;
ALTER TABLE `draft_dataset`
ADD COLUMN `dat_skip_empty_fields` TINYINT(1) NOT NULL DEFAULT '0' AFTER `dat_show_info`;

ALTER TABLE `draft_metadata`
ADD COLUMN `met_methods` TEXT NULL AFTER `met_abstract_long`,
ADD COLUMN `met_references` TEXT NULL AFTER `met_methods`,
CHANGE COLUMN `met_abstract` `met_abstract` VARCHAR(1500) NOT NULL COMMENT 'Resumen' ;

ALTER TABLE `metadata`
ADD COLUMN `met_methods` TEXT NULL AFTER `met_abstract_long`,
ADD COLUMN `met_references` TEXT NULL AFTER `met_methods`,
CHANGE COLUMN `met_abstract` `met_abstract` VARCHAR(1500) NOT NULL COMMENT 'Resumen' ;


UPDATE version SET ver_value = '101' WHERE ver_name = 'DB';

DROP FUNCTION `EllipseContainsMultiPolygon`;
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
END$$
DELIMITER ;

DROP FUNCTION `PolygonsOverlap`;
DELIMITER $$
CREATE FUNCTION `PolygonsOverlap`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;
DECLARE g2 POLYGON;
SET n = 0;
SET c = ST_NumGeometries(ele);

  count2_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      SET g2 = ST_GeometryN(ele, i);
      IF ST_Intersects(g, g2) AND
      (ST_Overlaps(g, g2) OR ST_Contains(g, g2) OR ST_Within(g, g2)) THEN
        RETURN 1;
      END IF;
      IF i >= c THEN
        LEAVE count3_loop;
      END IF;
    END LOOP;

    IF n >= c THEN
        LEAVE count2_loop;
      END IF;
 END LOOP;

 RETURN 0;
END$$
DELIMITER ;