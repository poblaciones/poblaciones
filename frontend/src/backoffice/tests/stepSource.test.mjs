import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import StepSource from '@/backoffice/views/Dataset/CalculatedWizard/StepSource.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function makeNewMetric(overrides) {
	return Object.assign({
		Type: 'area',
		Source: { VariableId: null, ValueLabelIds: [] },
		Output: { HasValue: true, HasDescription: true },
		OutputArea: { HasSumValue: false, HasMaxValue: true, HasMinValue: true, HasCount: false, IsInclusionPoint: false },
		SourceMetric: null,
		SelectedVersion: null,
		SelectedLevel: null,
		SelectedVariable: null,
	}, overrides);
}

function setup(newMetricOverrides) {
	axios.reset();
	const browser = setupBackoffice('P');
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	browser.window.Context.CurrentDataset = dataset;
	const vm = mountLite(StepSource, { propsData: { newMetric: makeNewMetric(newMetricOverrides) } });
	browser.confirmations = [];
	browser.answer = true;
	globalThis.confirm = function (message) { browser.confirmations.push(message); return browser.answer; };
	return { vm: vm, dataset: dataset, browser: browser };
}

function runWatch(vm, name) {
	StepSource.watch[name].call(vm);
}

function makeVariable(id, overrides) {
	return Object.assign({ Id: id, IsSimpleCount: false, ValueLabels: [{ Id: 1 }, { Id: 2 }, { Id: 3 }] }, overrides);
}

describe('StepSource: propiedades calculadas');

it('caption toma el nombre del indicador elegido, o vacío', () => {
	const { vm } = setup();
	expect(vm.caption).toBe('');
	vm.newMetric.SourceMetric = { Metric: { Name: 'Población' } };
	expect(vm.caption).toBe('Población');
	vm.newMetric.SourceMetric = { Metric: null };
	expect(vm.caption).toBe('');
});

it('action es rastreo para distancia y conteo para área', () => {
	const { vm } = setup({ Type: 'distance' });
	expect(vm.action).toBe('rastreo');
	vm.newMetric.Type = 'area';
	expect(vm.action).toBe('conteo');
});

it('versions asigna a cada versión su identificador y levels, variables y valueLabels siguen la selección', () => {
	const levels = [{ Name: 'N1', Variables: [makeVariable(1)] }];
	const { vm } = setup();
	vm.newMetric.SourceMetric = { Versions: [{ Version: { Id: 7 } }, { Version: { Id: 8 } }] };
	expect(vm.versions.map(function (version) { return version.Id; })).toEqual([7, 8]);
	expect(vm.levels).toEqual([]);
	expect(vm.variables).toEqual([]);
	expect(vm.valueLabels).toEqual([]);
	vm.newMetric.SelectedVersion = { Levels: levels };
	vm.newMetric.SelectedLevel = levels[0];
	vm.newMetric.SelectedVariable = levels[0].Variables[0];
	expect(vm.levels === levels).toBeTruthy();
	expect(vm.variables === levels[0].Variables).toBeTruthy();
	expect(vm.valueLabels).toHaveLength(3);
	vm.newMetric.SourceMetric = null;
	expect(vm.versions).toEqual([]);
});

it('showVariable oculta el selector si no hay variables o si hay una única de conteo con pocas categorías', () => {
	const { vm } = setup();
	vm.newMetric.SelectedLevel = { Variables: [] };
	expect(vm.showVariable).toBe(false);
	const simple = makeVariable(1, { IsSimpleCount: true, ValueLabels: [{ Id: 1 }] });
	vm.newMetric.SelectedLevel = { Variables: [simple] };
	vm.newMetric.SelectedVariable = simple;
	expect(vm.showVariable).toBe(false);
	simple.ValueLabels = [{ Id: 1 }, { Id: 2 }];
	expect(vm.showVariable).toBe(true);
	vm.newMetric.SelectedLevel = { Variables: [makeVariable(1), makeVariable(2)] };
	expect(vm.showVariable).toBe(true);
});

it('showLevelName exige un nivel con área cuyo dataset no sea de polígonos', () => {
	const { vm } = setup();
	expect(vm.showLevelName).toBeFalsy();
	vm.newMetric.SelectedLevel = { HasArea: true, Dataset: { Type: 'D' } };
	expect(vm.showLevelName).toBe(true);
	vm.newMetric.SelectedLevel = { HasArea: true, Dataset: { Type: 'S' } };
	expect(vm.showLevelName).toBe(false);
	vm.newMetric.SelectedLevel = { HasArea: false, Dataset: { Type: 'D' } };
	expect(vm.showLevelName).toBeFalsy();
});

describe('StepSource: acciones');

it('addMetric abre el selector de indicadores y formatVersion muestra el nombre de la versión', () => {
	const { vm } = setup();
	let shown = 0;
	vm.$refs.addMetricPopup = { show() { shown++; } };
	vm.addMetric();
	expect(shown).toBe(1);
	expect(vm.formatVersion({ Version: { Name: 'v2' } })).toBe('v2');
});

it('clearMetric descarta el indicador y todo lo elegido a partir de él, y pide volver al paso anterior', () => {
	const { vm } = setup();
	vm.newMetric.SourceMetric = { Metric: {} };
	vm.newMetric.Source.VariableId = 9;
	vm.newMetric.Source.ValueLabelIds = [1];
	vm.newMetric.SelectedVersion = {};
	vm.newMetric.SelectedLevel = {};
	vm.newMetric.SelectedVariable = {};
	vm.columnExists = true;
	vm.clearMetric();
	expect(vm.newMetric.SourceMetric).toBeNull();
	expect(vm.newMetric.Source).toEqual({ VariableId: null, ValueLabelIds: [] });
	expect([vm.newMetric.SelectedVersion, vm.newMetric.SelectedLevel, vm.newMetric.SelectedVariable]).toEqual([null, null, null]);
	expect(vm.columnExists).toBeNull();
	expect(vm.$emitted).toEqual([['raisePrev']]);
});

it('selectAll selecciona todas las categorías o ninguna según allCategories', () => {
	const { vm } = setup();
	vm.newMetric.SelectedVariable = makeVariable(1);
	vm.allCategories = true;
	vm.selectAll();
	expect(vm.newMetric.Source.ValueLabelIds).toEqual([1, 2, 3]);
	vm.allCategories = false;
	vm.selectAll();
	expect(vm.newMetric.Source.ValueLabelIds).toEqual([]);
});

describe('StepSource: validación');

it('validate exige indicador, versión, nivel, variable y al menos una categoría, en ese orden', () => {
	const { vm, browser } = setup();
	expect(vm.validate()).toBe(false);
	vm.newMetric.SourceMetric = { Metric: {} };
	expect(vm.validate()).toBe(false);
	vm.newMetric.SelectedVersion = {};
	expect(vm.validate()).toBe(false);
	vm.newMetric.SelectedLevel = {};
	expect(vm.validate()).toBe(false);
	vm.newMetric.SelectedVariable = {};
	expect(vm.validate()).toBe(false);
	expect(browser.alerts).toEqual([
		'Debe seleccionar un indicador.', 'Debe seleccionar una versión.', 'Debe seleccionar un nivel.',
		'Debe seleccionar una variable.', 'Debe seleccionar al menos una categoría.',
	]);
});

function completeSelection(vm) {
	vm.newMetric.SourceMetric = { Metric: {} };
	vm.newMetric.SelectedVersion = {};
	vm.newMetric.SelectedLevel = {};
	vm.newMetric.SelectedVariable = {};
	vm.newMetric.Source.ValueLabelIds = [1];
}

it('validate con todo elegido da por válido el paso', () => {
	const { vm } = setup();
	completeSelection(vm);
	expect(vm.validate()).toBe(true);
});

it('si el indicador ya fue calculado pide confirmar y respeta la respuesta', () => {
	const { vm, browser } = setup();
	completeSelection(vm);
	vm.columnExists = true;
	expect(vm.validate()).toBe(true);
	expect(browser.confirmations).toEqual(['El indicador ya fue calculado con este dataset. \n\n¿Desea continuar y sobreescribirlo?']);
	browser.answer = false;
	expect(vm.validate()).toBe(false);
});

describe('StepSource: validación asincrónica');

it('sin variable elegida o con el resultado ya conocido responde true sin consultar al servidor', async () => {
	const { vm } = setup();
	expect(await vm.asyncValidate()).toBe(true);
	vm.newMetric.Source.VariableId = 9;
	vm.columnExists = false;
	expect(await vm.asyncValidate()).toBe(true);
	expect(axios.calls).toHaveLength(0);
});

it('consulta si la variable calculada ya existe, según el tipo de indicador, y guarda el resultado', async () => {
	const { vm } = setup({ Type: 'area' });
	vm.newMetric.Source.VariableId = 9;
	axios.respond('get', { data: { columnExists: true } });
	const result = await vm.asyncValidate();
	expect(result).toBe(undefined);
	expect(vm.columnExists).toBe(true);
	expect(axios.calls[0].url).toBe('https://api.example.org/services/backoffice/CalculatedMetricAreaExists');
	expect(axios.calls[0].config.params).toEqual({ k: 5, v: 9 });
	vm.columnExists = null;
	vm.newMetric.Type = 'distance';
	await vm.asyncValidate();
	expect(axios.calls[1].url).toBe('https://api.example.org/services/backoffice/CalculatedMetricDistanceExists');
	await flushPromises();
});

describe('StepSource: cambios en la selección');

it('al elegir una versión selecciona el nivel Radios, si no Ubicaciones, si no Departamentos, si no el primero', () => {
	const { vm } = setup();
	const names = function (list) { return list.map(function (name) { return { Name: name, Variables: [] }; }); };
	const cases = [
		[['Provincias', 'Departamentos', 'Radios'], 'Radios'],
		[['Provincias', 'Ubicaciones', 'Departamentos'], 'Ubicaciones'],
		[['Provincias', 'Departamentos'], 'Departamentos'],
		[['Provincias', 'Localidades'], 'Provincias'],
	];
	for (const [levelNames, expected] of cases) {
		vm.newMetric.SelectedVersion = { Levels: names(levelNames) };
		runWatch(vm, 'newMetric.SelectedVersion');
		expect(vm.newMetric.SelectedLevel.Name).toBe(expected);
	}
});

it('al elegir una versión sin niveles no cambia el nivel, y al quitarla limpia nivel y descripción', () => {
	const { vm } = setup();
	vm.allCategories = true;
	vm.newMetric.SelectedLevel = { Name: 'previo' };
	vm.newMetric.SelectedVersion = { Levels: [] };
	runWatch(vm, 'newMetric.SelectedVersion');
	expect(vm.allCategories).toBe(false);
	expect(vm.newMetric.SelectedLevel.Name).toBe('previo');
	vm.newMetric.SelectedVersion = null;
	runWatch(vm, 'newMetric.SelectedVersion');
	expect(vm.newMetric.SelectedLevel).toBeNull();
	expect(vm.newMetric.Output.HasDescription).toBe(false);
});

it('al elegir un nivel toma su primera variable y marca el punto de inclusión según el tipo del dataset', () => {
	const { vm, dataset } = setup();
	const first = makeVariable(1);
	vm.newMetric.SelectedLevel = { Variables: [first, makeVariable(2)] };
	dataset.properties.Type = 'L';
	runWatch(vm, 'newMetric.SelectedLevel');
	expect(vm.newMetric.SelectedVariable === first).toBeTruthy();
	expect(vm.newMetric.OutputArea.IsInclusionPoint).toBe(true);
	dataset.properties.Type = 'R';
	runWatch(vm, 'newMetric.SelectedLevel');
	expect(vm.newMetric.OutputArea.IsInclusionPoint).toBe(false);
});

it('al quitar el nivel se quita la variable y el punto de inclusión vuelve a verdadero', () => {
	const { vm } = setup();
	vm.newMetric.SelectedVariable = makeVariable(1);
	vm.newMetric.SelectedLevel = null;
	runWatch(vm, 'newMetric.SelectedLevel');
	expect(vm.newMetric.SelectedVariable).toBeNull();
	expect(vm.newMetric.OutputArea.IsInclusionPoint).toBe(true);
});

it('al elegir una variable define los datos de salida y selecciona todas sus categorías', () => {
	const { vm } = setup();
	vm.columnExists = true;
	vm.newMetric.SelectedVariable = makeVariable(9);
	runWatch(vm, 'newMetric.SelectedVariable');
	expect(vm.columnExists).toBeNull();
	expect(vm.newMetric.Source.VariableId).toBe(9);
	expect(vm.newMetric.Output.HasValue).toBe(true);
	expect(vm.newMetric.OutputArea).toEqual({ HasSumValue: true, HasMaxValue: false, HasMinValue: false, HasCount: true, IsInclusionPoint: false });
	expect(vm.allCategories).toBe(true);
	expect(vm.newMetric.Source.ValueLabelIds).toEqual([1, 2, 3]);
});

it('una variable de conteo simple no suma valores y sin categorías no se selecciona nada', () => {
	const { vm } = setup();
	vm.newMetric.SelectedVariable = makeVariable(9, { IsSimpleCount: true, ValueLabels: [] });
	runWatch(vm, 'newMetric.SelectedVariable');
	expect(vm.newMetric.Output.HasValue).toBe(false);
	expect(vm.newMetric.OutputArea.HasSumValue).toBe(false);
	expect(vm.allCategories).toBe(false);
});

it('al quitar la variable se quita su identificador', () => {
	const { vm } = setup();
	vm.newMetric.Source.VariableId = 9;
	vm.newMetric.SelectedVariable = null;
	runWatch(vm, 'newMetric.SelectedVariable');
	expect(vm.newMetric.Source.VariableId).toBeNull();
});

it('desmarca "todas las categorías" cuando la selección deja de abarcarlas', () => {
	const { vm } = setup();
	vm.newMetric.SelectedVariable = makeVariable(1);
	vm.allCategories = true;
	vm.newMetric.Source.ValueLabelIds = [1, 2, 3];
	runWatch(vm, 'newMetric.Source.ValueLabelIds');
	expect(vm.allCategories).toBe(true);
	vm.newMetric.Source.ValueLabelIds = [1];
	runWatch(vm, 'newMetric.Source.ValueLabelIds');
	expect(vm.allCategories).toBe(false);
});
