DROP FUNCTION IF EXISTS `NearestSnapshot`;

DELIMITER $$

CREATE FUNCTION `NearestSnapshot`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS
	INT(11)
	READS SQL DATA
	DETERMINISTIC
	SQL SECURITY INVOKER
BEGIN
	DECLARE ret INTEGER;
	SET ret = NULL;

	IF sizeM > 1000 THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, 1000), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	IF ret IS NULL AND sizeM > 10000 THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, 10000), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	IF ret IS NULL THEN
		SET ret = (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
	END IF;

	RETURN ret;
END$$

DELIMITER ;

UPDATE version SET ver_value = '032' WHERE ver_name = 'DB';

