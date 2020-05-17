CREATE TABLE `gradient` ( `grd_id` INT NOT NULL AUTO_INCREMENT  COMMENT 'Id', `grd_country_id` INT NOT NULL COMMENT 'País de pertenencia', `grd_caption` VARCHAR(100) NOT NULL COMMENT 'Descripción del gradiente. Ej. AR-2010', `grd_image_type` VARCHAR(20) NOT NULL COMMENT 'Tipo de imágenes. image/jpeg o image/png', `grd_max_zoom_level` INT NOT NULL COMMENT 'Nivel zoom hasta el que dispone de datos', PRIMARY KEY (`grd_id`)) ENGINE = InnoDB COMMENT = 'Cabecera de gradientes para ajustar polígonos';

ALTER TABLE `gradient` ADD CONSTRAINT `fk_gradient_country` FOREIGN KEY (`grd_country_id`) REFERENCES `clipping_region_item`(`cli_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE `gradient_item` ( `gri_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Id' , `gri_gradient_id` INT NOT NULL COMMENT 'Gradiente de pertenencia' , `gri_x` INT NOT NULL COMMENT 'Coordenada X' , `gri_y` INT NOT NULL COMMENT 'Coordenada Y' , `gri_z` INT NOT NULL COMMENT 'Coordenada Z' , `gri_content` LONGBLOB NOT NULL COMMENT 'Contenido' , PRIMARY KEY (`gri_id`)) ENGINE = InnoDB COMMENT = 'Detalle de los rasters por tile';

ALTER TABLE `gradient_item` ADD CONSTRAINT `fk_gradient_item` FOREIGN KEY (`gri_gradient_id`) REFERENCES `gradient`(`grd_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `geography` ADD `geo_gradient_id` INT NULL COMMENT 'Gradiente con el cual suavizar la información' AFTER `geo_metadata_id`;

ALTER TABLE `geography` ADD `geo_gradient_luminance` FLOAT NULL COMMENT 'Intensidad predeterminada del gradiente' AFTER `geo_gradient_id`;


ALTER TABLE `geography` ADD CONSTRAINT `fk_geography_gradient` FOREIGN KEY (`geo_gradient_id`) REFERENCES `gradient`(`grd_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `gradient_item` ADD UNIQUE `gradient_item` (`gri_gradient_id`, `gri_x`, `gri_y`, `gri_z`);

update geography set geo_max_zoom = 9 WHERE geo_caption = 'Departamentos';

update geography set geo_min_zoom = 10 WHERE geo_caption = 'Radios';

UPDATE version SET ver_value = '022' WHERE ver_name = 'DB';