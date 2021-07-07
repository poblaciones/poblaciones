DROP FUNCTION IF EXISTS `DmsToDecimal`;
DELIMITER $$

CREATE FUNCTION `DmsToDecimal`(`dms` VARCHAR(50))
   RETURNS DECIMAL(12,9)
   DETERMINISTIC
   NO SQL
   SQL SECURITY INVOKER
BEGIN
    DECLARE deg decimal(12,9);
    DECLARE mins decimal(12,9);
    DECLARE secs decimal(12,9);
    DECLARE sign integer;

    SET dms = UPPER(TRIM(REPLACE(dms, ",", ".")));
    IF dms IS NULL OR dms = "" THEN
      RETURN null;
    END IF;
    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(12,9));
    END IF;

    IF POSITION("°" IN dms) < 1 THEN
      RETURN CAST(dms AS decimal(12,9));
    END IF;

    SET deg = CAST(  SUBSTRING_INDEX(dms, '°', 1) AS decimal(12,9));
    SET mins = CAST( (SUBSTR(dms, POSITION('°' IN dms) + 1, POSITION("'" IN dms) -  POSITION("°" IN dms) - 1)) AS decimal(12,9));
    SET secs = CAST( (SUBSTR(dms, POSITION("'" IN dms) + 1, POSITION("""" IN dms) -  POSITION("'" IN dms) - 1)) AS decimal(12,9));

    SET sign = 1 - 2 * (RIGHT(dms, 1) = "W" OR RIGHT(dms, 1) = "S" OR RIGHT(dms, 1) = "O");

    RETURN  sign * (deg + mins / 60 + secs / 3600);
END$$
DELIMITER ;

drop FUNCTION `GeoreferenceErrorCode`;
DELIMITER ;;
CREATE FUNCTION `GeoreferenceErrorCode`(`error_code` INT) RETURNS varchar(255) CHARSET utf8
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE ret VARCHAR(255);

SET ret = (CASE error_code
WHEN 1 THEN 'La latitud o la longitud no están en un rango válido (-90 a 90 y -180 a 180).'
WHEN 2 THEN 'La coordenada indicada no se encuentra dentro de ningún elemento de la geografía seleccionada.'
WHEN 3 THEN 'El valor para el código no puede ser nulo'
WHEN 4 THEN 'El valor para el código no fue encontrado en la geografía indicada.'
WHEN 5 THEN 'El valor para el polígono no puede ser nulo'
WHEN 6 THEN 'El valor indicado en la columna del polígono no es un texto WKT o GeoJson correcto.'
WHEN 7 THEN 'El polígono reconocido no es una geometría válida.'
WHEN 8 THEN 'El centroide del polígono indicado no se encuentra dentro de ningún elemento de la geografía seleccionada.'
WHEN 9 THEN 'La latitud o la longitud contienen valores vacíos.'

WHEN 10 THEN 'La geometría no tiene signos de cierre. Es posible que se encuentre incompleta.'
WHEN 101 THEN 'El perímetro exterior del polígono no posee puntos.'
WHEN 102 THEN 'El perímetro exterior del polígono no está cerrado. El último punto debe coincidir con el primero.'
WHEN 103 THEN 'El perímetro exterior del polígono debe tener sus puntos ordenados en el sentido de las agujas del reloj (clockwise).'
WHEN 104 THEN 'El perímetro exterior del polígono se intersecta consigo mismo.'
WHEN 105 THEN 'Uno de los huecos del polígono no posee puntos.'
WHEN 106 THEN 'Uno de los huecos del polígono no está cerrado. El último punto debe coincidir con el primero.'
WHEN 107 THEN 'Los huecos del polígono deben tener sus puntos ordenados en el sentido contrario a las agujas del reloj (counter-clockwise).'
WHEN 108 THEN 'Uno de los huecos del polígono se intersecta consigo mismo.'
WHEN 109 THEN 'Un hueco del polígono excede los límites de su perímetro.'
WHEN 110 THEN 'Los polígonos de un polígono múltiple no pueden superponerse.'
WHEN 111 THEN 'Los huecos de un polígono no pueden superponerse.'
WHEN 120 THEN 'El polígono múltiple no contiene polígonos.'

ELSE 'Código no identificado'

END);

RETURN ret;

END ;;
DELIMITER ;

ALTER TABLE `draft_file`
CHANGE COLUMN `fil_name` `fil_name` VARCHAR(200) NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)' ;

ALTER TABLE `file`
CHANGE COLUMN `fil_name` `fil_name` VARCHAR(200) NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)' ;

UPDATE version SET ver_value = '075' WHERE ver_name = 'DB';