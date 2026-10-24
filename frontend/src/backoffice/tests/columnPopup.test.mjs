import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import ColumnPopup from '@/backoffice/views/Dataset/ColumnPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeColumn(overrides) {
	return Object.assign({ Id: 2, Variable: 'peso', Caption: 'Peso', Label: '', Format: 5, Order: 2 }, overrides);
}

function setup() {
	const browser = setupBackoffice('P');
	const dataset = makeGridDataset();
	dataset.SaveColumn = function () {};
	dataset.ScaleGenerator.labelChanges = [];
	dataset.ScaleGenerator.RegenAndSaveVariablesAffectedByLabelChange = function (column) { dataset.ScaleGenerator.labelChanges.push(column); };
	browser.window.Context.CurrentDataset = dataset;
	browser.window.Context.CurrentWork = {};
	const refs = {
		inputName: { focused: 0, focus() { this.focused++; } },
		invoker: { saved: [], result: Promise.resolve({ Id: 50, Caption: 'Caption nuevo', Order: 9 }), doSave(...args) { this.saved.push(args); return this.result; } },
	};
	const vm = mountLite(ColumnPopup, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, refs: refs, browser: browser };
}

describe('ColumnPopup: propiedades calculadas');

it('variableIsString y currentValidMeasures dependen del formato de la columna', () => {
	const { vm, dataset } = setup();
	vm.variable = makeColumn({ Format: 1 });
	expect(vm.variableIsString).toBe(true);
	expect(vm.currentValidMeasures.map(function (measure) { return measure.Id; })).toEqual(dataset.ValidMeasuresString().map(function (measure) { return measure.Id; }));
	vm.variable = makeColumn({ Format: 5 });
	expect(vm.variableIsString).toBe(false);
	expect(vm.currentValidMeasures.map(function (measure) { return measure.Id; })).toEqual(dataset.ValidMeasures().map(function (measure) { return measure.Id; }));
});

describe('ColumnPopup: apertura');

it('show trabaja sobre una copia, agrega el nombre del formato y abre la edición enfocando el nombre', async () => {
	const { vm, refs, dataset } = setup();
	const column = makeColumn();
	vm.show(column);
	expect(vm.originalVariable === column).toBeTruthy();
	expect(vm.variable === column).toBe(false);
	const expected = dataset.ValidFormats().find(function (format) { return format.Id === 5; }).Caption;
	expect(vm.variable.FormatFormatted).toBe(expected);
	expect(vm.activateEdit).toBe(true);
	await waitTimers(290);
	expect(refs.inputName.focused).toBe(1);
});

it('show de un formato desconocido lo informa como no reconocido', () => {
	const { vm } = setup();
	vm.show(makeColumn({ Format: 99 }));
	expect(vm.variable.FormatFormatted).toBe('No reconocido');
});

describe('ColumnPopup: guardado');

it('save rechaza un nombre de variable inválido con el mensaje del validador', () => {
	const { vm, browser, refs } = setup();
	vm.show(makeColumn({ Variable: '1abc' }));
	vm.save();
	expect(browser.alerts).toEqual(["El nombre de la variable no puede comenzar con '1'."]);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save de una columna existente la graba, actualiza su título y orden y la reemplaza en el dataset', async () => {
	const { vm, refs, dataset } = setup();
	vm.show(makeColumn());
	vm.variable.Caption = 'viejo';
	vm.save();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.SaveColumn).toBeTruthy();
	expect(refs.invoker.saved[0][2] === vm.variable).toBeTruthy();
	await flushPromises();
	expect(vm.variable.Caption).toBe('Caption nuevo');
	expect(vm.variable.Order).toBe(9);
	expect(dataset.Columns).toHaveLength(4);
	expect(dataset.Columns[1] === vm.variable).toBeTruthy();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([['completed']]);
});

it('save de una columna nueva toma su identificador y la agrega al dataset', async () => {
	const { vm, dataset } = setup();
	vm.show(makeColumn({ Id: null, Variable: 'talla' }));
	vm.save();
	await flushPromises();
	expect(vm.variable.Id).toBe(50);
	expect(dataset.Columns).toHaveLength(5);
	expect(dataset.Columns[4] === vm.variable).toBeTruthy();
});

it('si cambió el nombre o la etiqueta regenera las variables que la usan', async () => {
	const renamed = setup();
	renamed.vm.show(makeColumn());
	renamed.vm.variable.Variable = 'masa';
	renamed.vm.save();
	await flushPromises();
	expect(renamed.dataset.ScaleGenerator.labelChanges).toHaveLength(1);
	const relabeled = setup();
	relabeled.vm.show(makeColumn());
	relabeled.vm.variable.Label = 'Peso en kg';
	relabeled.vm.save();
	await flushPromises();
	expect(relabeled.dataset.ScaleGenerator.labelChanges).toHaveLength(1);
});

it('si no cambió el nombre ni la etiqueta no regenera nada', async () => {
	const { vm, dataset } = setup();
	vm.show(makeColumn());
	vm.variable.ColumnWidth = 30;
	vm.save();
	await flushPromises();
	expect(dataset.ScaleGenerator.labelChanges).toHaveLength(0);
});
