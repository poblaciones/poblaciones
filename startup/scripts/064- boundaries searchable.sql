CREATE TABLE `snapshot_boundary` (
  `bow_id` INT NOT NULL,
  `bow_boundary_id` VARCHAR(45) NOT NULL,
  `bow_caption` VARCHAR(100) NOT NULL COMMENT 'Nombre del límite',
  `bow_group` VARCHAR(45) NOT NULL COMMENT 'Grupo del límite',
  PRIMARY KEY (`bow_id`),
  UNIQUE INDEX `bow_boundary_id_UNIQUE` (`bow_boundary_id` ASC),
  FULLTEXT INDEX `bow_full_text` (`bow_caption`, `bow_group`))
ENGINE = MyISAM;

ALTER TABLE `snapshot_boundary`
CHANGE COLUMN `bow_id` `bow_id` INT(11) NOT NULL AUTO_INCREMENT ;

INSERT INTO snapshot_boundary(bow_boundary_id, bow_caption, bow_group)
SELECT bou_id, bou_caption, bgr_caption FROM boundary JOIN boundary_group ON bgr_id = bou_group_id
WHERE bou_visible = 1;

UPDATE version SET ver_value = '064' WHERE ver_name = 'DB';