DROP function IF EXISTS `PolygonsOverlap`;


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

DELIMITER ;

UPDATE version SET ver_value = '059' WHERE ver_name = 'DB';