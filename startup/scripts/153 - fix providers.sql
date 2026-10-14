
update draft_metric  join
metric_provider on  mtr_metric_provider_id = lpr_id
set mtr_metric_provider_id = 1
where lpr_caption like 'Censos nacionales%';

update metric  join
metric_provider on  mtr_metric_provider_id = lpr_id
set mtr_metric_provider_id = 1
where lpr_caption like 'Censos nacionales%';

delete from metric_provider  where lpr_caption like 'Censos nacionales%'
and lpr_id <> 1;

update metric_provider  set lpr_caption = replace(lpr_caption, ' (2018, 2021, 2024)', '');

update metric_provider  set lpr_caption = replace(lpr_caption, ' (2018, 2022)', '');
update metric_provider  set lpr_caption = replace(lpr_caption, ' (2015, 2019, 2023)', '');
update metric_provider  set lpr_caption = replace(lpr_caption, ' (2020)', '');
update metric_provider  set lpr_caption = replace(lpr_caption, ' (2022)', '');

update metric_provider set lpr_caption = 'Censos nacionales de población' where lpr_id = 1;

UPDATE version SET ver_value = '153' WHERE ver_name = 'DB';