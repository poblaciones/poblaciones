import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import CalculatedWizard from '@/backoffice/views/Dataset/CalculatedWizard/CalculatedWizard.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

const AREA_STEPS = ['stepAreaWelcome', 'stepMetric', 'stepSource', 'stepAreaOutput'];
const DISTANCE_STEPS = ['stepDistanceWelcome', 'stepMetric', 'stepSource', 'stepDistanceOutput'];

function makeStep(overrides) {
	const step = { focused: [], validated: 0, focus(next) { step.focused.push(next); } };
	return Object.assign(step, overrides);
}

function setup(type) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	dataset.MetricVersionLevels = [];
	dataset.ScaleGenerator.cleared = 0;
	dataset.ScaleGenerator.Clear = function () { dataset.ScaleGenerator.cleared++; };
	context.CurrentDataset = dataset;
	context.CurrentWork = { changed: 0, WorkChanged() { this.changed++; } };
	const refs = {};
	for (const name of AREA_STEPS.concat(DISTANCE_STEPS)) {
		refs[name] = makeStep({});
	}
	refs.stepper = { started: 0, complete: false, result: null, Start() { this.started++; } };
	const vm = mountLite(CalculatedWizard, { mocks: { $refs: refs } });
	CalculatedWizard.mounted.call(vm);
	if (type) {
		vm.show(type === 'distance');
	}
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser };
}

function fillSource(vm) {
	vm.newMetric.SourceMetric = { Metric: { Id: 11 } };
	vm.newMetric.SelectedVersion = { Version: { Id: 12 } };
	vm.newMetric.SelectedLevel = { Id: 13 };
}

function expand(compact) {
	let values = compact.values;
	for (let n = compact.dict.length - 1; n >= 0; n--) {
		values = values.replaceAll(compact.dict[n].k, compact.dict[n].v);
	}
	return values;
}

describe('CalculatedWizard: estado inicial');

it('define los pasos de un conteo por área y de un rastreo, y arranca en el primero', () => {
	const { vm } = setup();
	expect(vm.step).toBe(1);
	expect(vm.steps.area).toEqual(AREA_STEPS);
	expect(vm.steps.distance).toEqual(DISTANCE_STEPS);
	expect(vm.openPopup).toBeFalsy();
	expect(vm.stepperRunning).toBeFalsy();
});

it('al montar prepara el indicador nuevo con sus valores por defecto', () => {
	const { vm } = setup();
	expect(vm.newMetric.Id).toBeNull();
	expect(vm.newMetric.Type).toBe('');
	expect(vm.newMetric.Output).toEqual({ HasDescription: false, HasValue: true, HasCoords: true, HasMaxDistance: false, MaxDistance: 10 });
	expect(vm.newMetric.OutputArea).toEqual({
		HasSumValue: false, HasMaxValue: false, HasMinValue: false, HasCount: false, IsInclusionPoint: false, InclusionDistance: 2,
	});
	expect(vm.newMetric.Source).toEqual({ ValueLabelIds: [], VariableId: null });
});

describe('CalculatedWizard: tipo y apertura');

it('show abre el asistente en el primer paso con el tipo elegido', () => {
	const { vm } = setup();
	vm.step = 3;
	vm.stepperRunning = true;
	vm.processing = true;
	vm.show(true);
	expect(vm.newMetric.Type).toBe('distance');
	expect(vm.step).toBe(1);
	expect(vm.stepperRunning).toBe(false);
	expect(vm.processing).toBe(false);
	expect(vm.openPopup).toBe(true);
	vm.show();
	expect(vm.newMetric.Type).toBe('area');
});

it('defineType reinicia los datos al cambiar de tipo y los conserva si el tipo es el mismo', () => {
	const { vm } = setup('area');
	vm.newMetric.Source.VariableId = 7;
	vm.defineType('area');
	expect(vm.newMetric.Source.VariableId).toBe(7);
	vm.defineType('distance');
	expect(vm.newMetric.Source.VariableId).toBeNull();
	expect(vm.newMetric.Type).toBe('distance');
});

describe('CalculatedWizard: pasos');

it('calculateStep devuelve el nombre del paso o null más allá del último', () => {
	const { vm } = setup('area');
	expect(vm.calculateStep(1)).toBe('stepAreaWelcome');
	expect(vm.calculateStep(4)).toBe('stepAreaOutput');
	expect(vm.calculateStep(5)).toBeNull();
	expect(vm.currentStep).toBe('stepAreaWelcome');
});

it('isLast, maxSteps y action dependen del paso y del tipo', () => {
	const { vm } = setup('distance');
	expect(vm.isLast).toBe(false);
	expect(vm.maxSteps).toBe('');
	vm.step = 4;
	expect(vm.isLast).toBe(true);
	expect(vm.maxSteps).toBe(' de 5');
	expect(vm.action).toBe('rastreo');
	vm.defineType('area');
	expect(vm.action).toBe('conteo');
});

it('disabledOnStepping marca el contenido mientras corre el proceso', () => {
	const { vm } = setup('area');
	expect(vm.disabledOnStepping).toBe('');
	vm.stepperRunning = true;
	expect(vm.disabledOnStepping).toBe('disabledDiv');
});

it('columnExists lee el estado del paso de origen, si existe', () => {
	const { vm, refs } = setup('area');
	refs.stepSource.columnExists = true;
	expect(vm.columnExists).toBe(true);
	vm.$refs = {};
	expect(vm.columnExists).toBeFalsy();
});

it('validate delega en el paso actual, y lo da por válido si no valida', () => {
	const { vm, refs } = setup('area');
	expect(vm.validate()).toBe(true);
	refs.stepAreaWelcome.validate = function () { return false; };
	expect(vm.validate()).toBe(false);
});

describe('CalculatedWizard: navegación');

it('next avanza al paso siguiente y le da el foco, si el actual es válido', () => {
	const { vm, refs } = setup('area');
	vm.next();
	expect(vm.step).toBe(2);
	expect(refs.stepMetric.focused).toEqual([true]);
});

it('next no avanza si el paso actual no valida, ni más allá del último paso', () => {
	const { vm, refs } = setup('area');
	refs.stepAreaWelcome.validate = function () { return false; };
	vm.next();
	expect(vm.step).toBe(1);
	refs.stepAreaWelcome.validate = undefined;
	vm.step = 4;
	vm.next();
	expect(vm.step).toBe(4);
});

it('prev retrocede dando el foco al paso anterior, salvo en el primero', () => {
	const { vm, refs } = setup('area');
	vm.prev();
	expect(vm.step).toBe(1);
	vm.step = 3;
	vm.prev();
	expect(vm.step).toBe(2);
	expect(refs.stepMetric.focused).toEqual([false]);
});

it('un paso sin método de foco no impide avanzar', () => {
	const { vm, refs } = setup('area');
	refs.stepMetric.focus = undefined;
	vm.next();
	expect(vm.step).toBe(2);
});

it('next con validación asincrónica la ejecuta primero y recién entonces avanza', async () => {
	const { vm, refs } = setup('area');
	const calls = [];
	let resolved = false;
	refs.stepAreaWelcome.asyncValidate = function () {
		calls.push('async');
		if (resolved) {
			return Promise.resolve(true);
		}
		resolved = true;
		return Promise.resolve(undefined);
	};
	vm.next();
	expect(vm.processing).toBe(true);
	expect(vm.step).toBe(1);
	await flushPromises();
	expect(calls).toEqual(['async', 'async']);
	expect(vm.processing).toBe(false);
	expect(vm.step).toBe(2);
});

it('si la validación asincrónica falla deja de procesar sin avanzar', async () => {
	const { vm, refs } = setup('area');
	refs.stepAreaWelcome.asyncValidate = function () { return Promise.reject(new Error('sin red')); };
	vm.next();
	await flushPromises();
	expect(vm.processing).toBe(false);
	expect(vm.step).toBe(1);
});

describe('CalculatedWizard: argumentos del proceso');

it('args arma los identificadores del origen y el resumen de salida según el tipo', () => {
	const { vm } = setup('area');
	fillSource(vm);
	vm.newMetric.Source.VariableId = 99;
	const area = vm.args();
	expect(area.k).toBe(5);
	expect(JSON.parse(area.s)).toEqual({ ValueLabelIds: null, VariableId: 99, MetricId: 11, VersionId: 12, LevelId: 13 });
	expect(JSON.parse(area.o)).toEqual(vm.newMetric.OutputArea);
	vm.defineType('distance');
	fillSource(vm);
	expect(JSON.parse(vm.args().o)).toEqual(vm.newMetric.Output);
});

it('args envía las categorías elegidas compactadas y no las repite dentro del origen', () => {
	const { vm } = setup('area');
	fillSource(vm);
	vm.newMetric.Source.ValueLabelIds = [1, 2, 3];
	const args = vm.args();
	expect(args.labelsCompact).toBe('[1,2,3]');
	expect(JSON.parse(args.labelsDict)).toEqual([]);
	expect(JSON.parse(args.s).ValueLabelIds).toBeNull();
});

it('args puede repetirse (reintento tras un fallo) enviando siempre las mismas categorías', () => {
	const { vm } = setup('area');
	fillSource(vm);
	vm.newMetric.Source.ValueLabelIds = [1, 2, 3];
	const first = vm.args();
	const second = vm.args();
	expect(second.labelsCompact).toBe(first.labelsCompact);
	expect(vm.newMetric.Source.ValueLabelIds).toEqual([1, 2, 3]);
});

describe('CalculatedWizard: compactIdList');

it('una lista corta se envía tal cual, sin diccionario', () => {
	const { vm } = setup('area');
	expect(vm.compactIdList('[1,2,3]')).toEqual({ dict: [], values: '[1,2,3]' });
});

it('una lista larga con repeticiones se reduce y se puede reconstruir idéntica con el diccionario', () => {
	const { vm } = setup('area');
	const ids = [];
	for (let n = 0; n < 120; n++) {
		ids.push(100000 + n);
	}
	const original = JSON.stringify(ids);
	const compact = vm.compactIdList(original);
	expect(compact.values.length < original.length).toBeTruthy();
	expect(compact.dict.length > 0).toBeTruthy();
	expect(compact.dict[0].k).toBe('a');
	expect(expand(compact)).toBe(original);
});

it('las claves del diccionario son letras consecutivas', () => {
	const { vm } = setup('area');
	const ids = [];
	for (let n = 0; n < 300; n++) {
		ids.push(1230000 + n * 7);
	}
	const compact = vm.compactIdList(JSON.stringify(ids));
	expect(compact.dict.map(function (entry) { return entry.k; })).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].slice(0, compact.dict.length));
});

describe('CalculatedWizard: guardado');

it('save no inicia el proceso si el paso actual no valida', () => {
	const { vm, refs, context } = setup('area');
	refs.stepAreaWelcome.validate = function () { return false; };
	vm.save();
	expect(refs.stepper.started).toBe(0);
	expect(context.CurrentWork.changed).toBe(0);
});

it('save marca el cambio del trabajo y configura e inicia el avance con las direcciones del tipo', () => {
	const { vm, refs, context, dataset } = setup('area');
	fillSource(vm);
	vm.save();
	expect(context.CurrentWork.changed).toBe(1);
	expect(refs.stepper.startUrl).toBe(dataset.CalculateNewMetricUrl('area'));
	expect(refs.stepper.stepUrl).toBe(dataset.StepCalculateNewMetricUrl('area'));
	expect(refs.stepper.args.k).toBe(5);
	expect(refs.stepper.clientSteps.map(function (step) { return step.status; })).toEqual([
		'Obteniendo resultados', 'Calculando distribuciones', 'Aplicando simbologías',
	]);
	expect(vm.stepperRunning).toBe(true);
	expect(refs.stepper.started).toBe(1);
});

it('los pasos del cliente recargan columnas, calculan distribuciones y aplican simbologías', () => {
	const { vm, dataset } = setup('area');
	const steps = vm.defineClientSteps();
	expect(steps[0].do === dataset.ReloadColumns).toBeTruthy();
	expect(steps[0].container === dataset).toBeTruthy();
	expect(steps[1].do === vm.fetchDistributions).toBeTruthy();
	expect(steps[2].do === vm.applySymbologies).toBeTruthy();
});

it('stepperCompleted descarta las distribuciones cacheadas y stepperClosed cierra solo si terminó', () => {
	const { vm, refs, dataset } = setup('area');
	vm.stepperCompleted();
	expect(dataset.ScaleGenerator.cleared).toBe(1);
	vm.openPopup = true;
	vm.stepperRunning = true;
	vm.stepperClosed();
	expect(vm.stepperRunning).toBe(false);
	expect(vm.openPopup).toBe(true);
	refs.stepper.complete = true;
	vm.stepperClosed();
	expect(vm.openPopup).toBe(false);
});

describe('CalculatedWizard: simbología de los resultados');

function makeLevels(dataset) {
	dataset.MetricVersionLevels = [
		{ Id: 1, Variables: [{ Id: 10, Symbology: {} }, { Id: 11, Symbology: {} }] },
		{ Id: 2, Variables: [{ Id: 12, Symbology: {} }] },
	];
}

it('GetLevelAndVariable ubica la variable en su nivel y falla si no existe', () => {
	const { vm, dataset } = setup('area');
	makeLevels(dataset);
	const found = vm.GetLevelAndVariable(12);
	expect(found.Level.Id).toBe(2);
	expect(found.Variable.Id).toBe(12);
	let message = null;
	try {
		vm.GetLevelAndVariable(99);
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('No se ha podido obtener el indicador creado.');
});

it('parseVariables convierte una lista de identificadores separados por coma en pares nivel y variable', () => {
	const { vm, dataset } = setup('area');
	makeLevels(dataset);
	expect(vm.parseVariables('10,12').map(function (item) { return [item.Level.Id, item.Variable.Id]; })).toEqual([[1, 10], [2, 12]]);
});

it('GetLargestNTilesCut devuelve la mayor cantidad de grupos con todos sus cortes definidos, o 0', () => {
	const { vm } = setup('area');
	const groups = {
		1: { ntiles: [] },
		2: { ntiles: [5] },
		3: { ntiles: [3, 6] },
		4: { ntiles: [2, 4, null] },
		5: { ntiles: [1, 2, null, null] },
	};
	expect(vm.GetLargestNTilesCut(5, groups)).toBe(3);
	expect(vm.GetLargestNTilesCut(2, groups)).toBe(2);
	expect(vm.GetLargestNTilesCut(5, { 2: { ntiles: [null] }, 3: { ntiles: [null, null] } })).toBe(0);
});

it('GetLargestNTilesCut ignora los tamaños de los que el servidor no devolvió grupo', () => {
	const { vm } = setup('area');
	expect(vm.GetLargestNTilesCut(5, { 3: { ntiles: [3, 6] } })).toBe(3);
	expect(vm.GetLargestNTilesCut(5, {})).toBe(0);
});

it('el calculador de distribuciones elige cuantiles si hay variedad de valores y categoría única si no', async () => {
	const { vm, dataset } = setup('area');
	makeLevels(dataset);
	const responses = {
		10: { Groups: { 2: { ntiles: [5] }, 3: { ntiles: [3, 6] }, 4: { ntiles: [1, 2, null] }, 5: { ntiles: [1, null, null, null] } } },
		11: { Groups: { 2: { ntiles: [null] }, 3: { ntiles: [null, null] } } },
	};
	dataset.ScaleGenerator.GetAndCacheColumnDistributions = function (level, variable) { return Promise.resolve(responses[variable.Id]); };
	vm.$refs.stepper.result = '10,11';
	await vm.fetchDistributions();
	const first = dataset.MetricVersionLevels[0].Variables[0].Symbology;
	const second = dataset.MetricVersionLevels[0].Variables[1].Symbology;
	expect(first).toEqual({ CutMode: 'T', Round: 0, Categories: 3 });
	expect(second).toEqual({ CutMode: 'S' });
	expect(vm.clientProcessing).toHaveLength(2);
});

it('applySymbologies regenera y guarda cada variable procesada', async () => {
	const { vm, dataset } = setup('area');
	const saved = [];
	dataset.ScaleGenerator.RegenAndSaveVariable = function (level, variable) { saved.push([level.Id, variable.Id]); return Promise.resolve(); };
	vm.clientProcessing = [{ Level: { Id: 1 }, Variable: { Id: 10 } }, { Level: { Id: 2 }, Variable: { Id: 12 } }];
	await vm.applySymbologies();
	expect(saved).toEqual([[1, 10], [2, 12]]);
});
