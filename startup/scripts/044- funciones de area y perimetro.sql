DROP FUNCTION IF EXISTS MultiPolygonIsValid;
DELIMITER $$
CREATE FUNCTION `MultiPolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
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
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS GeometryAreaSphere;
DELIMITER $$
CREATE FUNCTION `GeometryAreaSphere`(ele GEOMETRY) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS MultiPolygonAreaSphere;
DELIMITER $$
CREATE FUNCTION `MultiPolygonAreaSphere`(ele GEOMETRY) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS PolygonAreaSphere;
DELIMITER $$

CREATE FUNCTION `PolygonAreaSphere`(p POLYGON) RETURNS double
    NO SQL
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
    SET sum = RingAreaSphere(ST_InteriorRingN(p, n));

    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;

END$$
DELIMITER ;

DROP FUNCTION IF EXISTS GeometryPerimeterSphere;
DELIMITER $$
CREATE FUNCTION `GeometryPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS RingPerimeterSphere;
DELIMITER $$
CREATE FUNCTION `RingPerimeterSphere`(ls LINESTRING) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS MultiLineStringPerimeterSphere;
DELIMITER $$
CREATE FUNCTION `MultiLineStringPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS MultiPolygonPerimeterSphere;
DELIMITER $$
CREATE FUNCTION `MultiPolygonPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
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
DELIMITER ;


DROP FUNCTION IF EXISTS PolygonPerimeterSphere;
DELIMITER $$

CREATE FUNCTION `PolygonPerimeterSphere`(p POLYGON) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

RETURN RingPerimeterSphere(ST_ExteriorRing(p));

END$$
DELIMITER ;

DROP FUNCTION IF EXISTS RingAreaSphere;
DELIMITER $$

CREATE FUNCTION `RingAreaSphere`(ls LINESTRING) RETURNS double
    NO SQL
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
-- 5.10072e+14
RETURN 5.10072e+14 * LEAST(ABS(sum)/4/PI, 1-ABS(sum)/4/PI);

END$$
DELIMITER ;



UPDATE version SET ver_value = '044' WHERE ver_name = 'DB';