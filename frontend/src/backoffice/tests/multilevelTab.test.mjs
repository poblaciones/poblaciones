import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises, captureConsoleAsync } from './fixtures.mjs';
import MultilevelTab from '@/backoffice/views/Dataset/MultilevelTab.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setup(ownMatrix, linkedDatasets) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	dataset.properties.MultilevelMatrix = ownMatrix;
	dataset.MultilevelMatrix = [{ Id: 6, Caption: 'Otro', Bounded: false }];
	dataset.linked = linkedDatasets || [];
	dataset.GetMultilevelDatasets = function () { return dataset.linked; };
	dataset.AcquireMultilevelMatrix = function () { dataset.properties.MultilevelMatrix = 4; };
	dataset.UpdateMultilevelMatrix = function () {};
	context.CurrentDataset = dataset;
	context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	browser.window.location = { reloads: 0, reload() { this.reloads++; } };
	const refs = {
		invoker: { saved: [], result: Promise.resolve(), doSave(...args) { this.saved.push(args); return this.result; } },
	};
	const vm = mountLite(MultilevelTab, { mocks: { $refs: refs } });
	const other = { ds: { properties: { Id: 6, MultilevelMatrix: null } }, Bounded: false };
	return { vm: vm, dataset: dataset, refs: refs, browser: browser, other: other, context: context };
}

describe('MultilevelTab: propiedades calculadas');

it('list es la matriz multinivel del dataset y canEdit depende del trabajo', () => {
	const { vm, dataset, context } = setup(null);
	expect(vm.list === dataset.MultilevelMatrix).toBeTruthy();
	expect(vm.canEdit).toBe(true);
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
});

describe('MultilevelTab: vincular y desvincular datasets');

it('vincular el primer dataset toma una matriz nueva para ambos y graba', async () => {
	const { vm, dataset, other, refs } = setup(null, []);
	vm.handleToggle(true, other);
	expect(dataset.properties.MultilevelMatrix).toBe(4);
	expect(other.ds.properties.MultilevelMatrix).toBe(4);
	expect(refs.invoker.saved[0][1] === dataset.UpdateMultilevelMatrix).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([5, 4, 6, 4]);
	await flushPromises();
});

it('vincular un dataset más conserva la matriz existente', async () => {
	const { vm, dataset, other, refs } = setup(2, [{ properties: { Id: 7 } }]);
	vm.handleToggle(true, other);
	expect(dataset.properties.MultilevelMatrix).toBe(2);
	expect(other.ds.properties.MultilevelMatrix).toBe(2);
	expect(refs.invoker.saved[0].slice(2)).toEqual([5, 2, 6, 2]);
	await flushPromises();
});

it('desvincular le quita la matriz al otro dataset y, si no queda ninguno vinculado, también al propio', async () => {
	const { vm, dataset, other, refs } = setup(2, []);
	other.ds.properties.MultilevelMatrix = 2;
	vm.handleToggle(false, other);
	expect(other.ds.properties.MultilevelMatrix).toBeNull();
	expect(dataset.properties.MultilevelMatrix).toBeNull();
	expect(refs.invoker.saved[0].slice(2)).toEqual([5, null, 6, null]);
	await flushPromises();
});

it('desvincular conserva la matriz propia si quedan otros datasets vinculados', async () => {
	const { vm, dataset, other } = setup(2, [{ properties: { Id: 7 } }]);
	other.ds.properties.MultilevelMatrix = 2;
	vm.handleToggle(false, other);
	expect(dataset.properties.MultilevelMatrix).toBe(2);
	await flushPromises();
});

it('al terminar de grabar recarga la página para actualizar la grilla de completar nivel', async () => {
	const { vm, other, browser } = setup(null, []);
	vm.handleToggle(true, other);
	await flushPromises();
	expect(browser.window.location.reloads).toBe(1);
});

it('si el guardado falla restaura los valores anteriores y no recarga la página', async () => {
	const { vm, dataset, other, refs, browser } = setup(2, [{ properties: { Id: 7 } }]);
	other.ds.properties.MultilevelMatrix = null;
	refs.invoker.result = Promise.reject(new Error('rechazado'));
	await captureConsoleAsync(async function () {
		vm.handleToggle(true, other);
		await flushPromises();
	});
	expect(dataset.properties.MultilevelMatrix).toBe(2);
	expect(other.ds.properties.MultilevelMatrix).toBeNull();
	expect(other.Bounded).toBe(false);
	expect(browser.window.location.reloads).toBe(0);
});
