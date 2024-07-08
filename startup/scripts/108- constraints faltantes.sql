ALTER TABLE `draft_work`
ADD CONSTRAINT `fk_draft_start`
  FOREIGN KEY (`wrk_startup_id`)
  REFERENCES `draft_work_startup` (`wst_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `work`
ADD CONSTRAINT `fk_work_file`
  FOREIGN KEY (`wrk_image_id`)
  REFERENCES `file` (`fil_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_metadata_work`
  FOREIGN KEY (`wrk_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_start_work`
  FOREIGN KEY (`wrk_startup_id`)
  REFERENCES `work_startup` (`wst_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;



UPDATE version SET ver_value = '108' WHERE ver_name = 'DB';
