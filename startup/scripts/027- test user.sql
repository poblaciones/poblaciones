INSERT INTO `user` (`usr_email`, `usr_firstname`, `usr_lastname`, `usr_facebook_oauth_id`, `usr_google_oauth_id`, `usr_password`, `usr_create_time`, `usr_privileges`, `usr_deleted`, `usr_is_active`) VALUES ('test', 'Test', 'User', NULL, NULL, '$NO_INTERACTIVE', '2020-25-01 11:00:00', 'P', '0', '1');

UPDATE version SET ver_value = '027' WHERE ver_name = 'DB';
