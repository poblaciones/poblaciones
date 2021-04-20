DROP function IF EXISTS `NearestSnapshotRangePoint`;

DELIMITER $$
CREATE FUNCTION `NearestSnapshotRangePoint`(sessionId VARCHAR(20), p POINT, mbrSize DOUBLE, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    RETURN (select sna_id FROM
			(SELECT sna_id, DistanceSphere(p, sna_location) d
				FROM tmp_calculate_metric
				WHERE MBRCONTAINS(SquareBuffer(p, mbrSize ), sna_location) AND (r IS NULL
                OR sna_r = r)
				ORDER BY DistanceSphere(p, sna_location) LIMIT 1) as candidate
                WHERE d <= sizeM);
END$$

DELIMITER ;

UPDATE version SET ver_value = '068' WHERE ver_name = 'DB';