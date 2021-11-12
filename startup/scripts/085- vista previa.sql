ALTER TABLE `draft_work`
ADD COLUMN `wrk_preview_file_id` INT NULL COMMENT 'Referencia a la vista previa para la cartografía' AFTER `wrk_comments`;

ALTER TABLE `draft_work`
ADD INDEX `fk_preview_file_jd_idx` (`wrk_preview_file_id` ASC);

ALTER TABLE `draft_work`
ADD CONSTRAINT `fk_preview_file_jd`
  FOREIGN KEY (`wrk_preview_file_id`)
  REFERENCES `draft_file` (`fil_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


UPDATE version SET ver_value = '085' WHERE ver_name = 'DB';