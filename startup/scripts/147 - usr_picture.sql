ALTER TABLE `user`
	ADD COLUMN `usr_picture` VARCHAR(255) NULL AFTER `usr_google_oauth_id`;

UPDATE version SET ver_value = '147' WHERE ver_name = 'DB';