ALTER TABLE `draft_metadata`
ADD COLUMN `met_methods` TEXT NULL AFTER `met_abstract_long`,
ADD COLUMN `met_references` TEXT NULL AFTER `met_methods`,
CHANGE COLUMN `met_abstract` `met_abstract` VARCHAR(1500) NOT NULL COMMENT 'Resumen' ;

ALTER TABLE `metadata`
ADD COLUMN `met_methods` TEXT NULL AFTER `met_abstract_long`,
ADD COLUMN `met_references` TEXT NULL AFTER `met_methods`,
CHANGE COLUMN `met_abstract` `met_abstract` VARCHAR(1500) NOT NULL COMMENT 'Resumen' ;


UPDATE version SET ver_value = '101' WHERE ver_name = 'DB';