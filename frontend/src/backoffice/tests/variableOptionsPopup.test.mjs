import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import VariableOptionsPopup from '@/backoffice/views/Metric/VariableOptionsPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';
import { makeVariable } from './scaleGeneratorFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.UpdateVariable = function () {};
	context.CurrentDataset = dataset;
	context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	context.Configuration = { UsePerimeter: true, UseGradients: true };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } },
		perimeter: { focused: 0, focus() { this.focused++; } },
	};
	const vm = mountLite(VariableOptionsPopup, { mocks: { $refs: refs } });
	vm.Level = { Id: 20, MetricVersion: { Metric: { Caption: 'Indicador' } } };
	vm.Variable = makeVariable({ IsSequence: false, SequenceColumn: null }, { Data: 'N', Perimeter: null });
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser };
}

describe('VariableOptionsPopup: propiedades calculadas');

it('lee la configuración de perímetro y gradientes, los permisos del trabajo y el título del indicador', () => {
	const { vm, context } = setup();
	expect(vm.usePerimeter).toBe(true);
	expect(vm.useGradients).toBe(true);
	expect(vm.canEdit).toBe(true);
	expect(vm.title).toBe('Indicador');
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
	vm.Level = null;
	expect(vm.title).toBe('');
});

it('columnsForSequenceColumn ofrece las columnas numéricas del dataset', () => {
	const { vm } = setup();
	expect(vm.columnsForSequenceColumn.map(function (column) { return column.Id; })).toEqual([1, 2]);
});

it('formatColumn formatea la columna con su variable', () => {
	const { vm, dataset } = setup();
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
});

describe('VariableOptionsPopup: apertura');

it('show trabaja sobre una copia y completa el modo de corte de la original si faltaba', () => {
	const { vm } = setup();
	const variable = makeVariable({ CutMode: null }, { Perimeter: 5 });
	vm.show({ Id: 20 }, variable);
	expect(variable.Symbology.CutMode).toBe('S');
	expect(vm.Variable === variable).toBe(false);
	expect(vm.Level).toEqual({ Id: 20 });
	expect(vm.showDialog).toBe(true);
});

it('show muestra el perímetro solo si la variable tiene uno positivo', () => {
	const { vm } = setup();
	vm.show({ Id: 20 }, makeVariable({}, { Perimeter: 5 }));
	expect(vm.showPerimeter).toBeTruthy();
	vm.show({ Id: 20 }, makeVariable({}, { Perimeter: null }));
	expect(vm.showPerimeter).toBeFalsy();
	vm.show({ Id: 20 }, makeVariable({}, { Perimeter: 0 }));
	expect(vm.showPerimeter).toBeFalsy();
});

it('al mostrar el perímetro enfoca su campo, y hide cierra el diálogo', async () => {
	const { vm, refs } = setup();
	vm.showPerimeter = false;
	vm.updatePerimeterVisibility();
	await waitTimers(130);
	expect(refs.perimeter.focused).toBe(0);
	vm.showPerimeter = true;
	vm.updatePerimeterVisibility();
	await waitTimers(130);
	expect(refs.perimeter.focused).toBe(1);
	vm.showDialog = true;
	vm.hide();
	expect(vm.showDialog).toBe(false);
});

describe('VariableOptionsPopup: guardado');

it('Save exige una variable para la fórmula', () => {
	const { vm, browser, refs } = setup();
	vm.Variable.Data = null;
	vm.Save();
	expect(browser.alerts).toEqual(['Debe indicar una variable para el valor para la fórmula.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save exige un perímetro numérico cuando se lo muestra', () => {
	const { vm, browser, refs } = setup();
	vm.showPerimeter = true;
	vm.Variable.Perimeter = 0;
	vm.Save();
	expect(browser.alerts).toEqual(['El perímetro debe tener un valor numérico.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save exige la columna de la secuencia cuando se activa el orden por secuencia', () => {
	const { vm, browser, refs, dataset } = setup();
	vm.Variable.Symbology.IsSequence = true;
	vm.Save();
	expect(browser.alerts).toEqual(['Debe indicar una variable que defina el orden de la secuencia.']);
	vm.Variable.Symbology.SequenceColumn = dataset.Columns[0];
	vm.Save();
	expect(refs.invoker.saved).toHaveLength(1);
});

it('Save descarta el perímetro si no se muestra, graba la variable con su nivel y cierra al terminar', async () => {
	const { vm, refs, dataset } = setup();
	vm.showPerimeter = false;
	vm.Variable.Perimeter = 7;
	vm.showDialog = true;
	vm.Save();
	expect(vm.Variable.Perimeter).toBeNull();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.UpdateVariable).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([vm.Level, vm.Variable]);
	await flushPromises();
	expect(vm.showDialog).toBe(false);
});

it('Save conserva el perímetro cuando se lo muestra con un valor válido', () => {
	const { vm } = setup();
	vm.showPerimeter = true;
	vm.Variable.Perimeter = 7;
	vm.Save();
	expect(vm.Variable.Perimeter).toBe(7);
});

it('DisplayError arma el mensaje de error del proceso', () => {
	const { vm } = setup();
	vm.DisplayError('sin conexión');
	expect(vm.error).toBe('El proceso no ha podido ser completado. sin conexión');
});
