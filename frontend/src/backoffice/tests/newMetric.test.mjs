import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import NewMetric from '@/backoffice/views/Metric/NewMetric.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeLevelTemplate() {
	return { Id: null, MetricVersion: { Id: null, Caption: '', Metric: { Id: null, Caption: '' } }, Variables: [{ Id: 1 }] };
}

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.UpdateMetricVersionLevel = function () {};
	context.CurrentDataset = dataset;
	context.CurrentWork = {};
	context.MetricGroups = { list: [{ Id: 1, Caption: 'Demografía' }, { Id: 2, Caption: 'Salud' }] };
	context.MetricProviders = { list: [{ Id: 5, Caption: 'INDEC' }] };
	context.Factory = { GetCopy(type, callback) { callback(makeLevelTemplate()); } };
	const refs = {
		invoker: { saved: [], result: Promise.resolve(), doSave(...args) { this.saved.push(args); return this.result; } },
		metricInput: { focused: 0, focus() { this.focused++; } },
		metricVersionInput: { focused: 0, focus() { this.focused++; } },
		pickMetric: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(NewMetric, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser };
}

describe('NewMetric: apertura');

it('show reinicia el formulario con el año actual como edición, abre el diálogo y enfoca el nombre', async () => {
	const { vm, refs } = setup();
	vm.newMetricName = 'viejo';
	vm.newMetricGroup = { Id: 1 };
	vm.selectedMetric = { Id: 9 };
	vm.show();
	expect(vm.newMetricName).toBe('');
	expect(vm.newMetricVersion).toBe('' + new Date().getFullYear());
	expect(vm.newMetricGroup).toBeNull();
	expect(vm.selectedMetric).toBeNull();
	expect(vm.openPopup).toBe(true);
	await waitTimers(130);
	expect(refs.metricInput.focused).toBe(1);
});

it('las listas de grupos y proveedores vienen del contexto', () => {
	const { vm } = setup();
	expect(vm.MetricGroups).toHaveLength(2);
	expect(vm.MetricProviders).toHaveLength(1);
});

describe('NewMetric: validación');

it('save exige un nombre y vuelve el foco al campo del nombre', async () => {
	const { vm, browser, refs } = setup();
	vm.newMetricName = '   ';
	vm.newMetricVersion = '2024';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un nombre para el indicador.']);
	await Promise.resolve();
	expect(refs.metricInput.focused).toBe(1);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save exige una edición y vuelve el foco al campo de la edición', async () => {
	const { vm, browser, refs } = setup();
	vm.newMetricName = 'Población';
	vm.newMetricVersion = ' ';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar una edición para el indicador.']);
	await Promise.resolve();
	expect(refs.metricVersionInput.focused).toBe(1);
});

describe('NewMetric: guardado');

it('save toma un nivel nuevo del catálogo y lo guarda con los datos del formulario, sin variables', () => {
	const { vm, refs, dataset } = setup();
	vm.newMetricName = '  Población  ';
	vm.newMetricVersion = ' 2024 ';
	vm.newMetricGroup = { Id: 1 };
	vm.newMetricProvider = { Id: 5 };
	vm.save();
	const level = refs.invoker.saved[0][2];
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.UpdateMetricVersionLevel).toBeTruthy();
	expect(level.MetricVersion.Caption).toBe('2024');
	expect(level.MetricVersion.Metric.Caption).toBe('Población');
	expect(level.MetricVersion.Metric.MetricGroup).toEqual({ Id: 1 });
	expect(level.MetricVersion.Metric.MetricProvider).toEqual({ Id: 5 });
	expect(level.MetricVersion.Metric.IsBasicMetric).toBe(false);
	expect(level.Variables).toEqual([]);
});

it('con un indicador existente elegido, el nivel nuevo usa ese indicador', () => {
	const { vm, refs } = setup();
	vm.newMetricName = 'Población';
	vm.newMetricVersion = '2025';
	vm.selectedMetric = { Id: 40, Caption: 'otro' };
	vm.save();
	const level = refs.invoker.saved[0][2];
	expect(level.MetricVersion.Metric.Id).toBe(40);
	expect(level.MetricVersion.Metric.Caption).toBe('Población');
});

it('al terminar de guardar cierra el diálogo', async () => {
	const { vm } = setup();
	vm.newMetricName = 'Población';
	vm.newMetricVersion = '2025';
	vm.openPopup = true;
	vm.save();
	await Promise.resolve();
	await Promise.resolve();
	expect(vm.openPopup).toBe(false);
});

describe('NewMetric: elegir un indicador existente');

it('pickMetric abre el selector de indicadores', () => {
	const { vm, refs } = setup();
	vm.pickMetric();
	expect(refs.pickMetric.shown).toBe(1);
});

it('onSelectMetric toma el nombre, el grupo y el proveedor del indicador y pide una edición nueva', () => {
	const { vm, refs } = setup();
	vm.newMetricVersion = '2024';
	const metric = { Id: 40, Caption: 'Población', GroupId: 2, ProviderId: 5 };
	vm.onSelectMetric(metric);
	expect(vm.selectedMetric === metric).toBeTruthy();
	expect(vm.newMetricVersion).toBe('');
	expect(vm.newMetricName).toBe('Población');
	expect(vm.newMetricGroup).toEqual({ Id: 2, Caption: 'Salud' });
	expect(vm.newMetricProvider).toEqual({ Id: 5, Caption: 'INDEC' });
	expect(refs.metricVersionInput.focused).toBe(1);
});

it('onSelectMetric con grupo o proveedor desconocidos los deja en null', () => {
	const { vm } = setup();
	vm.onSelectMetric({ Id: 40, Caption: 'Población', GroupId: 99, ProviderId: 98 });
	expect(vm.newMetricGroup).toBeNull();
	expect(vm.newMetricProvider).toBeNull();
});
