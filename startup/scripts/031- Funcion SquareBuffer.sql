DROP FUNCTION IF EXISTS `SquareBuffer`;

DELIMITER $$
CREATE FUNCTION `SquareBuffer`(p POINT, sizeM DOUBLE) RETURNS
	POLYGON
	NO SQL
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

DELIMITER ;

UPDATE version SET ver_value = '031' WHERE ver_name = 'DB';

