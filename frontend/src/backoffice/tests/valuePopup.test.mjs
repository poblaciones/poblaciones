import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import ValuePopup from '@/backoffice/views/Metric/ValuePopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup() {
	const browser = setupBackoffice('P');
	const dataset = makeGridDataset();
	dataset.ScaleGenerator.fixed = [];
	dataset.ScaleGenerator.FixManualRanges = function (variable, colors) { dataset.ScaleGenerator.fixed.push([variable, colors]); };
	browser.window.Context.CurrentDataset = dataset;
	const focus = [];
	const refs = {
		minInput: { focus() { focus.push('min'); } },
		maxInput: { focus() { focus.push('max'); } },
	};
	const vm = mountLite(ValuePopup, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, focus: focus, browser: browser };
}

function open(vm, itemValue, previousValue, isLast) {
	const variable = { Values: [] };
	const item = { Value: itemValue };
	let previous = null;
	if (previousValue !== undefined) {
		previous = { Value: previousValue };
	}
	vm.show(variable, ['#fff'], item, previous, isLast);
	return { variable: variable, item: item, previous: previous };
}

describe('ValuePopup: apertura');

it('show guarda el ítem, su valor y el anterior, y abre el diálogo', () => {
	const { vm } = setup();
	const opened = open(vm, 20, 10, false);
	expect(vm.showDialog).toBe(true);
	expect(vm.itemValue).toBe(20);
	expect(vm.previousValue).toBe(10);
	expect(vm.previous === opened.previous).toBeTruthy();
	expect(vm.isLast).toBe(false);
	expect(vm.customColors).toEqual(['#fff']);
});

it('show enfoca el mínimo si hay rango anterior y el máximo si es el primero', async () => {
	const withPrevious = setup();
	open(withPrevious.vm, 20, 10, false);
	await waitTimers(130);
	expect(withPrevious.focus).toEqual(['min']);
	const first = setup();
	open(first.vm, 20, undefined, false);
	await waitTimers(130);
	expect(first.focus).toEqual(['max']);
});

it('hide cierra el diálogo', () => {
	const { vm } = setup();
	vm.showDialog = true;
	vm.hide();
	expect(vm.showDialog).toBe(false);
});

describe('ValuePopup: parseNumber');

it('acepta coma o punto decimal y devuelve NaN si no es un número', () => {
	const { vm } = setup();
	expect(vm.parseNumber('2,5')).toBe(2.5);
	expect(vm.parseNumber('2.5')).toBe(2.5);
	expect(vm.parseNumber(7)).toBe(7);
	expect(isNaN(vm.parseNumber('abc'))).toBe(true);
	expect(isNaN(vm.parseNumber(null))).toBe(true);
});

describe('ValuePopup: save');

it('exige un valor mínimo cuando hay un rango anterior', () => {
	const { vm, browser, focus } = setup();
	open(vm, 20, 10, false);
	vm.previousValue = '  ';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un valor mínimo.']);
	expect(focus[focus.length - 1]).toBe('min');
	vm.previousValue = null;
	vm.save();
	expect(browser.alerts).toHaveLength(2);
});

it('exige que el mínimo sea numérico', () => {
	const { vm, browser, focus } = setup();
	open(vm, 20, 10, false);
	vm.previousValue = 'abc';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un valor numérico.']);
	expect(focus[focus.length - 1]).toBe('min');
});

it('exige un valor máximo salvo en el último rango', () => {
	const { vm, browser, focus } = setup();
	open(vm, 20, 10, false);
	vm.itemValue = '';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un valor máximo.']);
	expect(focus[focus.length - 1]).toBe('max');
	vm.isLast = true;
	vm.itemValue = '';
	vm.save();
	expect(browser.alerts).toHaveLength(1);
});

it('exige que el máximo sea numérico y vuelve el foco al campo del máximo', () => {
	const { vm, browser, focus } = setup();
	open(vm, 20, 10, false);
	vm.itemValue = 'abc';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un valor numérico.']);
	expect(focus[focus.length - 1]).toBe('max');
});

it('exige que el máximo sea mayor que el mínimo', () => {
	const { vm, browser, dataset } = setup();
	open(vm, 10, 10, false);
	vm.save();
	expect(browser.alerts).toEqual(['El máximo debe ser mayor al mínimo.']);
	expect(dataset.ScaleGenerator.fixed).toHaveLength(0);
	expect(vm.showDialog).toBe(true);
});

it('guarda el mínimo en el rango anterior y el máximo en el ítem, corrige los rangos y cierra', () => {
	const { vm, dataset } = setup();
	const opened = open(vm, 20, 10, false);
	vm.previousValue = '12,5';
	vm.itemValue = '30';
	vm.save();
	expect(opened.previous.Value).toBe(12.5);
	expect(opened.item.Value).toBe(30);
	expect(dataset.ScaleGenerator.fixed).toEqual([[opened.variable, ['#fff']]]);
	expect(vm.showDialog).toBe(false);
});

it('en el último rango no modifica el valor del ítem', () => {
	const { vm } = setup();
	const opened = open(vm, 9999, 10, true);
	vm.previousValue = '15';
	vm.save();
	expect(opened.previous.Value).toBe(15);
	expect(opened.item.Value).toBe(9999);
});

it('el primer rango admite un máximo negativo o cero', () => {
	const { vm, browser, dataset } = setup();
	const opened = open(vm, 20, undefined, false);
	vm.itemValue = '-5';
	vm.save();
	expect(browser.alerts).toEqual([]);
	expect(opened.item.Value).toBe(-5);
	vm.itemValue = '0';
	vm.save();
	expect(browser.alerts).toEqual([]);
	expect(dataset.ScaleGenerator.fixed).toHaveLength(2);
});
