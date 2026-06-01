delete draft_onboarding_step from draft_onboarding_step,draft_onboarding, draft_work
where wrk_id = onb_work_id and obs_onboarding_id = onb_id and  wrk_metadata_id = 2204;

delete draft_onboarding from draft_onboarding, draft_work
where wrk_id = onb_work_id and  wrk_metadata_id = 2204;

delete work_space_usage from work_space_usage, draft_work where wrk_metadata_id = 2204 and wrk_id = wdu_work_id;

delete draft_variable_value_label  from draft_variable_value_label, draft_variable, draft_dataset_column, draft_dataset, draft_work
where vvl_variable_id = mvv_id and mvv_data_column_id = dco_id and dco_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_variable_value_label  from draft_variable_value_label, draft_variable, draft_dataset_column, draft_dataset, draft_work
where vvl_variable_id = mvv_id and mvv_normalization_column_id = dco_id and dco_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_variable from draft_variable, draft_dataset_column, draft_dataset, draft_work
where mvv_data_column_id = dco_id and dco_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_variable from draft_variable, draft_dataset_column, draft_dataset, draft_work
where mvv_normalization_column_id = dco_id and dco_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_metric_version_level from draft_metric_version_level, draft_dataset, draft_work
where mvl_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_dataset_column from draft_dataset_column, draft_dataset, draft_work
where dco_dataset_id = dat_id and  wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_dataset from draft_dataset, draft_work
where wrk_id = dat_work_id and  wrk_metadata_id = 2204;

delete draft_work_permission from draft_work_permission, draft_work
where wrk_id = wkp_work_id and  wrk_metadata_id = 2204;

delete  from draft_work where wrk_metadata_id = 2204;


ALTER TABLE `draft_work`
DROP INDEX `draft_work_ibfk_1` ,
ADD UNIQUE INDEX `draft_work_ibfk_1` (`wrk_metadata_id` ASC);
;



UPDATE version SET ver_value = '136' WHERE ver_name = 'DB';
