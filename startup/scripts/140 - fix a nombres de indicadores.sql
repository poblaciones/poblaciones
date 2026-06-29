update draft_variable  set mvv_Caption  = 'Población total (en hogares familiares)'
where mvv_Caption  = 'Población total (en hogares familiares).';

update draft_dataset_column
set dco_Caption  = 'Población total (en hogares familiares)'
where dco_Caption  = 'Población total (en hogares familiares).';

update draft_dataset_column
set dco_Label  = 'Población total (en hogares familiares)'
where dco_Label  = 'Población total (en hogares familiares).';

update variable  set mvv_Caption  = 'Población total (en hogares familiares)'
where mvv_Caption  = 'Población total (en hogares familiares).';

update dataset_column
set dco_Caption  = 'Población total (en hogares familiares)'
where dco_Caption  = 'Población total (en hogares familiares).';

update dataset_column
set dco_Label  = 'Población total (en hogares familiares)'
where dco_Label  = 'Población total (en hogares familiares).';

UPDATE version SET ver_value = '140' WHERE ver_name = 'DB';
