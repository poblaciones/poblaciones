CREATE TABLE `geography_tuple` (
  `gtu_id` INT NOT NULL AUTO_INCREMENT,
  `gtu_geography_id` INT NOT NULL,
  `gtu_previous_geography_id` INT NOT NULL,
  `gtu_previous_lower_geography_id` INT NULL,
  PRIMARY KEY (`gtu_id`),
  INDEX `fw_prev_idx` (`gtu_previous_geography_id` ASC),
  INDEX `fw_current_idx` (`gtu_geography_id` ASC),
  INDEX `fw_current_lower_idx` (`gtu_previous_lower_geography_id` ASC),
  CONSTRAINT `fw_prev`
    FOREIGN KEY (`gtu_previous_geography_id`)
    REFERENCES `geography` (`geo_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fw_current`
    FOREIGN KEY (`gtu_geography_id`)
    REFERENCES `geography` (`geo_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fw_current_lower`
    FOREIGN KEY (`gtu_previous_lower_geography_id`)
    REFERENCES `geography` (`geo_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `geography_tuple`
ADD UNIQUE INDEX `fw_tuple_unique` (`gtu_geography_id` ASC, `gtu_previous_geography_id` ASC);
;

CREATE TABLE `geography_tuple_item` (
  `gti_id` INT NOT NULL AUTO_INCREMENT,
  `gti_geography_tuple_id` INT NOT NULL,
  `gti_geography_item_id` INT NOT NULL,
  `gti_geography_previous_item_id` INT NOT NULL,
  PRIMARY KEY (`gti_id`),
  INDEX `gti_tuple_idx` (`gti_geography_tuple_id` ASC),
  INDEX `gti_geo_item_idx` (`gti_geography_item_id` ASC),
  INDEX `gti_geo_previous_idx` (`gti_geography_previous_item_id` ASC),
  INDEX `gti_pair_index` (`gti_geography_tuple_id` ASC, `gti_geography_item_id` ASC),
  CONSTRAINT `gti_tuple`
    FOREIGN KEY (`gti_geography_tuple_id`)
    REFERENCES `geography_tuple` (`gtu_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `gti_geo_item`
    FOREIGN KEY (`gti_geography_item_id`)
    REFERENCES `geography_item` (`gei_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `gti_geo_previous`
    FOREIGN KEY (`gti_geography_previous_item_id`)
    REFERENCES `gradient_item` (`gri_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

-- La llena por nombre de serie y de contenido
insert into geography_tuple (gtu_geography_id,
gtu_previous_geography_id)
SELECT g1.geo_id, g2.geo_id FROM geography g1
join geography g2
on g1.geo_caption = g2.geo_caption
and g1.geo_revision > g2.geo_revision
and (select count(*) from geography_tuple gt where gt.gtu_geography_id = g1.geo_id
and gt.gtu_previous_geography_id = g2.geo_id) = 0
order by g1.geo_revision desc, g1.geo_caption, g2.geo_revision desc;

update geography_tuple q
join geography g2 on g2.geo_id = q.gtu_previous_geography_id
join geography g3 on g3.geo_caption = 'Radios'
and g2.geo_caption = 'Departamentos'
and g2.geo_revision = g3.geo_revision
set q.gtu_previous_lower_geography_id = g3.geo_id;


ALTER TABLE `geography_tuple_item`
ADD COLUMN `gti_is_partial` TINYINT(1) NOT NULL DEFAULT 0 AFTER `gti_geography_previous_item_id`;

ALTER TABLE `geography_tuple_item`
DROP FOREIGN KEY `gti_geo_previous`;
ALTER TABLE `geography_tuple_item`
ADD INDEX `gti_geo_previous_idx` (`gti_geography_previous_item_id` ASC),
DROP INDEX `gti_geo_previous_idx` ;
;
ALTER TABLE `geography_tuple_item`
ADD CONSTRAINT `gti_geo_previous`
  FOREIGN KEY (`gti_geography_previous_item_id`)
  REFERENCES `geography_item` (`gei_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `geography_tuple_item`
ADD COLUMN `gti_geography_previous_id` INT NOT NULL AFTER `gti_geography_item_id`,
DROP INDEX `gti_pair_index` ,
ADD INDEX `gti_pair_index_2` (`gti_geography_previous_id` ASC, `gti_geography_item_id` ASC),
ADD INDEX `gti_geo_id_prev_idx` (`gti_geography_previous_id` ASC);
;
ALTER TABLE `geography_tuple_item`
ADD CONSTRAINT `gti_geo_id_prev`
  FOREIGN KEY (`gti_geography_previous_id`)
  REFERENCES `geography` (`geo_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


UPDATE version SET ver_value = '102' WHERE ver_name = 'DB';