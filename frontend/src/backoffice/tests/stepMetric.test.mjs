import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import StepMetric from '@/backoffice/views/Dataset/CalculatedWizard/StepMetric.vue';

function makeNewMetric(overrides) {
	return Object.assign({
		Type: 'area',
		Source: { VariableId: 9, ValueLabelIds: [1] },
		SourceMetric: null,
		SelectedVersion: null,
		SelectedLevel: null,
		SelectedVariable: null,
	}, overrides);
}

function setup(overrides) {
	axios.reset();
	const browser = setupBackoffice('P');
	const refs = { searchPanel: { focused: 0, focus() { this.focused++; } } };
	const vm = mountLite(StepMetric, { propsData: { newMetric: makeNewMetric(overrides) }, mocks: { $refs: refs } });
	return { vm: vm, refs: refs, browser: browser };
}

describe('StepMetric: propiedades calculadas');

it('caption toma el nombre del indicador elegido, o vacío', () => {
	const { vm } = setup();
	expect(vm.caption).toBe('');
	vm.newMetric.SourceMetric = { Metric: { Name: 'Población' } };
	expect(vm.caption).toBe('Población');
	vm.newMetric.SourceMetric = { Metric: null };
	expect(vm.caption).toBe('');
});

it('action es rastreo para distancia y conteo en otro caso', () => {
	const { vm } = setup({ Type: 'distance' });
	expect(vm.action).toBe('rastreo');
	vm.newMetric.Type = 'area';
	expect(vm.action).toBe('conteo');
});

describe('StepMetric: foco');

it('focus avanza al paso siguiente si ya hay indicador y se presionó Siguiente', () => {
	const { vm, refs } = setup({ SourceMetric: { Metric: {} } });
	vm.focus(true);
	expect(vm.$emitted).toEqual([['raiseNext']]);
	expect(refs.searchPanel.focused).toBe(0);
});

it('focus enfoca el buscador si no hay indicador o se volvió desde el paso siguiente', () => {
	const { vm, refs } = setup();
	vm.focus(true);
	const withMetric = setup({ SourceMetric: { Metric: {} } });
	withMetric.vm.focus(false);
	expect(refs.searchPanel.focused).toBe(1);
	expect(withMetric.refs.searchPanel.focused).toBe(1);
	expect(vm.$emitted).toHaveLength(0);
});

describe('StepMetric: elección del indicador');

it('clearMetric descarta el indicador y todo lo elegido a partir de él', () => {
	const { vm } = setup({ SourceMetric: { Metric: {} }, SelectedVersion: {}, SelectedLevel: {}, SelectedVariable: {} });
	vm.columnExists = true;
	vm.clearMetric();
	expect(vm.newMetric.SourceMetric).toBeNull();
	expect(vm.newMetric.Source).toEqual({ VariableId: null, ValueLabelIds: [] });
	expect([vm.newMetric.SelectedVersion, vm.newMetric.SelectedLevel, vm.newMetric.SelectedVariable]).toEqual([null, null, null]);
	expect(vm.columnExists).toBeNull();
});

it('metricSelected consulta el indicador, toma su última versión y avanza', async () => {
	const { vm } = setup();
	const versions = [{ Id: 1 }, { Id: 2 }];
	axios.respond('get', { data: { Metric: { Name: 'Población' }, Versions: versions } });
	vm.metricSelected({ Id: 40 });
	await flushPromises();
	expect(axios.calls[0].url).toBe('https://api.example.org/services/metrics/GetSelectedMetric');
	expect(axios.calls[0].config.params).toEqual({ l: 40 });
	expect(vm.newMetric.SourceMetric.Metric.Name).toBe('Población');
	expect(vm.newMetric.SelectedVersion === versions[1]).toBeTruthy();
	expect(vm.$emitted).toEqual([['raiseNext']]);
});

it('metricSelected de un indicador sin series avisa y no avanza', async () => {
	const { vm, browser } = setup();
	axios.respond('get', { data: { Metric: { Name: 'Vacío' }, Versions: [] } });
	vm.metricSelected({ Id: 41 });
	await flushPromises();
	expect(browser.alerts).toEqual(['El indicador no posee ninguna serie de datos.']);
	expect(vm.newMetric.SelectedVersion).toBeNull();
	expect(vm.$emitted).toHaveLength(0);
});

it('metricSelected reemplaza lo elegido antes', async () => {
	const { vm } = setup({ SelectedLevel: {}, SelectedVariable: {} });
	axios.respond('get', { data: { Metric: {}, Versions: [{ Id: 1 }] } });
	vm.metricSelected({ Id: 40 });
	expect(vm.newMetric.SelectedLevel).toBeNull();
	expect(vm.newMetric.SelectedVariable).toBeNull();
	await flushPromises();
});

describe('StepMetric: validación');

it('validate exige un indicador con una versión', () => {
	const { vm, browser } = setup();
	expect(vm.validate()).toBe(false);
	vm.newMetric.SourceMetric = { Metric: {} };
	expect(vm.validate()).toBe(false);
	expect(browser.alerts).toEqual(['Debe seleccionar un indicador.', 'El indicador seleccionado no posee ninguna serie de datos.']);
	vm.newMetric.SelectedVersion = {};
	expect(vm.validate()).toBe(true);
});
