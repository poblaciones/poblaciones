UPDATE draft_work_startup SET wst_type = 'E' WHERE wst_type = 'D';
UPDATE work_startup SET wst_type = 'E' WHERE wst_type = 'D';

ALTER TABLE `draft_work_startup` CHANGE `wst_type` `wst_type` CHAR(1) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=interactivo, R=región, L=ubicación, E=extensión (predeterminado)';

ALTER TABLE `work_startup` CHANGE `wst_type` `wst_type` CHAR(1) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'D' COMMENT 'Tipo de inicio: D=interactivo, R=región, L=ubicación, E=extensión (predeterminado)';

UPDATE version SET ver_value = '042' WHERE ver_name = 'DB';
