import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import MetricsTab from '@/backoffice/views/Metric/MetricsTab.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';
import { makeVariable } from './scaleGeneratorFixtures.mjs';

function setup(routeQuery) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Geocoded = true;
	dataset.properties.MultilevelMatrix = 2;
	dataset.MetricVersionLevels = [{ Id: 20, Variables: [] }];
	context.CurrentDataset = dataset;
	const metricVersions = { list: [], GetAll(callback) { this.callbacks = (this.callbacks || []).concat([callback]); } };
	context.CurrentWork = { properties: { Type: 'R' }, MetricVersions: metricVersions };
	context.Configuration = { UseCalculated: true };
	const refs = {
		invoker: {
			messages: [],
			confirmDos: [],
			saved: [],
			result: Promise.resolve([]),
			doMessage(...args) { this.messages.push(args); return this.result; },
			confirmDo(...args) { this.confirmDos.push(args); },
			doSave(...args) { this.saved.push(args); },
		},
		newMetric: { shown: 0, show() { this.shown++; } },
		calculatedMetricWizard: { shown: [], show(...args) { this.shown.push(args); } },
		pickMetricVersion: { shown: 0, show() { this.shown++; } },
		levelPopup: { shown: [], show(...args) { this.shown.push(args); } },
		metricPopup: { shown: [], show(...args) { this.shown.push(args); } },
		editVariableFormulaPopup: { shown: [], show(...args) { this.shown.push(args); } },
		editVariableSymbologyPopup: { shown: [], show(...args) { this.shown.push(args); } },
		editVariableOptionsPopup: { shown: [], show(...args) { this.shown.push(args); } },
	};
	const vm = mountLite(MetricsTab, { mocks: { $refs: refs, $route: { query: routeQuery || {} } } });
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser, metricVersions: metricVersions };
}

function labels(segments) {
	return segments.map(function (segment) { return segment.label; }).join('');
}

describe('MetricsTab: propiedades calculadas');

it('list toma los niveles del dataset y isTableReady exige dataset, niveles y columnas', () => {
	const { vm, dataset, context } = setup();
	expect(vm.list === dataset.MetricVersionLevels).toBeTruthy();
	expect(vm.isTableReady).toBe(true);
	dataset.Columns = null;
	expect(vm.isTableReady).toBe(false);
	context.CurrentDataset = null;
	expect(vm.isTableReady).toBe(false);
});

it('canLevel exige datos públicos con al menos un nivel, y es falso sin dataset', () => {
	const { vm, context, dataset } = setup();
	expect(vm.canLevel).toBeFalsy();
	context.CurrentWork.properties.Type = 'P';
	expect(vm.canLevel).toBeTruthy();
	dataset.MetricVersionLevels = [];
	expect(vm.canLevel).toBeFalsy();
	context.CurrentDataset = null;
	expect(vm.canLevel).toBe(false);
});

it('isSearchTarget compara el nivel con el parámetro level de la dirección como texto', () => {
	const { vm } = setup({ level: '20' });
	expect(vm.isSearchTarget({ Id: 20 })).toBe(true);
	expect(vm.isSearchTarget({ Id: 21 })).toBe(false);
});

it('scrollToSearchTarget lleva la fila encontrada al centro y no hace nada si no existe', () => {
	const { vm } = setup();
	const options = [];
	vm.$el = { querySelector() { return { scrollIntoView(arg) { options.push(arg); } }; } };
	vm.scrollToSearchTarget();
	expect(options).toEqual([{ block: 'center' }]);
	vm.$el = { querySelector() { return null; } };
	vm.scrollToSearchTarget();
	expect(options).toHaveLength(1);
});

it('al estar la tabla lista se desplaza al resultado de búsqueda en el siguiente ciclo', async () => {
	const { vm } = setup();
	let scrolled = 0;
	vm.scrollToSearchTarget = function () { scrolled++; };
	MetricsTab.watch.isTableReady.handler.call(vm, false);
	await Promise.resolve();
	expect(scrolled).toBe(0);
	MetricsTab.watch.isTableReady.handler.call(vm, true);
	await Promise.resolve();
	expect(scrolled).toBe(1);
});

describe('MetricsTab: fórmula de la variable');

function formulaVariable(overrides, symbologyOverrides) {
	return makeVariable(symbologyOverrides, Object.assign({ Data: 'O' }, overrides));
}

it('una variable de conteo se muestra como Conteo', () => {
	const { vm } = setup();
	expect(labels(vm.formulaToSegments(formulaVariable({ Data: 'N' })))).toBe('Conteo');
	expect(labels(vm.formulaToSegments(formulaVariable({ Data: 'O', DataColumnIsCategorical: true })))).toBe('Conteo');
});

it('una variable sobre una columna muestra su nombre y, si tiene etiqueta, la agrega como ayuda', () => {
	const { vm, dataset } = setup();
	dataset.Columns[0].Label = 'Latitud';
	const segments = vm.formulaToSegments(formulaVariable({ DataColumn: dataset.Columns[0] }));
	expect(segments).toEqual([{ label: 'lat', tooltip: 'Latitud' }]);
	const plain = vm.formulaToSegments(formulaVariable({ DataColumn: dataset.Columns[1] }));
	expect(plain).toEqual([{ label: 'lon', tooltip: null }]);
});

it('con normalización agrega el divisor y la escala', () => {
	const { vm, dataset } = setup();
	const variable = formulaVariable({ DataColumn: dataset.Columns[0], Normalization: 'O', NormalizationColumn: dataset.Columns[1] });
	const expectedByScale = { 100: 'lat / lon * 100', 1000: 'lat / lon / 1.000', 10000: 'lat / lon / 10.000', 100000: 'lat / lon / 100.000', 1000000: 'lat / lon / 1.000.000', 1: 'lat / lon' };
	for (const scale of Object.keys(expectedByScale)) {
		variable.NormalizationScale = Number(scale);
		expect(labels(vm.formulaToSegments(variable))).toBe(expectedByScale[scale]);
	}
});

it('una brecha en porcentaje muestra la resta entre ambos términos', () => {
	const { vm, dataset } = setup();
	const variable = formulaVariable({
		IsGap: true, DataColumn: dataset.Columns[0], GapData: 'O', GapDataColumn: dataset.Columns[1],
		Normalization: 'O', NormalizationColumn: dataset.Columns[2], NormalizationScale: 100,
		GapNormalization: 'O', GapNormalizationColumn: dataset.Columns[2],
	});
	expect(labels(vm.formulaToSegments(variable))).toBe('lon / codigo * 100 - lat / codigo * 100');
});

it('una brecha sin porcentaje muestra la variación relativa respecto del segundo término', () => {
	const { vm, dataset } = setup();
	const variable = formulaVariable({ IsGap: true, DataColumn: dataset.Columns[0], GapData: 'O', GapDataColumn: dataset.Columns[1] });
	expect(labels(vm.formulaToSegments(variable))).toBe('(lon - lat) / lon * 100');
});

it('con corte por variable agrega "por" y la columna de corte', () => {
	const { vm, dataset } = setup();
	const variable = formulaVariable({ Data: 'N' }, { CutMode: 'V', CutColumn: dataset.Columns[2] });
	expect(labels(vm.formulaToSegments(variable))).toBe('Conteo por codigo');
});

it('formatGroup, formatMultilevel y los datos del filtro se formatean para la tabla', () => {
	const { vm } = setup();
	expect(vm.formatGroup(null)).toBe('-');
	expect(vm.formatGroup(undefined)).toBe('-');
	expect(vm.formatGroup({ Caption: 'Grupo' })).toBe('Grupo');
	expect(vm.formatMultilevel({ MetricVersion: { Multilevel: true } })).toBe('Sí');
	expect(vm.formatMultilevel({ MetricVersion: { Multilevel: false } })).toBe('No');
});

it('los datos del filtro de la variable se toman del filtro interpretado', () => {
	const { vm } = setup();
	const filtered = { FilterValue: "codigo\t<>\t'AB'" };
	expect(vm.getFilterColumn({ FilterValue: null })).toBeNull();
	expect(vm.getFilterColumn(filtered).Id).toBe(3);
	expect(vm.formatFilterOperator(filtered)).toBe(' ≠ ');
	expect(vm.formatFilterValue(filtered)).toBe('AB');
});

describe('MetricsTab: acciones de indicadores');

it('crear un indicador nuevo, un nivel o editar un indicador abre su popup', () => {
	const { vm, refs } = setup();
	vm.createNewMetric();
	vm.createNewLevel();
	vm.openEdition({ Id: 20 });
	expect(refs.newMetric.shown).toBe(1);
	expect(refs.pickMetricVersion.shown).toBe(1);
	expect(refs.metricPopup.shown).toEqual([[{ Id: 20 }]]);
});

it('calculateEnabled refleja la configuración del sistema', () => {
	const { vm, context } = setup();
	expect(vm.calculateEnabled()).toBe(true);
	context.Configuration.UseCalculated = false;
	expect(vm.calculateEnabled()).toBe(false);
});

it('los indicadores calculados exigen un dataset georreferenciado y luego abren el asistente', () => {
	const { vm, refs, dataset, browser } = setup();
	dataset.properties.Geocoded = false;
	vm.calculateNewMetricDistance();
	vm.calculateNewMetricAreaCount();
	expect(browser.alerts).toEqual([
		'Para realizar un rastreo es necesario antes georreferenciar el dataset.',
		'Para definir un conteo es necesario antes georreferenciar el dataset.',
	]);
	expect(refs.calculatedMetricWizard.shown).toHaveLength(0);
	dataset.properties.Geocoded = true;
	vm.calculateNewMetricDistance();
	vm.calculateNewMetricAreaCount();
	expect(refs.calculatedMetricWizard.shown).toEqual([[true], []]);
});

it('onCompleteLevel completa el nivel con el generador de niveles', () => {
	const { vm, refs, dataset } = setup();
	vm.onCompleteLevel({ Id: 1 });
	expect(refs.invoker.messages[0][0]).toBe('Completando nivel');
	expect(refs.invoker.messages[0][1] === dataset.LevelGenerator).toBeTruthy();
	expect(refs.invoker.messages[0][2] === dataset.LevelGenerator.CompleteLevel).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toEqual({ Id: 1 });
});

it('levelDataset trae los datasets relacionados, se quita a sí mismo y abre el selector', async () => {
	const { vm, refs } = setup();
	refs.invoker.result = Promise.resolve([{ Id: 5 }, { Id: 8 }, { Id: 9 }]);
	vm.levelDataset();
	await Promise.resolve();
	await Promise.resolve();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo niveles');
	expect(refs.levelPopup.shown[0][0].map(function (dataset) { return dataset.Id; })).toEqual([8, 9]);
});

it('onDelete pide confirmar y elimina el nivel del indicador', () => {
	const { vm, refs, dataset } = setup();
	vm.onDelete({ Id: 20 });
	expect(refs.invoker.message).toBe('Eliminando...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Eliminar indicador', 'El indicador seleccionado será eliminado']);
	expect(refs.invoker.confirmDos[0][3] === dataset.DeleteMetricVersionLevel).toBeTruthy();
	expect(refs.invoker.confirmDos[0][4]).toEqual({ Id: 20 });
});

describe('MetricsTab: variables');

it('isFirst e isLast identifican la posición de la variable en el nivel', () => {
	const { vm } = setup();
	const level = { Variables: [{ Id: 1 }, { Id: 2 }, { Id: 3 }] };
	expect(vm.isFirst(level, level.Variables[0])).toBe(true);
	expect(vm.isFirst(level, level.Variables[1])).toBe(false);
	expect(vm.isLast(level, level.Variables[2])).toBe(true);
	expect(vm.isLast(level, level.Variables[0])).toBe(false);
});

it('up y down guardan el movimiento de la variable', () => {
	const { vm, refs, dataset } = setup();
	const level = { Id: 20 };
	const variable = { Id: 1 };
	vm.up(level, variable);
	vm.down(level, variable);
	expect(refs.invoker.saved[0][1] === dataset.MoveVariableUp).toBeTruthy();
	expect(refs.invoker.saved[1][1] === dataset.MoveVariableDown).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([level, variable]);
});

it('createNewVariable toma una variable nueva del catálogo con la categoría Total y abre su fórmula', () => {
	const { vm, refs, context } = setup();
	context.Factory = { GetCopy(type, callback) { callback({ Type: type, Id: null }); } };
	const level = { Id: 20 };
	vm.createNewVariable(level);
	const [shownLevel, variable] = refs.editVariableFormulaPopup.shown[0];
	expect(shownLevel === level).toBeTruthy();
	expect(variable.Type).toBe('Variable');
	expect(variable.Values).toHaveLength(1);
	expect(variable.Values[0].Caption).toBe('Total');
	expect(variable.Values[0].Value).toBe(1);
});

it('las ediciones de fórmula y opciones abren su popup con el nivel y la variable', () => {
	const { vm, refs } = setup();
	const level = { Id: 20 };
	const variable = { Id: 1 };
	vm.openVariableFormulaEdition(level, variable);
	vm.openVariableOptionsEdition(level, variable);
	expect(refs.editVariableFormulaPopup.shown[0]).toEqual([level, variable]);
	expect(refs.editVariableOptionsPopup.shown[0]).toEqual([level, variable]);
});

it('la simbología exige un dataset georreferenciado', () => {
	const { vm, refs, dataset, browser } = setup();
	dataset.properties.Geocoded = false;
	vm.openVariableSymbologyEdition({ Id: 20 }, makeVariable({}));
	expect(browser.alerts).toEqual(['Para definir la simbología del indicador es necesario antes georreferenciar el dataset.']);
	expect(refs.editVariableSymbologyPopup.shown).toHaveLength(0);
});

it('la simbología se abre enseguida si las distribuciones ya están calculadas', () => {
	const { vm, refs, dataset } = setup();
	const variable = makeVariable({});
	dataset.ScaleGenerator.InfoCache[dataset.ScaleGenerator.createKey(variable)] = {};
	vm.openVariableSymbologyEdition({ Id: 20 }, variable);
	expect(refs.editVariableSymbologyPopup.shown).toHaveLength(1);
	expect(refs.invoker.messages).toHaveLength(0);
});

it('la simbología calcula primero las distribuciones si faltan y luego se abre', async () => {
	const { vm, refs, dataset } = setup();
	const variable = makeVariable({});
	vm.openVariableSymbologyEdition({ Id: 20 }, variable);
	expect(refs.invoker.messages[0][0]).toBe('Calculando distribuciones');
	expect(refs.invoker.messages[0][2] === dataset.ScaleGenerator.GetColumnDistributions).toBeTruthy();
	expect(refs.editVariableSymbologyPopup.shown).toHaveLength(0);
	await Promise.resolve();
	await Promise.resolve();
	expect(refs.editVariableSymbologyPopup.shown).toHaveLength(1);
});

it('onDeleteVariable pide confirmar y quita la variable del indicador', () => {
	const { vm, refs, dataset } = setup();
	vm.onDeleteVariable({ Id: 20 }, { Id: 1 });
	expect(refs.invoker.message).toBe('Eliminando...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Eliminar variable', 'La variable seleccionada será quitada del indicador']);
	expect(refs.invoker.confirmDos[0][3] === dataset.DeleteVariable).toBeTruthy();
});

describe('MetricsTab: versiones sin usar');

const VERSIONS = [
	{ Id: 1, Levels: [{ MultilevelMatrix: 2, DatasetId: 5 }] },
	{ Id: 2, Levels: [{ MultilevelMatrix: 2, DatasetId: 99 }] },
	{ Id: 3, Levels: [{ MultilevelMatrix: 7, DatasetId: 98 }] },
	{ Id: 4, Levels: [{ MultilevelMatrix: 7, DatasetId: 97 }, { MultilevelMatrix: 2, DatasetId: 96 }] },
];

it('hasMatchingMatrix y containsCurrentDataset inspeccionan los niveles de la versión', () => {
	const { vm } = setup();
	expect(vm.hasMatchingMatrix(VERSIONS[0])).toBe(true);
	expect(vm.hasMatchingMatrix(VERSIONS[2])).toBe(false);
	expect(vm.hasMatchingMatrix(VERSIONS[3])).toBe(true);
	expect(vm.containsCurrentDataset(VERSIONS[0])).toBe(true);
	expect(vm.containsCurrentDataset(VERSIONS[1])).toBe(false);
});

it('filterNotMatched conserva las versiones de la misma matriz que no incluyen al dataset actual', () => {
	const { vm } = setup();
	expect(vm.filterNotMatched(VERSIONS).map(function (version) { return version.Id; })).toEqual([2, 4]);
});

it('ReloadUnUsedMetricVersions guarda las versiones filtradas, y se repite al cambiar la lista del trabajo', () => {
	const { vm, metricVersions } = setup();
	vm.ReloadUnUsedMetricVersions();
	metricVersions.callbacks[0](VERSIONS);
	expect(vm.unUsedWorkVersionsList.map(function (version) { return version.Id; })).toEqual([2, 4]);
	MetricsTab.watch['Work.MetricVersions.list'].call(vm);
	expect(metricVersions.callbacks).toHaveLength(2);
});
