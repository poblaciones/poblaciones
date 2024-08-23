delete from draft_file where fil_name like 'preview%'
and not exists (select * from draft_work where wrk_preview_file_id  = fil_id )

UPDATE version SET ver_value = '110' WHERE ver_name = 'DB';
