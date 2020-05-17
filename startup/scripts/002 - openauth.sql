ALTER TABLE `user` ADD `usr_facebook_oauth_id` VARCHAR(255) NULL COMMENT 'Identificación de ingreso integrado a Facebook' AFTER `usr_lastname`, ADD `usr_google_oauth_id` VARCHAR(255) NULL COMMENT 'Indentificación de ingreso integrado a Google' AFTER `usr_facebook_oauth_id`;

UPDATE version SET ver_value = '002' WHERE ver_name = 'DB';