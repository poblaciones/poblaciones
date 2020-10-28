ALTER TABLE draft_symbology
ADD COLUMN `vsy_gradient_opacity` CHAR(1) NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado' AFTER `vsy_opacity`,
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR(1) NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo' ;

ALTER TABLE symbology
ADD COLUMN `vsy_gradient_opacity` CHAR(1) NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada del gradiente poblaciones, en caso de estar disponible. H=Alto, M=Medio, L=Bajo, N=Deshabilitado' AFTER `vsy_opacity`,
CHANGE COLUMN `vsy_opacity` `vsy_opacity` CHAR(1) NOT NULL DEFAULT 'M' COMMENT 'Nivel de opacidad predeterminada de la variable. H=Alto, M=Medio, L=Bajo' ;

UPDATE version SET ver_value = '054' WHERE ver_name = 'DB';