-- Parametrización de capas base del mapa.
-- Tipos (bml_type): 'R' raster, 'M' basada en indicador, 'B' basada en delimitación, 'L' etiquetas.
-- Modo de etiquetas (bml_labels_mode): 'L' color claro, 'S' mismo color, 'N' sin etiquetas.

CREATE TABLE `basemap_layer` (
	`bml_id` int(11) NOT NULL AUTO_INCREMENT,
	`bml_type` char(1) NOT NULL,
	`bml_caption` varchar(100) NOT NULL,
	`bml_order` int(11) NOT NULL,
	`bml_group` varchar(100) DEFAULT NULL,
	`bml_separator` tinyint(1) NOT NULL DEFAULT 0,
	`bml_icon` varchar(100) DEFAULT NULL,
	`bml_route_tag` varchar(5) DEFAULT NULL,
	`bml_hide_on_satellite` tinyint(1) NOT NULL DEFAULT 0,
	`bml_metadata_id` int(11) DEFAULT NULL,
	`bml_item_ids` varchar(200) DEFAULT NULL,
	`bml_dynamic_width` tinyint(1) NOT NULL DEFAULT 0,
	`bml_line_width` int(11) DEFAULT NULL,
	`bml_dashed_line` tinyint(1) NOT NULL DEFAULT 0,
	`bml_labels_mode` char(1) DEFAULT NULL,
	`bml_aliases` text DEFAULT NULL,
	`bml_raster_url` varchar(500) DEFAULT NULL,
	`bml_raster_tms` tinyint(1) NOT NULL DEFAULT 0,
	`bml_raster_max_native_zoom` int(11) DEFAULT NULL,
	`bml_raster_max_zoom` int(11) DEFAULT NULL,
	`bml_raster_opacity` int(11) DEFAULT NULL,
	PRIMARY KEY (`bml_id`),
	UNIQUE KEY `bml_route_tag_UNIQUE` (`bml_route_tag`),
	KEY `fk_basemap_layer_metadata` (`bml_metadata_id`),
	CONSTRAINT `fk_basemap_layer_metadata` FOREIGN KEY (`bml_metadata_id`) REFERENCES `metadata` (`met_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `draft_work_basemap_layer` (
	`wbl_id` int(11) NOT NULL AUTO_INCREMENT,
	`wbl_work_id` int(11) NOT NULL,
	`wbl_layer_id` int(11) NOT NULL,
	`wbl_start_active` tinyint(1) NOT NULL,
	PRIMARY KEY (`wbl_id`),
	UNIQUE KEY `draft_work_basemap_layer_UNIQUE` (`wbl_work_id`, `wbl_layer_id`),
	KEY `fk_draft_work_basemap_layer_layer` (`wbl_layer_id`),
	CONSTRAINT `fk_draft_work_basemap_layer_work` FOREIGN KEY (`wbl_work_id`) REFERENCES `draft_work` (`wrk_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_draft_work_basemap_layer_layer` FOREIGN KEY (`wbl_layer_id`) REFERENCES `basemap_layer` (`bml_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `work_basemap_layer` (
	`wbl_id` int(11) NOT NULL AUTO_INCREMENT,
	`wbl_work_id` int(11) NOT NULL,
	`wbl_layer_id` int(11) NOT NULL,
	`wbl_start_active` tinyint(1) NOT NULL,
	PRIMARY KEY (`wbl_id`),
	UNIQUE KEY `work_basemap_layer_UNIQUE` (`wbl_work_id`, `wbl_layer_id`),
	KEY `fk_work_basemap_layer_layer` (`wbl_layer_id`),
	CONSTRAINT `fk_work_basemap_layer_work` FOREIGN KEY (`wbl_work_id`) REFERENCES `work` (`wrk_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_work_basemap_layer_layer` FOREIGN KEY (`wbl_layer_id`) REFERENCES `basemap_layer` (`bml_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Los metadatos de las capas de etiquetas y raster se crean desde el ABM (packs).
-- Semillas: reproducen la configuración que estaba en settings.php y el panel fijo del cliente.
INSERT INTO `basemap_layer`
	(`bml_id`, `bml_type`, `bml_caption`, `bml_order`, `bml_group`, `bml_separator`, `bml_icon`, `bml_route_tag`, `bml_hide_on_satellite`,
	 `bml_item_ids`, `bml_dynamic_width`, `bml_line_width`, `bml_dashed_line`, `bml_labels_mode`, `bml_aliases`,
	 `bml_raster_url`, `bml_raster_tms`, `bml_raster_max_native_zoom`, `bml_raster_max_zoom`, `bml_raster_opacity`) VALUES
	(1, 'L', 'Etiquetas', 1, NULL, 0, NULL, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL),
	(2, 'R', 'Relieve', 2, NULL, 0, NULL, 'e', 1, NULL, 0, NULL, 0, NULL, NULL,
		'https://desa.poblaciones.org:8000/services/frontend/raster/GetGpkgTile?l=elevation&x={x}&y={y}&z={z}&w=4', 1, 12, 16, 50),
	(3, 'M', 'Cursos de agua', 3, 'Hidrografía', 0, 'fas fa-water', 'a', 0, '531701', 1, 3, 0, 'L', '{"Arroyo":"A°"}', NULL, 0, NULL, NULL, NULL),
	(4, 'M', 'Espejos de agua', 4, 'Hidrografía', 1, 'fas fa-water', 'g', 0, '531601', 0, NULL, 0, 'L', NULL, NULL, 0, NULL, NULL, NULL),
	(5, 'M', 'Líneas de tren', 5, 'Transporte', 0, 'fas fa-train', 't', 0, '531801,531201', 1, 5, 1, 'N', NULL, NULL, 0, NULL, NULL, NULL),
	(6, 'M', 'Rutas nacionales', 6, 'Transporte', 0, 'fas fa-road', 'u', 0, '530901', 1, 4, 0, 'S', NULL, NULL, 0, NULL, NULL, NULL),
	(7, 'M', 'Rutas provinciales', 7, 'Transporte', 1, 'fas fa-road', 'p', 0, '531001', 1, 3, 0, 'S', NULL, NULL, 0, NULL, NULL, NULL),
	(8, 'B', 'Provincias', 8, 'Límites políticos', 0, 'fas fa-map', 'j', 0, '1', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL),
	(9, 'B', 'Departamentos', 9, 'Límites administrativos', 0, 'fas fa-chart-bar', 'd', 0, '4', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL),
	(10, 'B', 'Municipios', 10, 'Límites políticos', 0, 'fas fa-landmark', 'm', 0, '2', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL);
-- 'Espejos de agua' compartía el RouteTag 'a' con 'Cursos de agua' en settings.php; como bml_route_tag es único,
-- se le asigna 'g' (las URLs existentes con 'a' siguen activando solo 'Cursos de agua').


UPDATE version SET ver_value = '155' WHERE ver_name = 'DB';