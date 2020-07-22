ALTER TABLE `draft_institution` ADD `ins_color` char(6) NULL COMMENT 'Color primario institucional' AFTER `ins_watermark_id`;

ALTER TABLE `institution` ADD `ins_color` char(6) NULL COMMENT 'Color primario institucional' AFTER `ins_watermark_id`;

UPDATE version SET ver_value = '040' WHERE ver_name = 'DB';
