ALTER TABLE `geography_tuple_item` ADD UNIQUE INDEX `gti_geo_unix` (`gti_geography_tuple_id` ASC, `gti_geography_item_id` ASC);

UPDATE version SET ver_value = '116' WHERE ver_name = 'DB';

