ALTER TABLE `clipping_region` ADD `clr_is_crawler_indexer` TINYINT NOT NULL DEFAULT '0' COMMENT 'Indica si debe usarse como criterio de segmentación hacia crawlers' AFTER `clr_priority`;

ALTER TABLE `draft_work` ADD `wrk_segmented_crawling` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se segmenta al indexarse para crawlers' AFTER `wrk_is_indexed`;

ALTER TABLE `work` ADD `wrk_segmented_crawling` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Indica si se segmenta al indexarse para crawlers' AFTER `wrk_is_indexed`;

UPDATE version SET ver_value = '024' WHERE ver_name = 'DB';