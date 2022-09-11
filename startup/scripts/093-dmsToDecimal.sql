DROP function IF EXISTS `DmsToDecimal`;

DELIMITER $$
USE `aacademi_maps_prod`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `DmsToDecimal`(`dms` VARCHAR(50)) RETURNS decimal(20,9)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
    DECLARE deg decimal(20,9);
    DECLARE mins decimal(20,9);
    DECLARE secs decimal(20 ,9);
    DECLARE sign integer;
    IF dms IS NULL OR dms = "" THEN
      RETURN null;
    END IF;
    SET dms = UPPER(TRIM(REPLACE(dms, ",", ".")));
    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(20,9));
    END IF;
return null;

    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(20,9));
    END IF;

    SET deg = CAST(  SUBSTRING_INDEX(dms, '°', 1) AS decimal(20,9));
    SET mins = CAST( (SUBSTR(dms, POSITION('°' IN dms) + 1, POSITION("'" IN dms) -  POSITION("°" IN dms) - 1)) AS decimal(20,9));
    SET secs = CAST( (SUBSTR(dms, POSITION("'" IN dms) + 1, POSITION("""" IN dms) -  POSITION("'" IN dms) - 1)) AS decimal(20,9));

    SET sign = 1 - 2 * (RIGHT(dms, 1) = "W" OR RIGHT(dms, 1) = "S" OR RIGHT(dms, 1) = "O");

    RETURN  sign * (deg + mins / 60 + secs / 3600);
END$$

DELIMITER ;


UPDATE version SET ver_value = '093' WHERE ver_name = 'DB';