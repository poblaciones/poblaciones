ALTER TABLE `user`
ADD COLUMN `usr_email_new` VARCHAR(100) NULL AFTER `usr_email`;

UPDATE version SET ver_value = '104' WHERE ver_name = 'DB';