DELIMITER $$

CREATE FUNCTION `GeometryIsMinSize`(`geom` GEOMETRY, `width` DOUBLE, `height` DOUBLE)
RETURNS BOOLEAN DETERMINISTIC NO SQL SQL SECURITY INVOKER BEGIN

DECLARE envelope LINESTRING;
DECLARE p1 POINT;
DECLARE p2 POINT;
SET envelope = ST_ExteriorRing(ST_Envelope(geom));
SET p1 = ST_POINTN(envelope, 1);
SET p2 = ST_POINTN(envelope, 3);
RETURN ST_X(p2) - ST_X(p1) > width AND ST_Y(p2) - ST_Y(p1) > height;
END$$

DELIMITER ;

UPDATE version SET ver_value = '005' WHERE ver_name = 'DB';
