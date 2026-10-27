import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import CodesSelection from '@/backoffice/views/Dataset/Georeference/CodesSelection.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	context.CurrentDataset = dataset;
	context.CurrentWork = { requested: [], GetGeographyItems(id) { this.requested.push(id); } };
	context.Geographies = { GetAll(callback) { this.callback = callback; } };
	const refs = {
		invoker: { messages: [], result: Promise.resolve([{ Value: 'a' }]), doMessage(...args) { this.messages.push(args); return this.result; } },
		valuesPopup: { shown: [], showGeographyValues(...args) { this.shown.push(args); } },
	};
	const vm = mountLite(CodesSelection, { propsData: { value: {} }, mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, context: context, refs: refs };
}

function geography(id, parentId, rootCaption) {
	return { Id: id, ParentId: parentId, RootCaption: rootCaption, Caption: 'G' + id };
}

function ids(list) {
	return list.map(function (item) { return item.Id; });
}

describe('CodesSelection: propiedades y formato');

it('toma el dataset y el trabajo actuales y arranca sin geografías', () => {
	const { vm, dataset, context } = setup();
	expect(vm.Dataset === dataset).toBeTruthy();
	expect(vm.Work === context.CurrentWork).toBeTruthy();
	expect(vm.geographies).toEqual([]);
	expect(vm.valuesPopupReset).toBe(false);
});

it('valuesDisabled es verdadero sin geografía elegida, y formatGeography muestra nombre y revisión', () => {
	const { vm, dataset } = setup();
	expect(vm.valuesDisabled(null)).toBe(true);
	expect(vm.valuesDisabled(3)).toBe(false);
	expect(vm.formatGeography(null)).toBe('');
	expect(vm.formatGeography({ Caption: 'Departamentos', Revision: '2010' })).toBe('Departamentos (2010)');
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
});

describe('CodesSelection: orden jerárquico de geografías');

it('ordena cada raíz seguida de sus descendientes', () => {
	const { vm } = setup();
	const list = [geography(1, null, null), geography(2, 1, null), geography(3, 2, null), geography(4, null, null)];
	expect(ids(vm.ResolveRootCaptions(list))).toEqual([1, 2, 3, 4]);
});

it('agrupa los hijos bajo su raíz aunque aparezcan desordenados en la lista', () => {
	const { vm } = setup();
	const list = [geography(2, 1, null), geography(4, null, null), geography(1, null, null), geography(5, 4, null)];
	expect(ids(vm.ResolveRootCaptions(list))).toEqual([4, 5, 1, 2]);
});

it('los que tienen etiqueta de raíz y padre pasan a ser raíces propias, al final, con sus descendientes', () => {
	const { vm } = setup();
	const list = [geography(1, null, null), geography(2, 1, null), geography(4, 1, 'Otro grupo'), geography(5, 4, null)];
	const sorted = vm.ResolveRootCaptions(list);
	expect(ids(sorted)).toEqual([1, 2, 4, 5]);
	expect(sorted[3].RootCaption).toBe('Otro grupo');
});

it('los descendientes heredan la etiqueta de raíz del grupo', () => {
	const { vm } = setup();
	const list = [geography(1, null, 'Grupo A'), geography(2, 1, null), geography(3, 2, null)];
	vm.ResolveRootCaptions(list);
	expect(list[1].RootCaption).toBe('Grupo A');
	expect(list[2].RootCaption).toBe('Grupo A');
});

it('una lista vacía da una lista vacía', () => {
	const { vm } = setup();
	expect(vm.ResolveRootCaptions([])).toEqual([]);
});

it('al montar ordena las geografías del contexto para el combo', () => {
	const { vm, context } = setup();
	CodesSelection.mounted.call(vm);
	context.Geographies.callback([geography(2, 1, null), geography(1, null, null)]);
	expect(ids(vm.geographies)).toEqual([1, 2]);
});

describe('CodesSelection: valores de una geografía');

it('valuesOnClick trae los ítems de la geografía y abre el popup de valores en el siguiente ciclo', async () => {
	const { vm, refs, context } = setup();
	vm.valuesOnClick(4);
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo valores');
	expect(refs.invoker.messages[0][1] === context.CurrentWork).toBeTruthy();
	expect(refs.invoker.messages[0][2] === context.CurrentWork.GetGeographyItems).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe(4);
	await flushPromises();
	expect(vm.valuesPopupReset).toBe(true);
	expect(refs.valuesPopup.shown[0][0]).toEqual([{ Value: 'a' }]);
	refs.valuesPopup.shown[0][1]();
	expect(vm.valuesPopupReset).toBe(false);
});
