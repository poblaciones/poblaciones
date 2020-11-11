CREATE TABLE `draft_work_icon` (
  `wic_id` INT NOT NULL AUTO_INCREMENT,
  `wic_work_id` INT NOT NULL COMMENT 'Obra.',
  `wic_file_id` INT NOT NULL COMMENT 'Archivo.',
  PRIMARY KEY (`wic_id`),
  INDEX `fw_draft_work_ico_idx` (`wic_work_id` ASC),
  INDEX `fw_draft_ico_file_idx` (`wic_file_id` ASC),
  CONSTRAINT `fw_draft_work_ico`
    FOREIGN KEY (`wic_work_id`)
    REFERENCES `draft_work` (`wrk_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT,
  CONSTRAINT `fw_draft_ico_file`
    FOREIGN KEY (`wic_file_id`)
    REFERENCES `draft_file` (`fil_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT);

CREATE TABLE `work_icon` (
  `wic_id` INT NOT NULL AUTO_INCREMENT,
  `wic_work_id` INT NOT NULL COMMENT 'Obra.',
  `wic_file_id` INT NOT NULL COMMENT 'Archivo.',
  PRIMARY KEY (`wic_id`),
  INDEX `fw_work_ico_idx` (`wic_work_id` ASC),
  INDEX `fw_ico_file_idx` (`wic_file_id` ASC),
  CONSTRAINT `fw_work_ico`
    FOREIGN KEY (`wic_work_id`)
    REFERENCES `work` (`wrk_id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fw_ico_file`
    FOREIGN KEY (`wic_file_id`)
    REFERENCES `file` (`fil_id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT);

update  draft_dataset_marker  set dmk_symbol = case when left(dmk_symbol,4) = 'fla ' then concat('mp', mid(dmk_symbol, 17,100)) else  replace(dmk_symbol, 'fas ', '') end
where dmk_symbol is not null;

update  dataset_marker  set dmk_symbol = case when left(dmk_symbol,4) = 'fla ' then concat('mp', mid(dmk_symbol, 17,100)) else  replace(dmk_symbol, 'fas ', '') end
where dmk_symbol is not null;

UPDATE version SET ver_value = '058' WHERE ver_name = 'DB';