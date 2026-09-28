ALTER TABLE boundary_version ADD COLUMN bvr_extents geometry NULL;
UPDATE version SET ver_value = '151' WHERE ver_name = 'DB';