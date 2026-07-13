ALTER TABLE `clipping_region`
  ADD COLUMN `clr_color` CHAR(6) NULL DEFAULT NULL AFTER `clr_priority`;

ALTER TABLE `snapshot_boundary_version_item`
ADD COLUMN `biw_clipping_region_id` INT NOT NULL DEFAULT '0' AFTER `biw_boundary_id`;

-- Actualización de clr_color para clipping_region
-- Criterio: paletas ColorBrewer, con coherencia semántica según el boundary de pertenencia.
-- Se evitan tonos claros por legibilidad en mapa; se minimiza la repetición exacta de valores.
-- a partir de datos de:
----  select distinct bou_caption, clr_caption, clr_id from clipping_Region
----  join boundary_version_clipping_region on clr_id = bcr_clipping_region_id
----  join boundary_version on bvr_id = bcr_boundary_version_id
----  join boundary on bou_id = bvr_boundary_id

-- Provincias (nivel superior, familia azul)
UPDATE clipping_region SET clr_color = '2166AC' WHERE clr_id = 52;  -- Provincias
UPDATE clipping_region SET clr_color = '4393C3' WHERE clr_id = 103; -- Provincias (otra versión)

-- Familia Departamentos / Municipios (unidades sub-provinciales, distinciones técnicas -> misma gama cálida)
UPDATE clipping_region SET clr_color = 'FC8D59' WHERE clr_id = 55;  -- Municipios
UPDATE clipping_region SET clr_color = 'D7301F' WHERE clr_id = 56;  -- Municipios / Departamentos
UPDATE clipping_region SET clr_color = 'B30000' WHERE clr_id = 57;  -- Departamentos
UPDATE clipping_region SET clr_color = '7F0000' WHERE clr_id = 104; -- Departamentos (otra versión)
UPDATE clipping_region SET clr_color = 'EF6548' WHERE clr_id = 105; -- Municipios / Departamentos (otra versión)
UPDATE clipping_region SET clr_color = '993404' WHERE clr_id = 62;  -- Comunas / Departamentos
UPDATE clipping_region SET clr_color = '662506' WHERE clr_id = 134; -- Comunas / Departamentos (otra versión)
UPDATE clipping_region SET clr_color = 'D95F02' WHERE clr_id = 110; -- Municipios (también integra Gobiernos locales)

-- Regiones genéricas (familia violeta)
UPDATE clipping_region SET clr_color = '6A51A3' WHERE clr_id = 74;
UPDATE clipping_region SET clr_color = '807DBA' WHERE clr_id = 75;

-- Regiones y zonas sanitarias (categoría temática propia)
UPDATE clipping_region SET clr_color = 'C51B7D' WHERE clr_id = 90;

-- Códigos postales (categoría técnica/infraestructura)
UPDATE clipping_region SET clr_color = '35978F' WHERE clr_id = 91;

-- Aglomerados (familia magenta, mismas variantes con tonos distinguibles)
UPDATE clipping_region SET clr_color = 'AE017E' WHERE clr_id = 73;
UPDATE clipping_region SET clr_color = '7A0177' WHERE clr_id = 77;
UPDATE clipping_region SET clr_color = 'DD3497' WHERE clr_id = 127;
UPDATE clipping_region SET clr_color = 'F768A1' WHERE clr_id = 128;

-- Barrios (familia verde)
UPDATE clipping_region SET clr_color = '238B45' WHERE clr_id = 64;  -- Barrios CABA
UPDATE clipping_region SET clr_color = '006D2C' WHERE clr_id = 80;  -- Barrios
UPDATE clipping_region SET clr_color = '41AB5D' WHERE clr_id = 81;  -- Barrios (otra versión)
UPDATE clipping_region SET clr_color = '00441B' WHERE clr_id = 98;  -- Barrios de Neuquén Capital

-- Localidades (familia celeste)
UPDATE clipping_region SET clr_color = '0868AC' WHERE clr_id = 58;
UPDATE clipping_region SET clr_color = '2B8CBE' WHERE clr_id = 59;
UPDATE clipping_region SET clr_color = '4EB3D3' WHERE clr_id = 130;
UPDATE clipping_region SET clr_color = '08589E' WHERE clr_id = 131;

-- Climas / clima agrupado (familia rojo cálido)
UPDATE clipping_region SET clr_color = 'EF3B2C' WHERE clr_id = 85;  -- Climas
UPDATE clipping_region SET clr_color = 'A50F15' WHERE clr_id = 84;  -- Climas agrupados

-- Ecoregiones (tono oliva, diferenciado de Barrios)
UPDATE clipping_region SET clr_color = 'BF812D' WHERE clr_id = 86;

-- Cuencas y sistemas de cuencas (familia azul agua, distinguible de Provincias/Localidades)
UPDATE clipping_region SET clr_color = '045A8D' WHERE clr_id = 88;  -- Cuencas y regiones hídricas
UPDATE clipping_region SET clr_color = '3690C0' WHERE clr_id = 87;  -- Sistemas de cuencas

-- Gobiernos locales (paleta cualitativa Dark2, colores sustantivamente distinguibles entre sí)
UPDATE clipping_region SET clr_color = '1B9E77' WHERE clr_id = 106; -- Comunas
UPDATE clipping_region SET clr_color = '7570B3' WHERE clr_id = 107; -- Comisiones de fomento
UPDATE clipping_region SET clr_color = 'E6AB02' WHERE clr_id = 108; -- Comisiones municipales
UPDATE clipping_region SET clr_color = '66A61E' WHERE clr_id = 111; -- Juntas de gobierno
UPDATE clipping_region SET clr_color = 'A6761D' WHERE clr_id = 114; -- Comunas rurales
-- (clr_id 110, Municipios, ya definido arriba en D95F02)

-- Regiones judiciales / Circunscripciones judiciales (colores sustantivamente distinguibles entre sí)
UPDATE clipping_region SET clr_color = '54278F' WHERE clr_id = 115; -- Regiones judiciales
UPDATE clipping_region SET clr_color = '016C59' WHERE clr_id = 129; -- Circunscripciones judiciales

-- Zonas del conurbano bonaerense (categoría propia)
UPDATE clipping_region SET clr_color = '980043' WHERE clr_id = 132;

UPDATE version SET ver_value = '144' WHERE ver_name = 'DB';