CREATE TABLE `statistic_embedding` (
  `emb_id` INT NOT NULL AUTO_INCREMENT,
  `emb_month` CHAR(7) NOT NULL,
  `emb_host_url` VARCHAR(255) NOT NULL,
  `emb_map_url` VARCHAR(255) NOT NULL,
  `emb_hits` INT(11) NOT NULL,
  PRIMARY KEY (`emb_id`),
  UNIQUE INDEX `ix_sta` (`emb_month` ASC, `emb_host_url` ASC, `emb_map_url` ASC));

UPDATE version SET ver_value = '089' WHERE ver_name = 'DB';