ALTER TABLE `draft_variable_value_label` CHANGE `vvl_caption` `vvl_caption` VARCHAR(250) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;

ALTER TABLE `variable_value_label` CHANGE `vvl_caption` `vvl_caption` VARCHAR(250) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;


UPDATE version SET ver_value = '092' WHERE ver_name = 'DB';