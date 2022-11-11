DROP FUNCTION `LineStringCentroid`;

DELIMITER $$

CREATE FUNCTION `LineStringCentroid`(`ele` GEOMETRY) RETURNS POINT DETERMINISTIC NO SQL SQL SECURITY INVOKER BEGIN

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

DELIMITER ;

UPDATE version SET ver_value = '095' WHERE ver_name = 'DB';