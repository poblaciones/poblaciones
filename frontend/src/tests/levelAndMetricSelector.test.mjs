import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import MetricValues from '@/map/components/widgets/summary/metricValues.vue';

function conNiveles(nombres, versiones) {
	const armarVersion = function () {
		return makeVersion({
			Levels: nombres.map(function (n) { return makeLevel({ Name: n }); }),
		});
	};
	const props = makeMetricProperties({
		Versions: (versiones || 1) === 1 ? [armarVersion()] : [armarVersion(), armarVersion()],
	});
	return new ActiveSelectedMetric(props);
}

function mountValues(metric) {
	setupWindow();
	return mountLite(MetricValues, { props: { metric: metric, variable: metric.SelectedVariable() } });
}

describe('ActiveMetric: fijar y liberar el nivel');

it('PinLevelByName fija el nivel homónimo en todas las versiones y libera el resto', () => {
	setupWindow();
	const metric = conNiveles(['Provincias', 'Departamentos'], 2);
	metric.PinLevelByName('Departamentos');
	metric.properties.Versions.forEach(function (version) {
		expect(version.Levels[0].Pinned).toBeFalsy();
		expect(version.Levels[1].Pinned).toBeTruthy();
	});
});

it('fijar un nivel distinto libera el anterior', () => {
	setupWindow();
	const metric = conNiveles(['Provincias', 'Departamentos']);
	metric.PinLevelByName('Departamentos');
	metric.PinLevelByName('Provincias');
	const levels = metric.SelectedVersion().Levels;
	expect(levels[0].Pinned).toBeTruthy();
	expect(levels[1].Pinned).toBeFalsy();
});

it('PinLevelIndex acopla los dos índices y muestra ese nivel', () => {
	setupWindow();
	const metric = conNiveles(['Provincias', 'Departamentos']);
	metric.PinLevelIndex(1);
	const version = metric.SelectedVersion();
	expect(version.SelectedLevelIndex).toBe(1);
	expect(version.AutomaticLevelIndex).toBe(1);
	expect(version.Levels[1].Pinned).toBeTruthy();
});

it('ReleaseLevel libera el pin en todas las versiones', () => {
	setupWindow();
	const metric = conNiveles(['Provincias', 'Departamentos'], 2);
	metric.PinLevelByName('Departamentos');
	metric.ReleaseLevel();
	metric.properties.Versions.forEach(function (version) {
		version.Levels.forEach(function (level) {
			expect(level.Pinned).toBeFalsy();
		});
	});
});

it('con un nivel fijado, UpdateLevel no lo mueve aunque cambie el zoom', () => {
	const segMap = setupWindow();
	const metric = conNiveles(['Provincias', 'Departamentos']);
	metric.SelectedVersion().Levels[0].MinZoom = 0;
	metric.SelectedVersion().Levels[0].MaxZoom = 7;
	metric.SelectedVersion().Levels[1].MinZoom = 8;
	metric.SelectedVersion().Levels[1].MaxZoom = 20;
	metric.PinLevelIndex(0);
	segMap.frame.Zoom = 14; // correspondería Departamentos
	expect(metric.UpdateLevel()).toBeFalsy();
	expect(metric.SelectedVersion().SelectedLevelIndex).toBe(0);
});

describe('metricValues: opciones del selector de nivel');

it('ofrece TODOS los niveles, más un separador y Automático', () => {
	// El separador tiene que ser un ítem propio: como flag sobre un ítem
	// existente, mpDropdownMenu lo dibuja en lugar de ese ítem y el último
	// nivel desaparece de la lista.
	const metric = conNiveles(['Provincias', 'Departamentos', 'Radios']);
	const values = mountValues(metric);
	const items = values.levelItems;
	expect(items.filter(i => !i.separator).map(i => i.label).join(','))
		.toBe('Provincias,Departamentos,Radios,Automático');
	expect(items.filter(i => i.separator)).toHaveLength(1);
	expect(items[items.length - 1].label).toBe('Automático');
});

it('sin nivel fijado, el tilde va en Automático', () => {
	const metric = conNiveles(['Provincias', 'Departamentos']);
	const values = mountValues(metric);
	expect(values.isAutomaticLevel).toBeTruthy();
	const items = values.levelItems.filter(i => !i.separator);
	expect(items[items.length - 1].icon).toBe('fas fa-check');
	expect(items[0].icon).toBe('');
});

it('con un nivel fijado, el tilde va en ese nivel', () => {
	const metric = conNiveles(['Provincias', 'Departamentos']);
	metric.PinLevelByName('Departamentos');
	const values = mountValues(metric);
	expect(values.isAutomaticLevel).toBeFalsy();
	const items = values.levelItems.filter(i => !i.separator);
	expect(items[1].icon).toBe('fas fa-check');
	expect(items[items.length - 1].icon).toBe('');
});

it('elegir un nivel lo fija; elegir Automático lo libera', () => {
	const metric = conNiveles(['Provincias', 'Departamentos']);
	metric.UpdateMap = function () {};
	const values = mountValues(metric);
	values.levelSelected({ key: 1 });
	expect(metric.SelectedVersion().Levels[1].Pinned).toBeTruthy();
	values.levelSelected({ key: 'AUTO' });
	expect(values.isAutomaticLevel).toBeTruthy();
});

describe('metricValues: opciones del selector de métrica');

it('cada ítem combina el encabezado corto y la descripción', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	const items = values.metricItems.filter(i => !i.separator);
	expect(items[0].label).toBe('N - Cantidad');
	expect(items.every(i => i.label.indexOf(' - ') !== -1)).toBeTruthy();
});

it('el encabezado del ítem va sin marcado (los menús no interpretan HTML)', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	const km2 = values.metricItems.find(i => i.key === 'K');
	expect(km2.label.indexOf('<') === -1).toBeTruthy();
	expect(km2.label).toBe('Km2 - Área');
});

it('el tilde marca la métrica activa', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	const activa = values.metricItems.find(i => i.key === metric.properties.SummaryMetric);
	expect(activa.icon).toBe('fas fa-check');
});

it('elegir una métrica la aplica', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	values.metricSelected({ key: 'K' });
	expect(metric.properties.SummaryMetric).toBe('K');
});

describe('Summary: encabezado por clave');

it('getValueHeaderText saca el marcado del encabezado', () => {
	setupWindow();
	const metric = conNiveles(['Provincias']);
	expect(metric.Summary.getValueHeaderOf('K')).toBe('Km<sup>2</sup>');
	expect(metric.Summary.getValueHeaderText('K')).toBe('Km2');
	expect(metric.Summary.getValueHeaderText('A')).toBe('% Km2');
});

it('getValueHeader sigue devolviendo el de la métrica activa', () => {
	setupWindow();
	const metric = conNiveles(['Provincias']);
	metric.properties.SummaryMetric = 'K';
	expect(metric.Summary.getValueHeader(metric.SelectedVariable())).toBe('Km<sup>2</sup>');
});

describe('Separadores de los menús');

it('los separadores son ítems propios, no un flag sobre otro ítem', () => {
	// mpDropdownMenu dibuja el separador EN LUGAR del ítem que lo lleva
	// (el <a> tiene v-if="!item.separator"): marcado sobre un nivel, ese
	// nivel desaparece del menú.
	const metric = conNiveles(['Provincias', 'Departamentos', 'Radios']);
	const values = mountValues(metric);
	values.levelItems.forEach(function (item) {
		if (item.separator) {
			expect(item.label === undefined).toBeTruthy();
		}
	});
	values.metricItems.forEach(function (item) {
		if (item.separator) {
			expect(item.label === undefined).toBeTruthy();
		}
	});
});

it('las métricas se agrupan: cantidad, proporciones, área y total', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	const grupos = [[]];
	values.metricItems.forEach(function (item) {
		if (item.separator) {
			grupos.push([]);
		} else {
			grupos[grupos.length - 1].push(item.key);
		}
	});
	expect(grupos[0]).toEqual(['N']);
	expect(grupos[grupos.length - 1]).toEqual(['T']);
	expect(grupos.length).toBe(4);
});

it('el último grupo no lleva separador al final', () => {
	const metric = conNiveles(['Provincias']);
	const values = mountValues(metric);
	const items = values.metricItems;
	expect(items[items.length - 1].separator).toBeFalsy();
});

it('un grupo sin métricas presentes no deja un separador suelto', () => {
	setupWindow();
	// Sin área, el grupo K/A/D no existe: no debe quedar su separador.
	const metric = conNiveles(['Provincias']);
	metric.SelectedLevel().HasArea = false;
	const values = mountValues(metric);
	const keys = values.metricItems.filter(i => !i.separator).map(i => i.key);
	expect(keys.includes('K')).toBeFalsy();
	// Dos separadores: tras N y tras el grupo de proporciones.
	expect(values.metricItems.filter(i => i.separator)).toHaveLength(2);
});
