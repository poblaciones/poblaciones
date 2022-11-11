ALTER TABLE `draft_metadata`
DROP COLUMN `met_schedule_next_update`,
ADD COLUMN `met_last_online_user_id` INT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.' AFTER `met_publication_date`,
ADD INDEX `fk_draft_publish_user_idx` (`met_last_online_user_id` ASC);
;
ALTER TABLE `draft_metadata`
ADD CONSTRAINT `fk_draft_publish_user`
  FOREIGN KEY (`met_last_online_user_id`)
  REFERENCES `user` (`usr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


ALTER TABLE `metadata`
DROP COLUMN `met_schedule_next_update`,
ADD COLUMN `met_last_online_user_id` INT NULL COMMENT 'Referencia al usuario que hizo la publicación activa.' AFTER `met_publication_date`,
ADD INDEX `fk_publish_user_idx` (`met_last_online_user_id` ASC);
;
ALTER TABLE `metadata`
ADD CONSTRAINT `fk_publish_user`
  FOREIGN KEY (`met_last_online_user_id`)
  REFERENCES `user` (`usr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


ALTER TABLE `draft_work`
ADD COLUMN `wrk_update` DATETIME NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.' AFTER `wrk_unfinished`,
ADD COLUMN `wrk_update_user_id` INT NULL COMMENT 'Indica el usuario que realizó la útlima modificación' AFTER `wrk_update`,
ADD INDEX `fk_draft_work_updated_user_idx` (`wrk_update_user_id` ASC);
;
ALTER TABLE `draft_work`
ADD CONSTRAINT `fk_draft_work_updated_user`
  FOREIGN KEY (`wrk_update_user_id`)
  REFERENCES `user` (`usr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


ALTER TABLE `work`
ADD COLUMN `wrk_update` DATETIME NULL COMMENT 'Registrar cualquier cambio en la cartografía o sus entidades relacionadas.',
ADD COLUMN `wrk_update_user_id` INT NULL COMMENT 'Indica el usuario que realizó la útlima modificación' AFTER `wrk_update`,
ADD INDEX `fk_work_updated_user_idx` (`wrk_update_user_id` ASC);
;
ALTER TABLE `work`
ADD CONSTRAINT `fk_work_updated_user`
  FOREIGN KEY (`wrk_update_user_id`)
  REFERENCES `user` (`usr_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;



DELIMITER $$
CREATE FUNCTION `UserFullNameById`(`id` INT) RETURNS varchar(100)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF id IS NULL THEN
  RETURN null;
END IF;

RETURN (SELECT TRIM(CONCAT(usr_firstname, ' ', usr_lastname)) FROM `user` WHERE usr_id = 1);
END$$
DELIMITER ;


UPDATE version SET ver_value = '076' WHERE ver_name = 'DB';