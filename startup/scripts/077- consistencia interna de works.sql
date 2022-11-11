delete FROM symbology
WHERE NOT EXISTS(SELECT * FROM variable WHERE mvv_symbology_id = vsy_id);

delete FROM draft_symbology
WHERE NOT EXISTS(SELECT * FROM draft_variable WHERE mvv_symbology_id = vsy_id);

delete from dataset_marker
 where not exists(select * from dataset where dat_marker_id = dmk_id);

delete from draft_dataset_marker
where not exists(select * from draft_dataset where dat_marker_id = dmk_id);



drop FUNCTION `UserFullNameById`;

DELIMITER $$
CREATE FUNCTION `UserFullNameById`(`id` INT) RETURNS varchar(100)
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF id IS NULL THEN
  RETURN null;
END IF;

RETURN (SELECT TRIM(CONCAT(usr_firstname, ' ', usr_lastname)) FROM `user` WHERE usr_id = 1);
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION `GetDatasetOf`(column_id INT) RETURNS INT
    READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
IF column_id IS NULL THEN
  RETURN null;
END IF;

RETURN (SELECT dco_dataset_id FROM draft_dataset_column WHERE dco_id = column_id);
END$$
DELIMITER ;


UPDATE version SET ver_value = '077' WHERE ver_name = 'DB';