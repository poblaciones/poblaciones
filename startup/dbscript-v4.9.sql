-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `boundary`
--

DROP TABLE IF EXISTS `boundary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boundary` (
  `bou_id` int(11) NOT NULL AUTO_INCREMENT,
  `bou_group_id` int(11) NOT NULL COMMENT 'Grupo de límites al que pertenece.',
  `bou_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del límite.',
  `bou_tag` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'identificador para WFS',
  `bou_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `bou_is_private` tinyint(1) NOT NULL DEFAULT '1',
  `bou_is_suggestion` tinyint(1) NOT NULL DEFAULT '0',
  `bou_icon` varchar(10000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `bou_sort_by` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Valores posibles. ''N'': Nombre, ''P'': Población, ''C'': Código.',
  PRIMARY KEY (`bou_id`),
  UNIQUE KEY `ix_boundary_Tag` (`bou_tag`),
  KEY `fw_boundary_group_idx` (`bou_group_id`),
  CONSTRAINT `fk_boundary_group2` FOREIGN KEY (`bou_group_id`) REFERENCES `boundary_group` (`bgr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:55
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `boundary_group`
--

DROP TABLE IF EXISTS `boundary_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boundary_group` (
  `bgr_id` int(11) NOT NULL AUTO_INCREMENT,
  `bgr_caption` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de límites.',
  `bgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  PRIMARY KEY (`bgr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `boundary_version`
--

DROP TABLE IF EXISTS `boundary_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boundary_version` (
  `bvr_id` int(11) NOT NULL AUTO_INCREMENT,
  `bvr_boundary_id` int(11) NOT NULL,
  `bvr_caption` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `bvr_geography_id` int(11) DEFAULT NULL COMMENT 'Metadatos a anexar al momento de descargar (ej. código y nombre de departamento en que se encuentra)',
  `bvr_metadata_id` int(11) DEFAULT NULL COMMENT 'Metadatos del límite',
  PRIMARY KEY (`bvr_id`),
  KEY `fk_metadata_boundary_idx` (`bvr_metadata_id`),
  KEY `fk_boundary_geography_idx` (`bvr_geography_id`),
  KEY `fk_boundary` (`bvr_boundary_id`),
  CONSTRAINT `fk_boundary` FOREIGN KEY (`bvr_boundary_id`) REFERENCES `boundary` (`bou_id`),
  CONSTRAINT `fk_boundary_geography` FOREIGN KEY (`bvr_geography_id`) REFERENCES `geography` (`geo_id`),
  CONSTRAINT `fk_metadata_boundary` FOREIGN KEY (`bvr_metadata_id`) REFERENCES `metadata` (`met_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `boundary_version_clipping_region`
--

DROP TABLE IF EXISTS `boundary_version_clipping_region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boundary_version_clipping_region` (
  `bcr_id` int(11) NOT NULL AUTO_INCREMENT,
  `bcr_boundary_version_id` int(11) NOT NULL COMMENT 'Límite.',
  `bcr_clipping_region_id` int(11) NOT NULL COMMENT 'Región de clipping',
  PRIMARY KEY (`bcr_id`),
  UNIQUE KEY `fw_bound_clip_unique` (`bcr_boundary_version_id`,`bcr_clipping_region_id`),
  KEY `fw_boundary_relat_idx` (`bcr_boundary_version_id`),
  KEY `fk_boundary_clipping_idx` (`bcr_clipping_region_id`),
  CONSTRAINT `fk_boundary_clipping` FOREIGN KEY (`bcr_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_boundary_relat` FOREIGN KEY (`bcr_boundary_version_id`) REFERENCES `boundary_version` (`bvr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `clipping_region`
--

DROP TABLE IF EXISTS `clipping_region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clipping_region` (
  `clr_id` int(11) NOT NULL AUTO_INCREMENT,
  `clr_country_id` int(11) DEFAULT NULL,
  `clr_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la región ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere al registro Provincias.',
  `clr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `clr_version` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clr_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clr_priority` int(11) NOT NULL DEFAULT '0',
  `clr_is_crawler_indexer` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Indica si debe usarse como criterio de segmentación hacia crawlers',
  `clr_field_code_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la región (ej. ''codProv'')',
  `clr_index_code` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se indexa el código de los elementos.',
  `clr_no_autocomplete` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si debe ofrecerse este nivel de regiones al hacerse un autocompletado para el ingreso de regiones.',
  `clr_labels_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clr_labels_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clr_metadata_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`clr_id`),
  KEY `fk_geographies_geographies1_idx` (`clr_parent_id`),
  KEY `fk_clipping_region_clipping_region_item1` (`clr_country_id`),
  KEY `clipping_region_ibfk_1` (`clr_metadata_id`),
  CONSTRAINT `clipping_region_ibfk_1` FOREIGN KEY (`clr_metadata_id`) REFERENCES `metadata` (`met_id`),
  CONSTRAINT `fk_clipping_region_clipping_region_item1` FOREIGN KEY (`clr_country_id`) REFERENCES `clipping_region_item` (`cli_id`),
  CONSTRAINT `fk_geographies_geographies10` FOREIGN KEY (`clr_parent_id`) REFERENCES `clipping_region` (`clr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `clipping_region_geography`
--

DROP TABLE IF EXISTS `clipping_region_geography`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clipping_region_geography` (
  `crg_id` int(11) NOT NULL AUTO_INCREMENT,
  `crg_geography_id` int(11) NOT NULL COMMENT 'Geografía',
  `crg_clipping_region_id` int(11) NOT NULL COMMENT 'Región.',
  PRIMARY KEY (`crg_id`),
  UNIQUE KEY `crg_cartography_id` (`crg_geography_id`,`crg_clipping_region_id`),
  KEY `fk_clipping_regions_geographies_geographies1_idx` (`crg_geography_id`),
  KEY `fk_clipping_regions_geographies_clipping_regions1_idx` (`crg_clipping_region_id`),
  CONSTRAINT `fk_clipping_regions_geographies_clipping_regions1` FOREIGN KEY (`crg_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`),
  CONSTRAINT `fk_clipping_regions_geographies_geographies1` FOREIGN KEY (`crg_geography_id`) REFERENCES `geography` (`geo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=566 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `clipping_region_item`
--

DROP TABLE IF EXISTS `clipping_region_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clipping_region_item` (
  `cli_id` int(11) NOT NULL AUTO_INCREMENT,
  `cli_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la cartografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a  al registro Provincias.',
  `cli_clipping_region_id` int(11) NOT NULL COMMENT 'Región a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias).',
  `cli_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `cli_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto descriptivo (Ej. Catamarca).',
  `cli_geometry` geometry NOT NULL COMMENT 'Forma que define al ítem.',
  `cli_geometry_r1` geometry NOT NULL,
  `cli_geometry_r2` geometry NOT NULL,
  `cli_geometry_r3` geometry NOT NULL,
  `cli_centroid` point NOT NULL COMMENT 'Centroide del ítem.',
  `cli_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `cli_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`cli_id`),
  KEY `fk_clipping_regions_items_clipping_regions1_2_idx` (`cli_clipping_region_id`),
  KEY `fk_clipping_regions_items_clipping_regions_items1_2_idx` (`cli_parent_id`),
  CONSTRAINT `fk_clipping_items_g_2` FOREIGN KEY (`cli_clipping_region_id`) REFERENCES `clipping_region` (`clr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=99715 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1 ROW_FORMAT=COMPRESSED;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:17:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `clipping_region_item_geography_item`
--

DROP TABLE IF EXISTS `clipping_region_item_geography_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clipping_region_item_geography_item` (
  `cgi_id` int(11) NOT NULL AUTO_INCREMENT,
  `cgi_clipping_region_item_id` int(11) NOT NULL COMMENT 'Ítem de la región de clipping.',
  `cgi_geography_item_id` int(11) NOT NULL COMMENT 'Ítem de la geografía.',
  `cgi_clipping_region_geography_id` int(11) NOT NULL COMMENT 'Referencia a la relación entre las entidades contenedoras de ambos ítems.',
  `cgi_intersection_percent` double NOT NULL COMMENT 'Área de intersección en m2.',
  PRIMARY KEY (`cgi_id`),
  KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx` (`cgi_clipping_region_item_id`),
  KEY `fk_clipping_regions_items_geography_items_geographies_items_idx` (`cgi_geography_item_id`),
  KEY `fk_clipping_regions_items_geography_items_clipping_regions__idx1` (`cgi_clipping_region_geography_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9913221 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:49
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `compressed_table`
--

DROP TABLE IF EXISTS `compressed_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compressed_table` (
  `com_id` int(11) NOT NULL AUTO_INCREMENT,
  `com_caption` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`com_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `contact`
--

DROP TABLE IF EXISTS `contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact` (
  `con_id` int(11) NOT NULL,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  PRIMARY KEY (`con_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `dataset`
--

DROP TABLE IF EXISTS `dataset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dataset` (
  `dat_id` int(11) NOT NULL,
  `dat_geography_id` int(11) NOT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_geography_segment_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del final del segment en dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_latitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.',
  `dat_longitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_partition_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.',
  `dat_partition_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `dat_partition_all_label` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Todos',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_texture_id` int(11) DEFAULT NULL COMMENT 'Referencia al gradiente para generar rellenos',
  `dat_marker_id` int(11) NOT NULL,
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` bit(1) NOT NULL DEFAULT b'0',
  `dat_show_info` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si muestra el panel de resumen para los elementos del dataset',
  `dat_skip_empty_fields` tinyint(1) NOT NULL DEFAULT '0',
  `dat_are_segments` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la georreferenciación fue por segmentos.',
  `dat_public_labels` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.',
  PRIMARY KEY (`dat_id`),
  UNIQUE KEY `datTable` (`dat_table`),
  KEY `fk_datasets_methodology1_idx` (`dat_work_id`),
  KEY `fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  KEY `fk_datasets_geographies1_idx` (`dat_geography_id`),
  KEY `dat_latitude_column_id` (`dat_latitude_column_id`),
  KEY `dat_longitude_column_id` (`dat_longitude_column_id`),
  KEY `fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  KEY `dat_images_column_id` (`dat_images_column_id`) USING BTREE,
  KEY `ft_dataset_gradient_idx` (`dat_texture_id`),
  KEY `fk_dataset_marker_idx` (`dat_marker_id`),
  KEY `fk_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id`),
  KEY `fk_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id`),
  KEY `fk_datasets_geograph_segment_idx` (`dat_geography_segment_id`),
  CONSTRAINT `dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  CONSTRAINT `dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `dataset_column` (`dco_id`),
  CONSTRAINT `fk_dataset_marker` FOREIGN KEY (`dat_marker_id`) REFERENCES `dataset_marker` (`dmk_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_datasets_columns_lat_segment` FOREIGN KEY (`dat_latitude_column_segment_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_columns_lon_segment` FOREIGN KEY (`dat_longitude_column_segment_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_geograph_segment` FOREIGN KEY (`dat_geography_segment_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `ft_dataset_gradient` FOREIGN KEY (`dat_texture_id`) REFERENCES `gradient` (`grd_id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:56
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `dataset_column`
--

DROP TABLE IF EXISTS `dataset_column`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `dco_format` int(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Numérico.',
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci,
  PRIMARY KEY (`dco_id`),
  KEY `fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  KEY `fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`),
  CONSTRAINT `fk_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `dataset_column_value_label`
--

DROP TABLE IF EXISTS `dataset_column_value_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dataset_column_value_label` (
  `dla_id` int(11) NOT NULL,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.',
  PRIMARY KEY (`dla_id`),
  KEY `fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`),
  CONSTRAINT `fk_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `dataset_marker`
--

DROP TABLE IF EXISTS `dataset_marker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dataset_marker` (
  `dmk_id` int(11) NOT NULL,
  `dmk_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` int(11) DEFAULT NULL COMMENT 'Columna conteniendo la columna para los marcadores basado en variable (columna).',
  `dmk_symbol` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.',
  `dmk_text` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.',
  PRIMARY KEY (`dmk_id`),
  KEY `fp_dataset_marker_column1_idx` (`dmk_content_column_id`),
  CONSTRAINT `fp_dataset_marker_column1` FOREIGN KEY (`dmk_content_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_annotation`
--

DROP TABLE IF EXISTS `draft_annotation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_annotation` (
  `ann_id` int(11) NOT NULL AUTO_INCREMENT,
  `ann_caption` varchar(100) COLLATE utf8_bin NOT NULL,
  `ann_work_id` int(11) NOT NULL,
  `ann_guest_access` char(1) COLLATE utf8_bin NOT NULL DEFAULT 'N' COMMENT 'Permite los valores: \nA. puede agregar elementos. E. puede editar elementos. R. Puede solamente ver elementos. N. Las anotaciones son privadas.',
  `ann_allowed_types` varchar(10) COLLATE utf8_bin NOT NULL DEFAULT 'CLMPQ',
  PRIMARY KEY (`ann_id`),
  KEY `fw_annotation_work_idx` (`ann_work_id`),
  CONSTRAINT `fw_annotation_work` FOREIGN KEY (`ann_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_annotation_item`
--

DROP TABLE IF EXISTS `draft_annotation_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_annotation_item` (
  `ani_id` int(11) NOT NULL AUTO_INCREMENT,
  `ani_annotation_id` int(11) NOT NULL,
  `ani_type` char(1) NOT NULL COMMENT 'Valores posibles. M. Punto. L. Polilínea. P. Polígono. C. Comentario. Q. Pregunta',
  `ani_centroid` point NOT NULL,
  `ani_geometry` geometry NOT NULL,
  `ani_order` int(11) NOT NULL,
  `ani_caption` varchar(255) NOT NULL,
  `ani_description` text,
  `ani_color` char(6) DEFAULT NULL,
  `ani_image` blob,
  `ani_length_m` float DEFAULT NULL,
  `ani_area_m2` float DEFAULT NULL,
  `ani_create` datetime NOT NULL,
  `ani_user` varchar(100) NOT NULL,
  `ani_update` datetime NOT NULL,
  PRIMARY KEY (`ani_id`),
  UNIQUE KEY `ani_order` (`ani_annotation_id`,`ani_order`),
  KEY `fw_annotation_idx` (`ani_annotation_id`),
  CONSTRAINT `fw_annotation` FOREIGN KEY (`ani_annotation_id`) REFERENCES `draft_annotation` (`ann_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:57
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_contact`
--

DROP TABLE IF EXISTS `draft_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_contact` (
  `con_id` int(11) NOT NULL AUTO_INCREMENT,
  `con_person` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre y apellido de la persona de contacto',
  `con_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico de contacto',
  `con_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  PRIMARY KEY (`con_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4857 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:58
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_dataset`
--

DROP TABLE IF EXISTS `draft_dataset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_dataset` (
  `dat_id` int(11) NOT NULL AUTO_INCREMENT,
  `dat_geography_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del dataset (ej. Radio, Provincia).',
  `dat_geography_segment_id` int(11) DEFAULT NULL COMMENT 'Nivel de mapa con el que se vinculan los datos del final del segment en dataset (ej. Radio, Provincia).',
  `dat_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de dataset. Los tipos posibles son: S: ShapeLayer, como por ejemplo la lista de asentamientos de TECHO. L: LocationLayer, listas de lugares, como las ubicaciones de las escuelas del país, D: DataLayer, capa de datos vinculados al mapa, como la lista de radios con vulnerabilidad de vivienda según censo. ',
  `dat_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del dataset (ej. Datos demográficos por radio CNPyV 2001).',
  `dat_table` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tabla en la que fueron volcados los datos correspondientes al dataset (ej. T_0001).',
  `dat_multilevel_matrix` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Grupo de datasets dentro de la obra a la que pertenece el dataset.',
  `dat_geography_item_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al ID de mapa (ej. C_geography_id).',
  `dat_caption_column_id` int(11) DEFAULT NULL COMMENT 'Indica la columna que posee las descripciones de los elementos',
  `dat_latitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud.',
  `dat_longitude_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud.',
  `dat_latitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo latitud para segmentos.',
  `dat_longitude_column_segment_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo longitud para segmentos.',
  `dat_images_column_id` int(11) DEFAULT NULL COMMENT 'Columna que contiene la secuencia de imágenes correspondientes al item. Las imágenes deben estar indicadas como URLs absolutas, separados por coma, pudiendo tener entre [] a continuación una url de thumbnail.',
  `dat_partition_column_id` int(11) DEFAULT NULL COMMENT 'Columna en la tabla (ej. T_001) que tiene la referencia al campo de particionado.',
  `dat_partition_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `dat_partition_all_label` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Todos',
  `dat_work_id` int(11) NOT NULL COMMENT 'Fuente de la información.',
  `dat_texture_id` int(11) DEFAULT NULL COMMENT 'Referencia al gradiente para generar rellenos',
  `dat_marker_id` int(11) NOT NULL,
  `dat_exportable` tinyint(1) NOT NULL COMMENT 'Indica si el dataset debe ser ofrecido para descargarse.',
  `dat_geocoded` tinyint(1) NOT NULL DEFAULT '0',
  `dat_georeference_attributes` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dat_georeference_status` int(11) NOT NULL DEFAULT '0',
  `dat_show_info` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si muestra el panel de resumen para los elementos del dataset',
  `dat_skip_empty_fields` tinyint(1) NOT NULL DEFAULT '0',
  `dat_are_segments` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la georreferenciación fue por segmentos.',
  `dat_public_labels` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si las filas del dataset deben formar parte de las etiquetas del mapa en los niveles de zoom más grandes.',
  PRIMARY KEY (`dat_id`),
  UNIQUE KEY `draftDatTable` (`dat_table`),
  KEY `draft_fk_datasets_methodology1_idx` (`dat_work_id`),
  KEY `draft_fk_datasets_datasets_columns1_idx` (`dat_geography_item_column_id`),
  KEY `draft_fk_datasets_geographies1_idx` (`dat_geography_id`),
  KEY `draft_dat_latitude_column_id` (`dat_latitude_column_id`),
  KEY `draft_dat_longitude_column_id` (`dat_longitude_column_id`),
  KEY `draft_fk_datasets_datasets_columns1x` (`dat_caption_column_id`),
  KEY `draft_dat_images_column_id` (`dat_images_column_id`) USING BTREE,
  KEY `ft_draftdataset_gradient_idx` (`dat_texture_id`),
  KEY `fk_draft_dataset_marker_idx` (`dat_marker_id`),
  KEY `fk_draft_datasets_columns_lat_ref_idx` (`dat_latitude_column_segment_id`),
  KEY `fk_draft_datasets_columns_lon_segment_idx` (`dat_longitude_column_segment_id`),
  KEY `fk_draft_datasets_geograph_segment_idx` (`dat_geography_segment_id`),
  CONSTRAINT `draft_dataset_ibfk_1` FOREIGN KEY (`dat_latitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  CONSTRAINT `draft_dataset_ibfk_2` FOREIGN KEY (`dat_longitude_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  CONSTRAINT `fk_draft_dataset_marker` FOREIGN KEY (`dat_marker_id`) REFERENCES `draft_dataset_marker` (`dmk_id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_draft_datasets_columns_lat_segment` FOREIGN KEY (`dat_latitude_column_segment_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_columns_lon_segment` FOREIGN KEY (`dat_longitude_column_segment_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_datasets_columns1` FOREIGN KEY (`dat_geography_item_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_datasets_columns1x` FOREIGN KEY (`dat_caption_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_geograph_segment` FOREIGN KEY (`dat_geography_segment_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_geographies1` FOREIGN KEY (`dat_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_methodology1` FOREIGN KEY (`dat_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `ft_draft_dataset_gradient` FOREIGN KEY (`dat_texture_id`) REFERENCES `gradient` (`grd_id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5348 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:58
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_dataset_column`
--

DROP TABLE IF EXISTS `draft_dataset_column`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_dataset_column` (
  `dco_id` int(11) NOT NULL AUTO_INCREMENT,
  `dco_dataset_id` int(11) NOT NULL COMMENT 'Dataset al que pertenece la columna.',
  `dco_field` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Campo en la tabla importada.',
  `dco_variable` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `dco_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta a mostrar: si dco_label es nulo, es igual a dco_variable. Si no es igual a dco_label.',
  `dco_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Etiqueta original del campo.',
  `dco_column_width` int(11) NOT NULL,
  `dco_field_width` int(11) NOT NULL,
  `dco_decimals` int(11) NOT NULL,
  `dco_format` int(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Numérico.',
  `dco_measure` int(11) NOT NULL,
  `dco_alignment` int(11) NOT NULL,
  `dco_use_in_summary` tinyint(1) NOT NULL COMMENT 'Indica si la columna debe ser incluida al construirse el popup de resumen de la entidad en el mapa.',
  `dco_use_in_export` tinyint(1) NOT NULL COMMENT 'Indica si el campo debe ser incluido en la descarga de datos.',
  `dco_order` int(11) NOT NULL COMMENT 'Orden en que debe aparecer la columna.',
  `dco_aggregation` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de agregación a realizar para los niveles superiores de la cartografía. Valores posibles: S: Suma. M: Valor mínimo. X: Valor máximo. A: Promedio. T: Trasposición. I: Ignorar.',
  `dco_aggregation_weight_id` int(11) DEFAULT NULL COMMENT 'Columna para usar como ponderador de los promedios en las agregaciones.',
  `dco_aggregation_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `dco_aggregation_transpose_labels` text COLLATE utf8_unicode_ci,
  `dco_value_labels_are_dirty` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que los valores de texto correspondientes a etiquetas automáticas fueron modificados',
  PRIMARY KEY (`dco_id`),
  KEY `draft_fk_datasets_columns_datasets1_idx` (`dco_dataset_id`),
  KEY `draft_fk_dataset_column_dataset_column1_idx` (`dco_aggregation_weight_id`),
  CONSTRAINT `fk_draft_dataset_column_dataset_column1` FOREIGN KEY (`dco_aggregation_weight_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_datasets_columns_datasets1` FOREIGN KEY (`dco_dataset_id`) REFERENCES `draft_dataset` (`dat_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=110903 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:58
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_dataset_column_value_label`
--

DROP TABLE IF EXISTS `draft_dataset_column_value_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_dataset_column_value_label` (
  `dla_id` int(11) NOT NULL AUTO_INCREMENT,
  `dla_dataset_column_id` int(11) NOT NULL COMMENT 'Columna a la que corresponde la etiqueta de valor.',
  `dla_order` int(11) DEFAULT NULL COMMENT 'Orden en que deben presentarse los valores.',
  `dla_value` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Valor a etiquetar.',
  `dla_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Texto de la etiqueta.',
  PRIMARY KEY (`dla_id`),
  KEY `draft_fk_datasets_labels_datasets_columns1_idx` (`dla_dataset_column_id`),
  CONSTRAINT `fk_draft_datasets_labels_datasets_columns1` FOREIGN KEY (`dla_dataset_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=139938 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:58
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_dataset_marker`
--

DROP TABLE IF EXISTS `draft_dataset_marker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_dataset_marker` (
  `dmk_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador.',
  `dmk_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de marcador. N: Ninguno. I: Ícono. T: Texto.',
  `dmk_source` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'F' COMMENT 'Tipo de origen. F: Fijo. V: Variable',
  `dmk_size` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'Tamaño del marcador. S: Pequeño (normal). M: Mediano. L: Grande.',
  `dmk_description_vertical_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'B' COMMENT 'Posición de la descripción respecto del marcador. B: Abajo. M: Superpuesto. T: Arriba.',
  `dmk_frame` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de marco para el marcador. P: Pin. C: Círculo. B: Rectangular.',
  `dmk_auto_scale` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Adaptar el tamaño según el zoom en el mapa.',
  `dmk_content_column_id` int(11) DEFAULT NULL COMMENT 'Columna conteniendo la columna para los marcadores basados en variable (columna).',
  `dmk_symbol` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo fijo.',
  `dmk_text` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo texto fijo.',
  `dmk_image` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores de tipo imagen fija.',
  PRIMARY KEY (`dmk_id`),
  KEY `fp_draft_dataset_marker_column1_idx` (`dmk_content_column_id`),
  CONSTRAINT `fp_draft_dataset_marker_column1` FOREIGN KEY (`dmk_content_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4712 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:58
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_file`
--

DROP TABLE IF EXISTS `draft_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_file` (
  `fil_id` int(11) NOT NULL AUTO_INCREMENT,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas',
  PRIMARY KEY (`fil_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3036 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:59
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_file_chunk`
--

DROP TABLE IF EXISTS `draft_file_chunk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_file_chunk` (
  `chu_id` int(11) NOT NULL AUTO_INCREMENT,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob,
  PRIMARY KEY (`chu_id`),
  KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`),
  CONSTRAINT `fk_draft_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2696 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:18:59
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_institution`
--

DROP TABLE IF EXISTS `draft_institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_institution` (
  `ins_id` int(11) NOT NULL AUTO_INCREMENT,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.',
  `ins_watermark_id` int(11) DEFAULT NULL COMMENT 'Imagen de marca de agua institucional',
  `ins_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Color primario institucional',
  PRIMARY KEY (`ins_id`),
  KEY `fw_draft_ins_water` (`ins_watermark_id`),
  CONSTRAINT `fw_draft_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `draft_file` (`fil_id`)
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:00
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metadata`
--

DROP TABLE IF EXISTS `draft_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metadata` (
  `met_id` int(11) NOT NULL AUTO_INCREMENT,
  `met_title` varchar(150) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_last_online_user_id` int(11) DEFAULT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(1500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci COMMENT 'Texto con descripción extendida de los metadatos',
  `met_methods` text COLLATE utf8_unicode_ci,
  `met_references` text COLLATE utf8_unicode_ci,
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del emento',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización',
  PRIMARY KEY (`met_id`),
  UNIQUE KEY `draft_metadata_ibfk_1` (`met_contact_id`) USING BTREE,
  KEY `fk_draft_publish_user_idx` (`met_last_online_user_id`),
  CONSTRAINT `draft_metadata_ibfk_1b` FOREIGN KEY (`met_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_publish_user` FOREIGN KEY (`met_last_online_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3006 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:00
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metadata_file`
--

DROP TABLE IF EXISTS `draft_metadata_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metadata_file` (
  `mfi_id` int(11) NOT NULL AUTO_INCREMENT,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`mfi_id`),
  UNIQUE KEY `draft_unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  UNIQUE KEY `draft_fk_work_file_file1_idx` (`mfi_file_id`) USING BTREE,
  KEY `draft_fk_work_file_work1_idx` (`mfi_metadata_id`),
  CONSTRAINT `draft_metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `draft_metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=257 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:00
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metadata_institution`
--

DROP TABLE IF EXISTS `draft_metadata_institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metadata_institution` (
  `min_id` int(11) NOT NULL AUTO_INCREMENT,
  `min_metadata_id` int(11) NOT NULL,
  `min_institution_id` int(11) NOT NULL,
  `min_order` int(11) NOT NULL,
  PRIMARY KEY (`min_id`),
  UNIQUE KEY `uniquemetainstitutioninst` (`min_metadata_id`,`min_institution_id`),
  KEY `draft_metadata_institution_institution` (`min_institution_id`),
  KEY `draft_metadata_institution_metadata` (`min_metadata_id`),
  CONSTRAINT `draft_metadata_institution_institution` FOREIGN KEY (`min_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `draft_metadata_institution_metadata` FOREIGN KEY (`min_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=681 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metadata_source`
--

DROP TABLE IF EXISTS `draft_metadata_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metadata_source` (
  `msc_id` int(11) NOT NULL AUTO_INCREMENT,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL,
  PRIMARY KEY (`msc_id`),
  UNIQUE KEY `uniquemetasource` (`msc_metadata_id`,`msc_source_id`),
  KEY `draft_metadata_source_source` (`msc_source_id`),
  KEY `draft_metadata_source_metadata` (`msc_metadata_id`),
  CONSTRAINT `draft_metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `draft_metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `draft_source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=492 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metric`
--

DROP TABLE IF EXISTS `draft_metric`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metric` (
  `mtr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT '0',
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_metric_provider_id` int(11) DEFAULT NULL COMMENT 'Origen del que proviene la métrica.',
  `mtr_caption` varchar(150) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).',
  `mtr_tag` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripción para servicios y apis',
  `mtr_icon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mtr_id`),
  UNIQUE KEY `ix2_tag` (`mtr_tag`),
  KEY `draft_fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  KEY `fk_draft_metric_symbology1` (`mtr_symbology_id`),
  KEY `fk_draft_metrics_provider_g_idx` (`mtr_metric_provider_id`),
  CONSTRAINT `fk_draft_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_metrics_provider_g` FOREIGN KEY (`mtr_metric_provider_id`) REFERENCES `metric_provider` (`lpr_id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5906 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metric_version`
--

DROP TABLE IF EXISTS `draft_metric_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metric_version` (
  `mvr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(20) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010).',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador al que pertenece la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.',
  `mvr_start_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía',
  PRIMARY KEY (`mvr_id`),
  UNIQUE KEY `ix_metric_metric_version_caption` (`mvr_metric_id`,`mvr_caption`),
  KEY `fk_draft_metric_version_draft_metric1_idx` (`mvr_metric_id`),
  KEY `fk_draft_work_id` (`mvr_work_id`),
  CONSTRAINT `fk_draft_metric_version_draft_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `draft_metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_work_id` FOREIGN KEY (`mvr_work_id`) REFERENCES `draft_work` (`wrk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7113 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `draft_metric_no_versions_update` AFTER UPDATE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_work_extra_metric WHERE wmt_metric_id = old.mvr_metric_id;
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `draft_metric_no_versions` AFTER DELETE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_work_extra_metric WHERE wmt_metric_id = old.mvr_metric_id;
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END */;;
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

-- Dump completed on 2026-06-02 17:19:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_metric_version_level`
--

DROP TABLE IF EXISTS `draft_metric_version_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_metric_version_level` (
  `mvl_id` int(11) NOT NULL AUTO_INCREMENT,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mvl_id`),
  KEY `fk_draft_version_dataset` (`mvl_dataset_id`),
  KEY `fk_draft_metric_version_level_draft_metric_version1_idx` (`mvl_metric_version_id`),
  CONSTRAINT `fk_draft_metric_version_level_draft_metric_version1` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `draft_metric_version` (`mvr_id`),
  CONSTRAINT `fk_draft_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `draft_dataset` (`dat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7536 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `draft_metric_version_no_levels_update` AFTER UPDATE ON `draft_metric_version_level`
FOR EACH ROW BEGIN
IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
mvl_metric_version_id = old.mvl_metric_version_id) THEN
DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `draft_metric_version_no_levels` AFTER DELETE ON `draft_metric_version_level`
FOR EACH ROW BEGIN
IF NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
mvl_metric_version_id = old.mvl_metric_version_id) THEN
DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
END IF;
END */;;
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

-- Dump completed on 2026-06-02 17:19:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_onboarding`
--

DROP TABLE IF EXISTS `draft_onboarding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_onboarding` (
  `onb_id` int(11) NOT NULL AUTO_INCREMENT,
  `onb_work_id` int(11) NOT NULL,
  `onb_enabled` bit(1) NOT NULL,
  PRIMARY KEY (`onb_id`),
  UNIQUE KEY `un_onb_work` (`onb_work_id`),
  KEY `fw_onb_work_idx` (`onb_work_id`),
  CONSTRAINT `fw_onb_work` FOREIGN KEY (`onb_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_onboarding_step`
--

DROP TABLE IF EXISTS `draft_onboarding_step`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_onboarding_step` (
  `obs_id` int(11) NOT NULL AUTO_INCREMENT,
  `obs_onboarding_id` int(11) NOT NULL,
  `obs_order` tinyint(4) NOT NULL,
  `obs_enabled` bit(1) NOT NULL,
  `obs_caption` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `obs_content` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `obs_image_id` int(11) DEFAULT NULL,
  `obs_image_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'L' COMMENT 'Valores: R. Derecha, L. Izquierda.',
  PRIMARY KEY (`obs_id`),
  UNIQUE KEY `ix_work_order` (`obs_onboarding_id`,`obs_order`),
  KEY `fw_obs_onboarding_idx` (`obs_onboarding_id`),
  KEY `fw_obs_file_idx` (`obs_image_id`),
  CONSTRAINT `fw_obs_file` FOREIGN KEY (`obs_image_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fw_obs_work` FOREIGN KEY (`obs_onboarding_id`) REFERENCES `draft_onboarding` (`onb_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_source`
--

DROP TABLE IF EXISTS `draft_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_source` (
  `src_id` int(11) NOT NULL AUTO_INCREMENT,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente',
  PRIMARY KEY (`src_id`),
  UNIQUE KEY `draft_srcUnique2` (`src_caption`,`src_version`),
  KEY `draft_source_ibfk_3` (`src_contact_id`),
  KEY `draft_source_ibfk_5` (`src_institution_id`),
  CONSTRAINT `draft_source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `draft_contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `draft_source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_symbology`
--

DROP TABLE IF EXISTS `draft_symbology`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_symbology` (
  `vsy_id` int(11) NOT NULL AUTO_INCREMENT,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_sequence_column_id` int(11) DEFAULT NULL COMMENT 'Columna que define el orden de la secuencia',
  `vsy_categories` int(11) NOT NULL DEFAULT '4' COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT '5' COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT '1' COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_custom_colors` varchar(60000) CHARACTER SET ascii DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo',
  `vsy_gradient_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado',
  `vsy_pattern` int(11) NOT NULL DEFAULT '0' COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT '1',
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores',
  `vsy_is_sequence` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si el indicador debe mostrar secuencialmente.',
  `vsy_id_ex` int(11) DEFAULT NULL,
  PRIMARY KEY (`vsy_id`),
  KEY `fk_draft_sym_sequence_idx` (`vsy_sequence_column_id`),
  CONSTRAINT `fk_draft_sym_sequence` FOREIGN KEY (`vsy_sequence_column_id`) REFERENCES `draft_dataset_column` (`dco_id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=20001 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_variable`
--

DROP TABLE IF EXISTS `draft_variable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_variable` (
  `mvv_id` int(11) NOT NULL AUTO_INCREMENT,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Descripción autocalculada de la variable',
  `mvv_order` int(11) NOT NULL COMMENT 'Orden de presentación',
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_data_column_is_categorical` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT '100' COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato',
  `mvv_filter_value` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Expresión a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un número, un ''texto'', o una [columna]',
  `mvv_legend` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos',
  `mvv_perimeter` float DEFAULT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).',
  PRIMARY KEY (`mvv_id`),
  UNIQUE KEY `levelorder` (`mvv_metric_version_level_id`,`mvv_order`),
  KEY `draft_fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  KEY `draft_fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  KEY `fk_draft_variable_norm_col` (`mvv_normalization_column_id`),
  KEY `fk_draft_variable_symbology` (`mvv_symbology_id`),
  CONSTRAINT `fk_draft_metric_version_data_col` FOREIGN KEY (`mvv_data_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  CONSTRAINT `fk_draft_variable_norm_col` FOREIGN KEY (`mvv_normalization_column_id`) REFERENCES `draft_dataset_column` (`dco_id`),
  CONSTRAINT `fk_draft_variable_symbology` FOREIGN KEY (`mvv_symbology_id`) REFERENCES `draft_symbology` (`vsy_id`),
  CONSTRAINT `fk_version_level_variable` FOREIGN KEY (`mvv_metric_version_level_id`) REFERENCES `draft_metric_version_level` (`mvl_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13139 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:03
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_variable_value_label`
--

DROP TABLE IF EXISTS `draft_variable_value_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_variable_value_label` (
  `vvl_id` int(11) NOT NULL AUTO_INCREMENT,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT '1',
  `vvl_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT '0',
  PRIMARY KEY (`vvl_id`),
  UNIQUE KEY `variableValor` (`vvl_variable_id`,`vvl_value`),
  UNIQUE KEY `fk_order` (`vvl_variable_id`,`vvl_order`),
  KEY `fk_draft_variable_value_label_draft_metric_version_variable_idx` (`vvl_variable_id`),
  CONSTRAINT `fw_draft_variable` FOREIGN KEY (`vvl_variable_id`) REFERENCES `draft_variable` (`mvv_id`)
) ENGINE=InnoDB AUTO_INCREMENT=208410 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:03
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_work`
--

DROP TABLE IF EXISTS `draft_work`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_work` (
  `wrk_id` int(11) NOT NULL AUTO_INCREMENT,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_preview_file_id` int(11) DEFAULT NULL COMMENT 'Referencia a la vista previa para la cartografía',
  `wrk_is_private` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados',
  `wrk_is_indexed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador',
  `wrk_is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `wrk_is_example` tinyint(1) NOT NULL DEFAULT '0',
  `wrk_segmented_crawling` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se segmenta al indexarse para crawlers',
  `wrk_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link',
  `wrk_last_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Resguarda el valor del último enlace cuando deja de usarse este modo de visibilidad.',
  `wrk_startup_id` int(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía',
  `wrk_metadata_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambiaron los metadatos de una obra.',
  `wrk_dataset_labels_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambió el nombre de una columna o las etiquetas de un dataset.',
  `wrk_dataset_data_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que cambiaron la cantidad de datasets, los valores de un dataset o sus agregaciones.',
  `wrk_metric_labels_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que se modificó el color o los textos de las variables o categorías, sin cambiar su cantidad o puntos de corte.',
  `wrk_metric_data_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica que se modificó la cantidad de variables o categorías de un metric.',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT '1',
  `wrk_unfinished` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la obra es el resultado de un clone interrumpido',
  `wrk_update` datetime DEFAULT NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.',
  `wrk_update_user_id` int(11) DEFAULT NULL COMMENT 'Indica el usuario que realizó la útlima modificación',
  PRIMARY KEY (`wrk_id`),
  UNIQUE KEY `uk_draft_work_startup_id` (`wrk_startup_id`),
  UNIQUE KEY `draft_work_ibfk_1_idx` (`wrk_metadata_id`),
  KEY `draft_fk_work_file1_idx` (`wrk_image_id`),
  KEY `draft_wrk_type` (`wrk_type`),
  KEY `fk_draft_work_work_startup` (`wrk_startup_id`),
  KEY `fk_draft_work_updated_user_idx` (`wrk_update_user_id`),
  KEY `fk_preview_file_jd_idx` (`wrk_preview_file_id`),
  KEY `draft_wk_type` (`wrk_type`,`wrk_is_example`),
  CONSTRAINT `draft_work_ibfk_1` FOREIGN KEY (`wrk_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_start` FOREIGN KEY (`wrk_startup_id`) REFERENCES `draft_work_startup` (`wst_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_work_file1` FOREIGN KEY (`wrk_image_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_work_updated_user` FOREIGN KEY (`wrk_update_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_preview_file_jd` FOREIGN KEY (`wrk_preview_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3237 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:03
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_work_extra_metric`
--

DROP TABLE IF EXISTS `draft_work_extra_metric`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_work_extra_metric` (
  `wmt_id` int(11) NOT NULL AUTO_INCREMENT,
  `wmt_work_id` int(11) NOT NULL COMMENT 'Cartografía de la que indica la métrica adicional',
  `wmt_metric_id` int(11) NOT NULL COMMENT 'Métrica adicional',
  `wmt_start_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el indicador debe incorporarse al mapa al abrir el work',
  PRIMARY KEY (`wmt_id`),
  UNIQUE KEY `u_draft_work_extra_metric` (`wmt_work_id`,`wmt_metric_id`),
  KEY `fk_draft_extra_work_metric_metric` (`wmt_metric_id`),
  CONSTRAINT `fk_draft_extra_work_metric_metric` FOREIGN KEY (`wmt_metric_id`) REFERENCES `draft_metric` (`mtr_id`),
  CONSTRAINT `fk_draft_extra_work_metric_work` FOREIGN KEY (`wmt_work_id`) REFERENCES `draft_work` (`wrk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=648 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:03
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_work_icon`
--

DROP TABLE IF EXISTS `draft_work_icon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_work_icon` (
  `wic_id` int(11) NOT NULL AUTO_INCREMENT,
  `wic_work_id` int(11) NOT NULL COMMENT 'Obra.',
  `wic_file_id` int(11) NOT NULL COMMENT 'Archivo.',
  PRIMARY KEY (`wic_id`),
  KEY `fw_draft_work_ico_idx` (`wic_work_id`),
  KEY `fw_draft_ico_file_idx` (`wic_file_id`),
  CONSTRAINT `fw_draft_ico_file` FOREIGN KEY (`wic_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE NO ACTION,
  CONSTRAINT `fw_draft_work_ico` FOREIGN KEY (`wic_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:03
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_work_permission`
--

DROP TABLE IF EXISTS `draft_work_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_work_permission` (
  `wkp_id` int(11) NOT NULL AUTO_INCREMENT,
  `wkp_user_id` int(11) NOT NULL COMMENT 'Usuario al que se asigna el permiso',
  `wkp_work_id` int(11) NOT NULL COMMENT 'Obra sobre la que se asigna',
  `wkp_permission` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de permiso: ''V'': puede ver el backoffice. ''E'': puede editar. ''A'': puede administrar la obra',
  PRIMARY KEY (`wkp_id`),
  KEY `fk_draft_work_permission_user1` (`wkp_user_id`),
  KEY `fk_draft_work_permission_work1` (`wkp_work_id`),
  CONSTRAINT `fk_draft_work_permission_user1` FOREIGN KEY (`wkp_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_draft_work_permission_work1` FOREIGN KEY (`wkp_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3699 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:04
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `draft_work_startup`
--

DROP TABLE IF EXISTS `draft_work_startup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `draft_work_startup` (
  `wst_id` int(11) NOT NULL AUTO_INCREMENT,
  `wst_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=interactivo, R=región, L=ubicación, E=extensión (predeterminado)',
  `wst_clipping_region_item_id` int(11) DEFAULT NULL COMMENT 'Región de referencia',
  `wst_clipping_region_item_selected` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la región debe iniciarse como selección activa',
  `wst_center` point DEFAULT NULL COMMENT 'Ubicación del dentro de la vista',
  `wst_zoom` tinyint(1) DEFAULT NULL COMMENT 'Nivel de acercamiento para la vista',
  `wst_active_metrics` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indicadores del work que deben estar activos (lista separada por comas)',
  PRIMARY KEY (`wst_id`),
  KEY `fk_draft_work_startup_region` (`wst_clipping_region_item_id`),
  CONSTRAINT `fk_draft_work_startup_region` FOREIGN KEY (`wst_clipping_region_item_id`) REFERENCES `clipping_region_item` (`cli_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2922 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:04
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file` (
  `fil_id` int(11) NOT NULL,
  `fil_type` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'application/pdf' COMMENT 'Indica el content-type del archivo almacenado.',
  `fil_name` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del archivo cuando fue subido a la base de datos (sin incluir la ruta, incluyendo la extensión)',
  `fil_size` int(11) DEFAULT NULL,
  `fil_pages` int(11) DEFAULT NULL COMMENT 'Para archivos de tipo PDF, almacena la cantidad de páginas',
  PRIMARY KEY (`fil_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:04
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `file_chunk`
--

DROP TABLE IF EXISTS `file_chunk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file_chunk` (
  `chu_id` int(11) NOT NULL,
  `chu_file_id` int(11) NOT NULL,
  `chu_content` longblob,
  PRIMARY KEY (`chu_id`),
  KEY `fk_file_chunk_file1_idx` (`chu_file_id`),
  CONSTRAINT `fk_file_chunk_file1` FOREIGN KEY (`chu_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:04
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `geography`
--

DROP TABLE IF EXISTS `geography`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geography` (
  `geo_id` int(11) NOT NULL AUTO_INCREMENT,
  `geo_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia a la geografía ''padre''. En el caso por ejemplo de Departamentos, su parent_id refiere a al registro Provincias.',
  `geo_country_id` int(11) NOT NULL,
  `geo_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la entidad mapeada (ej. Provincias, Departamentos).',
  `geo_caption_short` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `geo_root_caption` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `geo_revision` varchar(10) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Permite complementar el caption en casos de geografías que mapean una misma unidad geográfica. En el caso de mapas censales, en geo_revision debe indicarse el año (ej. 2010, 2001).',
  `geo_area_avg_m2` double NOT NULL DEFAULT '0' COMMENT 'Tamaño promedio de las áreas de la geografía.',
  `geo_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo zoom sugerido a utilizar ante la disponibilidad de niveles de menor desagregación (rango: 0 a 22).',
  `geo_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo zoom sugerido a utilizar ante la disponibilidad de niveles de mayor desagregación (rango: 0 a 22).',
  `geo_field_code_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica el código de la entidad (ej. ''codProv'')',
  `geo_field_code_size` int(11) NOT NULL COMMENT 'Tamaño de los valores de los códigos',
  `geo_field_code_type` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de dato del campo en el archivo dbf provisto por el usuario que indica el código de la entidad. Los valores posibles son: ''T'': texto, ''N'': numérico entero.',
  `geo_field_caption_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica la descripción de la entidad (ej. ''Descripcion'')',
  `geo_field_urbanity_name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre del campo en el archivo dbf provisto por el usuario que indica si las zonas son de tipo urbano (1) o rural (0) (ej. ''urbano'')',
  `geo_is_tracking_level` tinyint(1) NOT NULL DEFAULT '0',
  `geo_use_for_clipping` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si la geografía se debe considerar como serie para el cálculo de totales poblaciones. ',
  `geo_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `geo_metadata_id` int(11) DEFAULT NULL,
  `geo_gradient_id` int(11) DEFAULT NULL COMMENT 'Gradiente con el cual suavizar la información',
  `geo_gradient_luminance` float DEFAULT NULL COMMENT 'Intensidad predeterminada del gradiente',
  PRIMARY KEY (`geo_id`),
  KEY `fk_geographies_geographies1_idx` (`geo_parent_id`),
  KEY `fk_cartography_clipping_region_item1` (`geo_country_id`),
  KEY `geography_ibfk_1` (`geo_metadata_id`),
  KEY `fk_geography_gradient` (`geo_gradient_id`),
  CONSTRAINT `fk_geographies_geographies1` FOREIGN KEY (`geo_parent_id`) REFERENCES `geography` (`geo_id`),
  CONSTRAINT `fk_geography_clipping_region_item1` FOREIGN KEY (`geo_country_id`) REFERENCES `clipping_region_item` (`cli_id`),
  CONSTRAINT `fk_geography_gradient` FOREIGN KEY (`geo_gradient_id`) REFERENCES `gradient` (`grd_id`),
  CONSTRAINT `geography_ibfk_1` FOREIGN KEY (`geo_metadata_id`) REFERENCES `metadata` (`met_id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:13
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `geography_item`
--

DROP TABLE IF EXISTS `geography_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geography_item` (
  `gei_id` int(11) NOT NULL AUTO_INCREMENT,
  `gei_geography_id` int(11) NOT NULL COMMENT 'Geografía a la que pertenece el ítem (ej. Catamarca puede pertenecer a Provincias 2010).',
  `gei_parent_id` int(11) DEFAULT NULL COMMENT 'Referencia al ítem de geografía ''padre''. En el caso por ejemplo de Morón, su parent_id refiere a la provincia de Buenos Aires.',
  `gei_code` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código para el ítem (ej. 020).',
  `gei_code_as_number` decimal(12,0) DEFAULT NULL,
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
  `gei_geometry_r6` geometry NOT NULL,
  `rura` int(11) DEFAULT NULL,
  PRIMARY KEY (`gei_id`),
  UNIQUE KEY `carto_codes_2` (`gei_geography_id`,`gei_code`),
  UNIQUE KEY `carto_codes_numbered_2` (`gei_geography_id`,`gei_code_as_number`),
  KEY `fk_geographies_items_geographies1_idx_2` (`gei_geography_id`),
  KEY `fk_geographies_items_geographies_items1_idx_2` (`gei_parent_id`),
  CONSTRAINT `fk_geographies_items_geographies1_2` FOREIGN KEY (`gei_geography_id`) REFERENCES `geography` (`geo_id`),
  CONSTRAINT `fk_geographies_items_geographies_items1_2` FOREIGN KEY (`gei_parent_id`) REFERENCES `geography_item` (`gei_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1300457 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1 ROW_FORMAT=COMPRESSED;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:19:14
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `geography_tuple`
--

DROP TABLE IF EXISTS `geography_tuple`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geography_tuple` (
  `gtu_id` int(11) NOT NULL AUTO_INCREMENT,
  `gtu_geography_id` int(11) NOT NULL,
  `gtu_previous_geography_id` int(11) NOT NULL,
  `gtu_previous_lower_geography_id` int(11) DEFAULT NULL,
  `gtu_metadata_id` int(11) NOT NULL,
  PRIMARY KEY (`gtu_id`),
  UNIQUE KEY `fw_tuple_unique` (`gtu_geography_id`,`gtu_previous_geography_id`),
  KEY `fw_prev_idx` (`gtu_previous_geography_id`),
  KEY `fw_current_idx` (`gtu_geography_id`),
  KEY `fw_current_lower_idx` (`gtu_previous_lower_geography_id`),
  KEY `fw_metadata_id_idx` (`gtu_metadata_id`),
  CONSTRAINT `fw_current` FOREIGN KEY (`gtu_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fw_current_lower` FOREIGN KEY (`gtu_previous_lower_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fw_metadata_id` FOREIGN KEY (`gtu_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fw_prev` FOREIGN KEY (`gtu_previous_geography_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:00
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `geography_tuple_item`
--

DROP TABLE IF EXISTS `geography_tuple_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geography_tuple_item` (
  `gti_id` int(11) NOT NULL AUTO_INCREMENT,
  `gti_geography_tuple_id` int(11) NOT NULL,
  `gti_geography_item_id` int(11) NOT NULL,
  `gti_geography_previous_id` int(11) NOT NULL,
  `gti_geography_previous_item_id` int(11) NOT NULL,
  `gti_is_partial` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`gti_id`),
  UNIQUE KEY `gti_geo_item_uk` (`gti_geography_previous_item_id`,`gti_geography_previous_id`,`gti_geography_item_id`,`gti_geography_tuple_id`),
  UNIQUE KEY `gti_geo_unix` (`gti_geography_tuple_id`,`gti_geography_item_id`),
  KEY `gti_tuple_idx` (`gti_geography_tuple_id`),
  KEY `gti_geo_item_idx` (`gti_geography_item_id`),
  KEY `gti_geo_previous_idx` (`gti_geography_previous_item_id`),
  KEY `gti_pair_index_2` (`gti_geography_previous_id`,`gti_geography_item_id`),
  KEY `gti_geo_id_prev_idx` (`gti_geography_previous_id`),
  CONSTRAINT `gti_geo_id_prev` FOREIGN KEY (`gti_geography_previous_id`) REFERENCES `geography` (`geo_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `gti_geo_item` FOREIGN KEY (`gti_geography_item_id`) REFERENCES `geography_item` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `gti_geo_previous` FOREIGN KEY (`gti_geography_previous_item_id`) REFERENCES `geography_item` (`gei_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `gti_tuple` FOREIGN KEY (`gti_geography_tuple_id`) REFERENCES `geography_tuple` (`gtu_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=492031 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:01
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `gradient`
--

DROP TABLE IF EXISTS `gradient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gradient` (
  `grd_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id',
  `grd_country_id` int(11) NOT NULL COMMENT 'País de pertenencia',
  `grd_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Descripción del gradiente. Ej. AR-2010',
  `grd_image_type` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de imágenes. image/jpeg o image/png',
  `grd_max_zoom_level` int(11) NOT NULL COMMENT 'Nivel zoom hasta el que dispone de datos',
  PRIMARY KEY (`grd_id`),
  KEY `fk_gradient_country` (`grd_country_id`),
  CONSTRAINT `fk_gradient_country` FOREIGN KEY (`grd_country_id`) REFERENCES `clipping_region_item` (`cli_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Cabecera de gradientes para ajustar polígonos';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `gradient_item`
--

DROP TABLE IF EXISTS `gradient_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gradient_item` (
  `gri_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id',
  `gri_gradient_id` int(11) NOT NULL COMMENT 'Gradiente de pertenencia',
  `gri_x` int(11) NOT NULL COMMENT 'Coordenada X',
  `gri_y` int(11) NOT NULL COMMENT 'Coordenada Y',
  `gri_z` int(11) NOT NULL COMMENT 'Coordenada Z',
  `gri_content` longblob NOT NULL COMMENT 'Contenido',
  PRIMARY KEY (`gri_id`),
  UNIQUE KEY `gradient_item` (`gri_gradient_id`,`gri_x`,`gri_y`,`gri_z`),
  CONSTRAINT `fk_gradient_item` FOREIGN KEY (`gri_gradient_id`) REFERENCES `gradient` (`grd_id`)
) ENGINE=InnoDB AUTO_INCREMENT=148490 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Detalle de los rasters por tile';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:02
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `institution`
--

DROP TABLE IF EXISTS `institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `institution` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.',
  `ins_watermark_id` int(11) DEFAULT NULL COMMENT 'Imagen de marca de agua institucional',
  `ins_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Color primario institucional',
  PRIMARY KEY (`ins_id`),
  KEY `fw_ins_water` (`ins_watermark_id`),
  CONSTRAINT `fw_ins_water` FOREIGN KEY (`ins_watermark_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:50
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `institution_tmp`
--

DROP TABLE IF EXISTS `institution_tmp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `institution_tmp` (
  `ins_id` int(11) NOT NULL,
  `ins_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la institución',
  `ins_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una institución del usuario o si forma parte del catálogo global de institución.',
  `ins_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `ins_email` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Correo electrónico',
  `ins_address` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Dirección postal',
  `ins_phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Teléfono',
  `ins_country` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Argentina' COMMENT 'Teléfono',
  `ins_public_data_editor` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si es la institución a la cual imputar la edición de los datos públicos.',
  `ins_watermark_id` int(11) DEFAULT NULL COMMENT 'Imagen de marca de agua institucional',
  `ins_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Color primario institucional',
  PRIMARY KEY (`ins_id`),
  KEY `fw_ins_water_tmp` (`ins_watermark_id`),
  CONSTRAINT `fw_ins_water_tmp` FOREIGN KEY (`ins_watermark_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:50
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metadata`
--

DROP TABLE IF EXISTS `metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metadata` (
  `met_id` int(11) NOT NULL,
  `met_title` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT 'Nombre del conjunto de metadatos',
  `met_publication_date` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Fecha de publicación (opcional)',
  `met_last_online_user_id` int(11) DEFAULT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.',
  `met_online_since` datetime DEFAULT NULL COMMENT 'Fecha en que fue puesto como público en el sitio por primera vez',
  `met_last_online` datetime DEFAULT NULL COMMENT 'Útima fecha en que fue puesto en forma pública en el sitio',
  `met_abstract` varchar(1500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Resumen',
  `met_status` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Estado. Valores posibles: C: completo, P: Parcial. B: Borrador.',
  `met_authors` varchar(2000) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Autores',
  `met_coverage_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Cobertura espacial',
  `met_period_caption` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Cobertura temporal',
  `met_frequency` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Frecuencia',
  `met_group_id` int(11) DEFAULT NULL COMMENT 'Grupo temático',
  `met_license` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Licencia',
  `met_type` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario. C: Cartografía',
  `met_abstract_long` text COLLATE utf8_unicode_ci COMMENT 'Texto con descripción extendida de los metadatos',
  `met_methods` text COLLATE utf8_unicode_ci,
  `met_references` text COLLATE utf8_unicode_ci,
  `met_language` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'es; Español' COMMENT 'Idioma del elemento',
  `met_wiki` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Entrada en wikipedia para cartografías.',
  `met_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta estable al elemento',
  `met_contact_id` int(11) NOT NULL COMMENT 'Datos de contacto',
  `met_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del emento',
  `met_create` datetime NOT NULL COMMENT 'Fecha de creación',
  `met_update` datetime NOT NULL COMMENT 'Fecha de actualización',
  PRIMARY KEY (`met_id`),
  KEY `metadata_ibfk_1` (`met_contact_id`),
  KEY `fk_publish_user_idx` (`met_last_online_user_id`),
  CONSTRAINT `fk_publish_user` FOREIGN KEY (`met_last_online_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `metadata_ibfk_1` FOREIGN KEY (`met_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:50
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metadata_file`
--

DROP TABLE IF EXISTS `metadata_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metadata_file` (
  `mfi_id` int(11) NOT NULL,
  `mfi_metadata_id` int(11) NOT NULL,
  `mfi_order` int(11) NOT NULL,
  `mfi_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `mfi_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mfi_file_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`mfi_id`),
  UNIQUE KEY `unique_work_file` (`mfi_metadata_id`,`mfi_caption`),
  KEY `fk_work_file_work1_idx` (`mfi_metadata_id`),
  KEY `fk_work_file_file1_idx` (`mfi_file_id`),
  CONSTRAINT `metadata_file_file` FOREIGN KEY (`mfi_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `metadata_file_metadata` FOREIGN KEY (`mfi_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:51
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metadata_institution`
--

DROP TABLE IF EXISTS `metadata_institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metadata_institution` (
  `min_id` int(11) NOT NULL,
  `min_metadata_id` int(11) NOT NULL,
  `min_institution_id` int(11) NOT NULL,
  `min_order` int(11) NOT NULL,
  PRIMARY KEY (`min_id`),
  UNIQUE KEY `uniquemetaiutioninst` (`min_metadata_id`,`min_institution_id`),
  KEY `metadata_institution_institution` (`min_institution_id`),
  KEY `metadata_institution_metadata` (`min_metadata_id`),
  CONSTRAINT `metadata_institution_institution` FOREIGN KEY (`min_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `metadata_institution_metadata` FOREIGN KEY (`min_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:51
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metadata_source`
--

DROP TABLE IF EXISTS `metadata_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metadata_source` (
  `msc_id` int(11) NOT NULL,
  `msc_metadata_id` int(11) NOT NULL,
  `msc_source_id` int(11) NOT NULL,
  `msc_order` int(11) NOT NULL,
  PRIMARY KEY (`msc_id`),
  UNIQUE KEY `uniquemetasource2` (`msc_metadata_id`,`msc_source_id`) USING BTREE,
  KEY `metadata_source_source` (`msc_source_id`),
  KEY `metadata_source_metadata` (`msc_metadata_id`),
  CONSTRAINT `metadata_source_metadata` FOREIGN KEY (`msc_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `metadata_source_source` FOREIGN KEY (`msc_source_id`) REFERENCES `source` (`src_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:51
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metric`
--

DROP TABLE IF EXISTS `metric`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metric` (
  `mtr_id` int(11) NOT NULL,
  `mtr_is_basic_metric` tinyint(1) NOT NULL DEFAULT '0',
  `mtr_symbology_id` int(11) DEFAULT NULL,
  `mtr_metric_group_id` int(11) DEFAULT NULL COMMENT 'Agrupador en el que se encuentra la métrica.',
  `mtr_metric_provider_id` int(11) DEFAULT NULL COMMENT 'Origen del que proviene la métrica.',
  `mtr_coverage_id` int(11) DEFAULT NULL,
  `mtr_caption` varchar(150) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre de la métrica de datos (sin incluir ni el año ni la fuente de información).',
  `mtr_revision` bigint(20) NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador',
  `mtr_tag` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripción para servicios y apis',
  `mtr_icon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mtr_id`),
  UNIQUE KEY `ix_tag` (`mtr_tag`),
  KEY `fk_metric_symbology1` (`mtr_symbology_id`),
  KEY `fk_layers_layers_groups1_idx` (`mtr_metric_group_id`),
  KEY `fk_layer_clipping_region_item1` (`mtr_coverage_id`),
  KEY `fk_metrics_provider_g_idx` (`mtr_metric_provider_id`),
  CONSTRAINT `fk_metric_clipping_region_item1` FOREIGN KEY (`mtr_coverage_id`) REFERENCES `clipping_region_item` (`cli_id`),
  CONSTRAINT `fk_metrics_metrics_groups10` FOREIGN KEY (`mtr_metric_group_id`) REFERENCES `metric_group` (`lgr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_metrics_provider_g` FOREIGN KEY (`mtr_metric_provider_id`) REFERENCES `metric_provider` (`lpr_id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:51
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metric_group`
--

DROP TABLE IF EXISTS `metric_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metric_group` (
  `lgr_id` int(11) NOT NULL AUTO_INCREMENT,
  `lgr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del grupo de métricas.',
  `lgr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  `lgr_icon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono de la categoría.',
  PRIMARY KEY (`lgr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:52
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metric_provider`
--

DROP TABLE IF EXISTS `metric_provider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metric_provider` (
  `lpr_id` int(11) NOT NULL AUTO_INCREMENT,
  `lpr_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre a mostrar del origen de las métricas.',
  `lpr_order` smallint(6) DEFAULT NULL COMMENT 'Orden en que deben mostrarse los items',
  PRIMARY KEY (`lpr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:52
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metric_version`
--

DROP TABLE IF EXISTS `metric_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metric_version` (
  `mvr_id` int(11) NOT NULL,
  `mvr_work_id` int(11) NOT NULL COMMENT 'Obra a la que pertenece la versión',
  `mvr_caption` varchar(20) NOT NULL COMMENT 'Nombre de la versión. Es esperable que el año dé nombre a las versiones (ej. 2001, 2010). ',
  `mvr_metric_id` int(11) NOT NULL COMMENT 'Indicador de la versión.',
  `mvr_order` int(11) DEFAULT NULL COMMENT 'Orden dentro del work.',
  `mvr_multilevel` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indique si la edición del indicador sincroniza automáticamente sus niveles.',
  `mvr_start_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si el indicador debe insertarse en el mapa al ingresarse a la cartografía',
  PRIMARY KEY (`mvr_id`),
  UNIQUE KEY `ixp_metric_metric_version_caption` (`mvr_metric_id`,`mvr_caption`),
  KEY `fk_metric_version_metric1_idx` (`mvr_metric_id`),
  KEY `fk_work_id2` (`mvr_work_id`),
  CONSTRAINT `fk_metric_version_metric1` FOREIGN KEY (`mvr_metric_id`) REFERENCES `metric` (`mtr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_work_id2` FOREIGN KEY (`mvr_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `metric_no_versions_update` AFTER UPDATE ON `metric_version`
FOR EACH ROW BEGIN
IF old.mvr_metric_id <> new.mvr_metric_id AND
NOT EXISTS (SELECT * FROM metric_version WHERE
mvr_metric_id = old.mvr_metric_id) THEN
DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `metric_no_versions` AFTER DELETE ON `metric_version`
FOR EACH ROW BEGIN
IF NOT EXISTS (SELECT * FROM metric_version WHERE
mvr_metric_id = old.mvr_metric_id) THEN
DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
END IF;
END */;;
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

-- Dump completed on 2026-06-02 17:23:52
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `metric_version_level`
--

DROP TABLE IF EXISTS `metric_version_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metric_version_level` (
  `mvl_id` int(11) NOT NULL,
  `mvl_metric_version_id` int(11) NOT NULL,
  `mvl_dataset_id` int(11) NOT NULL COMMENT 'Dataset que alimenta la visualización de la versión de métrica.',
  `mvl_extents` geometry DEFAULT NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel',
  `mvl_partial_coverage` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mvl_id`),
  KEY `fk_version_dataset` (`mvl_dataset_id`),
  KEY `fk_metric_version_level_metric_version1_idx` (`mvl_metric_version_id`),
  CONSTRAINT `fk_version_dataset` FOREIGN KEY (`mvl_dataset_id`) REFERENCES `dataset` (`dat_id`) ON DELETE CASCADE,
  CONSTRAINT `fw_metric_version` FOREIGN KEY (`mvl_metric_version_id`) REFERENCES `metric_version` (`mvr_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `metric_version_no_levels_update` AFTER UPDATE ON `metric_version_level`
FOR EACH ROW BEGIN
IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
NOT EXISTS (SELECT * FROM metric_version_level WHERE
mvl_metric_version_id = old.mvl_metric_version_id) THEN
DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/  /*!50003 TRIGGER `metric_version_no_levels` AFTER DELETE ON `metric_version_level`
FOR EACH ROW BEGIN
IF NOT EXISTS (SELECT * FROM metric_version_level WHERE
mvl_metric_version_id = old.mvl_metric_version_id) THEN
DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
END IF;
END */;;
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

-- Dump completed on 2026-06-02 17:23:52
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `onboarding`
--

DROP TABLE IF EXISTS `onboarding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onboarding` (
  `onb_id` int(11) NOT NULL,
  `onb_work_id` int(11) NOT NULL,
  `onb_enabled` bit(1) NOT NULL,
  PRIMARY KEY (`onb_id`),
  UNIQUE KEY `un_nd_onb_work` (`onb_work_id`),
  KEY `fw_nd_onb_work_idx` (`onb_work_id`),
  CONSTRAINT `fw_dn_onb_work` FOREIGN KEY (`onb_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:53
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `onboarding_step`
--

DROP TABLE IF EXISTS `onboarding_step`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onboarding_step` (
  `obs_id` int(11) NOT NULL,
  `obs_onboarding_id` int(11) NOT NULL,
  `obs_order` tinyint(4) NOT NULL,
  `obs_enabled` bit(1) NOT NULL,
  `obs_caption` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `obs_content` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `obs_image_id` int(11) DEFAULT NULL,
  `obs_image_alignment` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'L' COMMENT 'Valores: R. Derecha, L. Izquierda.',
  PRIMARY KEY (`obs_id`),
  UNIQUE KEY `ix_nd_work_order` (`obs_onboarding_id`,`obs_order`),
  KEY `fw_obs_onboarding_idx` (`obs_onboarding_id`),
  KEY `fw_obs_file_idx` (`obs_image_id`),
  CONSTRAINT `fw_nd_obs_file` FOREIGN KEY (`obs_image_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE,
  CONSTRAINT `fw_nd_obs_work` FOREIGN KEY (`obs_onboarding_id`) REFERENCES `onboarding` (`onb_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:53
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `review` (
  `rev_id` int(11) NOT NULL AUTO_INCREMENT,
  `rev_work_id` int(11) NOT NULL COMMENT 'Cartografía a la que refiere la revisión',
  `rev_submission_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha/hora en la que fue solicitada la revisión',
  `rev_resolution_time` timestamp NULL DEFAULT NULL COMMENT 'Fecha/hora en que fue dada la decisión de la revisión',
  `rev_decision` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Resultado de la revisión. A: Publicable, C: Cambios solicitados, R: Rechazada',
  `rev_reviewer_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios de los revisores',
  `rev_editor_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios del editor',
  `rev_extra_comments` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos del proceso de revisión',
  `rev_user_submission_id` int(11) DEFAULT NULL COMMENT 'Usuario que solicitó la revisión',
  `rev_user_submission_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email del usuario que solicitó la revisión (toma un valor solamente si el usuario fue eliminado)',
  `rev_user_decision_id` int(11) DEFAULT NULL COMMENT 'Usuario que registró la decisión',
  PRIMARY KEY (`rev_id`),
  KEY `createdate` (`rev_submission_time`),
  KEY `fw_rev_work_idx` (`rev_work_id`),
  KEY `fw_rev_user_submission_idx` (`rev_user_submission_id`),
  KEY `fw_rev_user_decision_idx` (`rev_user_decision_id`),
  CONSTRAINT `fw_rev_user_decision` FOREIGN KEY (`rev_user_decision_id`) REFERENCES `user` (`usr_id`),
  CONSTRAINT `fw_rev_user_submission` FOREIGN KEY (`rev_user_submission_id`) REFERENCES `user` (`usr_id`),
  CONSTRAINT `fw_rev_work` FOREIGN KEY (`rev_work_id`) REFERENCES `draft_work` (`wrk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:53
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Dumping routines for database 'poblaciones_arg'
--
/*!50003 DROP FUNCTION IF EXISTS `CircleContainsSphereGeometry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CircleContainsSphereGeometry`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
BEGIN
DECLARE t VARCHAR(12);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
RETURN CircleContainsSpherePoint(center, radius, ele);
END IF;

IF t = 'LINESTRING'  THEN
RETURN CircleContainsSpherePolygon(center, radius, ele);
END IF;
IF t = 'POLYGON' THEN
RETURN CircleContainsSpherePolygon(center, radius, ST_ExteriorRing(ele));
END IF;
IF t = 'MULTIPOLYGON' OR t = 'MULTILINESTRING' THEN
RETURN CircleContainsSphereMultiPolygon(center, radius, ele);
END IF;

RETURN 2;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `CircleContainsSphereMultiPolygon` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CircleContainsSphereMultiPolygon`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE e POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE g GEOMETRY;

SET e = PolygonEnvelope(ele);
IF CircleContainsSpherePoint(center, radius, ST_PointN(e,1)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,2)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,3)) AND  CircleContainsSpherePoint(center, radius, ST_PointN(e,4)) THEN
RETURN 1;
END IF;

SET n = 0;
SET c = ST_NumGeometries(ele);

count_loop: LOOP
SET n = n + 1;
SET g = ST_GeometryN(ele, n);
IF ST_GeometryType(g) = 'POLYGON' THEN
IF CircleContainsSpherePolygon(center, radius, ST_ExteriorRing(g)) = 0 THEN
RETURN 0;
END IF;
ELSEIF CircleContainsSpherePolygon(center, radius, g) = 0 THEN
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
/*!50003 DROP FUNCTION IF EXISTS `CircleContainsSpherePoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CircleContainsSpherePoint`(
center POINT, sizeM DOUBLE, p POINT) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
RETURN DistanceSphere(center, p) <= sizeM;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `CircleContainsSpherePolygon` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CircleContainsSpherePolygon`(`center` POINT, `radius` DOUBLE, `ele` GEOMETRY) RETURNS tinyint(4)
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
IF CircleContainsSpherePoint(center, radius, ST_PointN(e,1)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,2)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,3)) AND CircleContainsSpherePoint(center, radius, ST_PointN(e,4)) THEN
RETURN 1;
END IF;

SET n = 0;
SET c = ST_NumPoints(ele);

count_loop: LOOP
SET n = n + 1;

IF CircleContainsSpherePoint(center, radius, ST_PointN(ele,n)) = 0 THEN
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
/*!50003 DROP FUNCTION IF EXISTS `ContentOfSnapshotGeography` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `ContentOfSnapshotGeography`(
sessionId VARCHAR(20),
id INT, g GEOMETRY,
sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
FROM tmp_calculate_metric
WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
JOIN geography_item ON gei_id = sna_feature_id
WHERE ST_CONTAINS(g, coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1));
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `ContentOfSnapshotPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `ContentOfSnapshotPoint`(
sessionId VARCHAR(20),
id INT, g GEOMETRY,
sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_location
FROM tmp_calculate_metric
WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
WHERE ST_CONTAINS(g, sna_location);
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `ContentOfSnapshotShape` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `ContentOfSnapshotShape`(
sessionId VARCHAR(20),
id INT, g GEOMETRY, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
FROM tmp_calculate_metric
WHERE MBRCONTAINS(g, sna_location) AND (r IS NULL OR sna_r = r)) as t
JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
WHERE ST_CONTAINS(g, sdi_geometry);
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `CoverageSnapshotGeography` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CoverageSnapshotGeography`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
FROM tmp_calculate_metric
WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
OR sna_r = r)) as t
JOIN geography_item ON gei_id = sna_feature_id
WHERE CircleContainsSphereGeometry(p, sizeM,
coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1));
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `CoverageSnapshotPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CoverageSnapshotPoint`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_location
FROM tmp_calculate_metric
WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
OR sna_r = r)) as T
WHERE CircleContainsSpherePoint(p, sizeM, sna_location);
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `CoverageSnapshotShape` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `CoverageSnapshotShape`(sessionId VARCHAR(20), id INT, p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
INSERT INTO tmp_calculate_metric_affected(id, ana_id)
SELECT id, sna_id FROM (SELECT id, sna_id, sna_feature_id
FROM tmp_calculate_metric
WHERE MBRCONTAINS(SquareBuffer(p, sizeM), sna_location) AND (r IS NULL
OR sna_r = r)) as t
JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
WHERE CircleContainsSphereGeometry(p, sizeM, sdi_geometry);
RETURN ROW_COUNT();
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `deg2radLatitude` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `deg2radLatitude`(latitude DOUBLE) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN

RETURN (90 - latitude) * 6.2831852 / 360;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `deg2radLongitude` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `deg2radLongitude`(longitude DOUBLE) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN

IF longitude > 0 THEN
return longitude * 6.2831852 / 360;
ELSE
RETURN (longitude + 360) * 6.2831852 / 360;
END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `DistanceSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `DistanceSphere`(`pt1` POINT, `pt2` POINT) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
RETURN 12742000 * ASIN(SQRT(
POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * 0.0087266472), 2)
+ COS(ST_Y(pt1) * 0.0174532944) * COS(ST_Y(pt2)
* 0.0174532944) * POWER(
SIN((ST_X(pt2) - ST_X(pt1)) * 0.0087266472), 2)));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `DistanceSphereGeometry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `DistanceSphereGeometry`(`pt1` POINT, `pt2` POINT, g GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
if (ST_CONTAINS(g, pt1)) THEN
RETURN 0;
END IF;

RETURN 12742000 * ASIN(SQRT(
POWER(SIN((ST_Y(pt2) - ST_Y(pt1)) * 0.0087266472), 2)
+ COS(ST_Y(pt1) * 0.0174532944) * COS(ST_Y(pt2)
* 0.0174532944) * POWER(
SIN((ST_X(pt2) - ST_X(pt1)) * 0.0087266472), 2)));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `DmsToDecimal` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `DmsToDecimal`(`dms` VARCHAR(50)) RETURNS decimal(20,9)
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

IF POSITION("°" IN dms) < 1 THEN
RETURN CAST(dms AS decimal(20,9));
END IF;

SET deg = CAST(  SUBSTRING_INDEX(dms, '°', 1) AS decimal(20,9));
SET mins = CAST( (SUBSTR(dms, POSITION('°' IN dms) + 1, POSITION("'" IN dms) -  POSITION("°" IN dms) - 1)) AS decimal(20,9));
SET secs = CAST( (SUBSTR(dms, POSITION("'" IN dms) + 1, POSITION("""" IN dms) -  POSITION("'" IN dms) - 1)) AS decimal(20,9));

SET sign = 1 - 2 * (RIGHT(dms, 1) = "W" OR RIGHT(dms, 1) = "S" OR RIGHT(dms, 1) = "O");

RETURN  sign * (deg + mins / 60 + secs / 3600);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
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
CREATE  FUNCTION `EllipseContains`(`center` POINT, `radius` POINT, `location` POINT) RETURNS tinyint(4)
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
CREATE  FUNCTION `EllipseContainsGeometry`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
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
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `EllipseContainsMultiPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
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
SET c = ST_NumGeometries(ele);

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
CREATE  FUNCTION `EllipseContainsPolygon`(`center` POINT, `radius` POINT, `ele` GEOMETRY) RETURNS tinyint(4)
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
CREATE  FUNCTION `FixEncoding`(`cad` TEXT) RETURNS text CHARSET utf8 COLLATE utf8_unicode_ci
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

SET cad = REPLACE(cad, 'Ã‚Â¡', 'Ã¡');
SET cad = REPLACE(cad, 'Ã‚Â¢', 'Ã¢');
SET cad = REPLACE(cad, 'Ã‚Â£', 'Ã£');
SET cad = REPLACE(cad, 'Ã‚Â¤', 'Ã¤');
SET cad = REPLACE(cad, 'Ã‚Â¥', 'Ã¥');
SET cad = REPLACE(cad, 'Ã‚Â¦', 'Ã¦');
SET cad = REPLACE(cad, 'Ã‚Â§', 'Ã§');
SET cad = REPLACE(cad, 'Ã‚Â¨', 'Ã¨');
SET cad = REPLACE(cad, 'Ã‚Â©', 'Ã©');
SET cad = REPLACE(cad, 'Ã‚Âª', 'Ãª');
SET cad = REPLACE(cad, 'Ã‚Â«', 'Ã«');
SET cad = REPLACE(cad, 'Ã‚Â­', 'Ã­');
SET cad = REPLACE(cad, 'Ã‚Â®', 'Ã®');
SET cad = REPLACE(cad, 'Ã‚Â¯', 'Ã¯');
SET cad = REPLACE(cad, 'Ã‚Â°', 'Ã°');
SET cad = REPLACE(cad, 'Ã‚Â±', 'Ã±');
SET cad = REPLACE(cad, 'Ã‚Â²', 'Ã²');
SET cad = REPLACE(cad, 'Ã‚Â³', 'Ã³');
SET cad = REPLACE(cad, 'Ã‚Â´', 'Ã´');
SET cad = REPLACE(cad, 'Ã‚Âµ', 'Ãµ');
SET cad = REPLACE(cad, 'Ã‚Â·', 'Ã·');
SET cad = REPLACE(cad, 'Ã‚Â¸', 'Ã¸');
SET cad = REPLACE(cad, 'Ã‚Â¹', 'Ã¹');
SET cad = REPLACE(cad, 'Ã‚Âº', 'Ãº');
SET cad = REPLACE(cad, 'Ã‚Â»', 'Ã»');
SET cad = REPLACE(cad, 'Ã‚Â¼', 'Ã¼');
SET cad = REPLACE(cad, 'Ã‚Â½', 'Ã½');
SET cad = REPLACE(cad, 'Ã‚Â¾', 'Ã¾');
SET cad = REPLACE(cad, 'Ã‚Â¿', 'Ã¿');
SET cad = REPLACE(cad, 'Ãƒâ‚¬', 'Ã€');
SET cad = REPLACE(cad, 'ÃƒÂ', 'Ã');
SET cad = REPLACE(cad, 'Ãƒâ€š', 'Ã‚');
SET cad = REPLACE(cad, 'ÃƒÆ’', 'Ãƒ');
SET cad = REPLACE(cad, 'Ãƒâ€ž', 'Ã„');
SET cad = REPLACE(cad, 'Ãƒâ€¦', 'Ã…');
SET cad = REPLACE(cad, 'Ãƒâ€ ', 'Ã†');
SET cad = REPLACE(cad, 'Ãƒâ€¡', 'Ã‡');
SET cad = REPLACE(cad, 'ÃƒË†', 'Ãˆ');
SET cad = REPLACE(cad, 'Ãƒâ€°', 'Ã‰');
SET cad = REPLACE(cad, 'ÃƒÅ ', 'ÃŠ');
SET cad = REPLACE(cad, 'Ãƒâ€¹', 'Ã‹');
SET cad = REPLACE(cad, 'ÃƒÅ’', 'ÃŒ');
SET cad = REPLACE(cad, 'ÃƒÅ½', 'ÃŽ');
SET cad = REPLACE(cad, 'Ãƒâ€˜', 'Ã‘');
SET cad = REPLACE(cad, 'Ãƒâ€™', 'Ã’');
SET cad = REPLACE(cad, 'Ãƒâ€œ', 'Ã“');
SET cad = REPLACE(cad, 'Ãƒâ€', 'Ã”');
SET cad = REPLACE(cad, 'Ãƒâ€¢', 'Ã•');
SET cad = REPLACE(cad, 'Ãƒâ€“', 'Ã–');
SET cad = REPLACE(cad, 'Ãƒâ€”', 'Ã—');
SET cad = REPLACE(cad, 'ÃƒËœ', 'Ã˜');
SET cad = REPLACE(cad, 'Ãƒâ„¢', 'Ã™');
SET cad = REPLACE(cad, 'ÃƒÅ¡', 'Ãš');
SET cad = REPLACE(cad, 'Ãƒâ€º', 'Ã›');
SET cad = REPLACE(cad, 'ÃƒÅ“', 'Ãœ');
SET cad = REPLACE(cad, 'ÃƒÅ¾', 'Ãž');
SET cad = REPLACE(cad, 'ÃƒÅ¸', 'ÃŸ');
SET cad = REPLACE(cad, 'ÃƒÂ¡', 'Ã¡');
SET cad = REPLACE(cad, 'ÃƒÂ¢', 'Ã¢');
SET cad = REPLACE(cad, 'ÃƒÂ£', 'Ã£');
SET cad = REPLACE(cad, 'ÃƒÂ¤', 'Ã¤');
SET cad = REPLACE(cad, 'ÃƒÂ¥', 'Ã¥');
SET cad = REPLACE(cad, 'ÃƒÂ¦', 'Ã¦');
SET cad = REPLACE(cad, 'ÃƒÂ§', 'Ã§');
SET cad = REPLACE(cad, 'ÃƒÂ¨', 'Ã¨');
SET cad = REPLACE(cad, 'ÃƒÂ©', 'Ã©');
SET cad = REPLACE(cad, 'ÃƒÂª', 'Ãª');
SET cad = REPLACE(cad, 'ÃƒÂ«', 'Ã«');
SET cad = REPLACE(cad, 'ÃƒÂ­', 'Ã­');
SET cad = REPLACE(cad, 'ÃƒÂ®', 'Ã®');
SET cad = REPLACE(cad, 'ÃƒÂ¯', 'Ã¯');
SET cad = REPLACE(cad, 'ÃƒÂ°', 'Ã°');
SET cad = REPLACE(cad, 'ÃƒÂ±', 'Ã±');
SET cad = REPLACE(cad, 'ÃƒÂ²', 'Ã²');
SET cad = REPLACE(cad, 'ÃƒÂ³', 'Ã³');
SET cad = REPLACE(cad, 'ÃƒÂ´', 'Ã´');
SET cad = REPLACE(cad, 'ÃƒÂµ', 'Ãµ');
SET cad = REPLACE(cad, 'ÃƒÂ·', 'Ã·');
SET cad = REPLACE(cad, 'ÃƒÂ¸', 'Ã¸');
SET cad = REPLACE(cad, 'ÃƒÂ¹', 'Ã¹');
SET cad = REPLACE(cad, 'ÃƒÂº', 'Ãº');
SET cad = REPLACE(cad, 'ÃƒÂ»', 'Ã»');
SET cad = REPLACE(cad, 'ÃƒÂ¼', 'Ã¼');
SET cad = REPLACE(cad, 'ÃƒÂ½', 'Ã½');
SET cad = REPLACE(cad, 'ÃƒÂ¾', 'Ã¾');
SET cad = REPLACE(cad, 'ÃƒÂ¿', 'Ã¿');

RETURN cad;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeoJsonOrWktToWkt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeoJsonOrWktToWkt`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryAreaSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryAreaSphere`(ele GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' OR t = 'LINESTRING' OR t = 'MULTILINESTRING' THEN
RETURN 0;
END IF;

IF t = 'POLYGON' THEN
RETURN PolygonAreaSphere(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
RETURN MultiPolygonAreaSphere(ele);
END IF;

RETURN 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryCentroid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryCentroid`(`ele` GEOMETRY) RETURNS point
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
DECLARE nPoints INT;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;

SET t = ST_GeometryType(ele);

IF t = 'POLYGON' OR t = 'MULTIPOLYGON' THEN
RETURN ST_CENTROID(ele);
END IF;

IF t = 'LINESTRING' THEN
RETURN LineStringCentroid(ele);
END IF;

IF t = 'MULTILINESTRING' THEN
RETURN MultiLineStringCentroid(ele);
END IF;

IF t = 'POINT' THEN
RETURN ele;
END IF;

RETURN NULL;

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
CREATE  FUNCTION `GeometryIsMinSize`(`geom` GEOMETRY, `width` DOUBLE, `height` DOUBLE) RETURNS tinyint(1)
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
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryIsValid2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryIsValid2`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE t VARCHAR(20);
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION RETURN 199;

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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryIsValid3` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryIsValid3`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE t VARCHAR(20);
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
begin
insert into aaa (t) values(st_astext(ele));
set t = 1/0;
RETURN 199;
end;

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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryIsValid4` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryIsValid4`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE t VARCHAR(20);
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
begin
insert into aaa (t) values(st_astext(ele));
RETURN 199;
end;

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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometryPerimeterSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometryPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);

IF t = 'POINT' THEN
RETURN 0;
END IF;
IF t = 'LINESTRING' THEN
RETURN RingPerimeterSphere(ele);
END IF;

IF t = 'MULTILINESTRING' THEN
RETURN MultiLineStringPerimeterSphere(ele);
END IF;

IF t = 'POLYGON' THEN
RETURN PolygonPerimeterSphere(ele);
END IF;
IF t = 'MULTIPOLYGON' THEN
RETURN MultiPolygonPerimeterSphere(ele);
END IF;

RETURN 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `GeometrySimplifySphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeometrySimplifySphere`(`ele` GEOMETRY, threshold DOUBLE) RETURNS geometry
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE t VARCHAR(20);
SET t = ST_GeometryType(ele);
IF t = 'POINT' THEN
RETURN ele;
END IF;
IF t = 'LINESTRING' THEN
RETURN RingDouglasPeuckerSimplify(ele, threshold);
END IF;
IF t = 'MULTILINESTRING' THEN
RETURN MultiLineStringSimplifySphere(ele, threshold);
END IF;
IF t = 'POLYGON' THEN
RETURN PolygonSimplifySphere(ele, threshold);
END IF;
IF t = 'MULTIPOLYGON' THEN
RETURN MultiPolygonSimplifySphere(ele, threshold);
END IF;

RETURN NULL;

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
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `GeoreferenceErrorCode`(`error_code` INT) RETURNS varchar(255) CHARSET utf8
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
WHEN 112 THEN 'El perímetro exterior del polígono tiene menos de tres puntos únicos.'
WHEN 116 THEN 'Uno de los huecos del polígono tiene menos de tres puntos únicos.'
WHEN 120 THEN 'El polígono múltiple no contiene polígonos.'

WHEN 190 THEN 'La geometría no puede ser reconocida.'

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
CREATE  FUNCTION `GeoreferenceErrorWithCode`(`error_code` INT) RETURNS varchar(255) CHARSET utf8
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
/*!50003 DROP FUNCTION IF EXISTS `GetDatasetOf` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `GetDatasetOf`(column_id INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF column_id IS NULL THEN
RETURN null;
END IF;

RETURN (SELECT dco_dataset_id FROM draft_dataset_column WHERE dco_id = column_id);
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
CREATE  FUNCTION `GetGeographyByPoint`(`geography_id` INT, `p` POINT) RETURNS int(11)
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
CREATE  FUNCTION `GetGeoText`(`cad` LONGTEXT) RETURNS longtext CHARSET utf8 COLLATE utf8_unicode_ci
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
CREATE  FUNCTION `GetNonSingleGeographyByPoint`(`geography_id` INT, `p` POINT) RETURNS int(11)
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
/*!50003 DROP FUNCTION IF EXISTS `getOutMostVertexPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `getOutMostVertexPoint`(ls LINESTRING, index_start INT, index_end INT, tolerance DOUBLE) RETURNS int(11)
    NO SQL
    SQL SECURITY INVOKER
BEGIN

DECLARE distanceMax DOUBLE;
DECLARE distance DOUBLE;
DECLARE index_ INT;
DECLARE n INT;
DECLARE c INT;

SET distanceMax = 0;
SET index_ = 0;

SET n = index_start + 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
SET distance = PerpendicularDistance(ST_PointN(ls, index_start), ST_PointN(ls, index_end), ST_PointN(ls,n));
if (distance > distanceMax) THEN
SET index_ = n;
SET distanceMax = distance;
END IF;
SET n = n + 1;
IF n >= index_end THEN
LEAVE count_loop;
END IF;
END LOOP;

if (distanceMax > tolerance) THEN
RETURN index_;
ELSE
RETURN NULL;
END IF;

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
CREATE  FUNCTION `InnerRingsOverlap`(`ele` GEOMETRY) RETURNS tinyint(4)
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
/*!50003 DROP FUNCTION IF EXISTS `IsAccessibleWork` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `IsAccessibleWork`(userId INT,
workId INT,
workIsIndexed TINYINT,
workIsPrivate TINYINT) RETURNS tinyint(1)
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `LineStringCentroid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `LineStringCentroid`(`ele` GEOMETRY) RETURNS point
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE n INT;
DECLARE ttl INT;
DECLARE totalLength DOUBLE;
DECLARE length DOUBLE;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;
DECLARE p1 POINT;
DECLARE p2 POINT;

SET ttl = ST_NumPoints(ele);

IF ttl = 0 THEN
RETURN NULL;
END IF;
IF ttl = 1 THEN
RETURN ST_PointN(ele, 1);
END IF;
IF ttl = 2 THEN
SET p1 = ST_PointN(ele, 1);
SET p2 = ST_PointN(ele, 2);
RETURN POINT((ST_X(p1)+ST_X(p2)) / 2,
(ST_Y(p1)+ST_Y(p2)) / 2);
END IF;

SET n = 1;
SET totalLength = 0;
SET nX = 0;
SET nY = 0;

count_loop: LOOP
IF n >= ttl THEN
LEAVE count_loop;
END IF;
SET n = n + 1;
SET p1 = ST_PointN(ele, n-1);
SET p2 = ST_PointN(ele, n);
SET length = ST_DISTANCE(p1, p2);
SET nX = nX + (ST_X(p1) + ST_X(p2)) / 2 * length;
SET nY = nY + (ST_Y(p1) + ST_Y(p2)) / 2 * length;
SET totalLength = totalLength + length;
END LOOP;

RETURN POINT(nX / totalLength, nY / totalLength);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `LineStringSelfIntersects` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `LineStringSelfIntersects`(geometry_input LINESTRING) RETURNS tinyint(1)
    DETERMINISTIC
BEGIN
DECLARE i, j INT;
DECLARE segment1, segment2 LINESTRING;
DECLARE num_points INT;

SET num_points = ST_NumPoints(geometry_input);


IF num_points < 4 THEN
RETURN FALSE;
END IF;



SET i = 1;
WHILE i < num_points DO
SET j = i + 2;
WHILE j < num_points DO

SET segment1 = LINESTRING(
ST_PointN(geometry_input, i),
ST_PointN(geometry_input, i + 1)
);

SET segment2 = LINESTRING(
ST_PointN(geometry_input, j),
ST_PointN(geometry_input, j + 1)
);

IF ST_Crosses(segment1, segment2) THEN
RETURN TRUE;
END IF;

SET j = j + 1;
END WHILE;
SET i = i + 1;
END WHILE;

RETURN FALSE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiLineStringCentroid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiLineStringCentroid`(`ele` GEOMETRY) RETURNS point
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE n INT;
DECLARE ttl INT;
DECLARE totalLength DOUBLE;
DECLARE length DOUBLE;
DECLARE nX DOUBLE;
DECLARE nY DOUBLE;
DECLARE p1 POINT;
DECLARE p2 POINT;
DECLARE currentLine INT;
DECLARE totalLines INT;

DECLARE line LINESTRING;

SET totalLength = 0;
SET nX = 0;
SET nY = 0;

SET currentLine = 0;
SET totalLines = ST_NumGeometries(ele);

lines_loop: LOOP
IF currentLine >= totalLines THEN
LEAVE lines_loop;
END IF;
SET currentLine = currentLine + 1;
SET line = ST_GeometryN(ele, currentLine);
SET ttl = ST_NumPoints(line);
IF ttl > 1 THEN
SET n = 1;
count_loop: LOOP
IF n >= ttl THEN
LEAVE count_loop;
END IF;
SET n = n + 1;
SET p1 = ST_PointN(line, n-1);
SET p2 = ST_PointN(line, n);
SET length = ST_DISTANCE(p1, p2);
SET nX = nX + (ST_X(p1) + ST_X(p2)) / 2 * length;
SET nY = nY + (ST_Y(p1) + ST_Y(p2)) / 2 * length;
SET totalLength = totalLength + length;
END LOOP;
END IF;
END LOOP;

RETURN POINT(nX / totalLength, nY / totalLength);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiLineStringPerimeterSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiLineStringPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;

SET sum = 0;

SET n = 1;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
RETURN 0;
END IF;

count_loop: LOOP
SET g = ST_GeometryN(ele, n);
SET sum = sum + RingPerimeterSphere(g);

SET n = n + 1;
IF n > c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN sum;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiLineStringSimplifySphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiLineStringSimplifySphere`(ele GEOMETRY, threshold DOUBLE) RETURNS geometry
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l LINESTRING;
DECLARE c INT;
DECLARE n INT;
DECLARE comma VARCHAR(1);

SET res = "MULTILINESTRING(";
SET comma = "";
SET n = 0;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
RETURN ele;
END IF;

count_loop: LOOP
SET n = n + 1;
SET l = RingDouglasPeuckerSimplify(ST_GeometryN(ele, n), threshold);
IF l IS NOT NULL THEN
SET res = CONCAT(res, comma , REPLACE(AsText(l), "LINESTRING", ""));
SET comma = ",";
END IF;
IF n >= c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN GeomFromText(CONCAT(res, ")"));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiPolygonAreaSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiPolygonAreaSphere`(ele GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;
SET sum = 0;

SET n = 1;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
RETURN 0;
END IF;

count_loop: LOOP
SET g = ST_GeometryN(ele, n);
SET sum = sum + PolygonAreaSphere(g);

SET n = n + 1;
IF n > c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN sum;
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
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiPolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;

SET n = 0;
SET c = ST_NumGeometries(ele);
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
/*!50003 DROP FUNCTION IF EXISTS `MultiPolygonPerimeterSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiPolygonPerimeterSphere`(ele GEOMETRY) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;

DECLARE c INT;
DECLARE n INT;
DECLARE res tinyint(4);
DECLARE g GEOMETRY;
SET sum = 0;

SET n = 1;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
RETURN 0;
END IF;

count_loop: LOOP
SET g = ST_GeometryN(ele, n);
SET sum = sum + PolygonPerimeterSphere(g);

SET n = n + 1;
IF n > c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN sum;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `MultiPolygonSimplifySphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `MultiPolygonSimplifySphere`(ele MULTIPOLYGON, threshold DOUBLE) RETURNS multipolygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l POLYGON;
DECLARE c INT;
DECLARE n INT;
DECLARE comma VARCHAR(1);

SET res = "MULTIPOLYGON(";
SET comma = "";
SET n = 0;
SET c = ST_NumGeometries(ele);
IF c = 0 THEN
RETURN ele;
END IF;

count_loop: LOOP
SET n = n + 1;
SET l = PolygonSimplifySphere(ST_GeometryN(ele, n), threshold);
IF l IS NOT NULL THEN
SET res = CONCAT(res, comma , REPLACE(AsText(l), "POLYGON", ""));
SET comma = ",";
END IF;
IF n >= c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN ST_MultiPolygonFromText(CONCAT(res, ")"));

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshot` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshot`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotGeography` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotGeography`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE ret INTEGER;
SET ret = NULL;

IF sizeM > 1000 THEN
SET ret = NearestSnapshotRangeGeography(sessionId, p, 1000, sizeM, r);
END IF;
IF ret IS NULL AND sizeM > 10000 THEN
SET ret = NearestSnapshotRangeGeography(sessionId, p, 10000, sizeM, r);
END IF;

IF ret IS NULL THEN
SET ret = NearestSnapshotRangeGeography(sessionId, p, sizeM, sizeM, r);
END IF;

RETURN ret;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotPoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotPoint`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE ret INTEGER;
SET ret = NULL;

IF sizeM > 1000 THEN
SET ret = NearestSnapshotRangePoint(sessionId, p, 1000, sizeM, r);
END IF;
IF ret IS NULL AND sizeM > 10000 THEN
SET ret = NearestSnapshotRangePoint(sessionId, p, 10000, sizeM, r);
END IF;

IF ret IS NULL THEN
SET ret = NearestSnapshotRangePoint(sessionId, p, sizeM, sizeM, r);
END IF;

RETURN ret;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotRangeGeography` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotRangeGeography`(sessionId VARCHAR(20),
p POINT, buffer DOUBLE, sizeM DOUBLE,r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
RETURN (select sna_id FROM
(SELECT sna_id, DistanceSphereGeometry(p, sna_location,
coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)) d
FROM tmp_calculate_metric
JOIN geography_item ON gei_id = sna_feature_id
WHERE MBRCONTAINS(SquareBuffer(p, buffer), sna_location) AND (r IS NULL
OR sna_r = r)
ORDER BY DistanceSphereGeometry(p, sna_location,
coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)) LIMIT 1) as candidate
WHERE d <= sizeM);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotRangePoint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotRangePoint`(sessionId VARCHAR(20), p POINT, mbrSize DOUBLE, sizeM DOUBLE, r INT) RETURNS int(11)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotRangeShape` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotRangeShape`(sessionId VARCHAR(20), p POINT,
buffer DOUBLE, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
RETURN (select sna_id FROM
(SELECT sna_id, DistanceSphereGeometry(p, sna_location, sdi_geometry) d
FROM tmp_calculate_metric
JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id
WHERE MBRCONTAINS(SquareBuffer(p, buffer), sna_location) AND (r IS NULL
OR sna_r = r)
ORDER BY DistanceSphereGeometry(p, sna_location, sdi_geometry) LIMIT 1) as candidate WHERE d <= sizeM);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `NearestSnapshotShape` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `NearestSnapshotShape`(sessionId VARCHAR(20), p POINT, sizeM DOUBLE, r INT) RETURNS int(11)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE ret INTEGER;
SET ret = NULL;

IF sizeM > 1000 THEN
SET ret = NearestSnapshotRangeShape(sessionId, p, 1000, sizeM, r);
END IF;
IF ret IS NULL AND sizeM > 10000 THEN
SET ret = NearestSnapshotRangeShape(sessionId, p, 10000, sizeM, r);
END IF;

IF ret IS NULL THEN
SET ret = NearestSnapshotRangeShape(sessionId, p, sizeM, sizeM, r);
END IF;

RETURN ret;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PerpendicularDistance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `PerpendicularDistance`(line_start POINT, line_end POINT, p POINT) RETURNS double
    NO SQL
    SQL SECURITY INVOKER
BEGIN
DECLARE firstLinePointLat DOUBLE;
DECLARE firstLinePointLng DOUBLE;
DECLARE ellipsoidRadius DOUBLE;
DECLARE firstLinePointX DOUBLE;
DECLARE firstLinePointY DOUBLE;
DECLARE firstLinePointZ DOUBLE;
DECLARE secondLinePointLat DOUBLE;
DECLARE secondLinePointLng DOUBLE;
DECLARE secondLinePointX DOUBLE;
DECLARE secondLinePointY DOUBLE;
DECLARE secondLinePointZ DOUBLE;
DECLARE pointLat DOUBLE;
DECLARE pointLng DOUBLE;
DECLARE pointX DOUBLE;
DECLARE pointY DOUBLE;
DECLARE pointZ DOUBLE;
DECLARE normalizedX DOUBLE;
DECLARE normalizedY DOUBLE;
DECLARE normalizedZ DOUBLE;
DECLARE length DOUBLE;
DECLARE thetaPoint DOUBLE;
DECLARE distance DOUBLE;





SET ellipsoidRadius = 6371008.7714151;

SET firstLinePointLat = deg2radLatitude(ST_Y(line_start));
SET firstLinePointLng = deg2radLongitude(ST_X(line_start));

SET firstLinePointX = ellipsoidRadius * cos(firstLinePointLng) * sin(firstLinePointLat);
SET firstLinePointY = ellipsoidRadius * sin(firstLinePointLng) * sin(firstLinePointLat);
SET firstLinePointZ = ellipsoidRadius * cos(firstLinePointLat);

SET secondLinePointLat = deg2radLatitude(ST_Y(line_end));
SET secondLinePointLng = deg2radLongitude(ST_X(line_end));

SET secondLinePointX = ellipsoidRadius * cos(secondLinePointLng) * sin(secondLinePointLat);
SET secondLinePointY = ellipsoidRadius * sin(secondLinePointLng) * sin(secondLinePointLat);
SET secondLinePointZ = ellipsoidRadius * cos(secondLinePointLat);

SET pointLat = deg2radLatitude(ST_Y(p));
SET pointLng = deg2radLongitude(ST_X(p));

SET pointX = ellipsoidRadius * cos(pointLng) * sin(pointLat);
SET pointY = ellipsoidRadius * sin(pointLng) * sin(pointLat);
SET pointZ = ellipsoidRadius * cos(pointLat);

SET normalizedX = firstLinePointY * secondLinePointZ - firstLinePointZ * secondLinePointY;
SET normalizedY = firstLinePointZ * secondLinePointX - firstLinePointX * secondLinePointZ;
SET normalizedZ = firstLinePointX * secondLinePointY - firstLinePointY * secondLinePointX;

SET length = sqrt(normalizedX * normalizedX + normalizedY * normalizedY + normalizedZ * normalizedZ);

if (length > 0) THEN
SET normalizedX = normalizedX / length;
SET normalizedY = normalizedY / length;
SET normalizedZ = normalizedZ / length;
END IF;

SET thetaPoint = normalizedX * pointX + normalizedY * pointY + normalizedZ * pointZ;

SET length = sqrt(pointX * pointX + pointY * pointY + pointZ * pointZ);

if (length > 0) THEN
SET thetaPoint = thetaPoint / length;
END IF;
SET distance = abs((3.1415926 / 2) - acos(thetaPoint));

return distance * ellipsoidRadius;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PolygonAreaSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `PolygonAreaSphere`(`p` POLYGON) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE c INT;
DECLARE n INT;

SET sum = RingAreaSphere(ST_ExteriorRing(p));

SET n = 0;
SET c = ST_NumInteriorRings(p);
IF c = 0 THEN
RETURN sum;
END IF;

count_loop: LOOP
SET n = n + 1;
SET sum = sum - ABS(RingAreaSphere(ST_InteriorRingN(p, n)));

IF n >= c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN sum;

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
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  FUNCTION `PolygonEnvelope`(`g` GEOMETRY) RETURNS polygon
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
WHEN 'LINESTRING' THEN POLYGON(LINESTRING(ST_PointN(envelope, 1), ST_PointN(envelope, 2), ST_PointN(envelope, 2), ST_PointN(envelope, 1) ))
WHEN 'POINT' THEN POLYGON(LINESTRING(envelope, envelope, envelope, envelope))
END;

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
CREATE  FUNCTION `PolygonIsValid`(`ele` GEOMETRY) RETURNS tinyint(4)
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
/*!50003 DROP FUNCTION IF EXISTS `PolygonPerimeterSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `PolygonPerimeterSphere`(p POLYGON) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

RETURN RingPerimeterSphere(ST_ExteriorRing(p));

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `PolygonSimplifySphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `PolygonSimplifySphere`(p POLYGON, threshold DOUBLE) RETURNS polygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE res MEDIUMTEXT;
DECLARE ring MEDIUMTEXT;
DECLARE l LINESTRING;
DECLARE c INT;
DECLARE n INT;

SET l = RingDouglasPeuckerSimplify(ST_ExteriorRing(p), threshold);
SET res = REPLACE(AsText(l), "LINESTRING", "POLYGON(");

SET n = 0;
SET c = ST_NumInteriorRings(p);
IF c = 0 THEN
RETURN ST_PolygonFromText(CONCAT(res, ")"));
END IF;

count_loop: LOOP
SET n = n + 1;
SET l = RingDouglasPeuckerSimplify(ST_InteriorRingN(p, n), threshold);
IF l IS NOT NULL THEN
SET res = CONCAT(res, REPLACE(AsText(l), "LINESTRING", ","));
END IF;
IF n >= c THEN
LEAVE count_loop;
END IF;
END LOOP;

RETURN ST_PolygonFromText(CONCAT(res, ")"));

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
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `PolygonsOverlap`(`ele` GEOMETRY) RETURNS tinyint(4)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE c INT;
DECLARE n INT;
DECLARE i INT;
DECLARE res tinyint(4);
DECLARE g POLYGON;
DECLARE g2 POLYGON;
SET n = 0;
SET c = ST_NumGeometries(ele);

count2_loop: LOOP
SET n = n + 1;
SET g = ST_GeometryN(ele, n);
SET i = n;
count3_loop: LOOP
SET i = i + 1;
SET g2 = ST_GeometryN(ele, i);
IF ST_Intersects(g, g2) AND NOT ST_Touches(g, g2) THEN
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
CREATE  FUNCTION `RichEnvelope`(`g` GEOMETRY, `xDelta` INT, `yDelta` INT) RETURNS polygon
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
/*!50003 DROP FUNCTION IF EXISTS `RingAreaSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `RingAreaSphere`(ls LINESTRING) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE prevcolat DOUBLE;
DECLARE prevaz DOUBLE;
DECLARE colat0 DOUBLE;
DECLARE az0 DOUBLE;
DECLARE az DOUBLE;
DECLARE PI DOUBLE;
DECLARE lat DOUBLE;
DECLARE lon DOUBLE;
DECLARE colat DOUBLE;
DECLARE n INT;
DECLARE c INT;

IF ST_NumPoints(ls) = 0 THEN
RETURN 0;
END IF;
IF ST_IsClosed(ls) = 0 THEN
RETURN 0;
END IF;

SET sum=0;
SET prevcolat=0;
SET prevaz=0;
SET colat0=0;
SET az0=0;
SET PI=3.1415269;

SET n = 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
SET lat = ST_Y(ST_PointN(ls,n));
SET lon = ST_X(ST_PointN(ls,n));

SET colat=2*ATAN2(SQRT(POW(SIN(lat*PI/180/2), 2)+ COS(lat*PI/180)*POW(SIN(lon*PI/180/2), 2)),SQRT(1-  POW(SIN(lat*PI/180/2), 2)- COS(lat*PI/180)*POW(SIN(lon*PI/180/2), 2)));
SET az=0;
IF lat>=90 THEN
SET az=0;
ELSEIF lat<=-90 THEN
SET az=PI;
ELSE
SET az=ATAN2(COS(lat*PI/180) * SIN(lon*PI/180),SIN(lat*PI/180))% (2*PI);
END IF;

IF n = 1 THEN
SET colat0=colat;
SET az0=az;
ELSE
SET sum=sum+(1-COS(prevcolat  + (colat-prevcolat)/2))*PI*((ABS(az-prevaz)/PI)-2*CEIL(((ABS(az-prevaz)/PI)-1)/2))* SIGN(az-prevaz);
END IF;
SET prevcolat=colat;
SET prevaz=az;

SET n = n + 1;
IF n > c THEN
LEAVE count_loop;
END IF;

END LOOP;

SET sum=sum+(1-COS(prevcolat  + (colat0-prevcolat)/2))*(az0-prevaz);

RETURN 5.10072e+14 * LEAST(ABS(sum)/4/PI, 1-ABS(sum)/4/PI);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `RingDouglasPeuckerSimplify` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `RingDouglasPeuckerSimplify`(ls LINESTRING, tolerance DOUBLE) RETURNS linestring
    NO SQL
    SQL SECURITY INVOKER
BEGIN

DECLARE index_start INT;
DECLARE index_end INT;
DECLARE last_id INT;
DECLARE lineSize INT;
DECLARE outMost INT;
DECLARE pointsTexts TEXT;

SET lineSize = ST_NumPoints(ls);
if (lineSize < 4) THEN
RETURN ls;
END IF;

DROP TEMPORARY TABLE IF EXISTS ranges;
DROP TEMPORARY TABLE IF EXISTS results;

CREATE TEMPORARY TABLE ranges (id INT primary key auto_increment, fromPoint INT, toPoint INT) ENGINE=MEMORY;
CREATE TEMPORARY TABLE results (p POINT);


IF ST_IsClosed(ls) THEN
INSERT INTO ranges(fromPoint, toPoint) VALUES (2, lineSize);
INSERT INTO results VALUES (ST_PointN(ls, 1)), (ST_PointN(ls, 2));
ELSE
INSERT INTO ranges(fromPoint, toPoint) VALUES (1, lineSize);
INSERT INTO results VALUES (ST_PointN(ls, 1));
END IF;

SET last_id = (SELECT MAX(id) FROM ranges);

master_loop: LOOP
SELECT fromPoint, toPoint INTO index_start, index_end FROM ranges WHERE id = last_id;
DELETE FROM ranges WHERE id = last_id;

IF (index_end - index_start > 1) THEN
SET outMost = getOutMostVertexPoint(ls, index_start, index_end, tolerance);
ELSE
SET outMost = NULL;
END IF;

if outMost IS NOT NULL THEN
INSERT INTO ranges(fromPoint, toPoint) VALUES (outMost, index_end);
INSERT INTO ranges(fromPoint, toPoint) VALUES (index_start, outMost);
ELSE
INSERT INTO results VALUES (ST_PointN(ls, index_end));
END IF;

SET last_id = (SELECT MAX(id) FROM ranges);

IF last_id IS NULL THEN
LEAVE master_loop;
END IF;
END LOOP;

SET group_concat_max_len = 4294967295;
SET pointsTexts = (SELECT GROUP_CONCAT(CONCAT(ST_X(p), " ", ST_Y(p)) SEPARATOR ',') FROM results);

DROP TEMPORARY TABLE ranges;
IF ST_IsClosed(ls) AND (SELECT COUNT(*) FROM results) = 3 THEN
DROP TEMPORARY TABLE results;
RETURN NULL;
END IF;
DROP TEMPORARY TABLE results;

RETURN GeomFromText(CONCAT("LINESTRING(", pointsTexts, ")"));

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
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `RingIsValid`(`ele` GEOMETRY, direction tinyint(4)) RETURNS int(11)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE n INT;
SET n = ST_NumPoints(ele);

IF n = 0 THEN
RETURN 101;
END IF;
IF n < 4 THEN
RETURN 112;
END IF;

IF ST_IsClosed(ele) = 0 THEN
RETURN 102;
END IF;

IF ST_IsSimple(ele) = 0 AND LineStringSelfIntersects(ele) THEN
RETURN 104;
END IF;

RETURN 100;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `RingPerimeterSphere` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `RingPerimeterSphere`(ls LINESTRING) RETURNS double
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN

DECLARE sum DOUBLE;
DECLARE n INT;
DECLARE c INT;

IF ST_NumPoints(ls) < 2 THEN
RETURN 0;
END IF;

SET sum=0;

SET n = 1;
SET c = ST_NumPoints(ls);

count_loop: LOOP
SET sum = sum + DistanceSphere(ST_PointN(ls,n), ST_PointN(ls,n+1));

SET n = n + 1;
IF n >= c THEN
LEAVE count_loop;
END IF;

END LOOP;

RETURN sum;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `SanitizeTag` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `SanitizeTag`(input TEXT, current_id INT, is_draft int) RETURNS varchar(200) CHARSET latin1
    READS SQL DATA
BEGIN
DECLARE base_tag VARCHAR(200);
DECLARE candidate VARCHAR(200);
DECLARE counter INT DEFAULT 0;
DECLARE exists_count INT DEFAULT 0;

-- Parte 1: sanitización (idéntica a la original)
SET base_tag = LOWER(input);
SET base_tag = REPLACE(base_tag, 'á', 'a');
SET base_tag = REPLACE(base_tag, 'é', 'e');
SET base_tag = REPLACE(base_tag, 'í', 'i');
SET base_tag = REPLACE(base_tag, 'ó', 'o');
SET base_tag = REPLACE(base_tag, 'ú', 'u');
SET base_tag = REPLACE(base_tag, 'à', 'a');
SET base_tag = REPLACE(base_tag, 'è', 'e');
SET base_tag = REPLACE(base_tag, 'ì', 'i');
SET base_tag = REPLACE(base_tag, 'ò', 'o');
SET base_tag = REPLACE(base_tag, 'ù', 'u');
SET base_tag = REPLACE(base_tag, 'ä', 'a');
SET base_tag = REPLACE(base_tag, 'ë', 'e');
SET base_tag = REPLACE(base_tag, 'ï', 'i');
SET base_tag = REPLACE(base_tag, 'ö', 'o');
SET base_tag = REPLACE(base_tag, 'ü', 'u');
SET base_tag = REPLACE(base_tag, 'â', 'a');
SET base_tag = REPLACE(base_tag, 'ê', 'e');
SET base_tag = REPLACE(base_tag, 'î', 'i');
SET base_tag = REPLACE(base_tag, 'ô', 'o');
SET base_tag = REPLACE(base_tag, 'û', 'u');
SET base_tag = REPLACE(base_tag, 'ñ', 'n');
SET base_tag = REPLACE(base_tag, 'ç', 'c');
SET base_tag = REPLACE(base_tag, 'ã', 'a');
SET base_tag = REPLACE(base_tag, 'õ', 'o');

SET base_tag = REPLACE(base_tag, ':', '_');

SET base_tag = REPLACE(base_tag, ' ', '_');
SET base_tag = REPLACE(base_tag, '-', '_');
SET base_tag = REPLACE(base_tag, '/', '_');
SET base_tag = REPLACE(base_tag, '\\', '_');
SET base_tag = REPLACE(base_tag, '.', '_');
SET base_tag = REPLACE(base_tag, ',', '_');
SET base_tag = REPLACE(base_tag, ';', '_');
SET base_tag = REPLACE(base_tag, '(', '_');
SET base_tag = REPLACE(base_tag, ')', '_');
SET base_tag = REPLACE(base_tag, '[', '_');
SET base_tag = REPLACE(base_tag, ']', '_');
SET base_tag = REPLACE(base_tag, '{', '_');
SET base_tag = REPLACE(base_tag, '}', '_');
SET base_tag = REPLACE(base_tag, "'", '_');
SET base_tag = REPLACE(base_tag, '"', '_');
SET base_tag = REPLACE(base_tag, '!', '_');
SET base_tag = REPLACE(base_tag, '?', '_');
SET base_tag = REPLACE(base_tag, '%', '_');
SET base_tag = REPLACE(base_tag, '&', '_');
SET base_tag = REPLACE(base_tag, '+', '_');
SET base_tag = REPLACE(base_tag, '=', '_');
SET base_tag = REPLACE(base_tag, '@', '_');
SET base_tag = REPLACE(base_tag, '#', '_');
SET base_tag = REPLACE(base_tag, '*', '_');

SET base_tag = REPLACE(base_tag, '______', '_');
SET base_tag = REPLACE(base_tag, '_____', '_');
SET base_tag = REPLACE(base_tag, '____', '_');
SET base_tag = REPLACE(base_tag, '___', '_');
SET base_tag = REPLACE(base_tag, '__', '_');
SET base_tag = TRIM('_' FROM base_tag);
SET base_tag = LEFT(base_tag, 200);

-- Parte 2: verificación de unicidad
SET candidate = base_tag;

if is_draft THEN
SELECT COUNT(*) INTO exists_count
FROM draft_metric
WHERE mtr_tag = candidate
AND mtr_id <> current_id;
ELSE
SELECT COUNT(*) INTO exists_count
FROM metric
WHERE mtr_tag = candidate
AND mtr_id <> current_id;
END IF;

WHILE exists_count > 0 DO
SET counter = counter + 1;
SET candidate = CONCAT(base_tag, '_', counter);
SELECT COUNT(*) INTO exists_count
FROM metric
WHERE mtr_tag = candidate
AND mtr_id <> current_id;
END WHILE;

RETURN candidate;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `Signature` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `Signature`() RETURNS bigint(20)
    NO SQL
    SQL SECURITY INVOKER
BEGIN
RETURN UNIX_TIMESTAMP(NOW(6))* 1000 & 0xFFFFFFFF;
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
CREATE  FUNCTION `SignedArea`(`ele` GEOMETRY) RETURNS double
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
/*!50003 DROP FUNCTION IF EXISTS `SquareBuffer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `SquareBuffer`(p POINT, sizeM DOUBLE) RETURNS polygon
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE ret INTEGER;
DECLARE offsetX DOUBLE;
DECLARE offsetY DOUBLE;
SET offsetX = sizeM / (100000 * COS(ST_Y(p) / PI() / 180));
SET offsetY = sizeM / 100000;

RETURN POLYGON(LINESTRING(
POINT(ST_X(p) - offsetX, ST_Y(p) - offsetY),
POINT(ST_X(p) + offsetX, ST_Y(p) - offsetY),
POINT(ST_X(p) + offsetX, ST_Y(p) + offsetY),
POINT(ST_X(p) - offsetX, ST_Y(p) + offsetY),
POINT(ST_X(p) - offsetX, ST_Y(p) - offsetY)
));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `UserFullNameById` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `UserFullNameById`(`id` INT) RETURNS varchar(100) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF id IS NULL THEN
RETURN null;
END IF;

RETURN (SELECT TRIM(CONCAT(usr_firstname, ' ', usr_lastname)) FROM `user` WHERE usr_id = 1);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `find_invalid_geometries` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  PROCEDURE `find_invalid_geometries`()
BEGIN
DECLARE done INT DEFAULT FALSE;
DECLARE row_id INT;
DECLARE geom_data TEXT;
DECLARE error_msg VARCHAR(255);

DECLARE cur CURSOR FOR SELECT id, dt_col15 FROM work_dataset_draft_003927;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = TRUE;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1 error_msg = MESSAGE_TEXT;
INSERT INTO invalid_geometries VALUES (row_id, error_msg);
END;

OPEN cur;

read_loop: LOOP
FETCH cur INTO row_id, geom_data;
IF done THEN
LEAVE read_loop;
END IF;

SET @valid = ST_GeomFromText(GeoJsonOrWktToWkt(geom_data));
END LOOP;

CLOSE cur;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `find_invalid_geometries2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ALLOW_INVALID_DATES' */ ;
DELIMITER ;;
CREATE  PROCEDURE `find_invalid_geometries2`()
BEGIN
DECLARE done INT DEFAULT FALSE;
DECLARE row_id INT;
DECLARE geom_data TEXT;
DECLARE error_msg VARCHAR(255);

DECLARE cur CURSOR FOR SELECT id, dt_col15 FROM work_dataset_draft_003927;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = TRUE;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1 error_msg = MESSAGE_TEXT;
INSERT INTO invalid_geometries VALUES (row_id, error_msg);
END;

OPEN cur;

read_loop: LOOP
FETCH cur INTO row_id, geom_data;
IF done THEN
LEAVE read_loop;
END IF;


SET @valid = GeometryIsValid(ST_GeomFromText(GeoJsonOrWktToWkt(geom_data)));
END LOOP;

CLOSE cur;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_delete_draft_work_cascade` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  PROCEDURE `sp_delete_draft_work_cascade`(IN p_wrk_id INT)
proc_label: BEGIN
DECLARE v_error_message TEXT;
DECLARE v_sql_state VARCHAR(5);
DECLARE v_error_number INT;

DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
-- Capturar información del error
GET DIAGNOSTICS CONDITION 1
v_sql_state = RETURNED_SQLSTATE,
v_error_number = MYSQL_ERRNO,
v_error_message = MESSAGE_TEXT;

-- En caso de error, hacer rollback
ROLLBACK;

-- Mostrar información detallada del error
SELECT
'ERROR' AS status,
v_error_number AS error_code,
v_sql_state AS sql_state,
v_error_message AS error_message;
END;

-- Iniciar transacción
START TRANSACTION;

-- Verificar que el work existe
IF NOT EXISTS (SELECT 1 FROM draft_work WHERE wrk_id = p_wrk_id) THEN
SELECT
'ERROR' AS status,
CONCAT('El work ID ', p_wrk_id, ' no existe') AS error_message;
ROLLBACK;
LEAVE proc_label;
END IF;

-- 1. Eliminar anotaciones y sus items
DELETE ani FROM draft_annotation_item ani
INNER JOIN draft_annotation ann ON ani.ani_annotation_id = ann.ann_id
WHERE ann.ann_work_id = p_wrk_id;

delete from work_space_usage where wdu_work_id = p_wrk_id;

DELETE FROM draft_annotation
WHERE ann_work_id = p_wrk_id;

-- 2. Eliminar onboarding steps y onboarding
DELETE obs FROM draft_onboarding_step obs
INNER JOIN draft_onboarding onb ON obs.obs_onboarding_id = onb.onb_id
WHERE onb.onb_work_id = p_wrk_id;

DELETE FROM draft_onboarding
WHERE onb_work_id = p_wrk_id;

-- 3. Eliminar work icons
DELETE FROM draft_work_icon
WHERE wic_work_id = p_wrk_id;

-- 4. Eliminar permisos de work
DELETE FROM draft_work_permission
WHERE wkp_work_id = p_wrk_id;

-- 5. Eliminar métricas extra del work
DELETE FROM draft_work_extra_metric
WHERE wmt_work_id = p_wrk_id;

-- 6. Eliminar variables y sus value labels
DELETE vvl FROM draft_variable_value_label vvl
INNER JOIN draft_variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 7. Eliminar variables
DELETE mvv FROM draft_variable mvv
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 8. Eliminar metric version levels
DELETE mvl FROM draft_metric_version_level mvl
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 9. Eliminar metric versions del work
DELETE FROM draft_metric_version
WHERE mvr_work_id = p_wrk_id;

-- 10. Eliminar dataset column value labels
DELETE dla FROM draft_dataset_column_value_label dla
INNER JOIN draft_dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 11. Eliminar dataset columns
DELETE dco FROM draft_dataset_column dco
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 12. Eliminar dataset markers
DELETE dmk FROM draft_dataset_marker dmk
INNER JOIN draft_dataset dat ON dmk.dmk_id = dat.dat_marker_id
WHERE dat.dat_work_id = p_wrk_id;

-- 13. Eliminar datasets
DELETE FROM draft_dataset
WHERE dat_work_id = p_wrk_id;

-- 14. Obtener el metadata_id y startup_id antes de eliminar el work
SET @metadata_id = (SELECT wrk_metadata_id FROM draft_work WHERE wrk_id = p_wrk_id);
SET @startup_id = (SELECT wrk_startup_id FROM draft_work WHERE wrk_id = p_wrk_id);

-- 15. Eliminar el work
DELETE FROM draft_work
WHERE wrk_id = p_wrk_id;

-- 16. Eliminar startup del work (DESPUÉS de eliminar el work)
DELETE FROM draft_work_startup
WHERE wst_id = @startup_id;

-- 17. Eliminar metadata files
DELETE FROM draft_metadata_file
WHERE mfi_metadata_id = @metadata_id;

-- 18. Eliminar metadata institutions
DELETE FROM draft_metadata_institution
WHERE min_metadata_id = @metadata_id;

-- 19. Eliminar metadata sources
DELETE FROM draft_metadata_source
WHERE msc_metadata_id = @metadata_id;

-- 20. Obtener el contact_id antes de eliminar metadata
SET @contact_id = (SELECT met_contact_id FROM draft_metadata WHERE met_id = @metadata_id);

-- 21. Eliminar metadata
DELETE FROM draft_metadata
WHERE met_id = @metadata_id;

-- 22. Eliminar contact (si no está siendo usado por otros registros)
DELETE FROM draft_contact
WHERE con_id = @contact_id
AND con_id NOT IN (SELECT met_contact_id FROM draft_metadata WHERE met_contact_id IS NOT NULL)
AND con_id NOT IN (SELECT src_contact_id FROM draft_source WHERE src_contact_id IS NOT NULL);

-- Confirmar transacción
COMMIT;

SELECT
'SUCCESS' AS status,
CONCAT('Work ID ', p_wrk_id, ' eliminado exitosamente con todos sus registros dependientes') AS message;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_delete_draft_work_cascade_debug` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  PROCEDURE `sp_delete_draft_work_cascade_debug`(IN p_wrk_id INT)
proc_label: BEGIN
DECLARE v_count INT;

-- NO usar transacción en modo debug para ver cada paso

SELECT CONCAT('Iniciando eliminación del work ID: ', p_wrk_id) AS paso;

-- Verificar que el work existe
SELECT COUNT(*) INTO v_count FROM draft_work WHERE wrk_id = p_wrk_id;
SELECT CONCAT('0. Work encontrado: ', v_count) AS paso;

IF v_count = 0 THEN
SELECT 'ERROR: El work no existe' AS error;
LEAVE proc_label;
END IF;

-- 1. Eliminar anotaciones y sus items
SELECT '1. Eliminando annotation items...' AS paso;
DELETE ani FROM draft_annotation_item ani
INNER JOIN draft_annotation ann ON ani.ani_annotation_id = ann.ann_id
WHERE ann.ann_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' annotation items') AS resultado;

SELECT '2. Eliminando annotations...' AS paso;
DELETE FROM draft_annotation
WHERE ann_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' annotations') AS resultado;

-- 2. Eliminar onboarding steps y onboarding
SELECT '3. Eliminando onboarding steps...' AS paso;
DELETE obs FROM draft_onboarding_step obs
INNER JOIN draft_onboarding onb ON obs.obs_onboarding_id = onb.onb_id
WHERE onb.onb_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' onboarding steps') AS resultado;

SELECT '4. Eliminando onboarding...' AS paso;
DELETE FROM draft_onboarding
WHERE onb_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' onboardings') AS resultado;

-- 3. Eliminar work icons
SELECT '5. Eliminando work icons...' AS paso;
DELETE FROM draft_work_icon
WHERE wic_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' icons') AS resultado;

-- 4. Eliminar permisos de work
SELECT '6. Eliminando work permissions...' AS paso;
DELETE FROM draft_work_permission
WHERE wkp_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' permissions') AS resultado;

-- 5. Eliminar métricas extra del work
SELECT '7. Eliminando work extra metrics...' AS paso;
DELETE FROM draft_work_extra_metric
WHERE wmt_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' extra metrics') AS resultado;

-- 6. Eliminar variables y sus value labels
SELECT '8. Eliminando variable value labels...' AS paso;
DELETE vvl FROM draft_variable_value_label vvl
INNER JOIN draft_variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' variable value labels') AS resultado;

-- 7. Eliminar variables
SELECT '9. Eliminando variables...' AS paso;
DELETE mvv FROM draft_variable mvv
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' variables') AS resultado;

-- 8. Eliminar metric version levels
SELECT '10. Eliminando metric version levels...' AS paso;
DELETE mvl FROM draft_metric_version_level mvl
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metric version levels') AS resultado;

-- 9. Eliminar metric versions del work
SELECT '11. Eliminando metric versions...' AS paso;
DELETE FROM draft_metric_version
WHERE mvr_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metric versions') AS resultado;

-- 10. Eliminar dataset column value labels
SELECT '12. Eliminando dataset column value labels...' AS paso;
DELETE dla FROM draft_dataset_column_value_label dla
INNER JOIN draft_dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset column value labels') AS resultado;

-- 11. Eliminar dataset columns
SELECT '13. Eliminando dataset columns...' AS paso;
DELETE dco FROM draft_dataset_column dco
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset columns') AS resultado;

-- 12. Eliminar dataset markers
SELECT '14. Eliminando dataset markers...' AS paso;
DELETE dmk FROM draft_dataset_marker dmk
INNER JOIN draft_dataset dat ON dmk.dmk_id = dat.dat_marker_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset markers') AS resultado;

-- 13. Eliminar datasets
SELECT '15. Eliminando datasets...' AS paso;
DELETE FROM draft_dataset
WHERE dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' datasets') AS resultado;

-- 14. Obtener el metadata_id y startup_id antes de eliminar el work
SELECT '16. Obteniendo metadata_id y startup_id...' AS paso;
SET @metadata_id = (SELECT wrk_metadata_id FROM draft_work WHERE wrk_id = p_wrk_id);
SET @startup_id = (SELECT wrk_startup_id FROM draft_work WHERE wrk_id = p_wrk_id);
SELECT CONCAT('   - Metadata ID: ', IFNULL(@metadata_id, 'NULL'), ', Startup ID: ', IFNULL(@startup_id, 'NULL')) AS resultado;

delete from work_space_usage where wdu_work_id = p_wrk_id;

-- 15. Eliminar el work
SELECT '17. Eliminando work...' AS paso;
DELETE FROM draft_work
WHERE wrk_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' works') AS resultado;

-- 16. Eliminar startup del work (DESPUÉS de eliminar el work)
SELECT '18. Eliminando work startup...' AS paso;
DELETE FROM draft_work_startup
WHERE wst_id = @startup_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' startups') AS resultado;

-- 17. Eliminar metadata files
SELECT '19. Eliminando metadata files...' AS paso;
DELETE FROM draft_metadata_file
WHERE mfi_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata files') AS resultado;

-- 18. Eliminar metadata institutions
SELECT '20. Eliminando metadata institutions...' AS paso;
DELETE FROM draft_metadata_institution
WHERE min_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata institutions') AS resultado;

-- 19. Eliminar metadata sources
SELECT '21. Eliminando metadata sources...' AS paso;
DELETE FROM draft_metadata_source
WHERE msc_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata sources') AS resultado;

-- 20. Obtener el contact_id antes de eliminar metadata
SELECT '22. Obteniendo contact_id...' AS paso;
SET @contact_id = (SELECT met_contact_id FROM draft_metadata WHERE met_id = @metadata_id);
SELECT CONCAT('   - Contact ID: ', IFNULL(@contact_id, 'NULL')) AS resultado;

-- 21. Eliminar metadata
SELECT '23. Eliminando metadata...' AS paso;
DELETE FROM draft_metadata
WHERE met_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata') AS resultado;

-- 22. Eliminar contact (si no está siendo usado por otros registros)
SELECT '24. Eliminando contact (si no está en uso)...' AS paso;
DELETE FROM draft_contact
WHERE con_id = @contact_id
AND con_id NOT IN (SELECT met_contact_id FROM draft_metadata WHERE met_contact_id IS NOT NULL)
AND con_id NOT IN (SELECT src_contact_id FROM draft_source WHERE src_contact_id IS NOT NULL);
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' contacts') AS resultado;

SELECT CONCAT('✓ COMPLETADO: Work ID ', p_wrk_id, ' eliminado exitosamente') AS resultado_final;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_delete_work_cascade` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  PROCEDURE `sp_delete_work_cascade`(IN p_wrk_id INT)
proc_label: BEGIN
DECLARE v_error_message TEXT;
DECLARE v_sql_state VARCHAR(5);
DECLARE v_error_number INT;

DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
-- Capturar información del error
GET DIAGNOSTICS CONDITION 1
v_sql_state = RETURNED_SQLSTATE,
v_error_number = MYSQL_ERRNO,
v_error_message = MESSAGE_TEXT;

-- En caso de error, hacer rollback
ROLLBACK;

-- Mostrar información detallada del error
SELECT
'ERROR' AS status,
v_error_number AS error_code,
v_sql_state AS sql_state,
v_error_message AS error_message;
END;

-- Iniciar transacción
START TRANSACTION;

-- Verificar que el work existe
IF NOT EXISTS (SELECT 1 FROM work WHERE wrk_id = p_wrk_id) THEN
SELECT
'ERROR' AS status,
CONCAT('El work ID ', p_wrk_id, ' no existe') AS error_message;
ROLLBACK;
LEAVE proc_label;
END IF;


-- 2. Eliminar onboarding steps y onboarding
DELETE obs FROM onboarding_step obs
INNER JOIN onboarding onb ON obs.obs_onboarding_id = onb.onb_id
WHERE onb.onb_work_id = p_wrk_id;

DELETE FROM onboarding
WHERE onb_work_id = p_wrk_id;

-- 3. Eliminar work icons
DELETE FROM work_icon
WHERE wic_work_id = p_wrk_id;

-- 5. Eliminar métricas extra del work
DELETE FROM work_extra_metric
WHERE wmt_work_id = p_wrk_id;

-- 6. Eliminar variables y sus value labels
DELETE vvl FROM variable_value_label vvl
INNER JOIN variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
INNER JOIN metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 7. Eliminar variables
DELETE mvv FROM variable mvv
INNER JOIN metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 8. Eliminar metric version levels
DELETE mvl FROM metric_version_level mvl
INNER JOIN dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 9. Eliminar metric versions del work
DELETE FROM metric_version
WHERE mvr_work_id = p_wrk_id;

-- 10. Eliminar dataset column value labels
DELETE dla FROM dataset_column_value_label dla
INNER JOIN dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
INNER JOIN dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 11. Eliminar dataset columns
DELETE dco FROM dataset_column dco
INNER JOIN dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;

-- 12. Eliminar dataset markers
DELETE dmk FROM dataset_marker dmk
INNER JOIN dataset dat ON dmk.dmk_id = dat.dat_marker_id
WHERE dat.dat_work_id = p_wrk_id;

-- 13. Eliminar datasets
DELETE FROM dataset
WHERE dat_work_id = p_wrk_id;

-- 14. Obtener el metadata_id y startup_id antes de eliminar el work
SET @metadata_id = (SELECT wrk_metadata_id FROM work WHERE wrk_id = p_wrk_id);
SET @startup_id = (SELECT wrk_startup_id FROM work WHERE wrk_id = p_wrk_id);

-- 15. Eliminar el work
DELETE FROM work
WHERE wrk_id = p_wrk_id;

-- 16. Eliminar startup del work (DESPUÉS de eliminar el work)
DELETE FROM work_startup
WHERE wst_id = @startup_id;

-- 17. Eliminar metadata files
DELETE FROM metadata_file
WHERE mfi_metadata_id = @metadata_id;

-- 18. Eliminar metadata institutions
DELETE FROM metadata_institution
WHERE min_metadata_id = @metadata_id;

-- 19. Eliminar metadata sources
DELETE FROM metadata_source
WHERE msc_metadata_id = @metadata_id;

-- 20. Obtener el contact_id antes de eliminar metadata
SET @contact_id = (SELECT met_contact_id FROM metadata WHERE met_id = @metadata_id);

-- 21. Eliminar metadata
DELETE FROM metadata
WHERE met_id = @metadata_id;

-- 22. Eliminar contact (si no está siendo usado por otros registros)
DELETE FROM contact
WHERE con_id = @contact_id
AND con_id NOT IN (SELECT met_contact_id FROM metadata WHERE met_contact_id IS NOT NULL)
AND con_id NOT IN (SELECT src_contact_id FROM source WHERE src_contact_id IS NOT NULL);

-- Confirmar transacción
COMMIT;

SELECT
'SUCCESS' AS status,
CONCAT('Work ID ', p_wrk_id, ' eliminado exitosamente con todos sus registros dependientes') AS message;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_delete_work_cascade_debug` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  PROCEDURE `sp_delete_work_cascade_debug`(IN p_wrk_id INT)
proc_label: BEGIN
DECLARE v_count INT;

-- NO usar transacción en modo debug para ver cada paso

SELECT CONCAT('Iniciando eliminación del work ID: ', p_wrk_id) AS paso;

-- Verificar que el work existe
SELECT COUNT(*) INTO v_count FROM draft_work WHERE wrk_id = p_wrk_id;
SELECT CONCAT('0. Work encontrado: ', v_count) AS paso;

IF v_count = 0 THEN
SELECT 'ERROR: El work no existe' AS error;
LEAVE proc_label;
END IF;

-- 1. Eliminar anotaciones y sus items
SELECT '1. Eliminando annotation items...' AS paso;
DELETE ani FROM draft_annotation_item ani
INNER JOIN draft_annotation ann ON ani.ani_annotation_id = ann.ann_id
WHERE ann.ann_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' annotation items') AS resultado;

SELECT '2. Eliminando annotations...' AS paso;
DELETE FROM draft_annotation
WHERE ann_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' annotations') AS resultado;

-- 2. Eliminar onboarding steps y onboarding
SELECT '3. Eliminando onboarding steps...' AS paso;
DELETE obs FROM draft_onboarding_step obs
INNER JOIN draft_onboarding onb ON obs.obs_onboarding_id = onb.onb_id
WHERE onb.onb_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' onboarding steps') AS resultado;

SELECT '4. Eliminando onboarding...' AS paso;
DELETE FROM draft_onboarding
WHERE onb_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' onboardings') AS resultado;

-- 3. Eliminar work icons
SELECT '5. Eliminando work icons...' AS paso;
DELETE FROM draft_work_icon
WHERE wic_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' icons') AS resultado;

-- 4. Eliminar permisos de work
SELECT '6. Eliminando work permissions...' AS paso;
DELETE FROM draft_work_permission
WHERE wkp_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' permissions') AS resultado;

-- 5. Eliminar métricas extra del work
SELECT '7. Eliminando work extra metrics...' AS paso;
DELETE FROM draft_work_extra_metric
WHERE wmt_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' extra metrics') AS resultado;

-- 6. Eliminar variables y sus value labels
SELECT '8. Eliminando variable value labels...' AS paso;
DELETE vvl FROM draft_variable_value_label vvl
INNER JOIN draft_variable mvv ON vvl.vvl_variable_id = mvv.mvv_id
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' variable value labels') AS resultado;

-- 7. Eliminar variables
SELECT '9. Eliminando variables...' AS paso;
DELETE mvv FROM draft_variable mvv
INNER JOIN draft_metric_version_level mvl ON mvv.mvv_metric_version_level_id = mvl.mvl_id
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' variables') AS resultado;

-- 8. Eliminar metric version levels
SELECT '10. Eliminando metric version levels...' AS paso;
DELETE mvl FROM draft_metric_version_level mvl
INNER JOIN draft_dataset dat ON mvl.mvl_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metric version levels') AS resultado;

-- 9. Eliminar metric versions del work
SELECT '11. Eliminando metric versions...' AS paso;
DELETE FROM draft_metric_version
WHERE mvr_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metric versions') AS resultado;

-- 10. Eliminar dataset column value labels
SELECT '12. Eliminando dataset column value labels...' AS paso;
DELETE dla FROM draft_dataset_column_value_label dla
INNER JOIN draft_dataset_column dco ON dla.dla_dataset_column_id = dco.dco_id
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset column value labels') AS resultado;

-- 11. Eliminar dataset columns
SELECT '13. Eliminando dataset columns...' AS paso;
DELETE dco FROM draft_dataset_column dco
INNER JOIN draft_dataset dat ON dco.dco_dataset_id = dat.dat_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset columns') AS resultado;

-- 12. Eliminar dataset markers
SELECT '14. Eliminando dataset markers...' AS paso;
DELETE dmk FROM draft_dataset_marker dmk
INNER JOIN draft_dataset dat ON dmk.dmk_id = dat.dat_marker_id
WHERE dat.dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' dataset markers') AS resultado;

-- 13. Eliminar datasets
SELECT '15. Eliminando datasets...' AS paso;
DELETE FROM draft_dataset
WHERE dat_work_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' datasets') AS resultado;

-- 14. Eliminar startup del work
SELECT '16. Eliminando work startup...' AS paso;
DELETE wst FROM draft_work_startup wst
INNER JOIN draft_work wrk ON wst.wst_id = wrk.wrk_startup_id
WHERE wrk.wrk_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' startups') AS resultado;

-- 15. Obtener el metadata_id antes de eliminar el work
SELECT '17. Obteniendo metadata_id...' AS paso;
SET @metadata_id = (SELECT wrk_metadata_id FROM draft_work WHERE wrk_id = p_wrk_id);
SELECT CONCAT('   - Metadata ID: ', IFNULL(@metadata_id, 'NULL')) AS resultado;

-- 16. Eliminar el work
SELECT '18. Eliminando work...' AS paso;
DELETE FROM draft_work
WHERE wrk_id = p_wrk_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' works') AS resultado;

-- 17. Eliminar metadata files
SELECT '19. Eliminando metadata files...' AS paso;
DELETE FROM draft_metadata_file
WHERE mfi_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata files') AS resultado;

-- 18. Eliminar metadata institutions
SELECT '20. Eliminando metadata institutions...' AS paso;
DELETE FROM draft_metadata_institution
WHERE min_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata institutions') AS resultado;

-- 19. Eliminar metadata sources
SELECT '21. Eliminando metadata sources...' AS paso;
DELETE FROM draft_metadata_source
WHERE msc_metadata_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata sources') AS resultado;

-- 20. Obtener el contact_id antes de eliminar metadata
SELECT '22. Obteniendo contact_id...' AS paso;
SET @contact_id = (SELECT met_contact_id FROM draft_metadata WHERE met_id = @metadata_id);
SELECT CONCAT('   - Contact ID: ', IFNULL(@contact_id, 'NULL')) AS resultado;

-- 21. Eliminar metadata
SELECT '23. Eliminando metadata...' AS paso;
DELETE FROM draft_metadata
WHERE met_id = @metadata_id;
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' metadata') AS resultado;

-- 22. Eliminar contact (si no está siendo usado por otros registros)
SELECT '24. Eliminando contact (si no está en uso)...' AS paso;
DELETE FROM draft_contact
WHERE con_id = @contact_id
AND con_id NOT IN (SELECT met_contact_id FROM draft_metadata WHERE met_contact_id IS NOT NULL)
AND con_id NOT IN (SELECT src_contact_id FROM draft_source WHERE src_contact_id IS NOT NULL);
SELECT CONCAT('   - Eliminados: ', ROW_COUNT(), ' contacts') AS resultado;

SELECT CONCAT('✓ COMPLETADO: Work ID ', p_wrk_id, ' eliminado exitosamente') AS resultado_final;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_fix_shared_work_startup` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  PROCEDURE `sp_fix_shared_work_startup`()
BEGIN
DECLARE done INT DEFAULT FALSE;
DECLARE v_wrk_id INT;
DECLARE v_shared_startup_id INT;
DECLARE v_new_startup_id INT;
DECLARE v_count INT;
DECLARE v_total_fixed INT DEFAULT 0;

-- Cursor para obtener todos los works que comparten startup (excepto el primero)
DECLARE cur_works CURSOR FOR
SELECT w.wrk_id, w.wrk_startup_id
FROM work w
INNER JOIN (
SELECT wrk_startup_id, COUNT(*) as uso_count
FROM work
GROUP BY wrk_startup_id
HAVING COUNT(*) > 1
) shared ON w.wrk_startup_id = shared.wrk_startup_id
WHERE w.wrk_id NOT IN (
-- Excluir el primer work de cada grupo (ese mantendrá el startup original)
SELECT MIN(wrk_id)
FROM work
GROUP BY wrk_startup_id
)
ORDER BY w.wrk_startup_id, w.wrk_id;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

-- Verificar cuántos works tienen startup compartido
SELECT COUNT(*) INTO v_count
FROM work w
INNER JOIN (
SELECT wrk_startup_id, COUNT(*) as uso_count
FROM work
GROUP BY wrk_startup_id
HAVING COUNT(*) > 1
) shared ON w.wrk_startup_id = shared.wrk_startup_id
WHERE w.wrk_id NOT IN (
SELECT MIN(wrk_id)
FROM work
GROUP BY wrk_startup_id
);

SELECT CONCAT('Se encontraron ', v_count, ' works que necesitan un nuevo work_startup') AS info;

-- Mostrar detalles de los startups compartidos
SELECT
wst.wst_id AS startup_id,
COUNT(*) AS works_usando_este_startup,
GROUP_CONCAT(w.wrk_id ORDER BY w.wrk_id) AS work_ids
FROM work w
INNER JOIN work_startup wst ON w.wrk_startup_id = wst.wst_id
GROUP BY wst.wst_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Iniciar transacción
START TRANSACTION;

OPEN cur_works;

read_loop: LOOP
FETCH cur_works INTO v_wrk_id, v_shared_startup_id;

IF done THEN
LEAVE read_loop;
END IF;

-- Crear una copia del startup compartido
INSERT INTO work_startup (
wst_type,
wst_clipping_region_item_id,
wst_clipping_region_item_selected,
wst_center,
wst_zoom,
wst_active_metrics
)
SELECT
wst_type,
wst_clipping_region_item_id,
wst_clipping_region_item_selected,
wst_center,
wst_zoom,
wst_active_metrics
FROM work_startup
WHERE wst_id = v_shared_startup_id;

-- Obtener el ID del nuevo startup
SET v_new_startup_id = LAST_INSERT_ID();

-- Actualizar el work para que use el nuevo startup
UPDATE work
SET wrk_startup_id = v_new_startup_id
WHERE wrk_id = v_wrk_id;

SET v_total_fixed = v_total_fixed + 1;

-- Mostrar progreso cada 10 registros
IF v_total_fixed % 10 = 0 THEN
SELECT CONCAT('Procesados: ', v_total_fixed, ' works...') AS progreso;
END IF;

END LOOP;

CLOSE cur_works;

-- Confirmar transacción
COMMIT;

SELECT CONCAT('✓ COMPLETADO: Se crearon ', v_total_fixed, ' nuevos work_startup') AS resultado;

-- Verificar que ya no haya startups compartidos
SELECT COUNT(*) INTO v_count
FROM (
SELECT wrk_startup_id, COUNT(*) as uso_count
FROM work
GROUP BY wrk_startup_id
HAVING COUNT(*) > 1
) shared;

IF v_count = 0 THEN
SELECT '✓ VERIFICACIÓN: Ahora todos los works tienen su propio startup único' AS verificacion;
ELSE
SELECT CONCAT('⚠ ADVERTENCIA: Aún quedan ', v_count, ' startups compartidos') AS verificacion;
END IF;

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

-- Dump completed on 2026-06-02 17:17:46
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_boundary`
--

DROP TABLE IF EXISTS `snapshot_boundary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_boundary` (
  `bow_id` int(11) NOT NULL AUTO_INCREMENT,
  `bow_boundary_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bow_caption` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del límite',
  `bow_group` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Grupo del límite',
  PRIMARY KEY (`bow_id`),
  UNIQUE KEY `bow_boundary_id_UNIQUE` (`bow_boundary_id`),
  FULLTEXT KEY `bow_full_text` (`bow_caption`,`bow_group`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:53
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_boundary_version_item`
--

DROP TABLE IF EXISTS `snapshot_boundary_version_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_boundary_version_item` (
  `biw_id` int(11) NOT NULL AUTO_INCREMENT,
  `biw_boundary_version_id` int(11) NOT NULL,
  `biw_boundary_id` int(11) NOT NULL COMMENT 'Límite al que pertenece el ítem (ej. Catamarca puede pertenecer a \r\n\r\nProvincias).',
  `biw_clipping_region_item_id` int(11) NOT NULL COMMENT 'Región de recorte representada por la fila',
  `biw_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Etiqueta de la región',
  `biw_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Código de la región',
  `biw_centroid` point NOT NULL COMMENT 'Centroide de la región de recorte',
  `biw_area_m2` double NOT NULL COMMENT 'Area en m2.',
  `biw_geometry_r1` geometry NOT NULL COMMENT 'Polígono de la región',
  `biw_geometry_r2` geometry NOT NULL,
  `biw_geometry_r3` geometry NOT NULL,
  `biw_envelope` polygon NOT NULL COMMENT 'Rectángulo envolvente del polígono',
  PRIMARY KEY (`biw_id`),
  UNIQUE KEY `ix_ver` (`biw_boundary_version_id`,`biw_clipping_region_item_id`),
  SPATIAL KEY `ix_g_b_1` (`biw_geometry_r1`),
  SPATIAL KEY `ix_envelope` (`biw_envelope`),
  KEY `ix_cai_b_id` (`biw_boundary_id`,`biw_clipping_region_item_id`)
) ENGINE=MyISAM AUTO_INCREMENT=15563 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:23:53
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_clipping_region_item_geography_item`
--

DROP TABLE IF EXISTS `snapshot_clipping_region_item_geography_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_clipping_region_item_geography_item` (
  `cgv_id` int(11) NOT NULL AUTO_INCREMENT,
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
  `cgv_urbanity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de elemento de la geografía según si es urbano, rural o no corresponde. Valores posibles. U: Urbano, R: Rural: N: No corresponde.',
  PRIMARY KEY (`cgv_id`),
  KEY `ix_cliregion_carto` (`cgv_clipping_region_item_id`,`cgv_geography_id`),
  KEY `ix_carto` (`cgv_geography_item_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5443418 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:24:16
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_geography_item`
--

DROP TABLE IF EXISTS `snapshot_geography_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_geography_item` (
  `giw_id` int(11) NOT NULL AUTO_INCREMENT,
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
  `giw_geometry_r6` geometry NOT NULL,
  PRIMARY KEY (`giw_id`),
  UNIQUE KEY `ix_cai_id` (`giw_geography_item_id`),
  SPATIAL KEY `ix_g1` (`giw_geometry_r1`),
  SPATIAL KEY `ix_g2` (`giw_geometry_r2`),
  SPATIAL KEY `ix_g3` (`giw_geometry_r3`),
  SPATIAL KEY `ix_g4` (`giw_geometry_r4`),
  SPATIAL KEY `ix_g5` (`giw_geometry_r5`),
  SPATIAL KEY `ix_g6` (`giw_geometry_r6`),
  KEY `geography` (`giw_geography_id`)
) ENGINE=MyISAM AUTO_INCREMENT=225434 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:24:38
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_lookup_clipping_region_item`
--

DROP TABLE IF EXISTS `snapshot_lookup_clipping_region_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_lookup_clipping_region_item` (
  `clc_id` int(11) NOT NULL AUTO_INCREMENT,
  `clc_clipping_region_item_id` int(11) NOT NULL,
  `clc_level` int(11) DEFAULT NULL,
  `clc_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clc_full_ids` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_code` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Código del item',
  `clc_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clc_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clc_population` int(11) NOT NULL DEFAULT '0' COMMENT 'Población declarada en la región de clippping',
  `clc_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clc_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clc_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clc_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clc_shard` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`clc_id`),
  SPATIAL KEY `lookup_spatial` (`clc_location`),
  KEY `ix_clipping_region_item_id` (`clc_clipping_region_item_id`),
  FULLTEXT KEY `ix_lookup_caption` (`clc_caption`,`clc_tooltip`,`clc_full_parent`,`clc_code`),
  FULLTEXT KEY `ix_lookup_caption_only` (`clc_caption`)
) ENGINE=MyISAM AUTO_INCREMENT=10322 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:25:43
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_lookup_feature`
--

DROP TABLE IF EXISTS `snapshot_lookup_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_lookup_feature` (
  `clf_id` int(11) NOT NULL AUTO_INCREMENT,
  `clf_dataset_id` int(11) DEFAULT NULL,
  `clf_level` int(11) DEFAULT NULL,
  `clf_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clf_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clf_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clf_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clf_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clf_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clf_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clf_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clf_shard` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`clf_id`),
  UNIQUE KEY `ux_fid` (`clf_feature_ids`),
  SPATIAL KEY `lookup_spatial` (`clf_location`),
  KEY `snap_item_dataset` (`clf_dataset_id`),
  FULLTEXT KEY `ix_lookup_caption` (`clf_caption`)
) ENGINE=MyISAM AUTO_INCREMENT=4419510 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci CHECKSUM=1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:25:43
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_metric_version`
--

DROP TABLE IF EXISTS `snapshot_metric_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_metric_version` (
  `mvw_id` int(11) NOT NULL AUTO_INCREMENT,
  `mvw_metric_id` int(11) NOT NULL,
  `mvw_metric_icon` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_metric_tag` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_metric_caption` varchar(150) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del indicador',
  `mvw_metric_revision` bigint(20) NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador',
  `mvw_metric_group_id` int(11) DEFAULT NULL,
  `mvw_metric_provider_id` int(11) DEFAULT NULL,
  `mvw_metric_version_id` int(11) NOT NULL,
  `mvw_caption` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `mvw_partial_coverage` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_level` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_work_id` int(11) NOT NULL COMMENT 'Identificador de la obra.',
  `mvw_work_caption` varchar(500) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tìtulo de la obra.',
  `mvw_work_authors` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Autores de la cartografía',
  `mvw_work_institutions` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Instituciones de la cartografía',
  `mvw_work_type` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tipo de la obra',
  `mvw_work_is_private` tinyint(4) NOT NULL DEFAULT '0',
  `mvw_work_is_indexed` tinyint(4) NOT NULL DEFAULT '0',
  `mvw_work_access_link` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mvw_variable_captions` varchar(5000) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las variables para los metric_version multimétricos. Los items se separan por un caracter \\\\n.',
  `mvw_variable_value_captions` varchar(5000) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Descripciones de las etiquetas de os valores de las variables. Los valores se encuentran separados por caracteres \\\\r. Para los metric_version multimétricos, los items correspondientes a cada variable se encuentran agrupados entre separadores \\\\n.',
  PRIMARY KEY (`mvw_id`),
  KEY `ix_layer_version_view` (`mvw_metric_version_id`),
  FULLTEXT KEY `ix_version_fulltext` (`mvw_metric_caption`,`mvw_caption`,`mvw_variable_captions`,`mvw_variable_value_captions`,`mvw_work_caption`,`mvw_work_authors`,`mvw_work_institutions`)
) ENGINE=MyISAM AUTO_INCREMENT=1854 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:25:44
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `snapshot_shape_dataset_item`
--

DROP TABLE IF EXISTS `snapshot_shape_dataset_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshot_shape_dataset_item` (
  `sdi_id` int(11) NOT NULL AUTO_INCREMENT,
  `sdi_dataset_id` int(11) NOT NULL,
  `sdi_dataset_item_id` int(11) NOT NULL,
  `sdi_feature_id` bigint(11) NOT NULL,
  `sdi_geometry` geometry NOT NULL,
  `sdi_centroid` point DEFAULT NULL,
  PRIMARY KEY (`sdi_id`),
  UNIQUE KEY `uniquenormal` (`sdi_dataset_id`,`sdi_dataset_item_id`),
  UNIQUE KEY `unique` (`sdi_feature_id`),
  SPATIAL KEY `geor6` (`sdi_geometry`)
) ENGINE=MyISAM AUTO_INCREMENT=21740240 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:25:44
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `source`
--

DROP TABLE IF EXISTS `source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `source` (
  `src_id` int(11) NOT NULL,
  `src_caption` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Título de la fuente',
  `src_is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Establece si es una fuente del usuario o si forma parte del catálogo global de fuentes.',
  `src_institution_id` int(11) DEFAULT NULL COMMENT 'Institución productora de la fuente',
  `src_authors` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `src_version` varchar(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Versión de la fuente (año, período o número)',
  `src_web` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Página web',
  `src_wiki` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Link a wikipedia con información sobre la fuente',
  `src_contact_id` int(11) DEFAULT NULL COMMENT 'Contacto con de la fuente',
  PRIMARY KEY (`src_id`),
  KEY `source_ibfk_3` (`src_contact_id`),
  KEY `source_ibfk_5` (`src_institution_id`),
  CONSTRAINT `source_ibfk_1` FOREIGN KEY (`src_contact_id`) REFERENCES `contact` (`con_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `source_ibfk_4` FOREIGN KEY (`src_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:26
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `statistic`
--

DROP TABLE IF EXISTS `statistic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `statistic` (
  `sta_id` int(11) NOT NULL AUTO_INCREMENT,
  `sta_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mes al que corresponde la información.',
  `sta_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de registro. W: cartografía. M: métrica',
  `sta_element_id` int(11) NOT NULL COMMENT 'Id de la obra o la métrica',
  `sta_hits` int(11) NOT NULL DEFAULT '0' COMMENT 'Consultas',
  `sta_downloads` int(11) NOT NULL DEFAULT '0' COMMENT 'Descargas',
  `sta_google` int(11) NOT NULL DEFAULT '0' COMMENT 'Ingresos por una búsqueda desde google.',
  `sta_backoffice` int(11) NOT NULL DEFAULT '0' COMMENT 'Ingresos por backoffice',
  PRIMARY KEY (`sta_id`),
  KEY `sta_month` (`sta_month`,`sta_type`)
) ENGINE=InnoDB AUTO_INCREMENT=37035 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:26
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `statistic_embedding`
--

DROP TABLE IF EXISTS `statistic_embedding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `statistic_embedding` (
  `emb_id` int(11) NOT NULL AUTO_INCREMENT,
  `emb_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_host_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_map_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emb_hits` int(11) NOT NULL,
  PRIMARY KEY (`emb_id`),
  UNIQUE KEY `ix_sta` (`emb_month`,`emb_host_url`,`emb_map_url`)
) ENGINE=InnoDB AUTO_INCREMENT=73574 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:27
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_boundary_patterns`
--

DROP TABLE IF EXISTS `suggestions_boundary_patterns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_boundary_patterns` (
  `sbp_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `sbp_boundary_id` int(11) NOT NULL,
  `sbp_context_has_metrics` tinyint(1) NOT NULL,
  `sbp_context_has_regions` tinyint(1) NOT NULL,
  `sbp_zoom_min` tinyint(4) NOT NULL,
  `sbp_zoom_max` tinyint(4) NOT NULL,
  `sbp_frequency` float NOT NULL,
  `sbp_count` int(11) NOT NULL,
  `sbp_acceptance_rate` float DEFAULT '0',
  `sbp_updated_at` datetime NOT NULL,
  PRIMARY KEY (`sbp_id`),
  UNIQUE KEY `unique_boundary_context` (`sbp_boundary_id`,`sbp_context_has_metrics`,`sbp_context_has_regions`,`sbp_zoom_min`,`sbp_zoom_max`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:27
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_by_province`
--

DROP TABLE IF EXISTS `suggestions_by_province`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_by_province` (
  `sbp_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `sbp_province_code` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sbp_metric_id` int(11) NOT NULL,
  `sbp_frequency` float NOT NULL,
  `sbp_count` int(11) NOT NULL,
  `sbp_avg_session_actions` int(11) NOT NULL COMMENT 'Promedio de acciones en sesión',
  `sbp_acceptance_rate` float DEFAULT '0',
  `sbp_updated_at` datetime NOT NULL,
  PRIMARY KEY (`sbp_id`),
  UNIQUE KEY `unique_province_metric` (`sbp_province_code`,`sbp_metric_id`),
  KEY `idx_province` (`sbp_province_code`),
  KEY `idx_frequency` (`sbp_frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:27
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_by_zoom_range`
--

DROP TABLE IF EXISTS `suggestions_by_zoom_range`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_by_zoom_range` (
  `szr_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `szr_zoom_min` tinyint(4) NOT NULL,
  `szr_zoom_max` tinyint(4) NOT NULL,
  `szr_action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `szr_action_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `szr_action_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `szr_frequency` float NOT NULL COMMENT 'Frecuencia normalizada en este rango',
  `szr_count` int(11) NOT NULL,
  `szr_acceptance_rate` float DEFAULT '0',
  `szr_updated_at` datetime NOT NULL,
  PRIMARY KEY (`szr_id`),
  UNIQUE KEY `unique_zoom_action` (`szr_zoom_min`,`szr_zoom_max`,`szr_action_type`,`szr_action_name`,`szr_action_value`(100)),
  KEY `idx_zoom_range` (`szr_zoom_min`,`szr_zoom_max`),
  KEY `idx_frequency` (`szr_frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:27
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_metric_cooccurrence`
--

DROP TABLE IF EXISTS `suggestions_metric_cooccurrence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_metric_cooccurrence` (
  `smc_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `smc_metric_a` int(11) NOT NULL,
  `smc_metric_b` int(11) NOT NULL,
  `smc_support` float NOT NULL COMMENT 'Frecuencia conjunta',
  `smc_confidence` float NOT NULL COMMENT 'P(B|A)',
  `smc_lift` float NOT NULL COMMENT 'lift = confidence / P(B)',
  `smc_count` int(11) NOT NULL,
  `smc_acceptance_rate` float DEFAULT '0' COMMENT 'Tasa de aceptación cuando se sugiere',
  `smc_updated_at` datetime NOT NULL,
  PRIMARY KEY (`smc_id`),
  UNIQUE KEY `unique_pair` (`smc_metric_a`,`smc_metric_b`),
  KEY `idx_lift` (`smc_lift`),
  KEY `idx_acceptance` (`smc_acceptance_rate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:27
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_model_metadata`
--

DROP TABLE IF EXISTS `suggestions_model_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_model_metadata` (
  `smm_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `smm_key_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `smm_value_text` text COLLATE utf8mb4_unicode_ci,
  `smm_value_numeric` float DEFAULT NULL,
  `smm_updated_at` datetime NOT NULL,
  PRIMARY KEY (`smm_id`),
  UNIQUE KEY `unique_key` (`smm_key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_processing_log`
--

DROP TABLE IF EXISTS `suggestions_processing_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_processing_log` (
  `spl_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `spl_year_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Formato: YYYY-MM',
  `spl_sessions_analyzed` int(11) NOT NULL,
  `spl_rules_created` int(11) NOT NULL,
  `spl_rules_updated` int(11) NOT NULL,
  `spl_rules_deleted` int(11) NOT NULL,
  `spl_started_at` datetime NOT NULL,
  `spl_completed_at` datetime NOT NULL,
  `spl_status` enum('completed','failed','running') COLLATE utf8mb4_unicode_ci NOT NULL,
  `spl_error_message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`spl_id`),
  UNIQUE KEY `unique_month` (`spl_year_month`),
  KEY `idx_status` (`spl_status`),
  KEY `idx_completed` (`spl_completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_region_after_metric`
--

DROP TABLE IF EXISTS `suggestions_region_after_metric`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_region_after_metric` (
  `srm_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `srm_metric_id` int(11) NOT NULL,
  `srm_region_id` int(11) NOT NULL,
  `srm_zoom_min` tinyint(4) NOT NULL,
  `srm_zoom_max` tinyint(4) NOT NULL,
  `srm_frequency` float NOT NULL,
  `srm_count` int(11) NOT NULL,
  `srm_acceptance_rate` float DEFAULT '0',
  `srm_updated_at` datetime NOT NULL,
  PRIMARY KEY (`srm_id`),
  UNIQUE KEY `unique_metric_region_zoom` (`srm_metric_id`,`srm_region_id`,`srm_zoom_min`,`srm_zoom_max`),
  KEY `idx_metric_zoom` (`srm_metric_id`,`srm_zoom_min`,`srm_zoom_max`),
  KEY `idx_frequency` (`srm_frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_sequences`
--

DROP TABLE IF EXISTS `suggestions_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_sequences` (
  `ssq_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ssq_pattern_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash MD5 del patrón',
  `ssq_pattern_json` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Array JSON del patrón de acciones',
  `ssq_pattern_length` tinyint(4) NOT NULL,
  `ssq_next_action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ssq_next_action_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ssq_next_action_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ssq_probability` float NOT NULL,
  `ssq_count` int(11) NOT NULL,
  `ssq_avg_zoom_level` float DEFAULT NULL,
  `ssq_acceptance_rate` float DEFAULT '0',
  `ssq_updated_at` datetime NOT NULL,
  PRIMARY KEY (`ssq_id`),
  UNIQUE KEY `unique_pattern_next` (`ssq_pattern_hash`,`ssq_next_action_type`,`ssq_next_action_name`,`ssq_next_action_value`(100)),
  KEY `idx_pattern` (`ssq_pattern_hash`),
  KEY `idx_probability` (`ssq_probability`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `suggestions_variable_cooccurrence`
--

DROP TABLE IF EXISTS `suggestions_variable_cooccurrence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_variable_cooccurrence` (
  `svc_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `svc_metric_id` int(11) NOT NULL,
  `svc_variable_a` int(11) NOT NULL,
  `svc_variable_b` int(11) NOT NULL,
  `svc_support` float NOT NULL,
  `svc_confidence` float NOT NULL,
  `svc_count` int(11) NOT NULL,
  `svc_acceptance_rate` float DEFAULT '0',
  `svc_updated_at` datetime NOT NULL,
  PRIMARY KEY (`svc_id`),
  UNIQUE KEY `unique_metric_pair` (`svc_metric_id`,`svc_variable_a`,`svc_variable_b`),
  KEY `idx_metric` (`svc_metric_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `symbology`
--

DROP TABLE IF EXISTS `symbology`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `symbology` (
  `vsy_id` int(11) NOT NULL,
  `vsy_cut_mode` varchar(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Modo de generar las categorías. J: Jenqs. T: Ntiles. M: Manual. S: Simple. V: basado en una variable (columna)',
  `vsy_cut_column_id` int(11) DEFAULT NULL COMMENT 'Columna a utilizar para definir la segmentación de la variable',
  `vsy_sequence_column_id` int(11) DEFAULT NULL COMMENT 'Columna que define el orden de la secuencia',
  `vsy_categories` int(11) NOT NULL DEFAULT '4' COMMENT 'Cantidad de categorías a generar.',
  `vsy_null_category` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Define si se muestra una categoría para valores de nulos ',
  `vsy_round` double NOT NULL DEFAULT '5' COMMENT 'Indica el redondeo a utilizar al generar las cateogrías. Se indica como número por el cual calcular el módulo a restar para el redondeo (ej. 5 > redondeo = n - n % 5).',
  `vsy_palette_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Modo de generación automática de colores. Valores posibles: ''P'': Paleta. ''G'': Gradiente.',
  `vsy_color_from` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_color_to` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vsy_rainbow` int(11) NOT NULL DEFAULT '1' COMMENT 'Set de colores de la que se alimenta la generación automática de colores para esta paleta.',
  `vsy_rainbow_reverse` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_custom_colors` varchar(60000) CHARACTER SET ascii DEFAULT NULL COMMENT 'Colores definidos como override paleta o background',
  `vsy_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo',
  `vsy_gradient_opacity` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado',
  `vsy_pattern` int(11) NOT NULL DEFAULT '0' COMMENT 'Valores posibles: 0 Lleno; 1 Vacío; 2 a 6 cañerías; 7 diagonal; 8 horizonal; 9 vertical; 10 antidiagonal; 11 puntos; 12 puntos vacíos',
  `vsy_show_values` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_labels` tinyint(1) NOT NULL DEFAULT '0',
  `vsy_show_totals` tinyint(1) NOT NULL DEFAULT '1',
  `vsy_show_empty_categories` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si en el panel de resumen de la capa en el mapa deben ocultarse las categorías sin valores',
  `vsy_is_sequence` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si el indicador debe mostrar secuencialmente.',
  PRIMARY KEY (`vsy_id`),
  KEY `fk_sym_sequence_idx` (`vsy_sequence_column_id`),
  CONSTRAINT `fk_sym_sequence` FOREIGN KEY (`vsy_sequence_column_id`) REFERENCES `dataset_column` (`dco_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `usr_id` int(11) NOT NULL AUTO_INCREMENT,
  `usr_email` varchar(100) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Dirección de correo con la que se identifica el usuario.',
  `usr_email_new` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `usr_firstname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Nombre completo de la persona.',
  `usr_lastname` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `usr_facebook_oauth_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Identificación de ingreso integrado a Facebook',
  `usr_google_oauth_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indentificación de ingreso integrado a Google',
  `usr_password` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Contraseña.',
  `usr_create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del usuario.',
  `usr_privileges` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nivel de acceso del usuario (A=Administrador, L=Lector,E=Editor de capas, P=Usuario público)',
  `usr_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `usr_is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el usuario ha sido activado.',
  PRIMARY KEY (`usr_id`),
  UNIQUE KEY `idx_email` (`usr_email`)
) ENGINE=InnoDB AUTO_INCREMENT=3532 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:28
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Dumping data for table `user`
--
-- WHERE:  1 LIMIT 3051 OFFSET 0

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin@poblaciones.org',NULL,'admin','admin',NULL,'114196864868269139395','$2y$10$Ze3TZqq4uSkb2qaXWrsYQO.nw9bNEs7.gSAEbK2AwT.Fx9lBm3SRG','2017-07-12 16:19:02','A',0,1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `user_key`
--

DROP TABLE IF EXISTS `user_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_key` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `key_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 del key en texto plano (hex)',
  `key_user_id` int(11) NOT NULL COMMENT 'Usuario',
  `key_description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción legible del uso del key',
  `key_active` tinyint(1) NOT NULL DEFAULT '1',
  `key_created_at` datetime NOT NULL,
  `key_last_used` datetime DEFAULT NULL,
  PRIMARY KEY (`key_id`),
  UNIQUE KEY `uk_key_hash` (`key_hash`),
  KEY `fk_user_key_idx` (`key_user_id`),
  CONSTRAINT `fk_user_key` FOREIGN KEY (`key_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `user_link`
--

DROP TABLE IF EXISTS `user_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_link` (
  `lnk_id` int(11) NOT NULL AUTO_INCREMENT,
  `lnk_user_id` int(11) NOT NULL,
  `lnk_type` varchar(1) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_token` int(11) NOT NULL,
  `lnk_to` varchar(512) COLLATE utf8_unicode_ci NOT NULL,
  `lnk_message` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lnk_time` datetime NOT NULL,
  PRIMARY KEY (`lnk_id`),
  KEY `fk_user_user_link` (`lnk_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3028 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `user_session`
--

DROP TABLE IF EXISTS `user_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_session` (
  `ses_id` int(11) NOT NULL AUTO_INCREMENT,
  `ses_user_id` int(11) NOT NULL,
  `ses_token` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `ses_create` datetime NOT NULL,
  `ses_last_login` datetime NOT NULL,
  `ses_last_ip` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `ses_user_agent` varchar(512) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`ses_id`),
  UNIQUE KEY `ix_session_unique` (`ses_user_id`,`ses_token`)
) ENGINE=InnoDB AUTO_INCREMENT=5522 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `user_setting`
--

DROP TABLE IF EXISTS `user_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_setting` (
  `ust_id` int(11) NOT NULL AUTO_INCREMENT,
  `ust_user_id` int(11) NOT NULL COMMENT 'Usuario al que pertenece el valor',
  `ust_key` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `ust_value` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ust_id`),
  UNIQUE KEY `uk_setting` (`ust_user_id`,`ust_key`),
  CONSTRAINT `setting_user` FOREIGN KEY (`ust_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4730 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `variable`
--

DROP TABLE IF EXISTS `variable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variable` (
  `mvv_id` int(11) NOT NULL,
  `mvv_metric_version_level_id` int(11) NOT NULL,
  `mvv_symbology_id` int(11) NOT NULL COMMENT 'Opciones visuales de la variable',
  `mvv_caption` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `mvv_order` int(11) NOT NULL,
  `mvv_is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica qué variable es la predeterminada en un indicador con varias variables.',
  `mvv_default_measure` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Indica la métrica que debe mostrarse al incorporarse la variable. Valores: N: Cantidad. K: Área en km2. H: Área en hectáreas. D: Cantidad / área en km2. I: Cantidad normalizada.',
  `mvv_data` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Columna especial para mvv_data_column_id. Los valores son: P=Población. H=Hogares. A=Adultos. C=Menores de 18 años. M=AreaM2. N=Conteo. O=Otro (columna del dataset)',
  `mvv_data_column_id` int(11) DEFAULT NULL COMMENT 'Referencia a la columna del dataset cuando mvv_data es Other.',
  `mvv_data_column_is_categorical` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si la columna indicada tiene etiquetas correspondientes a categorías.',
  `mvv_normalization` char(1) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Indica el modo en que se normaliza el valor en data_column. Valores: nulo=sin normalización. P=Population: se utiliza el valor de gei_population del geographyItem. H=Households: se utiliza el valor de gei_households del geographyItem. C=Children: se utiliza el valor de gei_children del geographyItem. A=Adults: se utiliza el valor de gei_population-gei_children del geographyItem. O=Other: se utiliza el valor de la columna indicada en mvr_normalization_column_id.',
  `mvv_normalization_scale` float NOT NULL DEFAULT '100' COMMENT '100 para porcentajes. 1 unidad. 10000 para n / 10 mil. 100000 para n / 100 mil',
  `mvv_normalization_column_id` int(11) DEFAULT NULL COMMENT 'Columna por la cual normalizar el dato',
  `mvv_filter_value` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Expresión a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un número, un ''texto'', o una [columna]',
  `mvv_legend` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos',
  `mvv_perimeter` float DEFAULT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).',
  PRIMARY KEY (`mvv_id`),
  KEY `fk_layer_version_variable_dataset_column1_idx` (`mvv_data_column_id`),
  KEY `fk_layer_version_variable_layer_version1_idx1` (`mvv_metric_version_level_id`),
  KEY `fk_variable_norm_col` (`mvv_normalization_column_id`),
  KEY `fk_variable_symbology` (`mvv_symbology_id`),
  CONSTRAINT `fk_metric_version_data_col` FOREIGN KEY (`mvv_data_column_id`) REFERENCES `dataset_column` (`dco_id`),
  CONSTRAINT `fk_variable_norm_col` FOREIGN KEY (`mvv_normalization_column_id`) REFERENCES `dataset_column` (`dco_id`),
  CONSTRAINT `fk_variable_symbology` FOREIGN KEY (`mvv_symbology_id`) REFERENCES `symbology` (`vsy_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_version_level_variable2` FOREIGN KEY (`mvv_metric_version_level_id`) REFERENCES `metric_version_level` (`mvl_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:29
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `variable_value_label`
--

DROP TABLE IF EXISTS `variable_value_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variable_value_label` (
  `vvl_id` int(11) NOT NULL,
  `vvl_variable_id` int(11) NOT NULL,
  `vvl_caption` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `vvl_visible` tinyint(1) NOT NULL DEFAULT '1',
  `vvl_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor seleccionado para los marcadores con símbolo en categoría.',
  `vvl_value` double DEFAULT NULL,
  `vvl_fill_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_line_color` char(6) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vvl_order` int(11) DEFAULT '0',
  PRIMARY KEY (`vvl_id`),
  UNIQUE KEY `variableValorPub` (`vvl_variable_id`,`vvl_value`),
  CONSTRAINT `fw_variable` FOREIGN KEY (`vvl_variable_id`) REFERENCES `variable` (`mvv_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:30
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `version`
--

DROP TABLE IF EXISTS `version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `version` (
  `ver_id` int(11) NOT NULL AUTO_INCREMENT,
  `ver_name` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Nombre del ítem de versionado.',
  `ver_value` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Número de versión vigente.',
  PRIMARY KEY (`ver_id`),
  UNIQUE KEY `upt_name_UNIQUE` (`ver_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:30
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Dumping data for table `version`
--
-- WHERE:  1 LIMIT 30517 OFFSET 0

LOCK TABLES `version` WRITE;
/*!40000 ALTER TABLE `version` DISABLE KEYS */;
INSERT INTO `version` VALUES (1,'DB','135'),(2,'APP','-'),(3,'CARTO_GEO','1163'),(4,'LOOKUP_VIEW','269'),(5,'CARTOGRAPHY_VIEW','267'),(6,'CARTOGRAPHY_REGION_VIEW','318'),(7,'SHAPE_VIEW','210'),(8,'FAB_METRICS','2311'),(9,'LOOKUP_REGIONS','2562'),(10,'BOUNDARY_VIEW','75');
/*!40000 ALTER TABLE `version` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:30
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `work`
--

DROP TABLE IF EXISTS `work`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work` (
  `wrk_id` int(11) NOT NULL,
  `wrk_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'P' COMMENT 'Tipo de obra. Valores posibles: P: datos públicos. R: resultados de investigación. M: mapeo comunitario',
  `wrk_image_id` int(11) DEFAULT NULL COMMENT 'Imagen a utilizar como fondo o escudo de la obra.',
  `wrk_image_type` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Tipo de imagen contenida en image_id. Valores poibles: N: Ninguna, E: Escudo, F: Fondo.',
  `wrk_metadata_id` int(11) NOT NULL,
  `wrk_comments` varchar(4096) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Comentarios internos',
  `wrk_is_private` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Define si luego de publicarse cualquier usuario puede ver la cartografía o sólo usuarios con permisos asignados',
  `wrk_is_indexed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Permite a editores indicar si la cartografía debe aparecer en el buscador',
  `wrk_segmented_crawling` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se segmenta al indexarse para crawlers',
  `wrk_access_link` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ruta creada para el acceso vía link',
  `wrk_startup_id` int(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía',
  `wrk_published_by` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Usuario (direccion de email) que publicó la obra',
  `wrk_shard` tinyint(4) NOT NULL DEFAULT '1',
  `wrk_update` datetime DEFAULT NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.',
  `wrk_update_user_id` int(11) DEFAULT NULL COMMENT 'Indica el usuario que realizó la útlima modificación',
  PRIMARY KEY (`wrk_id`),
  UNIQUE KEY `uk_work_startup_id` (`wrk_startup_id`),
  KEY `fk_work_file1_idx` (`wrk_image_id`),
  KEY `wk_type` (`wrk_type`),
  KEY `wrk_type` (`wrk_type`),
  KEY `work_ibfk_1` (`wrk_metadata_id`),
  KEY `fk_work_work_startup` (`wrk_startup_id`),
  KEY `fk_work_updated_user_idx` (`wrk_update_user_id`),
  CONSTRAINT `fk_metadata_work` FOREIGN KEY (`wrk_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_start_work` FOREIGN KEY (`wrk_startup_id`) REFERENCES `work_startup` (`wst_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_work_file` FOREIGN KEY (`wrk_image_id`) REFERENCES `file` (`fil_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_work_updated_user` FOREIGN KEY (`wrk_update_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:30
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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
-- Table structure for table `work_dataset_draft`
--

DROP TABLE IF EXISTS `work_dataset_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_dataset_draft` (
  `wdd_id` int(11) NOT NULL AUTO_INCREMENT,
  `wdd_table` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `wdd_created` datetime NOT NULL,
  PRIMARY KEY (`wdd_id`),
  KEY `wdd_table` (`wdd_table`)
) ENGINE=InnoDB AUTO_INCREMENT=11542 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 17:26:30
-- MySQL dump 10.13  Distrib 5.7.42, for Win64 (x86_64)
--
-- Host: localhost    Database: poblaciones_arg
-- ------------------------------------------------------
-- Server version	5.7.42-log

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

-- Dump completed on 2026-06-02 17:26:32