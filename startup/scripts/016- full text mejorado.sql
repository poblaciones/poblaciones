CREATE TABLE `snapshot_lookup_clipping_region_item` (
  `clc_id` int(11) NOT NULL,
  `clc_clipping_region_item_id` int(11) DEFAULT NULL,
  `clc_level` int(11) DEFAULT NULL,
  `clc_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clc_full_ids` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clc_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clc_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clc_population` int(11) NOT NULL DEFAULT '0' COMMENT 'Población declarada en la región de clippping',
  `clc_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clc_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clc_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clc_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clc_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

ALTER TABLE `snapshot_lookup_clipping_region_item`
  ADD PRIMARY KEY (`clc_id`),
  ADD SPATIAL KEY `lookup_spatial` (`clc_location`);
ALTER TABLE `snapshot_lookup_clipping_region_item` ADD FULLTEXT KEY `ix_lookup_caption` (`clc_caption`, clc_tooltip);
ALTER TABLE `snapshot_lookup_clipping_region_item`
  MODIFY `clc_id` int(11) NOT NULL AUTO_INCREMENT;

CREATE TABLE `snapshot_lookup_feature` (
  `clf_id` int(11) NOT NULL,
  `clf_dataset_id` int(11) DEFAULT NULL,
  `clf_level` int(11) DEFAULT NULL,
  `clf_full_parent` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `clf_caption` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `clf_tooltip` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clf_feature_ids` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Ids de los geographyItem asociados a un ítem de clipping o de los features de un metric',
  `clf_min_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Mínimo nivel de zoom para la visualización del item como label',
  `clf_symbol` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Icono para los elementos de tipo feature o clippingregionitem',
  `clf_location` point NOT NULL COMMENT 'Ubicación del ítem como etiqueta',
  `clf_max_zoom` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Máximo nivel de zoom para la visualización del item como label',
  `clf_shard` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 CHECKSUM=1 COLLATE=utf8_unicode_ci;

ALTER TABLE `snapshot_lookup_feature`
  ADD PRIMARY KEY (`clf_id`),
  ADD SPATIAL KEY `lookup_spatial` (`clf_location`),
  ADD KEY `snap_item_dataset` (`clf_dataset_id`);
ALTER TABLE `snapshot_lookup_feature` ADD FULLTEXT KEY `ix_lookup_caption` (`clf_caption`);
ALTER TABLE `snapshot_lookup_feature`
  MODIFY `clf_id` int(11) NOT NULL AUTO_INCREMENT;


INSERT INTO `snapshot_lookup_clipping_region_item`(`clc_clipping_region_item_id`, `clc_full_parent`, `clc_full_ids`, `clc_caption`, `clc_tooltip`, `clc_feature_ids`, `clc_population`, `clc_min_zoom`, `clc_symbol`, `clc_location`, `clc_max_zoom`, `clc_shard`)
select
`clv_clipping_region_item_id`, `clv_full_parent`, `clv_full_ids`, `clv_caption`, `clv_tooltip`, `clv_feature_ids`, `clv_population`, `clv_min_zoom`, `clv_symbol`, `clv_location`, `clv_max_zoom`, `clv_shard`
FROM snapshot_lookup
WHERE clv_type = 'C';

ALTER TABLE `snapshot_lookup_feature` ADD UNIQUE KEY `ux_fid` (`clf_feature_ids`);
truncate table `snapshot_lookup_feature`;

INSERT INTO `snapshot_lookup_feature`(`clf_dataset_id`, `clf_level`, `clf_full_parent`, `clf_caption`, `clf_tooltip`, `clf_feature_ids`, `clf_min_zoom`, `clf_symbol`, `clf_location`, `clf_max_zoom`, `clf_shard`)
SELECT max(
`clv_dataset_id`), max(`clv_level`), max(`clv_full_parent`), max(`clv_caption`), max( `clv_tooltip`), `clv_feature_ids`, max(`clv_min_zoom`), max(`clv_symbol`), `clv_location`, max(`clv_max_zoom`), max(`clv_shard`)
FROM snapshot_lookup
JOIN dataset ON clv_dataset_id = dat_id
WHERE clv_type = 'F' GROUP BY clv_feature_ids, clv_location;

DROP TABLE snapshot_lookup;

UPDATE version SET ver_value = '016' WHERE ver_name = 'DB';

