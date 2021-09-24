delete from draft_metric_version where
not exists(SELECT * FROM draft_metric_version_level WHERE mvl_metric_version_id = mvr_id);
delete from draft_metric where
not exists(SELECT * FROM draft_metric_version where mvr_metric_id = mtr_id);

delete from metric_version where
not exists(SELECT * FROM metric_version_level WHERE mvl_metric_version_id = mvr_id);
delete from metric where
not exists(SELECT * FROM metric_version where mvr_metric_id = mtr_id);

ALTER TABLE `metric`
CHANGE COLUMN `mtr_revision` `mtr_revision` BIGINT NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador' ;
ALTER TABLE `snapshot_metric_version`
CHANGE COLUMN `mvw_metric_revision` `mvw_metric_revision` BIGINT NOT NULL DEFAULT '1' COMMENT 'Versión para el cacheo cliente del indicador' ;


DELIMITER $$
CREATE FUNCTION `Signature`() RETURNS BIGINT
    NO SQL
    NOT DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
RETURN UNIX_TIMESTAMP(NOW(6))* 1000 & 0xFFFFFFFF;
END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `draft_metric_version_no_levels` AFTER DELETE ON `draft_metric_version_level`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `draft_metric_no_versions` AFTER DELETE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END;
$$

DELIMITER ;
DELIMITER $$

CREATE
    TRIGGER `metric_version_no_levels` AFTER DELETE ON `metric_version_level`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `metric_no_versions` AFTER DELETE ON `metric_version`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END;
$$

DELIMITER ;


DELIMITER $$

CREATE
    TRIGGER `metric_version_no_levels_update` AFTER UPDATE ON `metric_version_level`
    FOR EACH ROW BEGIN
		IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
			NOT EXISTS (SELECT * FROM metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `metric_no_versions_update` AFTER UPDATE ON `metric_version`
    FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `draft_metric_version_no_levels_update` AFTER UPDATE ON `draft_metric_version_level`
    FOR EACH ROW BEGIN
		IF old.mvl_metric_version_id <> new.mvl_metric_version_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version_level WHERE
						mvl_metric_version_id = old.mvl_metric_version_id) THEN
			DELETE FROM draft_metric_version WHERE mvr_id = old.mvl_metric_version_id;
		END IF;
    END;
$$

DELIMITER ;

DELIMITER $$

CREATE
    TRIGGER `draft_metric_no_versions_update` AFTER UPDATE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END;
$$

DELIMITER ;


UPDATE version SET ver_value = '081' WHERE ver_name = 'DB';