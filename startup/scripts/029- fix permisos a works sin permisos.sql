INSERT INTO `draft_work_permission` (`wkp_user_id`, `wkp_work_id`, `wkp_permission`)

select (select usr_id from user where usr_email = 'admin'),
wrk_id, 'A'
from draft_work
where not exists( select * from draft_work_permission
 where wkp_work_id = wrk_id)
;

UPDATE version SET ver_value = '029' WHERE ver_name = 'DB';
