DELIMITER $$

CREATE FUNCTION `GeometryIsMinSize`(`geom` GEOMETRY, `width` DOUBLE, `height` DOUBLE) 
RETURNS BOOLEAN DETERMINISTIC NO SQL SQL SECURITY INVOKER BEGIN 

DECLARE envelope LINESTRING; 
DECLARE p1 POINT; 
DECLARE p2 POINT; 
SET envelope = ST_ExteriorRing(ST_Envelope(geom)); 
SET p1 = ST_POINTN(envelope, 1); 
SET p2 = ST_POINTN(envelope, 3); 
RETURN X(p2)-X(p1) > width AND Y(p2) - Y(p1) > height; 
END$$

DELIMITER ;

UPDATE version SET ver_value = '005' WHERE ver_name = 'DB';