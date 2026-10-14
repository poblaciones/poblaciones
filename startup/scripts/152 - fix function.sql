drop function UserFullNameById;
DELIMITER $$
CREATE  FUNCTION `UserFullNameById`(`id` INT) RETURNS varchar(100) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF id IS NULL THEN
RETURN null;
END IF;

RETURN (SELECT TRIM(CONCAT(usr_firstname, ' ', usr_lastname)) FROM `user` WHERE usr_id = id);
END$$
DELIMITER ;

UPDATE version SET ver_value = '152' WHERE ver_name = 'DB';