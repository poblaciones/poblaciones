-- ── metric_group: convertir nombres Material Design a clases FA ─────────────
ALTER TABLE metric_group
  MODIFY COLUMN lgr_icon VARCHAR(40) DEFAULT NULL COMMENT 'Clase FontAwesome (ej. fas fa-users)';

UPDATE metric_group SET lgr_icon = 'fas fa-users'          WHERE lgr_id = 4;  -- Población
UPDATE metric_group SET lgr_icon = 'fas fa-graduation-cap' WHERE lgr_id = 11; -- Educación
UPDATE metric_group SET lgr_icon = 'fas fa-heart'          WHERE lgr_id = 2;  -- Salud
UPDATE metric_group SET lgr_icon = 'fas fa-hard-hat'       WHERE lgr_id = 48; -- Trabajo y seguridad social
UPDATE metric_group SET lgr_icon = 'fas fa-book'           WHERE lgr_id = 7;  -- Cultura y deporte
UPDATE metric_group SET lgr_icon = 'fas fa-tint'           WHERE lgr_id = 3;  -- Servicios
UPDATE metric_group SET lgr_icon = 'fas fa-vote-yea'       WHERE lgr_id = 5;  -- Resultados electorales
UPDATE metric_group SET lgr_icon = 'fas fa-balance-scale'  WHERE lgr_id = 47; -- Justicia y derechos humanos
UPDATE metric_group SET lgr_icon = 'fas fa-home'           WHERE lgr_id = 6;  -- Hábitat

-- ── boundary_group: agregar columna e íconos ────────────────────────────────
ALTER TABLE boundary_group
  ADD COLUMN bgr_icon VARCHAR(40) DEFAULT NULL COMMENT 'Clase FontAwesome (ej. fas fa-flag)'
  AFTER bgr_order;

UPDATE boundary_group SET bgr_icon = 'fas fa-landmark'           WHERE bgr_id = 1; -- Límites políticos
UPDATE boundary_group SET bgr_icon = 'fas fa-city'           WHERE bgr_id = 2; -- Áreas administrativas
UPDATE boundary_group SET bgr_icon = 'fas fa-layer-group'    WHERE bgr_id = 3; -- Conglomerados
UPDATE boundary_group SET bgr_icon = 'fas fa-theater-masks'  WHERE bgr_id = 4; -- Zonas culturales
UPDATE boundary_group SET bgr_icon = 'fas fa-leaf'           WHERE bgr_id = 5; -- Regiones naturales
UPDATE boundary_group SET bgr_icon = 'fas fa-map-pin'        WHERE bgr_id = 6; -- Otros

-- boundary: convertir íconos Material Design a clases FA (solo filas con valor)
UPDATE boundary SET bou_icon = 'fas fa-map'    WHERE bou_icon = 'map';
UPDATE boundary SET bou_icon = 'fas fa-globe'  WHERE bou_icon = 'public';
UPDATE boundary SET bou_icon = 'fas fa-city'   WHERE bou_icon = 'location_city';

-- ── boundary: asignar íconos FontAwesome 5.15 (free) a las filas sin valor ──
-- (las que ya tenían ícono fueron convertidas en el script anterior:
--  1 Provincias → fas fa-map, 3 Regiones → fas fa-globe,
--  9 Aglomerados / 23 Zonas del conurbano → fas fa-city)

UPDATE boundary SET bou_icon = 'fas fa-landmark'          WHERE bou_id = 2;  -- Municipios
UPDATE boundary SET bou_icon = 'fas fa-draw-polygon'      WHERE bou_id = 4;  -- Departamentos
UPDATE boundary SET bou_icon = 'fas fa-school'            WHERE bou_id = 5;  -- Distritos escolares (CABA)
UPDATE boundary SET bou_icon = 'fas fa-clinic-medical'    WHERE bou_id = 6;  -- Regiones y zonas sanitarias
UPDATE boundary SET bou_icon = 'fas fa-vote-yea'          WHERE bou_id = 7;  -- Secciones electorales
UPDATE boundary SET bou_icon = 'fas fa-mail-bulk'         WHERE bou_id = 8;  -- Códigos postales (4 dígitos)
UPDATE boundary SET bou_icon = 'fas fa-home'              WHERE bou_id = 10; -- Barrios
UPDATE boundary SET bou_icon = 'fas fa-map-marker-alt'    WHERE bou_id = 11; -- Localidades
UPDATE boundary SET bou_icon = 'fas fa-feather-alt'       WHERE bou_id = 12; -- Pueblos originarios
UPDATE boundary SET bou_icon = 'fas fa-language'          WHERE bou_id = 13; -- Zonas lingüísticas
UPDATE boundary SET bou_icon = 'fas fa-cloud-sun'         WHERE bou_id = 14; -- Climas
UPDATE boundary SET bou_icon = 'fas fa-leaf'              WHERE bou_id = 15; -- Eco-regiones
UPDATE boundary SET bou_icon = 'fas fa-water'             WHERE bou_id = 16; -- Cuencas y regiones hídricas
UPDATE boundary SET bou_icon = 'fas fa-cloud-sun-rain'    WHERE bou_id = 17; -- Climas agrupados
UPDATE boundary SET bou_icon = 'fas fa-tint'              WHERE bou_id = 18; -- Sistemas de cuencas
UPDATE boundary SET bou_icon = 'fas fa-university'        WHERE bou_id = 19; -- Gobiernos locales
UPDATE boundary SET bou_icon = 'fas fa-balance-scale'     WHERE bou_id = 20; -- Regiones judiciales
UPDATE boundary SET bou_icon = 'fas fa-gavel'             WHERE bou_id = 21; -- Circunscripciones judiciales

ALTER TABLE boundary
  MODIFY COLUMN bou_icon VARCHAR(40) DEFAULT NULL COMMENT 'Clase FontAwesome (ej. fas fa-map)';

UPDATE version SET ver_value = '138' WHERE ver_name = 'DB';
