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


UPDATE version SET ver_value = '099' WHERE ver_name = 'DB';
