ALTER TABLE `geography_item` ADD `gei_code_as_number` DECIMAL(12) NULL AFTER `gei_code`;

ALTER TABLE `geography_item` ADD UNIQUE `carto_codes_numbered` (`gei_geography_id`, `gei_code_as_number`);

update `geography_item` set `gei_code_as_number` = convert(gei_code, SIGNED);

UPDATE version SET ver_value = '028' WHERE ver_name = 'DB';
