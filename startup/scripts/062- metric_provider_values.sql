INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Censos nacionales de población (1991, 2001, 2010)');
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Mapa educativo (2018)');
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Mapa sanitario (2018)');
INSERT INTO `metric_provider` (`lpr_caption`, lpr_order) VALUES ('Sistema de información cultural (2018)', 1);
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('OpenStreetmap');
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Observatorio de la Deuda Social');
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Dirección nacional electoral (2015)');
INSERT INTO `metric_provider` (`lpr_caption`) VALUES ('Estadísticas vitales');
-- precalcula en la vista
update snapshot_metric_version,
(SELECT wrk_id as work_id,
(select lpr_id from metric_provider where lpr_caption like (CASE WHEN met_title LIKE 'Indicadores del Censo Nacional%' THEN 'Censos nacionales de población%'
  WHEN met_title LIKE 'Establecimientos educativos%' THEN 'Mapa educativo%'
  WHEN  met_title LIKE 'Establecimientos de salud%' THEN 'Mapa sanitario%'
  WHEN  met_title LIKE 'Estratificación y desigualdad socia%' OR met_title LIKE 'Riesgo de inseguridad alimentaria%' OR met_title LIKE 'Riesgo de exclusión socia%' OR met_title LIKE 'Informalidad urbana%' OR met_title LIKE 'Riesgo de indocumentación%' OR met_title LIKE 'Centros de desarrollo infantil%' THEN 'Observatorio de la deuda%'
  WHEN  met_title LIKE 'Infraestructura, agentes y actividades culturales%' THEN 'Sistema de información cultural%'
  WHEN  met_title LIKE 'Resultados Elecciones Nacionales Presidenciales%' THEN 'Dirección nacional electoral%'
  WHEN  met_title LIKE '%OpenStreetMap%' THEN 'OpenStreetmap%'
  WHEN  met_title LIKE '%Mortalidad infantil en la Argentina%' OR met_title LIKE '%vitales%' THEN 'Estadísticas vitales%'
 END)) as prov_id
 from work join metadata on wrk_metadata_id = met_id ) AS EXTRA_DATA
SET mvw_metric_provider_id = prov_id
WHERE work_id = mvw_work_id and mvw_metric_group_id is not null;
-- lleva los valores a las tablas
update metric, snapshot_metric_version
SET mtr_metric_provider_id =  mvw_metric_provider_id
where mtr_id = mvw_metric_id AND mtr_metric_group_id is not null;
update draft_metric, snapshot_metric_version
SET mtr_metric_provider_id =  mvw_metric_provider_id
where mtr_id = floor(mvw_metric_id / 100)  AND mtr_metric_group_id is not null;

-- actualiza vista
update `snapshot_metric_version`
set mvw_metric_provider_id = (select mtr_metric_provider_id from metric where mtr_id = mvw_metric_id);


UPDATE version SET ver_value = '062' WHERE ver_name = 'DB';