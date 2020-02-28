-- MySQL dump 10.13  Distrib 5.6.41-84.1, for Linux (x86_64)
--
-- Host: localhost    Database: aacademi_maps_restore
-- ------------------------------------------------------
-- Server version	5.6.41-84.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping routines for database 'aacademi_maps_restore'
--
/*!50003 DROP FUNCTION IF EXISTS `EllipseContains` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `EllipseContains`(`center` POINT, `radius` POINT, `location` POINT) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE normalized POINT;
  if (ST_X(radius) <= 0.0 || ST_Y(radius) <= 0.0) THEN
    return false;
  END IF;
  SET normalized = Point(ST_X(location) - ST_X(center), ST_Y(location) - ST_Y(center));

  RETURN ((ST_X(normalized) * ST_X(normalized)) / (ST_X(radius) * ST_X(radius))) + ((ST_Y(normalized) * ST_Y(normalized)) / (ST_Y(radius) * ST_Y(radius))) <= 1.0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `EllipseContainsGeometry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `EllipseContainsGeometry`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
BEGIN
  DECLARE t VARCHAR(12);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
  RETURN EllipseContains(center, radius, ele);
END IF;

IF t = 'LINESTRING'  THEN
  RETURN EllipseContainsPolygon(center, radius, ele);
END IF;
IF t = 'POLYGON' THEN
  RETURN EllipseContainsPolygon(center, radius, ST_ExteriorRing(ele));
END IF;
IF t = 'MULTIPOLYGON' OR t = 'MULTILINESTRING' THEN
  RETURN EllipseContainsMultiPolygon(center, radius, ele);
END IF;

RETURN 2;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `EllipseContainsMultiPolygon` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `EllipseContainsMultiPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE g GEOMETRY;

SET e = PolygonEnvelope(ele);
IF EllipseContains(center, radius, ST_PointN(e,1)) AND  EllipseContains(center, radius, ST_PointN(e,2)) AND  EllipseContains(center, radius, ST_PointN(e,3)) AND  EllipseContains(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;

  SET n = 0;
  SET c = NumGeometries(ele);

  count_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    IF ST_GeometryType(g) = 'POLYGON' THEN
      IF EllipseContainsPolygon(center, radius, ST_ExteriorRing(g)) = 0 THEN
        RETURN 0;
      END IF;
    ELSEIF EllipseContainsPolygon(center, radius, g) = 0 THEN
        RETURN 0;
    END IF;

    IF n >= c THEN
      LEAVE count_loop;
    END IF;

  END LOOP;

RETURN 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `EllipseContainsPolygon` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `EllipseContainsPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;

SET e = PolygonEnvelope(ele);
if ele is null THEN
  return 0;
end IF;
IF EllipseContains(center, radius, ST_PointN(e,1)) AND  EllipseContains(center, radius, ST_PointN(e,2)) AND  EllipseContains(center, radius, ST_PointN(e,3)) AND  EllipseContains(center, radius, ST_PointN(e,4)) THEN
  RETURN 1;
END IF;


  SET n = 0;
  SET c = ST_NumPoints(ele);

  count_loop: LOOP
    SET n = n + 1;

  IF EllipseContains(center, radius, ST_PointN(ele,n)) = 0 THEN
    RETURN 0;
  END IF;

  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `FixEncoding` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `FixEncoding`(`cad` TEXT) RETURNS text CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

SET cad = REPLACE(cad, 'Â¡', 'á');
SET cad = REPLACE(cad, 'Â¢', 'â');
SET cad = REPLACE(cad, 'Â£', 'ã');
SET cad = REPLACE(cad, 'Â¤', 'ä');
SET cad = REPLACE(cad, 'Â¥', 'å');
SET cad = REPLACE(cad, 'Â¦', 'æ');
SET cad = REPLACE(cad, 'Â§', 'ç');
SET cad = REPLACE(cad, 'Â¨', 'è');
SET cad = REPLACE(cad, 'Â©', 'é');
SET cad = REPLACE(cad, 'Âª', 'ê');
SET cad = REPLACE(cad, 'Â«', 'ë');
SET cad = REPLACE(cad, 'Â­', 'í');
SET cad = REPLACE(cad, 'Â®', 'î');
SET cad = REPLACE(cad, 'Â¯', 'ï');
SET cad = REPLACE(cad, 'Â°', 'ð');
SET cad = REPLACE(cad, 'Â±', 'ñ');
SET cad = REPLACE(cad, 'Â²', 'ò');
SET cad = REPLACE(cad, 'Â³', 'ó');
SET cad = REPLACE(cad, 'Â´', 'ô');
SET cad = REPLACE(cad, 'Âµ', 'õ');
SET cad = REPLACE(cad, 'Â·', '÷');
SET cad = REPLACE(cad, 'Â¸', 'ø');
SET cad = REPLACE(cad, 'Â¹', 'ù');
SET cad = REPLACE(cad, 'Âº', 'ú');
SET cad = REPLACE(cad, 'Â»', 'û');
SET cad = REPLACE(cad, 'Â¼', 'ü');
SET cad = REPLACE(cad, 'Â½', 'ý');
SET cad = REPLACE(cad, 'Â¾', 'þ');
SET cad = REPLACE(cad, 'Â¿', 'ÿ');
SET cad = REPLACE(cad, 'Ã€', 'À');
SET cad = REPLACE(cad, 'Ã', 'Á');
SET cad = REPLACE(cad, 'Ã‚', 'Â');
SET cad = REPLACE(cad, 'Ãƒ', 'Ã');
SET cad = REPLACE(cad, 'Ã„', 'Ä');
SET cad = REPLACE(cad, 'Ã…', 'Å');
SET cad = REPLACE(cad, 'Ã†', 'Æ');
SET cad = REPLACE(cad, 'Ã‡', 'Ç');
SET cad = REPLACE(cad, 'Ãˆ', 'È');
SET cad = REPLACE(cad, 'Ã‰', 'É');
SET cad = REPLACE(cad, 'ÃŠ', 'Ê');
SET cad = REPLACE(cad, 'Ã‹', 'Ë');
SET cad = REPLACE(cad, 'ÃŒ', 'Ì');
SET cad = REPLACE(cad, 'ÃŽ', 'Î');
SET cad = REPLACE(cad, 'Ã‘', 'Ñ');
SET cad = REPLACE(cad, 'Ã’', 'Ò');
SET cad = REPLACE(cad, 'Ã“', 'Ó');
SET cad = REPLACE(cad, 'Ã”', 'Ô');
SET cad = REPLACE(cad, 'Ã•', 'Õ');
SET cad = REPLACE(cad, 'Ã–', 'Ö');
SET cad = REPLACE(cad, 'Ã—', '×');
SET cad = REPLACE(cad, 'Ã˜', 'Ø');
SET cad = REPLACE(cad, 'Ã™', 'Ù');
SET cad = REPLACE(cad, 'Ãš', 'Ú');
SET cad = REPLACE(cad, 'Ã›', 'Û');
SET cad = REPLACE(cad, 'Ãœ', 'Ü');
SET cad = REPLACE(cad, 'Ãž', 'Þ');
SET cad = REPLACE(cad, 'ÃŸ', 'ß');
SET cad = REPLACE(cad, 'Ã¡', 'á');
SET cad = REPLACE(cad, 'Ã¢', 'â');
SET cad = REPLACE(cad, 'Ã£', 'ã');
SET cad = REPLACE(cad, 'Ã¤', 'ä');
SET cad = REPLACE(cad, 'Ã¥', 'å');
SET cad = REPLACE(cad, 'Ã¦', 'æ');
SET cad = REPLACE(cad, 'Ã§', 'ç');
SET cad = REPLACE(cad, 'Ã¨', 'è');
SET cad = REPLACE(cad, 'Ã©', 'é');
SET cad = REPLACE(cad, 'Ãª', 'ê');
SET cad = REPLACE(cad, 'Ã«', 'ë');
SET cad = REPLACE(cad, 'Ã­', 'í');
SET cad = REPLACE(cad, 'Ã®', 'î');
SET cad = REPLACE(cad, 'Ã¯', 'ï');
SET cad = REPLACE(cad, 'Ã°', 'ð');
SET cad = REPLACE(cad, 'Ã±', 'ñ');
SET cad = REPLACE(cad, 'Ã²', 'ò');
SET cad = REPLACE(cad, 'Ã³', 'ó');
SET cad = REPLACE(cad, 'Ã´', 'ô');
SET cad = REPLACE(cad, 'Ãµ', 'õ');
SET cad = REPLACE(cad, 'Ã·', '÷');
SET cad = REPLACE(cad, 'Ã¸', 'ø');
SET cad = REPLACE(cad, 'Ã¹', 'ù');
SET cad = REPLACE(cad, 'Ãº', 'ú');
SET cad = REPLACE(cad, 'Ã»', 'û');
SET cad = REPLACE(cad, 'Ã¼', 'ü');
SET cad = REPLACE(cad, 'Ã½', 'ý');
SET cad = REPLACE(cad, 'Ã¾', 'þ');
SET cad = REPLACE(cad, 'Ã¿', 'ÿ');

RETURN cad;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `FixGeoJson` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `FixGeoJson`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryIsMinSize` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GeometryIsMinSize`(`geom` GEOMETRY, `width` DOUBLE, `height` DOUBLE) RETURNS tinyint(1)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE envelope LINESTRING;
DECLARE p1 POINT;
DECLARE p2 POINT;
SET envelope = ST_ExteriorRing(PolygonEnvelope(geom));
SET p1 = ST_PointN(envelope, 1);
SET p2 = ST_PointN(envelope, 3);
RETURN ST_X(p2)-ST_X(p1) > width AND ST_Y(p2) - ST_Y(p1) > height;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryIsValid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GeometryIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE t VARCHAR(12);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
  RETURN 100;
END IF;
IF t = 'LINESTRING' OR t = 'MULTILINESTRING' THEN
  IF ST_NumPoints(ele) > 0 THEN
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeoreferenceErrorCode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeoreferenceErrorWithCode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GeoreferenceErrorWithCode`(`error_code` INT) RETURNS varchar(255) CHARSET utf8
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE ret VARCHAR(255);

SET ret = CONCAT('E', error_code, '. ' , GeoreferenceErrorCode(error_code));
RETURN ret;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GetGeographyByPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GetGeographyByPoint`(`geography_id` INT, `p` POINT) RETURNS int(11)
    SQL SECURITY INVOKER
BEGIN

DECLARE ret INTEGER;

SET ret = (SELECT giw_geography_item_id FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id LIMIT 1);

RETURN ret;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GetGeoText` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GetGeoText`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
SET cad = REPLACE(cad, '\n', '');
SET cad = REPLACE(cad, '\r', '');

IF LEFT(cad, 1) != "{" THEN
  RETURN cad;
END IF;

SET cad = REPLACE(cad, ' ', '');
SET cad = REPLACE(cad, '{"type":"', '');
SET cad = REPLACE(cad, '","coordinates":[', '');
SET cad = REPLACE(cad, '],', ']@');
SET cad = REPLACE(cad, ',', ' ');
SET cad = REPLACE(cad, '[', '(');
SET cad = REPLACE(cad, ']', ')');
SET cad = REPLACE(cad, '@', ',');
SET cad = REPLACE(cad, ']}', '');

RETURN cad;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GetNonSingleGeographyByPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `GetNonSingleGeographyByPoint`(`geography_id` INT, `p` POINT) RETURNS int(11)
    SQL SECURITY INVOKER
BEGIN

DECLARE ret INTEGER;

SET ret = (SELECT Count(giw_geography_item_id) FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id);

RETURN ret > 1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `InnerRingsOverlap` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `InnerRingsOverlap`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;

SET n = 0;
SET c = ST_NumInteriorRings(ele);

  count2_loop: LOOP
    SET n = n + 1;
    SET g = Polygon(ST_InteriorRingN(ele, n));
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      IF ST_Intersects(g, ST_InteriorRingN(ele, i)) THEN
        RETURN 1;
      END IF;
      IF i >= c THEN
        LEAVE count3_loop;
      END IF;
    END LOOP;

    IF n >= c THEN
        LEAVE count2_loop;
      END IF;
 END LOOP;

 RETURN 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiPolygonIsValid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `MultiPolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;

  SET n = 0;
  SET c = NumGeometries(ele);
  IF c = 0 THEN
    RETURN 120;
  END IF;

  count_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    SET res = PolygonIsValid(g);
    IF res != 100 THEN
      RETURN res;
    END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;
  END LOOP;

  IF PolygonsOverlap(ele) THEN
    RETURN 110;
  END IF;

RETURN 100;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PolygonIsValid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `PolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g LINESTRING;
DECLARE e LINESTRING;
DECLARE p POLYGON;

SET e = ST_ExteriorRing(ele);
SET res = RingIsValid(e,1);
IF res != 100 THEN
  RETURN res;
END IF;

  SET n = 0;
  SET c = ST_NumInteriorRings(ele);
  IF c = 0 THEN
    RETURN 100;
  END IF;
 SET p = Polygon(e);

count_loop: LOOP
    SET n = n + 1;
    SET g = ST_InteriorRingN(ele, n);
    SET res = RingIsValid(g, -1);
    IF res != 100 THEN
      RETURN res + 4;
    END IF;
    IF NOT ST_Contains(p, g) THEN
    	RETURN 109;
    END IF;
    IF n >= c THEN
      LEAVE count_loop;
    END IF;

  END LOOP;


  IF InnerRingsOverlap(ele) THEN
    RETURN 111;
  END IF;

RETURN 100;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PolygonsOverlap` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `PolygonsOverlap`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;

SET n = 0;
SET c = NumGeometries(ele);

  count2_loop: LOOP
    SET n = n + 1;
    SET g = ST_GeometryN(ele, n);
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      IF ST_Intersects(g, ST_GeometryN(ele, i)) THEN
        RETURN 1;
      END IF;
      IF i >= c THEN
        LEAVE count3_loop;
      END IF;
    END LOOP;

    IF n >= c THEN
        LEAVE count2_loop;
      END IF;
 END LOOP;

 RETURN 0;
END ;;

DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `RichEnvelope` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `RichEnvelope`(`g` GEOMETRY, `xDelta` INT, `yDelta` INT) RETURNS polygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE x1 DOUBLE;
  DECLARE y1 DOUBLE;
  DECLARE x2 DOUBLE;
  DECLARE y2 DOUBLE;
  DECLARE envelopeLine LINESTRING;

SET envelopeLine = ST_ExteriorRing(PolygonEnvelope(g));

SET x1 = ST_X(ST_PointN(envelopeLine, 1)) + (xDelta * 1000);
SET x2 = ST_X(ST_PointN(envelopeLine, 3)) + (xDelta * 1000);
SET y1 = ST_Y(ST_PointN(envelopeLine, 1)) + (yDelta * 1000);
SET y2 = ST_Y(ST_PointN(envelopeLine, 3)) + (yDelta * 1000);

RETURN Polygon(LineString(Point(x1, y1), Point(x1, y2), Point(x2, y2),
Point(x2, y1),  Point(x1, y1)));

END ;;


DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PolygonEnvelope` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `PolygonEnvelope`(`g` GEOMETRY) RETURNS polygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE x1 DOUBLE;
  DECLARE y1 DOUBLE;
  DECLARE x2 DOUBLE;
  DECLARE y2 DOUBLE;
  DECLARE envelope GEOMETRY;

SET envelope = ST_Envelope(g);

RETURN CASE ST_GeometryType(envelope)
		WHEN 'POLYGON' THEN envelope
		WHEN 'LINESTRING' THEN POLYGON(LINESTRING(ST_PointN(envelope, 1), ST_PointN(envelope, 1), ST_PointN(envelope, 2), ST_PointN(envelope, 2)))
		WHEN 'POINT' THEN POLYGON(LINESTRING(envelope, envelope, envelope, envelope))
		END;

END ;;


DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `RingIsValid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `RingIsValid`(`ele` GEOMETRY, `direction` TINYINT(4)) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN



IF ST_NumPoints(ele) = 0 THEN
  RETURN 101;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN 102;
END IF;

IF ST_IsSimple(ele) = 0 THEN
  RETURN 104;
END IF;

RETURN 100;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `SignedArea` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `SignedArea`(`ele` GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE c INT;
DECLARE n INT;
DECLARE ret DOUBLE;

IF ST_NumPoints(ele) = 0 THEN
  RETURN -1;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN -1;
END IF;
  SET n = 1;
  SET c = ST_NumPoints(ele);
  SET ret = 0;
  count_loop: LOOP

     SET ret = RET +
            (ST_X(ST_PointN(ele,n + 1)) - ST_X(ST_PointN(ele,n))) *
            (ST_Y(ST_PointN(ele,n + 1)) + ST_Y(ST_PointN(ele,n))) / 2;

      SET n = n + 1;
  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN ret;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-01-06 18:21:21


UPDATE version SET ver_value = '020' WHERE ver_name = 'DB';