DROP TRIGGER IF EXISTS `draft_metric_no_versions_update`;

DELIMITER $$
CREATE TRIGGER `draft_metric_no_versions_update` AFTER UPDATE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF old.mvr_metric_id <> new.mvr_metric_id AND
			NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_work_extra_metric WHERE wmt_metric_id = old.mvr_metric_id;
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END$$
DELIMITER ;

DROP TRIGGER IF EXISTS `draft_metric_no_versions`;
DELIMITER $$
CREATE TRIGGER `draft_metric_no_versions` AFTER DELETE ON `draft_metric_version`
    FOR EACH ROW BEGIN
		IF NOT EXISTS (SELECT * FROM draft_metric_version WHERE
						mvr_metric_id = old.mvr_metric_id) THEN
			DELETE FROM draft_work_extra_metric WHERE wmt_metric_id = old.mvr_metric_id;
			DELETE FROM draft_metric WHERE mtr_id = old.mvr_metric_id;
		END IF;
    END$$
DELIMITER ;


UPDATE version SET ver_value = '135' WHERE ver_name = 'DB';
