CREATE TABLE `draft_onboarding` (
  `onb_id` INT NOT NULL AUTO_INCREMENT,
  `onb_work_id` INT NOT NULL,
  `onb_enabled` BIT NOT NULL,
  `onb_caption` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`onb_id`),
  INDEX `fw_onb_work_idx` (`onb_work_id` ASC),
  CONSTRAINT `fw_onb_work`
    FOREIGN KEY (`onb_work_id`)
    REFERENCES `draft_work` (`wrk_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `draft_onboarding_step` (
  `obs_id` INT NOT NULL AUTO_INCREMENT,
  `obs_onboarding_id` INT NOT NULL,
  `obs_order` TINYINT NOT NULL,
  `obs_enabled` BIT NOT NULL,
  `obs_caption` VARCHAR(600) NULL,
  `obs_image_id` INT NULL,
  `obs_image_alignment` CHAR(1) NOT NULL DEFAULT 'L' COMMENT 'Valores: R. Derecha, L. Izquierda.',
  PRIMARY KEY (`obs_id`),
  INDEX `fw_obs_onboarding_idx` (`obs_onboarding_id` ASC),
  INDEX `fw_obs_file_idx` (`obs_image_id` ASC),
  UNIQUE INDEX `ix_work_order` (`obs_onboarding_id` ASC, `obs_order` ASC),
  CONSTRAINT `fw_obs_work`
    FOREIGN KEY (`obs_onboarding_id`)
    REFERENCES `draft_onboarding` (`onb_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fw_obs_file`
    FOREIGN KEY (`obs_image_id`)
    REFERENCES `draft_file` (`fil_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `draft_onboarding`
ADD UNIQUE INDEX `un_onb_work` (`onb_work_id` ASC);

CREATE TABLE `onboarding` (
  `onb_id` INT NOT NULL,
  `onb_work_id` INT NOT NULL,
  `onb_enabled` BIT NOT NULL,
  `onb_caption` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`onb_id`),
  INDEX `fw_nd_onb_work_idx` (`onb_work_id` ASC),
  CONSTRAINT `fw_dn_onb_work`
    FOREIGN KEY (`onb_work_id`)
    REFERENCES `work` (`wrk_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `onboarding_step` (
  `obs_id` INT NOT NULL,
  `obs_onboarding_id` INT NOT NULL,
  `obs_order` TINYINT NOT NULL,
  `obs_enabled` BIT NOT NULL,
  `obs_caption` VARCHAR(600) NULL,
  `obs_image_id` INT NULL,
  `obs_image_alignment` CHAR(1) NOT NULL DEFAULT 'L' COMMENT 'Valores: R. Derecha, L. Izquierda.',
  PRIMARY KEY (`obs_id`),
  INDEX `fw_obs_onboarding_idx` (`obs_onboarding_id` ASC),
  INDEX `fw_obs_file_idx` (`obs_image_id` ASC),
  UNIQUE INDEX `ix_nd_work_order` (`obs_onboarding_id` ASC, `obs_order` ASC),
  CONSTRAINT `fw_nd_obs_work`
    FOREIGN KEY (`obs_onboarding_id`)
    REFERENCES `onboarding` (`onb_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fw_nd_obs_file`
    FOREIGN KEY (`obs_image_id`)
    REFERENCES `file` (`fil_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `onboarding`
ADD UNIQUE INDEX `un_nd_onb_work` (`onb_work_id` ASC);

ALTER TABLE `onboarding`
DROP FOREIGN KEY `fw_dn_onb_work`;
ALTER TABLE `onboarding`
ADD CONSTRAINT `fw_dn_onb_work`
  FOREIGN KEY (`onb_work_id`)
  REFERENCES `work` (`wrk_id`)
  ON DELETE CASCADE
  ON UPDATE RESTRICT;

ALTER TABLE `onboarding_step`
DROP FOREIGN KEY `fw_nd_obs_file`,
DROP FOREIGN KEY `fw_nd_obs_work`;
ALTER TABLE `onboarding_step`
ADD CONSTRAINT `fw_nd_obs_file`
  FOREIGN KEY (`obs_image_id`)
  REFERENCES `file` (`fil_id`)
  ON DELETE CASCADE
  ON UPDATE RESTRICT,
ADD CONSTRAINT `fw_nd_obs_work`
  FOREIGN KEY (`obs_onboarding_id`)
  REFERENCES `onboarding` (`onb_id`)
  ON DELETE CASCADE
  ON UPDATE RESTRICT;

update draft_onboarding_step set obs_caption = '';
update onboarding_step set obs_caption = '';

ALTER TABLE `draft_onboarding_step`
ADD COLUMN `obs_content` VARCHAR(600) NOT NULL DEFAULT '' AFTER `obs_caption`,
CHANGE COLUMN `obs_caption` `obs_caption` VARCHAR(45) NOT NULL DEFAULT '';

ALTER TABLE `onboarding_step`
ADD COLUMN `obs_content` VARCHAR(600) NOT NULL DEFAULT '' AFTER `obs_caption`,
CHANGE COLUMN `obs_caption` `obs_caption` VARCHAR(45) NOT NULL DEFAULT '';

ALTER TABLE `onboarding`
DROP COLUMN `onb_caption`;

ALTER TABLE `draft_onboarding`
DROP COLUMN `onb_caption`;

UPDATE version SET ver_value = '103' WHERE ver_name = 'DB';