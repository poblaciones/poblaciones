ALTER TABLE `geography` ADD `geo_field_code_size` INT NULL COMMENT 'Tamaño de los valores de los códigos' AFTER `geo_field_code_name`;

update geography SET geo_field_code_size = 2 where geo_field_code_name = 'IDPROV';
update geography SET geo_field_code_size = 5 where geo_field_code_name = 'IDDPTO';
update geography SET geo_field_code_size = 9 where geo_field_code_name = 'REDCODE';

ALTER TABLE `geography` CHANGE `geo_field_code_size` `geo_field_code_size` INT(11) NOT NULL COMMENT 'Tamaño de los valores de los códigos';

UPDATE version SET ver_value = '004' WHERE ver_name = 'DB';