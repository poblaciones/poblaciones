-- Columna de código del dataset (identificación del dataset, junto a la descripción).
--
-- Identifica a cada elemento de un dataset de ubicaciones (L) o de zonas propias (S) de forma
-- comparable entre series (por ejemplo, el CUEAnexo de una escuela). Al publicar, el código no puede
-- repetirse dentro del dataset; con él se arma la tabla de comparación entre series, que sigue
-- siendo por equivalencias geográficas en los datasets estándar (D).
--
-- No lleva clave foránea, igual que el resto de las referencias a columnas del dataset: se anulan
-- explícitamente antes de eliminar las columnas (ver DatasetColumnService::UnlockColumns).

ALTER TABLE `draft_dataset`
	ADD COLUMN `dat_code_column_id` int(11) DEFAULT NULL COMMENT 'Columna cuyo valor identifica a cada elemento entre series; permite compararlas en ubicaciones y zonas propias. No admite repetidos.' AFTER `dat_caption_column_id`;

ALTER TABLE `dataset`
	ADD COLUMN `dat_code_column_id` int(11) DEFAULT NULL COMMENT 'Columna cuyo valor identifica a cada elemento entre series; permite compararlas en ubicaciones y zonas propias. No admite repetidos.' AFTER `dat_caption_column_id`;

UPDATE version SET ver_value = '156' WHERE ver_name = 'DB';