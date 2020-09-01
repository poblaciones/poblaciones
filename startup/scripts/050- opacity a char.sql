ALTER TABLE `draft_symbology`
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable' ;
update draft_symbology SET vsy_opacity = 'M';

ALTER TABLE `symbology`
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable' ;
update symbology SET vsy_opacity = 'M';


ALTER TABLE `draft_symbology`
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable' ;

ALTER TABLE `symbology`
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR NOT NULL DEFAULT 'M'  COMMENT 'Nivel de opacidad predeterminada de la variable' ;

UPDATE version SET ver_value = '050' WHERE ver_name = 'DB';