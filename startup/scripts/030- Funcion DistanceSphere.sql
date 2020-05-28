DROP FUNCTION IF EXISTS `DistanceSphere`;

DELIMITER //
CREATE FUNCTION `DistanceSphere`(`pt1` POINT, `pt2` POINT, `useST` BOOL) RETURNS
	DOUBLE
	NO SQL
	DETERMINISTIC
	SQL SECURITY INVOKER
BEGIN
	IF useST THEN
		RETURN ST_DISTANCE_SPHERE(pt1, pt2);
	ELSE
		RETURN 6371000 * 2 * ASIN(SQRT(
			POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * PI() / 180 / 2), 2)
			+ COS(ST_Y(pt1) * PI() / 180) * COS(ST_Y(pt2)
			* PI() / 180) * POWER(
			SIN((ST_X(pt2) - ST_X(pt1)) * PI() / 180 / 2), 2)
		));
	END IF;
END//
DELIMITER ;

UPDATE version SET ver_value = '030' WHERE ver_name = 'DB';

