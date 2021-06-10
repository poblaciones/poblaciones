ALTER TABLE `geography`
ADD COLUMN `geo_use_for_clipping` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Indica si la geograf�a se debe considerar como serie para el c�lculo de totales poblaciones. ' AFTER `geo_is_tracking_level`;

update geography set geo_use_for_clipping = 0 where geo_caption = 'C�digos postales (4 d�gitos)';

UPDATE version SET ver_value = '072' WHERE ver_name = 'DB';