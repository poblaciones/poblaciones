ALTER TABLE `snapshot_geography_item` ADD INDEX `geography` (`giw_geography_id`);

update geography set geo_max_zoom = 22 WHERE geo_caption = 'Radios';

UPDATE version SET ver_value = '026' WHERE ver_name = 'DB';
