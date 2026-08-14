-- ALTER TABLE `clipping_region_item_geography_item`
-- ADD UNIQUE INDEX `fw_unique_clipping_region_geography_items`
--  (`cgi_clipping_region_geography_id` ASC, `cgi_geography_item_id` ASC);
-- ;

ALTER TABLE `clipping_region_item_geography_item`
ADD CONSTRAINT `fk_cgi_clipping_region_item`
  FOREIGN KEY (`cgi_clipping_region_item_id`)
  REFERENCES `clipping_region_item` (`cli_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `clipping_region_item_geography_item`
ADD CONSTRAINT `fk_cgi_geography_item_id`
  FOREIGN KEY (`cgi_geography_item_id`)
  REFERENCES `geography_item` (`gei_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `clipping_region_item_geography_item`
ADD CONSTRAINT `fk_cgi_clipping_region_geography_id`
  FOREIGN KEY (`cgi_clipping_region_geography_id`)
  REFERENCES `clipping_region_geography` (`crg_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;



UPDATE version SET ver_value = '146' WHERE ver_name = 'DB';