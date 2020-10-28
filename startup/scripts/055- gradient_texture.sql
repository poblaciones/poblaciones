
ALTER TABLE `dataset`
ADD COLUMN `dat_texture_id` INT(11) NULL COMMENT 'Referencia al gradiente para generar rellenos' AFTER `dat_work_id`,
ADD INDEX `ft_dataset_gradient_idx` (`dat_texture_id` ASC);
;
ALTER TABLE `dataset`
ADD CONSTRAINT `ft_dataset_gradient`
  FOREIGN KEY (`dat_texture_id`)
  REFERENCES `gradient` (`grd_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;


ALTER TABLE `draft_dataset`
ADD COLUMN `dat_texture_id` INT(11) NULL COMMENT 'Referencia al gradiente para generar rellenos' AFTER `dat_work_id`,
ADD INDEX `ft_draftdataset_gradient_idx` (`dat_texture_id` ASC);
;
ALTER TABLE `draft_dataset`
ADD CONSTRAINT `ft_draft_dataset_gradient`
  FOREIGN KEY (`dat_texture_id`)
  REFERENCES `gradient` (`grd_id`)
  ON DELETE NO ACTION
  ON UPDATE RESTRICT;



UPDATE version SET ver_value = '055' WHERE ver_name = 'DB';