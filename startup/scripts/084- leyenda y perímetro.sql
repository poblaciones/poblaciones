ALTER TABLE `draft_variable`
ADD COLUMN `mvv_legend` VARCHAR(500) NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos' AFTER `mvv_filter_value`;

ALTER TABLE `variable`
ADD COLUMN `mvv_legend` VARCHAR(500) NULL COMMENT 'Información aclaratoria del indicador a mostrar en la presentación de los datos' AFTER `mvv_filter_value`;

ALTER TABLE `draft_variable`
ADD COLUMN `mvv_perimeter` FLOAT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).' AFTER `mvv_legend`;

ALTER TABLE `variable`
ADD COLUMN `mvv_perimeter` FLOAT NULL COMMENT 'Perímetro de cobertura del dataset para presentar como circunferencia alrededor de cada elemento (radio en kms).' AFTER `mvv_legend`;

UPDATE version SET ver_value = '084' WHERE ver_name = 'DB';