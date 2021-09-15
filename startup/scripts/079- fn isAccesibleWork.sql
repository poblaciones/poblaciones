DROP function IF EXISTS `IsAccessibleWork`;

DELIMITER $$
CREATE FUNCTION `IsAccessibleWork`(userId INT,
	workId INT,
    workIsIndexed TINYINT,
    workIsPrivate TINYINT) RETURNS BOOL
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE unshardified INT;

IF (workIsIndexed = 1 AND workIsPrivate = 0) THEN
	RETURN 1;
END IF;

IF (userId IS NULL) THEN
	RETURN 0;
END IF;

SET unshardified = CAST(workId / 100 AS SIGNED);

IF EXISTS(SELECT * FROM draft_work_permission
		WHERE wkp_user_id = userId AND wkp_work_id = unshardified) THEN
	RETURN 1;
ELSE
	RETURN 0;
END IF;

END$$

DELIMITER ;

UPDATE version SET ver_value = '079' WHERE ver_name = 'DB';