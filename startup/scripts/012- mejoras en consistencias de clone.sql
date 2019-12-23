ALTER TABLE `draft_work` ADD `wrk_unfinished` TINYINT(1) NOT NULL DEFAULT '0'
COMMENT 'Indica si la obra es el resultado de un clone interrumpido';

update  draft_work set wrk_unfinished = 1 where (select count(*) from draft_work_permission where wkp_work_id = wrk_id) = 0;

UPDATE version SET ver_value = '012' WHERE ver_name = 'DB';