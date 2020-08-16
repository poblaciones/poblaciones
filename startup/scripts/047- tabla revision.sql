CREATE TABLE `review` (
  `rev_id` INT NOT NULL AUTO_INCREMENT,
  `rev_work_id` INT NOT NULL COMMENT 'Cartografía a la que refiere la revisión',
  `rev_submission_time` timestamp NOT NULL COMMENT 'Fecha/hora en la que fue solicitada la revisión',
  `rev_resolution_time` timestamp NULL COMMENT 'Fecha/hora en que fue dada la decisión de la revisión',
  `rev_decision` CHAR(1) NULL COMMENT 'Resultado de la revisión. A: Publicable, C: Cambios solicitados, R: Rechazada' ,
  `rev_reviewer_comments` VARCHAR(2000) NULL COMMENT 'Comentarios de los revisores' ,
  `rev_editor_comments` VARCHAR(2000) NULL COMMENT 'Comentarios del editor' ,
  `rev_extra_comments` VARCHAR(2000) NULL COMMENT 'Comentarios internos del proceso de revisión' ,
  `rev_user_submission_id` INT NULL COMMENT 'Usuario que solicitó la revisión' ,
  `rev_user_submission_email` VARCHAR(100) NULL COMMENT 'Email del usuario que solicitó la revisión (toma un valor solamente si el usuario fue eliminado)' ,
  `rev_user_decision_id` INT NULL COMMENT 'Usuario que registró la decisión' ,
  PRIMARY KEY (`rev_id`),
  INDEX `createdate` (`rev_submission_time` ASC),
  INDEX `fw_rev_work_idx` (`rev_work_id` ASC),
  INDEX `fw_rev_user_submission_idx` (`rev_user_submission_id` ASC),
  INDEX `fw_rev_user_decision_idx` (`rev_user_decision_id` ASC),
  CONSTRAINT `fw_rev_work`
    FOREIGN KEY (`rev_work_id`)
    REFERENCES `draft_work` (`wrk_id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fw_rev_user_submission`
    FOREIGN KEY (`rev_user_submission_id`)
    REFERENCES `user` (`usr_id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fw_rev_user_decision`
    FOREIGN KEY (`rev_user_decision_id`)
    REFERENCES `user` (`usr_id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT);

UPDATE version SET ver_value = '047' WHERE ver_name = 'DB';