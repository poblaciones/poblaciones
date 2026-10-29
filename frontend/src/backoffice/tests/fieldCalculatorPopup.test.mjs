import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import FieldCalculatorPopup from '@/backoffice/views/Dataset/FieldCalculatorPopup.vue';
import { makeActive, makeColumn } from './activeDatasetFixtures.mjs';

function setup() {
	const browser = setupBackoffice('P');
	const dataset = makeActive();
	dataset.Columns = [makeColumn(1, 'edad', 5), makeColumn(2, 'nombre', 1)];
	dataset.calculated = [];
	dataset.CalculateColumn = function (...args) {
		dataset.calculated.push(args);
		return Promise.resolve('ok');
	};
	browser.window.Context.CurrentDataset = dataset;
	const refs = {
		invoker: {
			messages: [],
			doMessage(message, context, method, ...args) {
				this.messages.push(message);
				return method.apply(context, args);
			},
		},
	};
	const vm = mountLite(FieldCalculatorPopup, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, refs: refs, browser: browser };
}

describe('FieldCalculatorPopup: apertura');

it('show abre el popup con Sumar seleccionada y dos operandos con [Valor] vacío', () => {
	const { vm, dataset } = setup();
	vm.show(dataset.Columns[0]);
	expect(vm.activateEdit).toBe(true);
	expect(vm.column === dataset.Columns[0]).toBeTruthy();
	expect(vm.operationKey).toBe('add');
	expect(vm.operation.Caption).toBe('Sumar');
	expect(vm.operands).toEqual([{ Source: 'value', Value: '' }, { Source: 'value', Value: '' }]);
});

it('al cambiar la operación se reinician los operandos según su cantidad', () => {
	const { vm, dataset } = setup();
	vm.show(dataset.Columns[0]);
	vm.operands[0].Source = 1;
	vm.operationKey = 'abs';
	vm.operationChanged();
	expect(vm.operands).toEqual([{ Source: 'value', Value: '' }]);
	vm.operationKey = 'substring';
	vm.operationChanged();
	expect(vm.operands).toHaveLength(3);
});

it('optionsFor ofrece las columnas del tipo de cada operando e inputTypeFor el tipo del cuadro de texto', () => {
	const { vm, dataset } = setup();
	vm.show(dataset.Columns[0]);
	vm.operationKey = 'substring';
	vm.operationChanged();
	expect(vm.optionsFor(0).map(function (option) { return option.Id; })).toEqual(['value', 'null', -100, 2]);
	expect(vm.optionsFor(1).map(function (option) { return option.Id; })).toEqual(['value', 'null', -100, 1]);
	expect(vm.inputTypeFor(0)).toBe('text');
	expect(vm.inputTypeFor(1)).toBe('number');
});

describe('FieldCalculatorPopup: cálculo');

it('save con un valor numérico inválido avisa y no envía nada', () => {
	const { vm, dataset, browser } = setup();
	vm.show(dataset.Columns[0]);
	vm.save();
	expect(browser.alerts).toEqual(["Indique un valor numérico para 'Número 1'."]);
	expect(dataset.calculated).toHaveLength(0);
	expect(vm.activateEdit).toBe(true);
});

it('save envía la columna, la clave de la operación y los operandos codificados, y al volver cierra y avisa', async () => {
	const { vm, dataset, refs } = setup();
	vm.show(dataset.Columns[0]);
	vm.operands[0].Source = 1;
	vm.operands[1].Value = '10';
	vm.save();
	expect(refs.invoker.messages).toEqual(['Calculando los valores']);
	expect(dataset.calculated[0][0] === dataset.Columns[0]).toBeTruthy();
	expect(dataset.calculated[0][1]).toBe('add');
	expect(dataset.calculated[0][2]).toEqual([{ t: 'C', v: 1 }, { t: 'V', v: 10 }]);
	await flushPromises();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([['completed']]);
});
