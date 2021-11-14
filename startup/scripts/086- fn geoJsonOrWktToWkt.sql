DROP function IF EXISTS `GeoJsonOrWktToWkt`;

DELIMITER $$
CREATE FUNCTION `GeoJsonOrWktToWkt`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

IF LOCATE('{', cad) = 0 THEN
 SET cad = TRIM(cad);
 SET cad = IF(cad = '', null, cad);
 RETURN cad;
END IF;

SET cad = REPLACE(cad, '\n', '');
SET cad = REPLACE(cad, '\r', '');
SET cad = REPLACE(cad, ' ', '');
IF LEFT(cad, 1) != "{" THEN
  SET cad = TRIM(cad);
  SET cad = IF(cad = '', null, cad);
  RETURN cad;
END IF;


IF RIGHT(cad, 15) = '"type":"Point"}' THEN
   SET cad = CONCAT('{"type":"Point",', MID(cad, 2, length(cad) - 15 - 2), '}');
END IF;
IF RIGHT(cad, 17) = '"type":"Polygon"}' THEN
   SET cad = CONCAT('{"type":"Polygon",', MID(cad, 2, length(cad) - 17 - 2), '}');
END IF;
IF RIGHT(cad, 20) = '"type":"LineString"}' THEN
   SET cad = CONCAT('{"type":"LineString",', MID(cad, 2, length(cad) - 20 - 2), '}');
END IF;
IF RIGHT(cad, 20) = '"type":"MultiPoint"}' THEN
   SET cad = CONCAT('{"type":"MultiPoint",', MID(cad, 2, length(cad) - 20 - 2), '}');
END IF;
IF RIGHT(cad, 22) = '"type":"MultiPolygon"}' THEN
   SET cad = CONCAT('{"type":"MultiPolygon",', MID(cad, 2, length(cad) - 22 - 2), '}');
END IF;
IF RIGHT(cad, 25) = '"type":"MultiLineString"}' THEN
   SET cad = CONCAT('{"type":"MultiLineString",', MID(cad, 2, length(cad) - 25 - 2), '}');
END IF;

IF LEFT(cad, 15) = '{"type":"Point"' THEN
 SET cad = REPLACE(cad, ']', ']]');
 SET cad = REPLACE(cad, '[', '[[');
END IF;

SET cad = REPLACE(cad, ', ', ',');
SET cad = REPLACE(cad, '{"type":"', '');
SET cad = REPLACE(cad, '","coordinates":', '');
SET cad = REPLACE(cad, '],', ']@');
SET cad = REPLACE(cad, ',', ' ');
SET cad = REPLACE(cad, '[[[[', '~3');
SET cad = REPLACE(cad, '[[[', '~2');
SET cad = REPLACE(cad, '[[', '~1');
SET cad = REPLACE(cad, '[', '');
SET cad = REPLACE(cad, '~3', '(((');
SET cad = REPLACE(cad, '~2', '((');
SET cad = REPLACE(cad, '~1', '(');
SET cad = REPLACE(cad, ']]]]', '~3');
SET cad = REPLACE(cad, ']]]', '~2');
SET cad = REPLACE(cad, ']]', '~1');
SET cad = REPLACE(cad, '~3', ')))');
SET cad = REPLACE(cad, '~2', '))');
SET cad = REPLACE(cad, '~1', ')');
SET cad = REPLACE(cad, ']', '');
SET cad = REPLACE(cad, '@', ',');
SET cad = REPLACE(cad, '}', '');
SET cad = TRIM(cad);
SET cad = IF(cad = '', null, cad);
RETURN cad;
END$$

DELIMITER ;

UPDATE version SET ver_value = '086' WHERE ver_name = 'DB';