ALTER TABLE `draft_dataset`
ADD COLUMN `dat_segment_type` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Dirección de los segmentos. \'N\': Ninguna, \'A\': dirigido de \'A->B\', \'B\':dirigido de \'B->A\'' AFTER `dat_are_segments`;

ALTER TABLE `dataset`
ADD COLUMN `dat_segment_type` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Dirección de los segmentos. \'N\': Ninguna, \'A\': dirigido de \'A->B\', \'B\':dirigido de \'B->A\'' AFTER `dat_are_segments`;



UPDATE version SET ver_value = '142' WHERE ver_name = 'DB';
