
ALTER TABLE `draft_dataset_column` ADD `dco_value_labels_are_dirty` TINYINT(1) NOT NULL DEFAULT b'0' COMMENT 'Indica que los valores de texto correspondientes a etiquetas automáticas fueron modificados';

UPDATE version SET ver_value = '048' WHERE ver_name = 'DB';