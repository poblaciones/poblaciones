import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import MetricPopup from '@/backoffice/views/Metric/MetricPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeLevel(overrides) {
	return Object.assign({
		Id: 20,
		MetricVersion: { Id: 30, Caption: '2024', Metric: { Id: 40, Caption: 'Población' } },
	}, overrides);
}

function setup(sameVersions) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.updated = [];
	dataset.UpdateMetricVersionLevel = function () {};
	context.CurrentDataset = dataset;
	context.MetricGroups = { list: [{ Id: 1 }] };
	context.MetricProviders = { list: [{ Id: 2 }] };
	let versions = sameVersions;
	if (sameVersions === undefined) {
		versions = [{ Caption: '2023' }, { Caption: '2024' }];
	}
	const work = { requested: [], GetMetricVersionsByMetric(metric) { this.requested.push(metric); return Promise.resolve(versions); } };
	context.CurrentWork = work;
	const refs = {
		invoker: { saved: [], result: Promise.resolve({ LevelId: 21, MetricVersionId: 31, MetricId: 41 }), doSave(...args) { this.saved.push(args); return this.result; } },
		metricInput: { focused: 0, focus() { this.focused++; } },
		pickMetric: { shown: 0, show() { this.shown++; } },
		confirmUnbindDialog: { shown: 0, show() { this.shown++; } },
		confirmDialog: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(MetricPopup, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, work: work, refs: refs, browser: browser, context: context };
}

async function open(vm, level) {
	const target = level || makeLevel();
	vm.show(target);
	await flushPromises();
	return target;
}

describe('MetricPopup: apertura');

it('show trabaja sobre una copia del nivel, abre el diálogo y consulta las versiones del mismo indicador', async () => {
	const { vm, work } = setup();
	const level = await open(vm);
	expect(vm.showDialog).toBe(true);
	expect(vm.MetricVersionLevel === level).toBeTruthy();
	expect(vm.newMetricVersionLevel === level).toBe(false);
	expect(vm.newMetricVersionLevel).toEqual(level);
	expect(work.requested[0] === level.MetricVersion.Metric).toBeTruthy();
	expect(vm.SameMetricVersions).toEqual([{ Caption: '2023' }, { Caption: '2024' }]);
});

it('show enfoca el nombre del indicador y hide cierra el diálogo', async () => {
	const { vm, refs } = setup();
	await open(vm);
	await waitTimers(110);
	expect(refs.metricInput.focused).toBe(1);
	vm.hide();
	expect(vm.showDialog).toBe(false);
});

describe('MetricPopup: propiedades calculadas');

it('toma los grupos y proveedores de indicadores del contexto', () => {
	const { vm } = setup();
	expect(vm.MetricGroups).toEqual([{ Id: 1 }]);
	expect(vm.MetricProviders).toEqual([{ Id: 2 }]);
});

it('SameMetricVersionsAsText lista las ediciones separadas por coma', async () => {
	const { vm } = setup();
	await open(vm);
	expect(vm.SameMetricVersionsAsText).toBe('2023, 2024');
});

it('title muestra el nombre del indicador abierto y es null si no hay ninguno', async () => {
	const { vm } = setup();
	expect(vm.title).toBeNull();
	await open(vm);
	expect(vm.title).toBe('Población');
});

describe('MetricPopup: serie de ediciones');

it('bind y unbind abren los diálogos de selección y de confirmación', () => {
	const { vm, refs } = setup();
	vm.bind();
	vm.unbind();
	expect(refs.pickMetric.shown).toBe(1);
	expect(refs.confirmUnbindDialog.shown).toBe(1);
});

it('doUnbind separa la edición de la serie y deja la lista de ediciones vacía', async () => {
	const { vm } = setup();
	const level = await open(vm);
	vm.doUnbind();
	expect(vm.newMetricVersionLevel.MetricVersion.Metric.Id).toBeNull();
	expect(vm.newMetricVersionLevel.MetricVersion.Id).toBeNull();
	expect(vm.SameMetricVersions).toEqual([]);
	expect(level.MetricVersion.Metric.Id).toBe(40);
});

it('doBind vincula la edición con otro indicador como edición nueva', async () => {
	const { vm } = setup();
	await open(vm);
	const other = { Id: 99, Caption: 'Otro' };
	vm.doBind(other);
	expect(vm.newMetricVersionLevel.MetricVersion.Id).toBeNull();
	expect(vm.newMetricVersionLevel.MetricVersion.Metric === other).toBeTruthy();
});

describe('MetricPopup: guardado');

it('save exige un nombre para el indicador y una edición', async () => {
	const { vm, browser } = setup();
	await open(vm);
	vm.newMetricVersionLevel.MetricVersion.Metric.Caption = '   ';
	vm.save();
	vm.newMetricVersionLevel.MetricVersion.Metric.Caption = null;
	vm.save();
	vm.newMetricVersionLevel.MetricVersion.Metric.Caption = 'Población';
	vm.newMetricVersionLevel.MetricVersion.Caption = ' ';
	vm.save();
	vm.newMetricVersionLevel.MetricVersion.Caption = null;
	vm.save();
	expect(browser.alerts).toEqual([
		'Debe indicar un valor para el nombre del indicador.', 'Debe indicar un valor para el nombre del indicador.',
		"Debe indicar un valor para 'Edición'.", "Debe indicar un valor para 'Edición'.",
	]);
});

it('save pide confirmar si se renombra un indicador que tiene otras ediciones, y no guarda todavía', async () => {
	const { vm, refs } = setup();
	await open(vm);
	vm.newMetricVersionLevel.MetricVersion.Metric.Caption = 'Habitantes';
	vm.save();
	expect(refs.confirmDialog.shown).toBe(1);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save guarda directamente si el nombre no cambió o el indicador tiene una sola edición', async () => {
	const unchanged = setup();
	await open(unchanged.vm);
	unchanged.vm.save();
	expect(unchanged.refs.invoker.saved).toHaveLength(1);
	const single = setup([{ Caption: '2024' }]);
	await open(single.vm);
	single.vm.newMetricVersionLevel.MetricVersion.Metric.Caption = 'Habitantes';
	single.vm.save();
	expect(single.refs.invoker.saved).toHaveLength(1);
	expect(single.refs.confirmDialog.shown).toBe(0);
});

it('doSave guarda el nivel editado y, al terminar, traslada el nombre y los identificadores al original y cierra', async () => {
	const { vm, refs, dataset } = setup();
	const level = await open(vm);
	vm.newMetricVersionLevel.MetricVersion.Caption = '2025';
	vm.newMetricVersionLevel.MetricVersion.Metric.Caption = 'Habitantes';
	vm.doSave();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.UpdateMetricVersionLevel).toBeTruthy();
	expect(refs.invoker.saved[0][2] === vm.newMetricVersionLevel).toBeTruthy();
	await flushPromises();
	expect(level.MetricVersion.Caption).toBe('2025');
	expect(level.MetricVersion.Metric.Caption).toBe('Habitantes');
	expect([level.Id, level.MetricVersion.Id, level.MetricVersion.Metric.Id]).toEqual([21, 31, 41]);
	expect(vm.showDialog).toBe(false);
});
