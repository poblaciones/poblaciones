CREATE TABLE `draft_annotation` (
  `ann_id` INT NOT NULL AUTO_INCREMENT,
  `ann_caption` VARCHAR(100) NOT NULL,
  `ann_work_id` INT NOT NULL,
  `ann_guest_access` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Permite los valores: \nA. puede agregar elementos. E. puede editar elementos. R. Puede solamente ver elementos. N. Las anotaciones son privadas.',
  `ann_allowed_types` VARCHAR(10) NOT NULL DEFAULT 'CLMPQ',
  PRIMARY KEY (`ann_id`),
  INDEX `fw_annotation_work_idx` (`ann_work_id` ASC),
  CONSTRAINT `fw_annotation_work`
    FOREIGN KEY (`ann_work_id`)
    REFERENCES `draft_work` (`wrk_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_bin;


CREATE TABLE `draft_annotation_item` (
  `ani_id` INT NOT NULL AUTO_INCREMENT,
  `ani_annotation_id` INT NOT NULL,
  `ani_type` CHAR(1) NOT NULL COMMENT 'Valores posibles. M. Punto. L. Polilínea. P. Polígono. C. Comentario. Q. Pregunta',
  `ani_centroid` POINT NOT NULL,
  `ani_geometry` GEOMETRY NOT NULL,
  `ani_order` INT NOT NULL,
  `ani_caption` VARCHAR(255) NOT NULL,
  `ani_description` TEXT NULL,
  `ani_color` CHAR(6) NULL,
  `ani_image` BLOB NULL,
  `ani_length_m` FLOAT NULL,
  `ani_area_m2` FLOAT NULL,
  `ani_create` DATETIME NOT NULL,
  `ani_user` VARCHAR(100) NOT NULL,
  `ani_update` DATETIME NOT NULL,
  PRIMARY KEY (`ani_id`),
  INDEX `fw_annotation_idx` (`ani_annotation_id` ASC),
  CONSTRAINT `fw_annotation`
    FOREIGN KEY (`ani_annotation_id`)
    REFERENCES `draft_annotation` (`ann_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `draft_annotation_item`
ADD UNIQUE INDEX `ani_order` (`ani_annotation_id` ASC, `ani_order` ASC);

UPDATE version SET ver_value = '121' WHERE ver_name = 'DB';

