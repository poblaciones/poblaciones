DROP FUNCTION `FixGeoJson`;

DELIMITER $$
CREATE FUNCTION `FixGeoJson`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

IF LOCATE('{', cad) = 0 THEN
 RETURN cad;
END IF;

SET cad = REPLACE(cad, '\n', '');
SET cad = REPLACE(cad, '\r', '');
SET cad = REPLACE(cad, ' ', '');
IF LEFT(cad, 1) != "{" THEN
  RETURN cad;
END IF;
IF LEFT(cad, 15) = '{"type":"Point"' THEN
 SET cad = REPLACE(cad, ']', ']]');
 SET cad = REPLACE(cad, '[', '[[');
END IF;

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

RETURN cad;
END$$
DELIMITER ;

DROP FUNCTION `GeometryIsValid`;

DELIMITER $$
CREATE FUNCTION `GeometryIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' THEN
  RETURN 100;
END IF;
IF t = 'LINESTRING' THEN
  IF ST_NumPoints(ele) > 0 THEN
    RETURN 100;
  ELSE
    RETURN 101;
  END IF;
END IF;

IF t = 'MULTILINESTRING' THEN
  IF ST_NumPoints(ST_GeometryN(ele, 1)) > 0 THEN
    RETURN 100;
  ELSE
    RETURN 101;
  END IF;
END IF;

IF t = 'POLYGON' THEN
  RETURN PolygonIsValid(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
  RETURN MultiPolygonIsValid(ele);
END IF;

RETURN 2;
END$$
DELIMITER ;

UPDATE version SET ver_value = '037' WHERE ver_name = 'DB';

