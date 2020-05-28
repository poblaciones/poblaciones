DROP FUNCTION IF EXISTS `NearestSnapshot`;

DELIMITER $$

CREATE FUNCTION `NearestSnapshot`(sessionId int, p POINT, sizeM DOUBLE, useST BOOL) RETURNS
	INT(11)
	READS SQL DATA
	DETERMINISTIC
	SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;

	SET ret = 0;

	IF ret = 0 AND sizeM > 1000 THEN
		SET ret = (SELECT sna_id FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, 1000), sna_location)
		ORDER BY DistanceSphere(p, sna_location, useST) LIMIT 1);
	END IF;

	IF ret = 0 AND sizeM > 10000 THEN
		SET ret = (SELECT sna_id FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, 10000), sna_location)
		ORDER BY DistanceSphere(p, sna_location, useST) LIMIT 1);
	END IF;

	IF ret = 0 THEN
		SET ret = (SELECT sna_id FROM tmp_calculate_metric
		WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location)
		ORDER BY DistanceSphere(p, sna_location, useST) LIMIT 1);
	END IF;

	RETURN ret;
END$$

DELIMITER ;

UPDATE version SET ver_value = '032' WHERE ver_name = 'DB';

