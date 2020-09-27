ALTER TABLE `review` CHANGE `rev_submission_time` `rev_submission_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha/hora en la que fue solicitada la revisión';




UPDATE version SET ver_value = '052' WHERE ver_name = 'DB';