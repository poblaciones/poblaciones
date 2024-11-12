
ALTER TABLE `geography_tuple_item`
ADD UNIQUE INDEX `gti_geo_item_uk` (`gti_geography_previous_item_id` ASC, `gti_geography_previous_id` ASC, `gti_geography_item_id` ASC, `gti_geography_tuple_id` ASC);


UPDATE version SET ver_value = '113' WHERE ver_name = 'DB';

