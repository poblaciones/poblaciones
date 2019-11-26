
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `aacademi_maps_prod`
--

DELIMITER $$
--
-- Functions
--
CREATE FUNCTION `EllipseContains` (`center` POINT, `radius` POINT, `location` POINT) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE normalized POINT;
  if (X(radius) <= 0.0 || Y(radius) <= 0.0) THEN
    return false;
  END IF;
  SET normalized = Point(X(location) - X(center), Y(location) - Y(center));

  RETURN ((X(normalized) * X(normalized)) / (X(radius) * X(radius))) + ((Y(normalized) * Y(normalized)) / (Y(radius) * Y(radius))) <= 1.0;
END$$

CREATE FUNCTION `EllipseContainsGeometry` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
BEGIN
  DECLARE t VARCHAR(12);
SET t = GeometryType(ele);
IF t = 'POINT' THEN
  RETURN EllipseContains(center, radius, ele);
END IF;

IF t = 'LINESTRING'  THEN
  RETURN EllipseContainsPolygon(center, radius, ele);
END IF;
IF t = 'POLYGON' THEN
  RETURN EllipseContainsPolygon(center, radius, ExteriorRing(ele));
END IF;
IF t = 'MULTIPOLYGON' OR t = 'MULTILINESTRING' THEN
  RETURN EllipseContainsMultiPolygon(center, radius, ele);
END IF;

RETURN 2;
END$$

CREATE FUNCTION `EllipseContainsMultiPolygon` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE g GEOMETRY;

SET e = Envelope(ele);
IF EllipseContains(center, radius, PointN(e,1)) AND  EllipseContains(center, radius, PointN(e,2)) AND  EllipseContains(center, radius, PointN(e,3)) AND  EllipseContains(center, radius, PointN(e,4)) THEN
  RETURN 1;
END IF;

  SET n = 0;
  SET c = NumGeometries(ele);

  count_loop: LOOP
    SET n = n + 1;
    SET g = GeometryN(ele, n);
    IF GeometryType(g) = 'POLYGON' THEN
      IF EllipseContainsPolygon(center, radius, ExteriorRing(g)) = 0 THEN
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
END$$

CREATE FUNCTION `EllipseContainsPolygon` (`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;

SET e = Envelope(ele);
if ele is null THEN
  return 0;
end IF;
IF EllipseContains(center, radius, PointN(e,1)) AND  EllipseContains(center, radius, PointN(e,2)) AND  EllipseContains(center, radius, PointN(e,3)) AND  EllipseContains(center, radius, PointN(e,4)) THEN
  RETURN 1;
END IF;


  SET n = 0;
  SET c = NumPoints(ele);

  count_loop: LOOP
    SET n = n + 1;

  IF EllipseContains(center, radius, PointN(ele,n)) = 0 THEN
    RETURN 0;
  END IF;

  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN 1;
END$$

CREATE FUNCTION `FixEncoding` (`cad` TEXT) RETURNS TEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
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
END$$

CREATE FUNCTION `FixGeoJson` (`cad` LONGTEXT) RETURNS LONGTEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
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
END$$

CREATE FUNCTION `GeometryIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE t VARCHAR(12);
SET t = GeometryType(ele);
IF t = 'POINT' THEN
  RETURN 100;
END IF;
IF t = 'LINESTRING' OR t = 'MULTILINESTRING' THEN
  IF NumPoints(ele) > 0 THEN
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

CREATE FUNCTION `GeoreferenceErrorCode` (`error_code` INT) RETURNS VARCHAR(255) CHARSET utf8 NO SQL
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

END$$

CREATE FUNCTION `GeoreferenceErrorWithCode` (`error_code` INT) RETURNS VARCHAR(255) CHARSET utf8 NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  
DECLARE ret VARCHAR(255);

SET ret = CONCAT('E', error_code, '. ' , GeoreferenceErrorCode(error_code));
RETURN ret;

END$$

CREATE FUNCTION `GetGeographyByPoint` (`geography_id` INT, `p` POINT) RETURNS INT(11) SQL SECURITY INVOKER
BEGIN
  
DECLARE ret INTEGER;

SET ret = (SELECT giw_geography_item_id FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id LIMIT 1);

RETURN ret;

END$$

CREATE FUNCTION `GetGeoText` (`cad` LONGTEXT) RETURNS LONGTEXT CHARSET utf8 COLLATE utf8_unicode_ci NO SQL
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
END$$

CREATE FUNCTION `GetNonSingleGeographyByPoint` (`geography_id` INT, `p` POINT) RETURNS INT(11) SQL SECURITY INVOKER
BEGIN
  
DECLARE ret INTEGER;

SET ret = (SELECT Count(giw_geography_item_id) FROM snapshot_geography_item WHERE  ST_CONTAINS(giw_geometry_r6, p) and giw_geography_id = geography_id);

RETURN ret > 1;

END$$

CREATE FUNCTION `InnerRingsOverlap` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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
END$$

CREATE FUNCTION `MultiPolygonIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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
    SET g = GeometryN(ele, n);
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
END$$

CREATE FUNCTION `PolygonIsValid` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g LINESTRING;
DECLARE e LINESTRING;
DECLARE p POLYGON;

SET e = ExteriorRing(ele);
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
END$$

CREATE FUNCTION `PolygonsOverlap` (`ele` GEOMETRY) RETURNS TINYINT(4) NO SQL
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
    SET g = GeometryN(ele, n);
    SET i = n;
      count3_loop: LOOP
      SET i = i + 1;
      IF ST_Intersects(g, GeometryN(ele, i)) THEN
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
END$$

CREATE FUNCTION `RichEnvelope` (`g` GEOMETRY, `xDelta` INT, `yDelta` INT) RETURNS POLYGON NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
  DECLARE x1 DOUBLE;
  DECLARE y1 DOUBLE;
  DECLARE x2 DOUBLE;
  DECLARE y2 DOUBLE;
  DECLARE envelopeLine LINESTRING;
  
SET envelopeLine = ExteriorRing(Envelope(g));

SET x1 = X(PointN(envelopeLine, 1)) + (xDelta * 1000);
SET x2 = X(PointN(envelopeLine, 3)) + (xDelta * 1000);
SET y1 = Y(PointN(envelopeLine, 1)) + (yDelta * 1000);
SET y2 = Y(PointN(envelopeLine, 3)) + (yDelta * 1000); 

RETURN Polygon(LineString(Point(x1, y1), Point(x1, y2), Point(x2, y2),
Point(x2, y1),  Point(x1, y1)));

END$$

CREATE FUNCTION `RingIsValid` (`ele` GEOMETRY, `direction` TINYINT(4)) RETURNS TINYINT(4) NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN



IF NumPoints(ele) = 0 THEN
  RETURN 101;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN 102;
END IF;
/*IF SignedArea(ele) < 0 AND direction != -1 THEN
  RETURN 103;
END IF;*/
IF ST_IsSimple(ele) = 0 THEN
  RETURN 104;
END IF;

RETURN 100;
END$$

CREATE FUNCTION `SignedArea` (`ele` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE c INT;
DECLARE n INT;
DECLARE ret DOUBLE;

IF NumPoints(ele) = 0 THEN
  RETURN -1;
END IF;
IF ST_IsClosed(ele) = 0 THEN
  RETURN -1;
END IF;
  SET n = 1;
  SET c = NumPoints(ele);
  SET ret = 0;
  count_loop: LOOP

     SET ret = RET +
            (ST_X(PointN(ele,n + 1)) - ST_X(PointN(ele,n))) *
            (ST_Y(PointN(ele,n + 1)) + ST_Y(PointN(ele,n))) / 2;

      SET n = n + 1;
  IF n >= c THEN
    LEAVE count_loop;
  END IF;

  END LOOP;

RETURN ret;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region`
--

CREATE TABLE `clipping_region` (
  `clr_id` int(11) NOT NULL,
  `clr_country_id` int(11) DEFAULT NULL,
  `clr_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la región ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere al registro Provincias.',
  `clr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `clr_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clr_priority` int(11) NOT NULL DEFAULT '0',
  `clr_field_code_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la región (ej. ''codProv'')',
  `clr_no_autocomplete` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si debe ofrecerse este nivel de regiones al hacerse un autocompletado para el ingreso de regiones.',
  `clr_labels_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clr_labels_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clr_metadata_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_geography`
--

CREATE TABLE `clipping_region_geography` (
  `crg_id` int(11) NOT NULL,
  `crg_geography_id` int(11) NOT NULL COMMENT 'Geografía',
  `crg_clipping_region_id` int(11) NOT NULL COMMENT 'Región.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_geography_item`
--

CREATE TABLE `clipping_region_geography_item` (
  `cgi_id` int(11) NOT NULL,
  `cgi_clipping_region_item_id` int(11) NOT NULL COMMENT 'Ítem de la región de clipping.',
  `cgi_geography_item_id` int(11) NOT NULL COMMENT 'Ítem de la geografía.',
  `cgi_clipping_region_geography_id` int(11) NOT NULL COMMENT 'Referencia a la relación entre las entidades contenedoras de ambos ítems.',
  `cgi_intersection_percent` double NOT NULL COMMENT 'Área de intersección en m2.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clipping_region_item`
--

CREATE TABLE `clipping_region_item` (
  `cli_id` int(11) NOT NULL,
  `cli_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la cartografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a  al registro Provincias.',
  `cli_clipping_region_id` int(11) NOT NULL COMMENT 'Región a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias).',
  `cli_code` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `cli_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `cli_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `cli_geometry_r1` geometry NOT NULL,
  `cli_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `cli_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact`
--

CREATE TABLE `contact` (
  `con_id` int(11) NOT NULL,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset`
--

CREATE TABLE `dataset` (
  `dat_id` int(11) NOT NULL,
  `dat_geography_id` int(11) NOT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` bit(1) NOT NULL DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset_column`
--

CREATE TABLE `dataset_column` (
  `dco_id` int(11) NOT NULL,
  `dco_dataset_id` int(11) NOT NULL COMMENT 'Dataset al que pertenece la columna.',
  `dco_field` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Campo en la tabla importada.',
  `dco_variable` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `dco_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta a mostrar: si dco_label es nulo, es igual a dco_variable. Si no es igual a dco_label.',
  `dco_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Etiqueta original del campo.',
  `dco_column_width` int(11) NOT NULL,
  `dco_field_width` int(11) NOT NULL,
  `dco_decimals` int(11) NOT NULL,
  `dco_format` int(11) NOT NULL,
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dataset_label`
--

CREATE TABLE `dataset_label` (
  `dla_id` int(11) NOT NULL,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_contact`
--

CREATE TABLE `draft_contact` (
  `con_id` int(11) NOT NULL,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset`
--

CREATE TABLE `draft_dataset` (
  `dat_id` int(11) NOT NULL,
  `dat_geography_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` tinyint(1) NOT NULL DEFAULT '0',
  `dat_georeference_attributes` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dat_georeference_status` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset_column`
--

CREATE TABLE `draft_dataset_column` (
  `dco_id` int(11) NOT NULL,
  `dco_dataset_id` int(11) NOT NULL COMMENT 'Dataset al que pertenece la columna.',
  `dco_field` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Campo en la tabla importada.',
  `dco_variable` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `dco_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta a mostrar: si dco_label es nulo, es igual a dco_variable. Si no es igual a dco_label.',
  `dco_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Etiqueta original del campo.',
  `dco_column_width` int(11) NOT NULL,
  `dco_field_width` int(11) NOT NULL,
  `dco_decimals` int(11) NOT NULL,
  `dco_format` int(11) NOT NULL,
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_dataset_label`
--

CREATE TABLE `draft_dataset_label` (
  `dla_id` int(11) NOT NULL,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_file`
--

CREATE TABLE `draft_file` (
  `fil_id` int(11) NOT NULL,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_file_chunk`
--

CREATE TABLE `draft_file_chunk` (
  `chu_id` int(11) NOT NULL,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_institution`
--

CREATE TABLE `draft_institution` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata`
--

CREATE TABLE `draft_metadata` (
  `met_id` int(11) NOT NULL,
  `met_title` varchar(150) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(400) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci COMMENT 'Texto con descripción extendida de los metadatos',
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización',
  `met_schedule_next_update` datetime DEFAULT NULL COMMENT 'Fecha de próxima actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata_file`
--

CREATE TABLE `draft_metadata_file` (
  `mfi_id` int(11) NOT NULL,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metadata_source`
--

CREATE TABLE `draft_metadata_source` (
  `msc_id` int(11) NOT NULL,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric`
--

CREATE TABLE `draft_metric` (
  `mtr_id` int(11) NOT NULL,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT '0',
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_caption` varchar(75) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric_version`
--

CREATE TABLE `draft_metric_version` (
  `mvr_id` int(11) NOT NULL,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(10) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). .',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador al que pertenece la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `draft_metric_version_level`
--

CREATE TABLE `draft_metric_version_level` (
  `mvl_id` int(11) NOT NULL,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_source`
--

CREATE TABLE `draft_source` (
  `src_id` int(11) NOT NULL,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_symbology`
--

CREATE TABLE `draft_symbology` (
  `vsy_id` int(11) NOT NULL,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_categories` int(11) NOT NULL DEFAULT '4' COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT '5' COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT '1' COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_custom_colors` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` int(11) DEFAULT NULL,
  `vsy_pattern` int(11) NOT NULL DEFAULT '0' COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT '1',
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_variable`
--

CREATE TABLE `draft_variable` (
  `mvv_id` int(11) NOT NULL,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `mvv_order` int(11) NOT NULL,
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. ',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT '100' COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_variable_value_label`
--

CREATE TABLE `draft_variable_value_label` (
  `vvl_id` int(11) NOT NULL,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT '1',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work`
--

CREATE TABLE `draft_work` (
  `wrk_id` int(11) NOT NULL,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_uri` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `wrk_start_args` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_metadata_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambiaron los metadatos de una obra.',
  `wrk_dataset_labels_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambió el nombre de una columna o las etiquetas de un dataset.',
  `wrk_dataset_data_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambiaron la cantidad de datasets, los valores de un dataset o sus agregaciones.',
  `wrk_metric_labels_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que se modificó el color o los textos de las variables o categorías, sin cambiar su cantidad o puntos de corte.',
  `wrk_metric_data_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que se modificó la cantidad de variables o categorías de un metric.',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_work_permission`
--

CREATE TABLE `draft_work_permission` (
  `wkp_id` int(11) NOT NULL,
  `wkp_user_id` int(11) NOT NULL COMMENT 'Usuario al que se asigna el permiso',
  `wkp_work_id` int(11) NOT NULL COMMENT 'Obra sobre la que se asigna',
  `wkp_permission` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de permiso: ''V'': puede ver el backoffice. ''E'': puede editar. ''A'': puede administrar la obra'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `file`
--

CREATE TABLE `file` (
  `fil_id` int(11) NOT NULL,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `file_chunk`
--

CREATE TABLE `file_chunk` (
  `chu_id` int(11) NOT NULL,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geography`
--

CREATE TABLE `geography` (
  `geo_id` int(11) NOT NULL,
  `geo_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la geografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a al registro Provincias.',
  `geo_country_id` int(11) NOT NULL,
  `geo_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `geo_revision` varchar(10) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Permite complementar el caption en casos de geografías que mapean una misma unidad geográfica. En el caso de mapas censales, en geo_revision debe indicarse el año (ej. 2010, 2001).',
  `geo_area_avg_m2` double NOT NULL DEFAULT '0' COMMENT 'Tamaño promedio de las áreas de la geografía.',
  `geo_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo zoom sugerido a utilizar ante la disponibilidad de niveles de menor desagregación (rango: 0 a 22).',
  `geo_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo zoom sugerido a utilizar ante la disponibilidad de niveles de mayor desagregación (rango: 0 a 22).',
  `geo_field_code_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la entidad (ej. ''codProv'')',
  `geo_field_code_type` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de dato del campo en el archivo dbf provisto por el usuario que indica el código de la entidad. Los valores posibles son: ''T'': texto, ''N'': numérico entero.',
  `geo_field_caption_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica la descripción de la entidad (ej. ''Descripcion'')',
  `geo_field_urbanity_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica si las zonas son de tipo urbano (1) o rural (0) (ej. ''urbano'')',
  `geo_is_tracking_level` tinyint(1) NOT NULL DEFAULT '0',
  `geo_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `geo_metadata_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `geography_item`
--

CREATE TABLE `geography_item` (
  `gei_id` int(11) NOT NULL,
  `gei_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias 2010).',
  `gei_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia al ítem de geografía ''padre''. En el caso por ejemplo de Morón, su parent_id refiere a la provincia de Buenos Aires.',
  `gei_code` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `gei_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `gei_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `gei_geometry_is_null` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Permite indicar qué elementos no poseen geografía.',
  `gei_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `gei_area_m2` double DEFAULT NULL COMMENT 'Area en m2.',
  `gei_population` int(11) NOT NULL COMMENT 'Población total registrada en el ítem.',
  `gei_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en el ítem.',
  `gei_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en el ítem.',
  `gei_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, D: Urbano disperso,  R: Rural, L: Rural disperso, N: No corresponde. R y L corresponden a las categorias 2 y 3 la variable URP del Censo. U y D corresponden a la categoría 1 de URP, siendo D aquellas con < de 250 habitantes por km2.',
  `gei_geometry_r1` geometry NOT NULL,
  `gei_geometry_r2` geometry NOT NULL,
  `gei_geometry_r3` geometry NOT NULL,
  `gei_geometry_r4` geometry NOT NULL,
  `gei_geometry_r5` geometry NOT NULL,
  `gei_geometry_r6` geometry NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution`
--

CREATE TABLE `institution` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata`
--

CREATE TABLE `metadata` (
  `met_id` int(11) NOT NULL,
  `met_title` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(4096) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci COMMENT 'Texto con descripción extendida de los metadatos',
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización',
  `met_schedule_next_update` datetime DEFAULT NULL COMMENT 'Fecha de próxima actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata_file`
--

CREATE TABLE `metadata_file` (
  `mfi_id` int(11) NOT NULL,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metadata_source`
--

CREATE TABLE `metadata_source` (
  `msc_id` int(11) NOT NULL,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric`
--

CREATE TABLE `metric` (
  `mtr_id` int(11) NOT NULL,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT '0',
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_coverage_id` int(11) DEFAULT NULL,
  `mtr_caption` varchar(75) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric_group`
--

CREATE TABLE `metric_group` (
  `lgr_id` int(11) NOT NULL,
  `lgr_caption` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de métricas.',
  `lgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `lgr_visible` bit(1) NOT NULL DEFAULT b'1' COMMENT 'Visibilidad de la categoría en el visor de mapas',
  `lgr_icon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono de la categoría.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `metric_version`
--

CREATE TABLE `metric_version` (
  `mvr_id` int(11) NOT NULL,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(10) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). ',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador de la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `metric_version_level`
--

CREATE TABLE `metric_version_level` (
  `mvl_id` int(11) NOT NULL,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_clipping_region_item_geography_item`
--

CREATE TABLE `snapshot_clipping_region_item_geography_item` (
  `cgv_id` int(11) NOT NULL,
  `cgv_clipping_region_id` int(11) NOT NULL,
  `cgv_clipping_region_priority` int(11) NOT NULL DEFAULT '0',
  `cgv_clipping_region_item_id` int(11) NOT NULL,
  `cgv_geography_id` int(11) NOT NULL,
  `cgv_geography_item_id` int(11) NOT NULL,
  `cgv_level` int(11) NOT NULL,
  `cgv_area_m2` double NOT NULL COMMENT 'Area de la geografía.',
  `cgv_population` int(11) NOT NULL COMMENT 'Cantidad total de personas en la geografía.',
  `cgv_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en la geografía.',
  `cgv_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en la geografía.',
  `cgv_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento de la geografía según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural: N: No corresponde.'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_geography_item`
--

CREATE TABLE `snapshot_geography_item` (
  `giw_id` int(11) NOT NULL,
  `giw_geography_item_id` int(11) NOT NULL,
  `giw_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `giw_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a \r\n\r\nProvincias 2010).',
  `giw_centroid` point NOT NULL,
  `giw_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `giw_population` int(11) NOT NULL COMMENT 'Población total registrada en el ítem.',
  `giw_households` int(11) NOT NULL COMMENT 'Cantidad de hogares en el ítem.',
  `giw_children` int(11) NOT NULL COMMENT 'Cantidad de personas <18 años en el ítem.',
  `giw_geography_is_tracking_level` tinyint(1) DEFAULT NULL,
  `giw_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural, D: Urbano disperso, N: No corresponde.',
  `giw_geometry_r1` geometry NOT NULL,
  `giw_geometry_r2` geometry NOT NULL,
  `giw_geometry_r3` geometry NOT NULL,
  `giw_geometry_r4` geometry NOT NULL,
  `giw_geometry_r5` geometry NOT NULL,
  `giw_geometry_r6` geometry NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_lookup`
--

CREATE TABLE `snapshot_lookup` (
  `clv_id` int(11) NOT NULL,
  `clv_dataset_id` int(11) DEFAULT NULL,
  `clv_clipping_region_item_id` int(11) DEFAULT NULL,
  `clv_level` int(11) DEFAULT NULL,
  `clv_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clv_full_ids` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clv_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clv_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clv_priority` int(11) NOT NULL DEFAULT '10',
  `clv_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'C' COMMENT 'Tipo de elemento. Valores posibles: C=ítem de clipping, F=feature de layer (ej. escuela). P=Punto (ej. localidades)',
  `clv_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clv_population` int(11) NOT NULL DEFAULT '0' COMMENT 'Población declarada en la región de clippping',
  `clv_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clv_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clv_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clv_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clv_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_metric`
--

CREATE TABLE `snapshot_metric` (
  `myv_id` int(11) NOT NULL,
  `myv_metric_id` int(11) NOT NULL COMMENT 'Métrica a a que pertenece la versión.',
  `myv_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). El texto de contenido no debe repetirse, ya que está visible el caption de métrica (Metric).',
  `myv_work_ids` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `myv_work_captions` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `myv_has_public_data` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si el indicador está vinculado a datos públicos.',
  `myv_version_ids` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Ids de las versiones, separadas por ''\\t''.',
  `myv_version_captions` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Descripciones de las versiones de la métrica, separadas por ''\\t''.',
  `myv_version_environments` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los entornos de las versiones, separadas por ''\\t''.',
  `myv_version_levels` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `myv_version_partial_coverages` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `myv_variable_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombres de las variables de las versiones del metric para las métricas multimétricas. Las variables se encuentran agrupadas por versión entre separadores ''\\t''. Al interior de los datos de cada versión, se utiliza el separador ''\\n''.',
  `myv_variable_value_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombres de las etiquetas de los valores de las variables de las versiones del metric. ',
  `myv_metric_group_id` int(11) NOT NULL COMMENT 'Grupo al que pertenece el metric.',
  `myv_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_metric_versions`
--

CREATE TABLE `snapshot_metric_versions` (
  `mvw_id` int(11) NOT NULL,
  `mvw_metric_id` int(11) NOT NULL,
  `mvw_metric_version_id` int(11) NOT NULL,
  `mvw_caption` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `mvw_environment` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entorno en que debe mostrarse la versión de la métrica como disponible (NULO=Todos).',
  `mvw_partial_coverage` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_level` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_work_id` int(11) NOT NULL COMMENT 'Identificador de la obra.',
  `mvw_work_caption` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tìtulo de la obra.',
  `mvw_work_type` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de la obra',
  `mvw_variable_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las variables para los metric_version multimétricos. Los items se separan por un caracter \\n.',
  `mvw_variable_value_captions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las etiquetas de os valores de las variables. Los valores se encuentran separados por caracteres \\r. Para los metric_version multimétricos, los items correspondientes a cada variable se encuentran agrupados entre separadores \\n.'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_metric_version_item_variable`
--

CREATE TABLE `snapshot_metric_version_item_variable` (
  `miv_id` int(11) NOT NULL,
  `miv_metric_id` int(11) NOT NULL,
  `miv_metric_version_id` int(11) NOT NULL COMMENT 'MÃ©trica a la que corresponde el item.',
  `miv_geography_id` int(11) DEFAULT NULL,
  `miv_geography_item_id` int(11) NOT NULL COMMENT 'GeografÃ­a correspondiente a la fila del dataset.',
  `miv_feature_id` bigint(11) NOT NULL,
  `miv_envelope` polygon NOT NULL,
  `miv_rich_envelope` polygon NOT NULL,
  `miv_metric_version_variable_id` int(11) NOT NULL COMMENT 'Variable de la que se reflejan los valores.',
  `miv_value` double NOT NULL,
  `miv_version_value_label_id` int(11) DEFAULT NULL COMMENT 'CategorÃ­a correpondiente al valor.',
  `miv_description` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `miv_location` point NOT NULL,
  `miv_area_m2` double NOT NULL COMMENT 'Area en m2 de la cartografÃ¬a.',
  `miv_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento segÃºn si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural: N: No corresponde.',
  `miv_total` double NOT NULL DEFAULT '0' COMMENT 'Total calculado para la normalizaciÃ³n'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `snapshot_shape_dataset_item`
--

CREATE TABLE `snapshot_shape_dataset_item` (
  `sdi_id` int(11) NOT NULL,
  `sdi_dataset_id` int(11) NOT NULL,
  `sdi_dataset_item_id` int(11) NOT NULL,
  `sdi_feature_id` bigint(11) NOT NULL,
  `sdi_geometry_r1` geometry NOT NULL,
  `sdi_geometry_r2` geometry NOT NULL,
  `sdi_geometry_r3` geometry NOT NULL,
  `sdi_geometry_r4` geometry NOT NULL,
  `sdi_geometry_r5` geometry NOT NULL,
  `sdi_geometry_r6` geometry NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `source`
--

CREATE TABLE `source` (
  `src_id` int(11) NOT NULL,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `symbology`
--

CREATE TABLE `symbology` (
  `vsy_id` int(11) NOT NULL,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_categories` int(11) NOT NULL DEFAULT '4' COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT '5' COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT '1' COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_custom_colors` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` int(11) DEFAULT NULL,
  `vsy_pattern` int(11) NOT NULL DEFAULT '0' COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT '1',
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------


--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `usr_id` int(11) NOT NULL,
  `usr_email` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Dirección de correo con la que se identifica el usuario.',
  `usr_firstname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre completo de la persona.',
  `usr_lastname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `usr_password` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Contraseña.',
  `usr_create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del usuario.',
  `usr_privileges` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nivel de acceso del usuario (A=Administrador, L=Lector,E=Editor de capas, P=Usuario público)',
  `usr_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `usr_is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el usuario ha sido activado.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_link`
--

CREATE TABLE `user_link` (
  `lnk_id` int(11) NOT NULL,
  `lnk_user_id` int(11) NOT NULL,
  `lnk_type` varchar(1) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_token` int(11) NOT NULL,
  `lnk_to` varchar(512) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_message` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lnk_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_session`
--

CREATE TABLE `user_session` (
  `ses_id` int(11) NOT NULL,
  `ses_user_id` int(11) NOT NULL,
  `ses_token` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `ses_create` datetime NOT NULL,
  `ses_last_login` datetime NOT NULL,
  `ses_last_ip` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `ses_user_agent` varchar(512) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variable`
--

CREATE TABLE `variable` (
  `mvv_id` int(11) NOT NULL,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `mvv_order` int(11) NOT NULL,
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. ',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT '100' COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variable_value_label`
--

CREATE TABLE `variable_value_label` (
  `vvl_id` int(11) NOT NULL,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT '1',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `version`
--

CREATE TABLE `version` (
  `ver_id` int(11) NOT NULL,
  `ver_name` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del ítem de versionado.',
  `ver_value` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Número de versión vigente.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work`
--

CREATE TABLE `work` (
  `wrk_id` int(11) NOT NULL,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_uri` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `wrk_start_args` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_published_by` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Usuario (direccion de email) que publicó la obra',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_dataset_draft`
--

CREATE TABLE `work_dataset_draft` (
  `wdd_id` int(11) NOT NULL,
  `wdd_table` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `wdd_created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clipping_region`
--
ALTER TABLE `clipping_region`
  ADD PRIMARY KEY (`clr_id`),
  ADD KEY `fk_geographies_geographies1_idx` (`clr_parent_id`),
  ADD KEY `fk_clipping_region_clipping_region_item1` (`clr_country_id`),
  ADD KEY `clipping_region_ibfk_1` (`clr_metadata_id`);

--
-- Indexes for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  ADD PRIMARY KEY (`crg_id`),
  ADD UNIQUE KEY `crg_cartography_id` (`crg_geography_id`,`crg_clipping_region_id`),
  ADD KEY `fk_clipping_regions_geographies_geographies1_idx` (`crg_geography_id`),
  ADD KEY `fk_clipping_regions_geographies_clipping_regions1_idx` (`crg_clipping_region_id`);

--
-- Indexes for table `clipping_region_geography_item`
--
ALTER TABLE `clipping_region_geography_item`
  ADD PRIMARY KEY (`cgi_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx` (`cgi_clipping_region_item_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_geographies_items_idx` (`cgi_geography_item_id`),
  ADD KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx1` (`cgi_clipping_region_geography_id`);

--
-- Indexes for table `clipping_region_item`
--
ALTER TABLE `clipping_region_item`
  ADD PRIMARY KEY (`cli_id`),
  ADD KEY `fk_clipping_regions_items_clipping_regions1_idx` (`cli_clipping_region_id`),
  ADD KEY `fk_clipping_regions_items_clipping_regions_items1_idx` (`cli_parent_id`);

--
-- Indexes for table `contact`
--
ALTER TABLE `contact`
  ADD PRIMARY KEY (`con_id`);

--
-- Indexes for table `dataset`
--
ALTER TABLE `dataset`
  ADD PRIMARY KEY (`dat_id`),
  ADD KEY `fk_datasets_methodology1_idx` (`dat_work_id`),
  ADD KEY `fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  ADD KEY `fk_datasets_geographies1_idx` (`dat_geography_id`),
  ADD KEY `dat_latitude_column_id` (`dat_latitude_column_id`),
  ADD KEY `dat_longitude_column_id` (`dat_longitude_column_id`),
  ADD KEY `fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  ADD KEY `dat_images_column_id` (`dat_images_column_id`) USING BTREE;

--
-- Indexes for table `dataset_column`
--
ALTER TABLE `dataset_column`
  ADD PRIMARY KEY (`dco_id`),
  ADD KEY `fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  ADD KEY `fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`);

--
-- Indexes for table `dataset_label`
--
ALTER TABLE `dataset_label`
  ADD PRIMARY KEY (`dla_id`),
  ADD KEY `fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`);

--
-- Indexes for table `draft_contact`
--
ALTER TABLE `draft_contact`
  ADD PRIMARY KEY (`con_id`);

--
-- Indexes for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  ADD PRIMARY KEY (`dat_id`),
  ADD KEY `draft_fk_datasets_methodology1_idx` (`dat_work_id`),
  ADD KEY `draft_fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  ADD KEY `draft_fk_datasets_geographies1_idx` (`dat_geography_id`),
  ADD KEY `draft_dat_latitude_column_id` (`dat_latitude_column_id`),
  ADD KEY `draft_dat_longitude_column_id` (`dat_longitude_column_id`),
  ADD KEY `draft_fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  ADD KEY `draft_dat_images_column_id` (`dat_images_column_id`) USING BTREE;

--
-- Indexes for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  ADD PRIMARY KEY (`dco_id`),
  ADD KEY `draft_fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  ADD KEY `draft_fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`);

--
-- Indexes for table `draft_dataset_label`
--
ALTER TABLE `draft_dataset_label`
  ADD PRIMARY KEY (`dla_id`),
  ADD KEY `draft_fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`);

--
-- Indexes for table `draft_file`
--
ALTER TABLE `draft_file`
  ADD PRIMARY KEY (`fil_id`);

--
-- Indexes for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  ADD PRIMARY KEY (`chu_id`),
  ADD KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`);

--
-- Indexes for table `draft_institution`
--
ALTER TABLE `draft_institution`
  ADD PRIMARY KEY (`ins_id`),
  ADD UNIQUE KEY `draft_insUnique` (`ins_caption`);

--
-- Indexes for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  ADD PRIMARY KEY (`met_id`),
  ADD UNIQUE KEY `draft_metadata_ibfk_1` (`met_contact_id`) USING BTREE,
  ADD KEY `draft_metadata_ibfk_2` (`met_institution_id`);

--
-- Indexes for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  ADD PRIMARY KEY (`mfi_id`),
  ADD UNIQUE KEY `draft_unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  ADD KEY `draft_fk_work_file_work1_idx` (`mfi_metadata_id`),
  ADD KEY `draft_fk_work_file_file1_idx` (`mfi_file_id`);

--
-- Indexes for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  ADD PRIMARY KEY (`msc_id`),
  ADD UNIQUE KEY `uniquemetasource` (`msc_metadata_id`,`msc_source_id`),
  ADD KEY `draft_metadata_source_source` (`msc_source_id`),
  ADD KEY `draft_metadata_source_metadata` (`msc_metadata_id`);

--
-- Indexes for table `draft_metric`
--
ALTER TABLE `draft_metric`
  ADD PRIMARY KEY (`mtr_id`),
  ADD KEY `draft_fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  ADD KEY `fk_draft_metric_symbology1` (`mtr_symbology_id`);

--
-- Indexes for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  ADD PRIMARY KEY (`mvr_id`),
  ADD KEY `fk_draft_metric_version_draft_metric1_idx` (`mvr_metric_id`),
  ADD KEY `fk_draft_work_id` (`mvr_work_id`);

--
-- Indexes for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  ADD PRIMARY KEY (`mvl_id`),
  ADD KEY `fk_draft_version_dataset` (`mvl_dataset_id`),
  ADD KEY `fk_draft_metric_version_level_draft_metric_version1_idx` (`mvl_metric_version_id`);

--
-- Indexes for table `draft_source`
--
ALTER TABLE `draft_source`
  ADD PRIMARY KEY (`src_id`),
  ADD UNIQUE KEY `draft_srcUnique2` (`src_caption`,`src_version`),
  ADD KEY `draft_source_ibfk_3` (`src_contact_id`),
  ADD KEY `draft_source_ibfk_5` (`src_institution_id`);

--
-- Indexes for table `draft_symbology`
--
ALTER TABLE `draft_symbology`
  ADD PRIMARY KEY (`vsy_id`);

--
-- Indexes for table `draft_variable`
--
ALTER TABLE `draft_variable`
  ADD PRIMARY KEY (`mvv_id`),
  ADD UNIQUE KEY `levelorder` (`mvv_metric_version_level_id`,`mvv_order`),
  ADD KEY `draft_fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  ADD KEY `draft_fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  ADD KEY `fk_draft_variable_symbology` (`mvv_symbology_id`),
  ADD KEY `fk_draft_variable_norm_col` (`mvv_normalization_column_id`);

--
-- Indexes for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  ADD PRIMARY KEY (`vvl_id`),
  ADD UNIQUE KEY `variableValor` (`vvl_variable_id`,`vvl_value`),
  ADD KEY `fk_draft_variable_value_label_draft_metric_version_variable_idx` (`vvl_variable_id`);

--
-- Indexes for table `draft_work`
--
ALTER TABLE `draft_work`
  ADD PRIMARY KEY (`wrk_id`),
  ADD KEY `draft_fk_work_file1_idx` (`wrk_image_id`),
  ADD KEY `draft_wk_type` (`wrk_type`),
  ADD KEY `draft_wrk_type` (`wrk_type`),
  ADD KEY `draft_work_ibfk_1` (`wrk_metadata_id`);

--
-- Indexes for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  ADD PRIMARY KEY (`wkp_id`),
  ADD KEY `fk_draft_work_permission_user1` (`wkp_user_id`),
  ADD KEY `fk_draft_work_permission_work1` (`wkp_work_id`);

--
-- Indexes for table `file`
--
ALTER TABLE `file`
  ADD PRIMARY KEY (`fil_id`);

--
-- Indexes for table `file_chunk`
--
ALTER TABLE `file_chunk`
  ADD PRIMARY KEY (`chu_id`),
  ADD KEY `fk_file_chunk_file1_idx` (`chu_file_id`);

--
-- Indexes for table `geography`
--
ALTER TABLE `geography`
  ADD PRIMARY KEY (`geo_id`),
  ADD KEY `fk_geographies_geographies1_idx` (`geo_parent_id`),
  ADD KEY `fk_cartography_clipping_region_item1` (`geo_country_id`),
  ADD KEY `geography_ibfk_1` (`geo_metadata_id`);

--
-- Indexes for table `geography_item`
--
ALTER TABLE `geography_item`
  ADD PRIMARY KEY (`gei_id`),
  ADD UNIQUE KEY `carto_codes` (`gei_geography_id`,`gei_code`),
  ADD KEY `fk_geographies_items_geographies1_idx` (`gei_geography_id`),
  ADD KEY `fk_geographies_items_geographies_items1_idx` (`gei_parent_id`);

--
-- Indexes for table `institution`
--
ALTER TABLE `institution`
  ADD PRIMARY KEY (`ins_id`);

--
-- Indexes for table `metadata`
--
ALTER TABLE `metadata`
  ADD PRIMARY KEY (`met_id`),
  ADD KEY `metadata_ibfk_1` (`met_contact_id`),
  ADD KEY `metadata_ibfk_2` (`met_institution_id`);

--
-- Indexes for table `metadata_file`
--
ALTER TABLE `metadata_file`
  ADD PRIMARY KEY (`mfi_id`),
  ADD UNIQUE KEY `unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  ADD KEY `fk_work_file_work1_idx` (`mfi_metadata_id`),
  ADD KEY `fk_work_file_file1_idx` (`mfi_file_id`);

--
-- Indexes for table `metadata_source`
--
ALTER TABLE `metadata_source`
  ADD UNIQUE KEY `uniquemetasource2` (`msc_metadata_id`,`msc_source_id`) USING BTREE,
  ADD KEY `metadata_source_source` (`msc_source_id`),
  ADD KEY `metadata_source_metadata` (`msc_metadata_id`);

--
-- Indexes for table `metric`
--
ALTER TABLE `metric`
  ADD PRIMARY KEY (`mtr_id`),
  ADD KEY `fk_metric_symbology1` (`mtr_symbology_id`),
  ADD KEY `fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  ADD KEY `fk_layer_clipping_region_item1` (`mtr_coverage_id`);

--
-- Indexes for table `metric_group`
--
ALTER TABLE `metric_group`
  ADD PRIMARY KEY (`lgr_id`);

--
-- Indexes for table `metric_version`
--
ALTER TABLE `metric_version`
  ADD PRIMARY KEY (`mvr_id`),
  ADD KEY `fk_metric_version_metric1_idx` (`mvr_metric_id`),
  ADD KEY `fk_work_id2` (`mvr_work_id`);

--
-- Indexes for table `metric_version_level`
--
ALTER TABLE `metric_version_level`
  ADD PRIMARY KEY (`mvl_id`),
  ADD KEY `fk_version_dataset` (`mvl_dataset_id`),
  ADD KEY `fk_metric_version_level_metric_version1_idx` (`mvl_metric_version_id`);

--
-- Indexes for table `snapshot_clipping_region_item_geography_item`
--
ALTER TABLE `snapshot_clipping_region_item_geography_item`
  ADD PRIMARY KEY (`cgv_id`),
  ADD KEY `ix_cliregion_carto` (`cgv_clipping_region_item_id`,`cgv_geography_id`),
  ADD KEY `ix_carto` (`cgv_geography_item_id`);

--
-- Indexes for table `snapshot_geography_item`
--
ALTER TABLE `snapshot_geography_item`
  ADD PRIMARY KEY (`giw_id`),
  ADD UNIQUE KEY `ix_cai_id` (`giw_geography_item_id`),
  ADD SPATIAL KEY `ix_g1` (`giw_geometry_r1`),
  ADD SPATIAL KEY `ix_g2` (`giw_geometry_r2`),
  ADD SPATIAL KEY `ix_g3` (`giw_geometry_r3`),
  ADD SPATIAL KEY `ix_g4` (`giw_geometry_r4`),
  ADD SPATIAL KEY `ix_g5` (`giw_geometry_r5`),
  ADD SPATIAL KEY `ix_g6` (`giw_geometry_r6`);

--
-- Indexes for table `snapshot_lookup`
--
ALTER TABLE `snapshot_lookup`
  ADD PRIMARY KEY (`clv_id`),
  ADD SPATIAL KEY `lookup_spatial` (`clv_location`),
  ADD KEY `snap_item_dataset` (`clv_dataset_id`);
ALTER TABLE `snapshot_lookup` ADD FULLTEXT KEY `ix_lookup_caption` (`clv_caption`);

--
-- Indexes for table `snapshot_metric`
--
ALTER TABLE `snapshot_metric`
  ADD PRIMARY KEY (`myv_id`),
  ADD UNIQUE KEY `ix_layers_view_unique` (`myv_metric_id`);
ALTER TABLE `snapshot_metric` ADD FULLTEXT KEY `ix_layers_fulltext` (`myv_caption`,`myv_version_captions`,`myv_variable_captions`,`myv_variable_value_captions`,`myv_work_captions`);

--
-- Indexes for table `snapshot_metric_versions`
--
ALTER TABLE `snapshot_metric_versions`
  ADD PRIMARY KEY (`mvw_id`),
  ADD KEY `ix_layer_version_view` (`mvw_metric_version_id`);

--
-- Indexes for table `snapshot_metric_version_item_variable`
--
ALTER TABLE `snapshot_metric_version_item_variable`
  ADD PRIMARY KEY (`miv_id`),
  ADD KEY `ix_layer_version_item_variable_view_caritem` (`miv_metric_version_id`,`miv_geography_item_id`,`miv_geography_id`),
  ADD SPATIAL KEY `ix_liv_envelope_rich` (`miv_rich_envelope`);

--
-- Indexes for table `snapshot_shape_dataset_item`
--
ALTER TABLE `snapshot_shape_dataset_item`
  ADD PRIMARY KEY (`sdi_id`),
  ADD UNIQUE KEY `uniquenormal` (`sdi_dataset_id`,`sdi_dataset_item_id`),
  ADD UNIQUE KEY `unique` (`sdi_feature_id`),
  ADD SPATIAL KEY `geor1` (`sdi_geometry_r1`),
  ADD SPATIAL KEY `geor2` (`sdi_geometry_r2`),
  ADD SPATIAL KEY `geor3` (`sdi_geometry_r3`),
  ADD SPATIAL KEY `geor4` (`sdi_geometry_r4`),
  ADD SPATIAL KEY `geor5` (`sdi_geometry_r5`),
  ADD SPATIAL KEY `geor6` (`sdi_geometry_r6`);

--
-- Indexes for table `source`
--
ALTER TABLE `source`
  ADD PRIMARY KEY (`src_id`),
  ADD KEY `source_ibfk_3` (`src_contact_id`),
  ADD KEY `source_ibfk_5` (`src_institution_id`);

--
-- Indexes for table `symbology`
--
ALTER TABLE `symbology`
  ADD PRIMARY KEY (`vsy_id`);


--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`usr_id`),
  ADD UNIQUE KEY `idx_email` (`usr_email`);

--
-- Indexes for table `user_link`
--
ALTER TABLE `user_link`
  ADD PRIMARY KEY (`lnk_id`),
  ADD KEY `fk_user_user_link` (`lnk_user_id`);

--
-- Indexes for table `user_session`
--
ALTER TABLE `user_session`
  ADD PRIMARY KEY (`ses_id`),
  ADD UNIQUE KEY `ix_session_unique` (`ses_user_id`,`ses_token`);

--
-- Indexes for table `variable`
--
ALTER TABLE `variable`
  ADD PRIMARY KEY (`mvv_id`),
  ADD KEY `fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  ADD KEY `fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  ADD KEY `fk_variable_norm_col` (`mvv_normalization_column_id`),
  ADD KEY `fk_variable_symbology` (`mvv_symbology_id`);

--
-- Indexes for table `variable_value_label`
--
ALTER TABLE `variable_value_label`
  ADD PRIMARY KEY (`vvl_id`),
  ADD KEY `fw_variable` (`vvl_variable_id`);

--
-- Indexes for table `version`
--
ALTER TABLE `version`
  ADD PRIMARY KEY (`ver_id`),
  ADD UNIQUE KEY `upt_name_UNIQUE` (`ver_name`);

--
-- Indexes for table `work`
--
ALTER TABLE `work`
  ADD PRIMARY KEY (`wrk_id`),
  ADD KEY `fk_work_file1_idx` (`wrk_image_id`),
  ADD KEY `wk_type` (`wrk_type`),
  ADD KEY `wrk_type` (`wrk_type`),
  ADD KEY `work_ibfk_1` (`wrk_metadata_id`);

--
-- Indexes for table `work_dataset_draft`
--
ALTER TABLE `work_dataset_draft`
  ADD PRIMARY KEY (`wdd_id`),
  ADD KEY `wdd_table` (`wdd_table`);


--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clipping_region`
--
ALTER TABLE `clipping_region`
  MODIFY `clr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  MODIFY `crg_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_geography_item`
--
ALTER TABLE `clipping_region_geography_item`
  MODIFY `cgi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clipping_region_item`
--
ALTER TABLE `clipping_region_item`
  MODIFY `cli_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_contact`
--
ALTER TABLE `draft_contact`
  MODIFY `con_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  MODIFY `dat_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  MODIFY `dco_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_dataset_label`
--
ALTER TABLE `draft_dataset_label`
  MODIFY `dla_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_file`
--
ALTER TABLE `draft_file`
  MODIFY `fil_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  MODIFY `chu_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_institution`
--
ALTER TABLE `draft_institution`
  MODIFY `ins_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  MODIFY `met_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  MODIFY `mfi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  MODIFY `msc_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric`
--
ALTER TABLE `draft_metric`
  MODIFY `mtr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  MODIFY `mvr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  MODIFY `mvl_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_source`
--
ALTER TABLE `draft_source`
  MODIFY `src_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_symbology`
--
ALTER TABLE `draft_symbology`
  MODIFY `vsy_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_variable`
--
ALTER TABLE `draft_variable`
  MODIFY `mvv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  MODIFY `vvl_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work`
--
ALTER TABLE `draft_work`
  MODIFY `wrk_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  MODIFY `wkp_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `geography`
--
ALTER TABLE `geography`
  MODIFY `geo_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `geography_item`
--
ALTER TABLE `geography_item`
  MODIFY `gei_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `metric_group`
--
ALTER TABLE `metric_group`
  MODIFY `lgr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_clipping_region_item_geography_item`
--
ALTER TABLE `snapshot_clipping_region_item_geography_item`
  MODIFY `cgv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_geography_item`
--
ALTER TABLE `snapshot_geography_item`
  MODIFY `giw_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_lookup`
--
ALTER TABLE `snapshot_lookup`
  MODIFY `clv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_metric`
--
ALTER TABLE `snapshot_metric`
  MODIFY `myv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_metric_versions`
--
ALTER TABLE `snapshot_metric_versions`
  MODIFY `mvw_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_metric_version_item_variable`
--
ALTER TABLE `snapshot_metric_version_item_variable`
  MODIFY `miv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `snapshot_shape_dataset_item`
--
ALTER TABLE `snapshot_shape_dataset_item`
  MODIFY `sdi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `usr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_link`
--
ALTER TABLE `user_link`
  MODIFY `lnk_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_session`
--
ALTER TABLE `user_session`
  MODIFY `ses_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `version`
--
ALTER TABLE `version`
  MODIFY `ver_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_dataset_draft`
--
ALTER TABLE `work_dataset_draft`
  MODIFY `wdd_id` int(11) NOT NULL AUTO_INCREMENT;


--
-- Constraints for dumped tables
--

--
-- Constraints for table `clipping_region`
--
ALTER TABLE `clipping_region`
  ADD CONSTRAINT `clipping_region_ibfk_1` FOREIGN KEY (`clr_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_region_clipping_region_item1` FOREIGN KEY (`clr_country_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geographies_geographies10` FOREIGN KEY (`clr_parent_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `clipping_region_geography`
--
ALTER TABLE `clipping_region_geography`
  ADD CONSTRAINT `fk_clipping_regions_geographies_clipping_regions1` FOREIGN KEY (`crg_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_regions_geographies_geographies1` FOREIGN KEY (`crg_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `clipping_region_geography_item`
--
ALTER TABLE `clipping_region_geography_item`
  ADD CONSTRAINT `fk_clipping_regions_items_geography_items_clipping_regions_ge1` FOREIGN KEY (`cgi_clipping_region_geography_id`) REFERENCES `clipping_region_geography` (`crg_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_regions_items_geography_items_clipping_regions_it1` FOREIGN KEY (`cgi_clipping_region_item_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_regions_items_geography_items_geographies_items1` FOREIGN KEY (`cgi_geography_item_id`) REFERENCES `geography_item` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `clipping_region_item`
--
ALTER TABLE `clipping_region_item`
  ADD CONSTRAINT `fk_clipping_regions_items_clipping_regions1` FOREIGN KEY (`cli_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_clipping_regions_items_clipping_regions_items1` FOREIGN KEY (`cli_parent_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `dataset`
--
ALTER TABLE `dataset`
  ADD CONSTRAINT `dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `dataset_column`
--
ALTER TABLE `dataset_column`
  ADD CONSTRAINT `fk_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `dataset_label`
--
ALTER TABLE `dataset_label`
  ADD CONSTRAINT `fk_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `draft_dataset`
--
ALTER TABLE `draft_dataset`
  ADD CONSTRAINT `draft_dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `draft_dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_dataset_column`
--
ALTER TABLE `draft_dataset_column`
  ADD CONSTRAINT `fk_draft_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `draft_dataset` (`dat_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_dataset_label`
--
ALTER TABLE `draft_dataset_label`
  ADD CONSTRAINT `fk_draft_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_file_chunk`
--
ALTER TABLE `draft_file_chunk`
  ADD CONSTRAINT `fk_draft_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metadata`
--
ALTER TABLE `draft_metadata`
  ADD CONSTRAINT `draft_metadata_ibfk_1b` FOREIGN KEY (`met_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_ibfk_2` FOREIGN KEY (`met_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metadata_file`
--
ALTER TABLE `draft_metadata_file`
  ADD CONSTRAINT `draft_metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metadata_source`
--
ALTER TABLE `draft_metadata_source`
  ADD CONSTRAINT `draft_metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `draft_source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metric`
--
ALTER TABLE `draft_metric`
  ADD CONSTRAINT `fk_draft_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_metric_version`
--
ALTER TABLE `draft_metric_version`
  ADD CONSTRAINT `fk_draft_metric_version_draft_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `draft_metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_id` FOREIGN KEY (`mvr_work_id`) REFERENCES `draft_work` (`wrk_id`);

--
-- Constraints for table `draft_metric_version_level`
--
ALTER TABLE `draft_metric_version_level`
  ADD CONSTRAINT `fk_draft_metric_version_level_draft_metric_version1` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `draft_metric_version` (`mvr_id`),
  ADD CONSTRAINT `fk_draft_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `draft_dataset` (`dat_id`);

--
-- Constraints for table `draft_source`
--
ALTER TABLE `draft_source`
  ADD CONSTRAINT `draft_source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `draft_source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_variable`
--
ALTER TABLE `draft_variable`
  ADD CONSTRAINT `fk_draft_metric_version_data_col` FOREIGN KEY (`mvv_data_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_variable_norm_col` FOREIGN KEY (`mvv_normalization_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  ADD CONSTRAINT `fk_draft_variable_symbology` FOREIGN KEY (`mvv_symbology_id`) REFERENCES `draft_symbology` (`vsy_id`),
  ADD CONSTRAINT `fk_version_level_variable` FOREIGN KEY (`mvv_metric_version_level_id`) REFERENCES `draft_metric_version_level` (`mvl_id`);

--
-- Constraints for table `draft_variable_value_label`
--
ALTER TABLE `draft_variable_value_label`
  ADD CONSTRAINT `fw_draft_variable` FOREIGN KEY (`vvl_variable_id`) REFERENCES `draft_variable` (`mvv_id`);

--
-- Constraints for table `draft_work`
--
ALTER TABLE `draft_work`
  ADD CONSTRAINT `draft_work_ibfk_1` FOREIGN KEY (`wrk_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_file1` FOREIGN KEY (`wrk_image_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `draft_work_permission`
--
ALTER TABLE `draft_work_permission`
  ADD CONSTRAINT `fk_draft_work_permission_user1` FOREIGN KEY (`wkp_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_draft_work_permission_work1` FOREIGN KEY (`wkp_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `file_chunk`
--
ALTER TABLE `file_chunk`
  ADD CONSTRAINT `fk_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `geography`
--
ALTER TABLE `geography`
  ADD CONSTRAINT `fk_geographies_geographies1` FOREIGN KEY (`geo_parent_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geography_clipping_region_item1` FOREIGN KEY (`geo_country_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `geography_ibfk_1` FOREIGN KEY (`geo_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `geography_item`
--
ALTER TABLE `geography_item`
  ADD CONSTRAINT `fk_geographies_items_geographies1` FOREIGN KEY (`gei_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_geographies_items_geographies_items1` FOREIGN KEY (`gei_parent_id`) REFERENCES `geography_item` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metadata`
--
ALTER TABLE `metadata`
  ADD CONSTRAINT `metadata_ibfk_1` FOREIGN KEY (`met_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_ibfk_2` FOREIGN KEY (`met_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metadata_file`
--
ALTER TABLE `metadata_file`
  ADD CONSTRAINT `metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `metadata_source`
--
ALTER TABLE `metadata_source`
  ADD CONSTRAINT `metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metric`
--
ALTER TABLE `metric`
  ADD CONSTRAINT `fk_metric_clipping_region_item1` FOREIGN KEY (`mtr_coverage_id`) REFERENCES `clipping_region_item` (`cli_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `metric_version`
--
ALTER TABLE `metric_version`
  ADD CONSTRAINT `fk_metric_version_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_work_id2` FOREIGN KEY (`mvr_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `metric_version_level`
--
ALTER TABLE `metric_version_level`
  ADD CONSTRAINT `fk_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fw_metric_version` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `metric_version` (`mvr_id`) ON DELETE CASCADE;

--
-- Constraints for table `source`
--
ALTER TABLE `source`
  ADD CONSTRAINT `source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- DATOS DE BASE

INSERT INTO `version` (`ver_id`, `ver_name`, `ver_value`) VALUES
(1, 'DB', '104'),
(2, 'APP', '-'),
(3, 'CARTO_GEO', '583'),
(4, 'LOOKUP_VIEW', '210'),
(5, 'CARTOGRAPHY_VIEW', '210'),
(6, 'CARTOGRAPHY_REGION_VIEW', '210'),
(7, 'SHAPE_VIEW', '210');

INSERT INTO `clipping_region` (`clr_id`, `clr_country_id`, `clr_parent_id`, `clr_caption`, `clr_symbol`, `clr_priority`, `clr_field_code_name`, `clr_no_autocomplete`, `clr_labels_min_zoom`, `clr_labels_max_zoom`, `clr_metadata_id`) VALUES
(26, NULL, NULL, 'Países', NULL, 0, 'CODE', 0, 0, 0, NULL);


INSERT INTO `user` (`usr_id`, `usr_email`, `usr_firstname`, `usr_lastname`, `usr_password`, `usr_create_time`, `usr_privileges`, `usr_deleted`, `usr_is_active`) VALUES
(1, 'admin', 'Administrador', 'Administrador', '$2y$10$3ZM..N0URJfcwxgeL7QHQepGCbbbWYxrWsDk4yS.MfmMJB53UE6Zi', '2019-07-12 16:19:02', 'A', 0, 1);