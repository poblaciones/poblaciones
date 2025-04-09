drop function `PolygonEnvelope`;

DELIMITER $$
CREATE FUNCTION `PolygonEnvelope`(`g` GEOMETRY) RETURNS polygon
    NO SQL
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
WHEN 'LINESTRING' THEN POLYGON(LINESTRING(ST_PointN(envelope, 1), ST_PointN(envelope, 2), ST_PointN(envelope, 2), ST_PointN(envelope, 1) ))
WHEN 'POINT' THEN POLYGON(LINESTRING(envelope, envelope, envelope, envelope))
END;

END$$
DELIMITER ;


UPDATE version SET ver_value = '120' WHERE ver_name = 'DB';

