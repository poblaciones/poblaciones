ALTER TABLE `draft_metadata_file`
CHANGE COLUMN `mfi_caption` `mfi_caption` VARCHAR(200) NOT NULL ;
ALTER TABLE `metadata_file`
CHANGE COLUMN `mfi_caption` `mfi_caption` VARCHAR(200) NOT NULL ;

UPDATE version SET ver_value = '073' WHERE ver_name = 'DB';