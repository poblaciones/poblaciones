import fs from 'node:fs';
import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import MetricValues from '@/map/components/widgets/summary/metricValues.vue';
import MetricVariables from '@/map/components/widgets/summary/metricVariables.vue';
import MetricPanel from '@/map/components/widgets/summary/metric.vue';
import SelectedInfoRouter from '@/map/router/SelectedInfoRouter';

// Estructura de "Establecimientos penitenciarios": dos niveles agregados con
// una variable normalizada y un nivel final de ubicaciones con un conteo sin nombre.
function makeLocationsLevel(variables) {
	return makeLevel({
		Name: 'Ubicaciones',
		MinZoom: 12,
		MaxZoom: 20,
		Dataset: { Type: 'L', AreSegments: false, ShowInfo: true, Marker: null, Id: 1 },
		Variables: variables || [makeVariable({ Name: '', IsSimpleCount: true })],
	});
}

function makeAggregateLevel(name, minZoom, maxZoom) {
	return makeLevel({
		Name: name,
		MinZoom: minZoom,
		MaxZoom: maxZoom,
		Variables: [makeVariable({ Name: 'N', NormalizationScale: 1000000 })],
	});
}

function makeMetricWithLocations(aggregateLevels) {
	const levels = aggregateLevels || [makeAggregateLevel('Provincias', 0, 7), makeAggregateLevel('Departamentos', 8, 11)];
	levels.push(makeLocationsLevel());
	return new ActiveSelectedMetric(makeMetricProperties({
		Versions: [makeVersion({ Levels: levels })],
	}));
}

function mountVariables(metric, fixedLevel) {
	setupWindow();
	return mountLite(MetricVariables, { props: { metric: metric, fixedLevel: fixedLevel } });
}

function mountValues(metric) {
	setupWindow();
	return mountLite(MetricValues, { props: { metric: metric, variable: metric.SelectedVariable() } });
}

describe('ActiveMetric: nivel de ubicaciones aparte');

it('con niveles agregados y un último nivel de ubicaciones, el último queda aparte', () => {
	setupWindow();
	const metric = makeMetricWithLocations();
	expect(metric.HasSeparateBottomLevel()).toBeTruthy();
	expect(metric.MultilevelCount()).toBe(2);
});

it('sin nivel de ubicaciones no hay nivel aparte y cuentan todos', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeAggregateLevel('Provincias', 0, 7), makeAggregateLevel('Departamentos', 8, 20)] })],
	}));
	expect(metric.HasSeparateBottomLevel()).toBeFalsy();
	expect(metric.MultilevelCount()).toBe(2);
});

it('un indicador con solo el nivel de ubicaciones no tiene nada aparte', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLocationsLevel()] })],
	}));
	expect(metric.HasSeparateBottomLevel()).toBeFalsy();
	expect(metric.MultilevelCount()).toBe(1);
});

describe('metricValues: el nivel de ubicaciones no se elige ni se fija');

it('las opciones de nivel no incluyen las ubicaciones', () => {
	const metric = makeMetricWithLocations();
	const items = mountValues(metric).levelItems;
	expect(items.map(function (item) { return item.label; })).toEqual(['Provincias', 'Departamentos', undefined, 'Automático']);
});

it('con dos niveles agregados mostrando uno, hay selector de nivel', () => {
	const metric = makeMetricWithLocations();
	expect(mountValues(metric).hasLevelSelector).toBeTruthy();
});

it('mostrando las ubicaciones no hay selector de nivel ni pin', () => {
	const metric = makeMetricWithLocations();
	metric.SetLevel(metric.BottomLevel());
	expect(mountValues(metric).hasLevelSelector).toBeFalsy();
});

it('con un único nivel agregado no hay selector: no habría nada para elegir', () => {
	const metric = makeMetricWithLocations([makeAggregateLevel('Provincias', 0, 20)]);
	expect(mountValues(metric).hasLevelSelector).toBeFalsy();
});

it('sin ubicaciones, con varios niveles, el selector sigue como antes', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeAggregateLevel('Provincias', 0, 7), makeAggregateLevel('Departamentos', 8, 20)] })],
	}));
	expect(mountValues(metric).hasLevelSelector).toBeTruthy();
});

describe('metricVariables: filas con el nivel de ubicaciones aparte');

it('la única variable sin nombre de las ubicaciones tiene fila: permite alternar', () => {
	const metric = makeMetricWithLocations();
	const block = mountVariables(metric, metric.BottomLevel());
	expect(block.isRowVisible(0)).toBeTruthy();
});

it('la fila de los niveles agregados también se ve', () => {
	const metric = makeMetricWithLocations();
	const block = mountVariables(metric);
	expect(block.isRowVisible(0)).toBeTruthy();
});

it('sin nivel aparte, una única variable sin nombre sigue sin fila', () => {
	setupWindow();
	const level = makeLevel({ Variables: [makeVariable({ Name: '', IsSimpleCount: true })] });
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Versions: [makeVersion({ Levels: [level] })],
	}));
	expect(mountVariables(metric).isRowVisible(0)).toBeFalsy();
});

it('en modo solo lectura solo se ve la fila activa, de cualquiera de los dos bloques', () => {
	const metric = makeMetricWithLocations();
	const locations = mountVariables(metric, metric.BottomLevel());
	const aggregates = mountVariables(metric);
	window.Embedded.Readonly = true;
	expect(aggregates.isRowVisible(0)).toBeTruthy();
	expect(locations.isRowVisible(0)).toBeFalsy();
});

describe('metricVariables: rótulo de la fila de ubicaciones aparte');

it('la variable sin nombre de las ubicaciones se rotula "Ubicaciones"', () => {
	const metric = makeMetricWithLocations();
	const block = mountVariables(metric, metric.BottomLevel());
	expect(block.variableName(metric.BottomLevel().Variables[0])).toBe('Ubicaciones');
});

it('la variable llamada "Total" de las ubicaciones también se rotula "Ubicaciones"', () => {
	const metric = makeMetricWithLocations();
	metric.BottomLevel().Variables[0].Name = 'Total';
	const block = mountVariables(metric, metric.BottomLevel());
	expect(block.variableName(metric.BottomLevel().Variables[0])).toBe('Ubicaciones');
});

it('si el nivel aparte es de zonas propias, la fila dice "Zonas"', () => {
	const metric = makeMetricWithLocations();
	metric.BottomLevel().Dataset.Type = 'S';
	const block = mountVariables(metric, metric.BottomLevel());
	expect(block.variableName(metric.BottomLevel().Variables[0])).toBe('Zonas');
});

it('una variable con nombre propio conserva su nombre', () => {
	const metric = makeMetricWithLocations();
	metric.BottomLevel().Variables[0].Name = 'Capacidad';
	const block = mountVariables(metric, metric.BottomLevel());
	expect(block.variableName(metric.BottomLevel().Variables[0])).toBe('Capacidad');
});

it('con varias variables en ubicaciones no se reemplaza ningún nombre', () => {
	const metric = makeMetricWithLocations();
	const bottom = metric.BottomLevel();
	bottom.Variables = [makeVariable({ Name: 'Total' }), makeVariable({ Name: 'Capacidad' })];
	const block = mountVariables(metric, bottom);
	expect(block.variableName(bottom.Variables[0])).toBe('Total');
});

it('en los niveles agregados una variable sin nombre sigue diciendo "Conteo"', () => {
	setupWindow();
	const level = makeLevel({ Variables: [makeVariable({ Name: '', IsSimpleCount: true })] });
	const metric = new ActiveSelectedMetric(makeMetricProperties({ Versions: [makeVersion({ Levels: [level] })] }));
	expect(mountVariables(metric).variableName(level.Variables[0])).toBe('Conteo');
});

describe('metric: separación entre el bloque de ubicaciones y el de niveles agregados');

function mountPanel(metric) {
	return mountLite(MetricPanel, { props: { metric: metric, clipping: {} } });
}

it('con el detalle de ubicaciones desplegado, los bloques no se pegan', () => {
	const metric = makeMetricWithLocations();
	metric.SetLevel(metric.BottomLevel());
	metric.BottomLevel().SelectedVariableIndex = 0;
	metric.SelectedVersion().LabelsCollapsed = false;
	expect(mountPanel(metric).bottomBlockStyle).toBe('');
});

it('con las categorías ocultas, las filas quedan apiladas', () => {
	const metric = makeMetricWithLocations();
	metric.SetLevel(metric.BottomLevel());
	metric.BottomLevel().SelectedVariableIndex = 0;
	metric.SelectedVersion().LabelsCollapsed = true;
	expect(mountPanel(metric).bottomBlockStyle).toBe('margin-bottom: -1.5rem;');
});

it('con un nivel agregado activo, las filas quedan apiladas', () => {
	const metric = makeMetricWithLocations();
	metric.SelectedVersion().LabelsCollapsed = false;
	expect(mountPanel(metric).bottomBlockStyle).toBe('margin-bottom: -1.5rem;');
});

describe('metricVariables: alternar entre ubicaciones y niveles agregados');

it('elegir la variable de ubicaciones pasa a mostrar ese nivel sin tocar el automático', () => {
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	const version = metric.SelectedVersion();
	const automaticIndex = version.AutomaticLevelIndex;
	const block = mountVariables(metric, metric.BottomLevel());
	block.clickVariable(0);
	expect(metric.SelectedLevel()).toBe(metric.BottomLevel());
	expect(version.AutomaticLevelIndex).toBe(automaticIndex);
});

it('volver a una variable de niveles agregados muestra el nivel que resuelve el zoom', () => {
	const segMap = setupWindow();
	segMap.frame.Zoom = 9;
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	metric.UpdateLevel();
	const locations = mountVariables(metric, metric.BottomLevel());
	locations.clickVariable(0);
	const aggregates = mountVariables(metric);
	aggregates.clickVariable(0);
	expect(metric.SelectedLevel().Name).toBe('Departamentos');
});

it('con las ubicaciones mostradas, el zoom mueve el nivel automático pero no el mostrado', () => {
	const segMap = setupWindow();
	segMap.frame.Zoom = 5;
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	mountVariables(metric, metric.BottomLevel()).clickVariable(0);
	segMap.frame.Zoom = 9;
	metric.UpdateLevel();
	expect(metric.AutomaticLevel().Name).toBe('Departamentos');
	expect(metric.SelectedLevel()).toBe(metric.BottomLevel());
});

// Un recorte (por ejemplo un municipio) puede coincidir solo con la geografía
// de las ubicaciones: ese nivel no sigue al zoom y no puede volverse automático.
function clipOnlyBottomLevel(segMap, metric) {
	const bottom = metric.BottomLevel();
	segMap.Clipping.HasClippingLevels = function () { return true; };
	segMap.Clipping.LevelMachLevels = function (level) { return level === bottom; };
}

describe('ActiveMetric: el nivel automático nunca es el de ubicaciones');

it('un recorte que solo coincide con las ubicaciones no vuelve automático ese nivel', () => {
	const segMap = setupWindow();
	segMap.frame.Zoom = 5;
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	clipOnlyBottomLevel(segMap, metric);
	metric.UpdateLevel();
	expect(metric.AutomaticLevel()).toBeTruthy();
	expect(metric.AutomaticLevelIndex() < metric.MultilevelCount()).toBeTruthy();
});

it('con las ubicaciones mostradas y un recorte, no quedan dos filas activas', () => {
	const segMap = setupWindow();
	segMap.frame.Zoom = 5;
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	const locations = mountVariables(metric, metric.BottomLevel());
	locations.clickVariable(0);
	clipOnlyBottomLevel(segMap, metric);
	metric.UpdateLevel();
	const aggregates = mountVariables(metric);
	expect(locations.isActive(0)).toBeTruthy();
	expect(aggregates.isActive(0)).toBeFalsy();
	expect(metric.SelectedLevel()).toBe(metric.BottomLevel());
});

it('con un nivel agregado mostrado y un recorte, la selección se conserva', () => {
	const segMap = setupWindow();
	segMap.frame.Zoom = 5;
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	mountVariables(metric).clickVariable(0);
	clipOnlyBottomLevel(segMap, metric);
	metric.UpdateLevel();
	expect(metric.SelectedLevel() !== metric.BottomLevel()).toBeTruthy();
	expect(mountVariables(metric, metric.BottomLevel()).isActive(0)).toBeFalsy();
});

it('un nivel fijado en las ubicaciones no se aplica', () => {
	const segMap = setupWindow();
	const metric = makeMetricWithLocations();
	metric.UpdateMap = function () {};
	metric.PinLevelByName('Ubicaciones');
	expect(metric.ApplyPinnedLevel()).toBeFalsy();
	expect(metric.AutomaticLevel() !== metric.BottomLevel()).toBeTruthy();
});

describe('panel de variables: ranking dentro de variableDetail');

const SUMMARY_DIR = new URL('../components/widgets/summary/', import.meta.url);

function readSummaryFile(name) {
	return fs.readFileSync(new URL(name, SUMMARY_DIR), 'utf8');
}

it('variableDetail tiene 10px de relleno a cada lado y recibe el ranking por su ranura', () => {
	const source = readSummaryFile('metricVariables.vue');
	const css = source.substring(source.indexOf('.variableDetail'));
	expect(css.indexOf('padding-left: 10px') !== -1).toBeTruthy();
	expect(css.indexOf('padding-right: 10px') !== -1).toBeTruthy();
	const detail = source.substring(source.indexOf('class="variableDetail"'), source.indexOf('</mp-collapse>', source.indexOf('<slot')));
	expect(detail.indexOf('<div v-if="isActive(index)" class="detailSlot"') !== -1).toBeTruthy();
	expect(detail.indexOf('<slot></slot>') !== -1).toBeTruthy();
});

it('metric.vue ubica el ranking dentro de los bloques de variables, no al final del panel', () => {
	const source = readSummaryFile('metric.vue');
	const template = source.substring(0, source.indexOf('</template>\n<script>'));
	const lastVariables = template.lastIndexOf('</MetricVariables>');
	const lastRanking = template.lastIndexOf('<Ranking ');
	expect(lastRanking < lastVariables).toBeTruthy();
	expect(template.indexOf('<MetricVariables :metric="metric" @variableChanged="variableChanged">') < template.indexOf('<Ranking ', template.indexOf('<MetricVariables :metric="metric" @variableChanged="variableChanged">'))).toBeTruthy();
});

it('el espacio bajo el ranking existe solo si debajo hay la fila de otra variable', () => {
	setupWindow();
	const metric = makeMetricWithLocations();
	const main = mountLite(MetricVariables, { props: { metric: metric } });
	const levelVariables = main.level.Variables.length;
	expect(levelVariables > 0).toBeTruthy();
	main.level.Variables.push(makeVariable({ Name: 'Otra' }));
	expect(main.isFollowedByVariable(0)).toBe(true);
	expect(main.isFollowedByVariable(main.level.Variables.length - 1)).toBe(false);
	const bottom = mountLite(MetricVariables, { props: { metric: metric, fixedLevel: metric.BottomLevel() } });
	expect(bottom.isFollowedByVariable(0)).toBe(true);
});

describe('variable elegida: se conserva al moverse por la serie');

function twoVariables() {
	return [makeVariable({ Name: 'Total' }), makeVariable({ Name: 'Por sector' })];
}

function makeSeries(levelsPerVersion) {
	return new ActiveSelectedMetric(makeMetricProperties({
		Versions: levelsPerVersion.map(function (levels) { return makeVersion({ Levels: levels }); }),
	}));
}

function makeAggregateWithTwoVariables(name, minZoom, maxZoom) {
	return makeLevel({ Name: name, MinZoom: minZoom, MaxZoom: maxZoom, Variables: twoVariables() });
}

function indexes(metric, levelIndex) {
	return metric.properties.Versions.map(function (version) { return version.Levels[levelIndex].SelectedVariableIndex; });
}

function restore(metric, route) {
	const router = new SelectedInfoRouter();
	const state = router.parseMetric(route);
	router.RestoreMetricState(metric, state);
}

it('SelectVariableInAllVersions lleva la variable a todas las series y a los niveles que siguen al zoom', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 7), makeAggregateWithTwoVariables('Departamentos', 8, 11), makeLocationsLevel(twoVariables())],
		[makeAggregateWithTwoVariables('Provincias', 0, 7), makeAggregateWithTwoVariables('Departamentos', 8, 11), makeLocationsLevel(twoVariables())],
	]);
	const level = metric.properties.Versions[0].Levels[0];
	metric.SelectVariableInAllVersions(level, 1, false);
	expect(indexes(metric, 0)).toEqual([1, 1]);
	expect(indexes(metric, 1)).toEqual([1, 1]);
	expect(indexes(metric, 2)).toEqual([0, 0]);
	metric.SelectVariableInAllVersions(metric.properties.Versions[0].Levels[2], 1, true);
	expect(indexes(metric, 2)).toEqual([1, 1]);
});

it('la variable se busca por nombre: una serie que las ordena distinto igual la conserva', () => {
	setupWindow();
	const metric = makeSeries([
		[makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 20, Variables: [makeVariable({ Name: 'Total' }), makeVariable({ Name: 'Por sector' })] })],
		[makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 20, Variables: [makeVariable({ Name: 'Por nivel' }), makeVariable({ Name: 'Total' }), makeVariable({ Name: 'Por sector' })] })],
	]);
	metric.SelectVariableInAllVersions(metric.properties.Versions[0].Levels[0], 1, false);
	expect(indexes(metric, 0)).toEqual([1, 2]);
});

it('una serie sin una variable de ese nombre queda como estaba', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
		[makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 20, Variables: [makeVariable({ Name: 'Total' })] })],
	]);
	metric.SelectVariableInAllVersions(metric.properties.Versions[0].Levels[0], 1, false);
	expect(indexes(metric, 0)).toEqual([1, 0]);
});

it('deseleccionar la variable (-1) la deselecciona en todas las series', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
	]);
	metric.SelectVariableInAllVersions(metric.properties.Versions[0].Levels[0], -1, false);
	expect(indexes(metric, 0)).toEqual([-1, -1]);
});

it('al restaurar desde la ruta, la variable también queda elegida en las otras series', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
	]);
	restore(metric, { '': '1', v: '1', i: '1' });
	expect(metric.properties.SelectedVersionIndex).toBe(1);
	expect(indexes(metric, 0)).toEqual([1, 1, 1]);
});

it('al restaurar desde la ruta, la variable se busca por nombre en las otras series', () => {
	setupWindow();
	const metric = makeSeries([
		[makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 20, Variables: [makeVariable({ Name: 'Por nivel' }), makeVariable({ Name: 'Por sector' })] })],
		[makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 20, Variables: [makeVariable({ Name: 'Total' }), makeVariable({ Name: 'Por sector' }), makeVariable({ Name: 'Por nivel' })] })],
	]);
	restore(metric, { '': '1', v: '0', i: '1' });
	expect(indexes(metric, 0)).toEqual([1, 1]);
	restore(metric, { '': '1', v: '1', i: '2' });
	expect(indexes(metric, 0)).toEqual([0, 2]);
});

it('al restaurar la variable de las ubicaciones aparte solo se toca ese nivel en todas las series', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 7), makeAggregateWithTwoVariables('Departamentos', 8, 11), makeLocationsLevel(twoVariables())],
		[makeAggregateWithTwoVariables('Provincias', 0, 7), makeAggregateWithTwoVariables('Departamentos', 8, 11), makeLocationsLevel(twoVariables())],
	]);
	restore(metric, { '': '1', a: '2', i: '1' });
	expect(indexes(metric, 2)).toEqual([1, 1]);
	expect(indexes(metric, 0)).toEqual([0, 0]);
	expect(indexes(metric, 1)).toEqual([0, 0]);
});

it('restaurar una ruta sin variable elegida (la primera) deja las demás series en la primera', () => {
	setupWindow();
	const metric = makeSeries([
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
		[makeAggregateWithTwoVariables('Provincias', 0, 20)],
	]);
	restore(metric, { '': '1' });
	expect(indexes(metric, 0)).toEqual([0, 0]);
});
