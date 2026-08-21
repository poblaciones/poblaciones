ALTER TABLE `variable`
  ADD COLUMN `mvv_auto_rounding` TINYINT(1) NOT NULL DEFAULT 1
  AFTER `mvv_is_gap`;

ALTER TABLE `draft_variable`
  ADD COLUMN `mvv_auto_rounding` TINYINT(1) NOT NULL DEFAULT 1
  AFTER `mvv_is_gap`;

UPDATE `variable` SET `mvv_auto_rounding` = 0;
UPDATE `draft_variable` SET `mvv_auto_rounding` = 0;

UPDATE version SET ver_value = '149' WHERE ver_name = 'DB';