drop function LineStringSelfIntersects;

DELIMITER //

CREATE FUNCTION LineStringSelfIntersects(geometry_input LINESTRING)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE i, j INT;
    DECLARE segment1, segment2 LINESTRING;
    DECLARE num_points INT;

    SET num_points = ST_NumPoints(geometry_input);

    -- Una LineString necesita al menos 4 puntos para auto-intersectarse
    IF num_points < 4 THEN
        RETURN FALSE;
    END IF;

    -- Comparar cada segmento con todos los demás segmentos
    -- excepto los adyacentes
    SET i = 1;
    WHILE i < num_points DO
        SET j = i + 2;
        WHILE j < num_points DO
            -- Crear dos segmentos para comparar
               SET segment1 = LINESTRING(
					ST_PointN(geometry_input, i),
					ST_PointN(geometry_input, i + 1)
				);

				SET segment2 = LINESTRING(
					ST_PointN(geometry_input, j),
					ST_PointN(geometry_input, j + 1)
				);
            -- Verificar si los segmentos se cruzan
            IF ST_Crosses(segment1, segment2) THEN
                RETURN TRUE;
            END IF;

            SET j = j + 1;
        END WHILE;
        SET i = i + 1;
    END WHILE;

    RETURN FALSE;
END //

DELIMITER ;

drop function RingIsValid;

DELIMITER $$
CREATE FUNCTION `RingIsValid`(`ele` GEOMETRY, direction tinyint(4)) RETURNS int(11)
    NO SQL
    DETERMINISTIC
    SQL SECURITY INVOKER
BEGIN
DECLARE n INT;
SET n = ST_NumPoints(ele);

IF n = 0 THEN
  RETURN 101;
END IF;
IF n < 4 THEN
  RETURN 112;
END IF;

IF ST_IsClosed(ele) = 0 THEN
  RETURN 102;
END IF;

IF LineStringSelfIntersects(ele) = 0 THEN
  RETURN 104;
END IF;

RETURN 100;
END$$
DELIMITER ;

UPDATE version SET ver_value = '111' WHERE ver_name = 'DB';
