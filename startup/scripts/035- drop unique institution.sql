ALTER TABLE `draft_institution` DROP INDEX `draft_insUnique`;

UPDATE version SET ver_value = '035' WHERE ver_name = 'DB';

