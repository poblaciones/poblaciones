CREATE TABLE `draft_metadata_institution` (
  `min_id` int(11) NOT NULL AUTO_INCREMENT,
  `min_metadata_id` int(11) NOT NULL,
  `min_institution_id` int(11) NOT NULL,
  `min_order` int(11) NOT NULL,
  PRIMARY KEY (`min_id`),
  UNIQUE KEY `uniquemetainstitutioninst` (`min_metadata_id`,`min_institution_id`),
  KEY `draft_metadata_institution_institution` (`min_institution_id`),
  KEY `draft_metadata_institution_metadata` (`min_metadata_id`),
  CONSTRAINT `draft_metadata_institution_metadata` FOREIGN KEY (`min_metadata_id`) REFERENCES `draft_metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `draft_metadata_institution_institution` FOREIGN KEY (`min_institution_id`) REFERENCES `draft_institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=365 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `metadata_institution` (
  `min_id` int(11) NOT NULL,
  `min_metadata_id` int(11) NOT NULL,
  `min_institution_id` int(11) NOT NULL,
  `min_order` int(11) NOT NULL,
  PRIMARY KEY (`min_id`),
  UNIQUE KEY `uniquemetaiutioninst` (`min_metadata_id`,`min_institution_id`),
  KEY `metadata_institution_institution` (`min_institution_id`),
  KEY `metadata_institution_metadata` (`min_metadata_id`),
  CONSTRAINT `metadata_institution_metadata` FOREIGN KEY (`min_metadata_id`) REFERENCES `metadata` (`met_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `metadata_institution_institution` FOREIGN KEY (`min_institution_id`) REFERENCES `institution` (`ins_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=365 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `metadata_source`
ADD PRIMARY KEY (`msc_id`);
;

insert into draft_metadata_institution(min_metadata_id, min_institution_id, min_order)
SELECT met_id, met_institution_id, 1 FROM draft_metadata WHERE met_institution_id IS NOT NULL;

INSERT INTO metadata_institution(min_id, min_metadata_id, min_institution_id, min_order)
SELECT min_id * 100 + 1, min_metadata_id * 100 + 1, min_institution_id  * 100 + 1, 1 FROM draft_metadata_institution
WHERE EXISTS (SELECT * FROM metadata where met_id = min_metadata_id * 100 + 1);


ALTER TABLE `metadata_institution`
DROP FOREIGN KEY `metadata_institution_metadata`;

ALTER TABLE `metadata_institution`
ADD CONSTRAINT `metadata_institution_metadata`
  FOREIGN KEY (`min_metadata_id`)
  REFERENCES `metadata` (`met_id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;


-- Borra las columnas

ALTER TABLE `draft_metadata`
DROP FOREIGN KEY `draft_metadata_ibfk_2`;

ALTER TABLE `draft_metadata`
DROP COLUMN `met_institution_id`,
DROP INDEX `draft_metadata_ibfk_2` ;
;


ALTER TABLE `snapshot_metric_version`
CHANGE COLUMN `mvw_work_institution` `mvw_work_institutions` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Instituciones de la cartografía' ;


ALTER TABLE `metadata`
DROP FOREIGN KEY `metadata_ibfk_2`;
ALTER TABLE `metadata`
DROP COLUMN `met_institution_id`,
DROP INDEX `metadata_ibfk_2` ;
;



UPDATE version SET ver_value = '118' WHERE ver_name = 'DB';

