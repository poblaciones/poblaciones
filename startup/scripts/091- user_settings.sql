CREATE TABLE `user_setting` (
  `ust_id` int(11) NOT NULL AUTO_INCREMENT,
  `ust_user_id` int(11) NOT NULL COMMENT 'Usuario al que pertenece el valor',
  `ust_key` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Tag de identificación',
  `ust_value` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Valor plano o en format json',
  PRIMARY KEY (`ust_id`),
  UNIQUE KEY `uk_setting` (`ust_user_id`,`ust_key`),
  CONSTRAINT `setting_user` FOREIGN KEY (`ust_user_id`) REFERENCES `user` (`usr_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

UPDATE version SET ver_value = '091' WHERE ver_name = 'DB';