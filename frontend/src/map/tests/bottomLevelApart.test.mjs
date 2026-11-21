import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import MetricValues from '@/map/components/widgets/summary/metricValues.vue';
import MetricVariables from '@/map/components/widgets/summary/metricVariables.vue';

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
