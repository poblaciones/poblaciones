-- se migró a met_url
ALTER TABLE `work` DROP `wrk_uri`;
ALTER TABLE `draft_work` DROP `wrk_uri`;

UPDATE version SET ver_value = '008' WHERE ver_name = 'DB';