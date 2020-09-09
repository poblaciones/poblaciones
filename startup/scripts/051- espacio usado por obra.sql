CREATE TABLE `work_space_usage` (
  `wdu_id` VARCHAR(45) NOT NULL,
`wdu_work_id` INT NOT NULL COMMENT 'Obra referida',
`wdu_draft_attachment_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en adjuntos de metadatos',
 `wdu_draft_data_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en tablas de datasets',
`wdu_draft_index_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en índices de datasets',
`wdu_attachment_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en adjuntos de metadatos publicados',
 `wdu_data_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en tablas de datasets publicados',
 `wdu_index_bytes` BIGINT NOT NULL COMMENT 'Cantidad de espacio en índices de datasets publicados',
`wdu_update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
PRIMARY KEY (`wdu_id`),
 INDEX `wskpace_work_idx` (`wdu_work_id` ASC),
  CONSTRAINT `wskpace_work`
    FOREIGN KEY (`wdu_work_id`)
 REFERENCES `draft_work` (`wrk_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `work_space_usage`
CHANGE COLUMN `wdu_id` `wdu_id` INT(11) NOT NULL AUTO_INCREMENT ;

UPDATE version SET ver_value = '051' WHERE ver_name = 'DB';