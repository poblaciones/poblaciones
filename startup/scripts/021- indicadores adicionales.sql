ALTER TABLE `draft_work_extra_metric` DROP `wmt_order`;

ALTER TABLE `work_extra_metric` DROP `wmt_order`;

ALTER TABLE `draft_work_extra_metric` DROP INDEX `fk_draft_work_metric_metric`;

ALTER TABLE `work_extra_metric` DROP INDEX `fk_work_metric_metric`;

ALTER TABLE `draft_work_extra_metric` ADD CONSTRAINT `fk_draft_extra_work_metric_metric` FOREIGN KEY (`wmt_metric_id`) REFERENCES `draft_metric`(`mtr_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `draft_work_extra_metric` ADD CONSTRAINT `fk_draft_extra_work_metric_work` FOREIGN KEY (`wmt_work_id`) REFERENCES `draft_work`(`wrk_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `work_extra_metric` ADD CONSTRAINT `fk_extra_work_metric_metric` FOREIGN KEY (`wmt_metric_id`) REFERENCES `metric`(`mtr_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `work_extra_metric` ADD CONSTRAINT `fk_extra_work_metric_work` FOREIGN KEY (`wmt_work_id`) REFERENCES `work`(`wrk_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `draft_work_extra_metric` ADD UNIQUE `u_draft_work_extra_metric` (`wmt_work_id`, `wmt_metric_id`);

ALTER TABLE `work_extra_metric` ADD UNIQUE `u_work_extra_metric` (`wmt_work_id`, `wmt_metric_id`);

UPDATE version SET ver_value = '021' WHERE ver_name = 'DB';