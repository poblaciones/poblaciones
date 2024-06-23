
ALTER TABLE `draft_work`
ADD COLUMN `wrk_is_deleted` TINYINT(1) NOT NULL DEFAULT '0' AFTER `wrk_is_indexed`,
ADD COLUMN `wrk_is_example` TINYINT(1) NOT NULL DEFAULT '0' AFTER `wrk_is_deleted`;

ALTER TABLE `user_setting`
CHANGE COLUMN `ust_key` `ust_key` VARCHAR(50) NOT NULL ,
CHANGE COLUMN `ust_value` `ust_value` VARCHAR(100) NULL DEFAULT NULL ;

ALTER TABLE `draft_work`
DROP INDEX `draft_wk_type` ,
ADD INDEX `draft_wk_type` (`wrk_type` ASC, `wrk_is_example` ASC);
;


UPDATE version SET ver_value = '106' WHERE ver_name = 'DB';