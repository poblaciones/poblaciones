ALTER TABLE `draft_variable_value_label`
ADD UNIQUE INDEX `fk_order` (`vvl_variable_id` ASC, `vvl_order` ASC);
;

UPDATE version SET ver_value = '117' WHERE ver_name = 'DB';

