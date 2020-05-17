ALTER TABLE `metadata` ADD `met_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del emento' AFTER `met_contact_id`;

ALTER TABLE `metric_version_level` ADD `mvl_extents` GEOMETRY NULL COMMENT 'Guarda las dimensiones del total de datos del indicador en ese nivel' AFTER `mvl_dataset_id`;


ALTER TABLE `draft_work` DROP FOREIGN KEY `fk_draft_work_region`;

ALTER TABLE `work` DROP FOREIGN KEY `fk_work_region`;

ALTER TABLE `draft_work` DROP `wrk_start_clipping_region_selected`;
ALTER TABLE `draft_work` DROP `wrk_start_clipping_region_id`;
ALTER TABLE `draft_work` DROP `wrk_start_center`;
ALTER TABLE `draft_work` DROP `wrk_start_zoom`;

ALTER TABLE `work` DROP `wrk_start_clipping_region_selected`;
ALTER TABLE `work` DROP `wrk_start_clipping_region_id`;
ALTER TABLE `work` DROP `wrk_start_center`;
ALTER TABLE `work` DROP `wrk_start_zoom`;

CREATE TABLE `draft_work_startup` ( `wst_id` INT NOT NULL AUTO_INCREMENT , `wst_work_id` INT NOT NULL COMMENT 'Cartografía de la que indica las opciones de inicio' , `wst_type` CHAR(1) NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=dinámico, R=región, L=ubicación' , `wst_clipping_region_item_id` INT NULL COMMENT 'Región de referencia' , `wst_clipping_region_item_selected` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la región debe iniciarse como selección activa' ,`wst_center` POINT NULL COMMENT 'Ubicación del dentro de la vista' ,`wst_zoom` TINYINT(1) NULL COMMENT 'Nivel de acercamiento para la vista' , PRIMARY KEY (`wst_id`)) ENGINE = InnoDB;


CREATE TABLE `work_startup` ( `wst_id` INT NOT NULL AUTO_INCREMENT , `wst_work_id` INT NOT NULL COMMENT 'Cartografía de la que indica las opciones de inicio' , `wst_type` CHAR(1) NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=dinámico, R=región, L=ubicación' , `wst_clipping_region_item_id` INT NULL COMMENT 'Región de referencia' , `wst_clipping_region_item_selected` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la región debe iniciarse como selección activa' ,`wst_center` POINT NULL COMMENT 'Ubicación del dentro de la vista' ,`wst_zoom` TINYINT(1) NULL COMMENT 'Nivel de acercamiento para la vista' , PRIMARY KEY (`wst_id`)) ENGINE = InnoDB;


ALTER TABLE `draft_work_startup` ADD CONSTRAINT `fk_draft_work_startup_region`
FOREIGN KEY (`wst_clipping_region_item_id`)
REFERENCES `clipping_region_item`(`cli_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;


ALTER TABLE `work_startup` ADD CONSTRAINT `fk_work_startup_region`
FOREIGN KEY (`wst_clipping_region_item_id`)
REFERENCES `clipping_region_item`(`cli_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;

insert into draft_work_startup (wst_work_id)
select wrk_id from draft_work;

insert into work_startup (wst_work_id)
select wrk_id from work;

ALTER TABLE `draft_work` ADD `wrk_startup_id` INT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía' AFTER `wrk_last_access_link`;
ALTER TABLE `work` ADD `wrk_startup_id` INT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía' AFTER `wrk_access_link`;

UPDATE draft_work SET wrk_startup_id = (SELECT wst_id FROM draft_work_startup WHERE wst_work_id = wrk_id);
UPDATE work SET wrk_startup_id = (SELECT wst_id FROM work_startup WHERE wst_work_id = wrk_id);

ALTER TABLE `draft_work` CHANGE `wrk_startup_id` `wrk_startup_id` INT(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía';
ALTER TABLE `work` CHANGE `wrk_startup_id` `wrk_startup_id` INT(11) NOT NULL COMMENT 'Referencia a los atributos de inicio del visor para la cartografía';



ALTER TABLE `draft_work` ADD CONSTRAINT `fk_draft_work_work_startup`
FOREIGN KEY (`wrk_startup_id`)
REFERENCES `draft_work_startup`(`wst_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `work` ADD CONSTRAINT `fk_work_work_startup`
FOREIGN KEY (`wrk_startup_id`)
REFERENCES `work_startup`(`wst_id`)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `draft_work_startup` DROP wst_work_id;
ALTER TABLE `work_startup` DROP wst_work_id;

ALTER TABLE `snapshot_lookup` ADD UNIQUE `ix_clipping_regionItem` (`clv_clipping_region_item_id`);

-- Calcula los extents de lo preexistente (si tarda demasiado, poner rangos para dat_work_id)
update metric_version_level
JOIN dataset ON dat_id = mvl_dataset_id
set mvl_extents =
 (SELECT ST_Envelope(LineString(
POINT(MIN(ST_X(ST_POINTN(ST_ExteriorRing(miv_envelope), 1))),
MIN(ST_Y(ST_POINTN(ST_ExteriorRing(miv_envelope), 1)))),
POINT(MAX(ST_X(ST_POINTN(ST_ExteriorRing(miv_envelope), 3))),
MAX(ST_Y(ST_POINTN(ST_ExteriorRing(miv_envelope), 3))))))
FROM  snapshot_metric_version_item_variable
WHERE miv_metric_version_id = mvl_metric_version_id AND miv_geography_id = dat_geography_id)
WHERE mvl_extents is null;

update metadata
		JOIN work ON wrk_metadata_id = met_id
		JOIN dataset ON wrk_id = dat_work_id
		set met_extents =
		 (SELECT
			ST_Envelope(LineString(
			POINT(MIN(ST_X(ST_POINTN(ST_ExteriorRing(mvl_extents), 1))),
			MIN(ST_Y(ST_POINTN(ST_ExteriorRing(mvl_extents), 1)))),
			POINT(MAX(ST_X(ST_POINTN(ST_ExteriorRing(mvl_extents), 3))),
			MAX(ST_Y(ST_POINTN(ST_ExteriorRing(mvl_extents), 3))))))
			FROM  metric_version_level
			WHERE dat_id = mvl_dataset_id);

UPDATE version SET ver_value = '014' WHERE ver_name = 'DB';

