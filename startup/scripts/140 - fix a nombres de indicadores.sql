DELIMITER $$

DROP PROCEDURE IF EXISTS RenameCaption $$

CREATE PROCEDURE RenameCaption(
    IN p_old_caption VARCHAR(255),
    IN p_new_caption VARCHAR(255)
)
BEGIN

    UPDATE draft_variable
    SET mvv_Caption = p_new_caption
    WHERE mvv_Caption = trim(p_old_caption);

    UPDATE draft_dataset_column
    SET dco_Caption = p_new_caption
    WHERE dco_Caption = trim(p_old_caption);

    UPDATE draft_dataset_column
    SET dco_Label = p_new_caption
    WHERE dco_Label = trim(p_old_caption);

    UPDATE variable
    SET mvv_Caption = p_new_caption
    WHERE mvv_Caption = trim(p_old_caption);

    UPDATE dataset_column
    SET dco_Caption = p_new_caption
    WHERE dco_Caption = trim(p_old_caption);

    UPDATE dataset_column
    SET dco_Label = p_new_caption
    WHERE dco_Label = trim(p_old_caption);

END $$

DELIMITER ;

CALL RenameCaption(
    'Hogares sin heladeras',
    'Hogares sin heladera'
);

CALL RenameCaption(
    'Población total (en hogares familiares).',
    'Población total (en hogares familiares)'
);


CALL RenameCaption(
    'Tienen entre 50 y 64, no terminaron el secundario y no asisten',
    'Tienen entre 50 y 64 años, no terminaron el secundario y no asisten'
);

CALL RenameCaption(
    'Tienen entre 50 y 64 años, no terminaron el secundario y no asisten',
    'Tienen entre 50 y 64 años, no terminaron el secundario y no asisten'
);

CALL RenameCaption(
    'Tiene 65 años y más, no terminaron el secundario y no asisten',
    'Tienen 65 años y más, no terminaron el secundario y no asisten'
);

CALL RenameCaption(
    'Tienen entre 30 a 49 años, no terminaron el secundario y no asisten',
    'Tienen entre 30 y 49 años, no terminaron el secundario y no asisten'
);
CALL RenameCaption(
    'Tienen entre19 y 29 años, no terminaron el secundario y no asisten',
    'Tienen entre 19 y 29 años, no terminaron el secundario y no asisten'
);


UPDATE version SET ver_value = '140' WHERE ver_name = 'DB';
