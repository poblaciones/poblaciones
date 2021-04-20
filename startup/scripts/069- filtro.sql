ALTER TABLE `draft_variable`
ADD COLUMN `mvv_filter_value` VARCHAR(200) NULL COMMENT 'Expresi�n a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un n�mero, un \'texto\', o una [columna]';


ALTER TABLE `variable`
ADD COLUMN `mvv_filter_value` VARCHAR(200) NULL COMMENT 'Expresi�n a aplicar en el filtro (Formato: <colname><tab><operador><segundo_valor>, donde <segundovalor> puede ser un n�mero, un \'texto\', o una [columna]';

ALTER TABLE `dataset_column`
CHANGE COLUMN `dco_format` `dco_format` INT(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Num�rico.' ;

ALTER TABLE `draft_dataset_column`
CHANGE COLUMN `dco_format` `dco_format` INT(11) NOT NULL COMMENT 'Tipo de dato almacenado. 1=Texto, 5=Num�rico.' ;


UPDATE version SET ver_value = '069' WHERE ver_name = 'DB';