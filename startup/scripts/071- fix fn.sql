DROP function IF EXISTS `PolygonAreaSphere`;

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
    SET sum = sum - ABS(RingAreaSphere(ST_InteriorRingN(p, n)));

    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

RETURN sum;

END$$

DELIMITER ;

UPDATE version SET ver_value = '071' WHERE ver_name = 'DB';