ALTER TABLE `snapshot_metric_versions` ADD `mvw_work_authors` VARCHAR(200) NULL COMMENT 'Autores de la cartografía' AFTER `mvw_work_caption`, ADD `mvw_work_institution` VARCHAR(200) NULL COMMENT 'Institución de la cartografía' AFTER `mvw_work_authors`;

ALTER TABLE `snapshot_metric_versions` DROP INDEX `ix_version_fulltext`, ADD FULLTEXT `ix_version_fulltext` (`mvw_metric_caption`, `mvw_caption`, `mvw_variable_captions`, `mvw_variable_value_captions`, `mvw_work_caption`, `mvw_work_authors`, `mvw_work_institution`);

update `snapshot_metric_versions` 
join work on wrk_id = mvw_work_id 
join metadata on met_id = wrk_metadata_id 
left join institution on ins_id = met_institution_id
set mvw_work_institution = ins_caption, 
    mvw_work_authors = met_authors

UPDATE version SET ver_value = '003' WHERE ver_name = 'DB';