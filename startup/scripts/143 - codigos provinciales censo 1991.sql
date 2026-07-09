ALTER TABLE `geography_item`
ADD COLUMN  `gei_new_code` VARCHAR(100) NULL DEFAULT NULL ;

UPDATE geography_item gei
JOIN geography geo ON geo.geo_id = gei.gei_geography_id
SET gei.gei_new_code = CASE SUBSTR(gei.gei_code, 1, 2)
    WHEN '03' THEN CONCAT('02', SUBSTR(gei.gei_code, 3))
    WHEN '02' THEN CONCAT('06', SUBSTR(gei.gei_code, 3))
    WHEN '11' THEN CONCAT('10', SUBSTR(gei.gei_code, 3))
    WHEN '24' THEN CONCAT('14', SUBSTR(gei.gei_code, 3))
    WHEN '23' THEN CONCAT('18', SUBSTR(gei.gei_code, 3))
    WHEN '08' THEN CONCAT('22', SUBSTR(gei.gei_code, 3))
    WHEN '21' THEN CONCAT('26', SUBSTR(gei.gei_code, 3))
    WHEN '05' THEN CONCAT('30', SUBSTR(gei.gei_code, 3))
    WHEN '16' THEN CONCAT('34', SUBSTR(gei.gei_code, 3))
    WHEN '25' THEN CONCAT('38', SUBSTR(gei.gei_code, 3))
    WHEN '12' THEN CONCAT('42', SUBSTR(gei.gei_code, 3))
    WHEN '06' THEN CONCAT('46', SUBSTR(gei.gei_code, 3))
    WHEN '13' THEN CONCAT('50', SUBSTR(gei.gei_code, 3))
    WHEN '14' THEN CONCAT('54', SUBSTR(gei.gei_code, 3))
    WHEN '17' THEN CONCAT('58', SUBSTR(gei.gei_code, 3))
    WHEN '18' THEN CONCAT('62', SUBSTR(gei.gei_code, 3))
    WHEN '01' THEN CONCAT('66', SUBSTR(gei.gei_code, 3))
    WHEN '10' THEN CONCAT('70', SUBSTR(gei.gei_code, 3))
    WHEN '04' THEN CONCAT('74', SUBSTR(gei.gei_code, 3))
    WHEN '26' THEN CONCAT('78', SUBSTR(gei.gei_code, 3))
    WHEN '19' THEN CONCAT('82', SUBSTR(gei.gei_code, 3))
    WHEN '07' THEN CONCAT('86', SUBSTR(gei.gei_code, 3))
    WHEN '20' THEN CONCAT('90', SUBSTR(gei.gei_code, 3))
    WHEN '22' THEN CONCAT('94', SUBSTR(gei.gei_code, 3))
    ELSE gei.gei_new_code
END
WHERE geo.geo_revision = 1991;

ALTER TABLE `geography_item`
DROP INDEX `carto_codes_2` ;
;
ALTER TABLE `geography_item`
DROP INDEX `carto_codes_numbered_2` ;
;

UPDATE geography_item gei
JOIN geography geo ON geo.geo_id = gei.gei_geography_id
SET gei.gei_code = gei_new_code, gei_code_as_number = CONVERT(gei_new_code, UNSIGNED)
WHERE geo.geo_revision = 1991;

ALTER TABLE `geography_item`
ADD UNIQUE INDEX `carto_codes_2` (`gei_geography_id` ASC, `gei_code` ASC),
ADD UNIQUE INDEX `carto_codes_numbered_2` (`gei_geography_id` ASC, `gei_code_as_number` ASC);
;
ALTER TABLE `geography_item`
DROP COLUMN `gei_new_code`;

ALTER TABLE `geography_item`
DROP COLUMN `rura`;

UPDATE version SET ver_value = '143' WHERE ver_name = 'DB';