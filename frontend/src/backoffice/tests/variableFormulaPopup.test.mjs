import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import VariableFormulaPopup from '@/backoffice/views/Metric/VariableFormulaPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';
import { makeVariable } from './scaleGeneratorFixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.Labels = { 1: [{ Value: 1, Caption: 'Uno' }] };
	dataset.ScaleGenerator.regenerated = [];
	dataset.ScaleGenerator.RegenAndSaveVariable = function () {};
	context.CurrentDataset = dataset;
	context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	context.Configuration = { UseGap: true };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } },
		operator: { $el: {} },
		filterVal: { $el: {} },
	};
	const vm = mountLite(VariableFormulaPopup, { mocks: { $refs: refs } });
	vm.Level = { Id: 20, MetricVersion: { Metric: { Caption: 'Indicador' } } };
	vm.Variable = makeVariable({}, { Data: 'N' });
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser };
}

describe('VariableFormulaPopup: propiedades calculadas');

it('useGap viene de la configuración, canEdit del permiso del trabajo y title del indicador', () => {
	const { vm, context } = setup();
	expect(vm.useGap).toBe(true);
	expect(vm.canEdit).toBe(true);
	expect(vm.title).toBe('Indicador');
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
	vm.Level = null;
	expect(vm.title).toBe('');
});

it('DataColumnIsCategorical es verdadero para columnas de texto o con etiquetas', () => {
	const { vm, dataset } = setup();
	expect(vm.DataColumnIsCategorical()).toBe(false);
	vm.Variable.DataColumn = dataset.Columns[2];
	expect(vm.DataColumnIsCategorical()).toBe(true);
	vm.Variable.DataColumn = dataset.Columns[0];
	expect(vm.DataColumnIsCategorical()).toBe(true);
	vm.Variable.DataColumn = dataset.Columns[1];
	expect(vm.DataColumnIsCategorical()).toBe(false);
	vm.Variable = null;
	expect(vm.DataColumnIsCategorical()).toBe(false);
});

describe('VariableFormulaPopup: recepción de la variable');

it('receiveFilter sin filtro deja el filtro desactivado y vacío', () => {
	const { vm } = setup();
	vm.filterValue = 'x';
	vm.receiveFilter();
	expect(vm.useFilter).toBe(false);
	expect([vm.filterOperator, vm.filterValue, vm.filterVariable]).toEqual([null, null, null]);
});

it('receiveFilter con filtro toma su columna, operador y valor', () => {
	const { vm, dataset } = setup();
	vm.Variable.FilterValue = 'lat\t>\t5';
	vm.receiveFilter();
	expect(vm.useFilter).toBe(true);
	expect(vm.filterVariable === dataset.Columns[0]).toBeTruthy();
	expect(vm.filterOperator).toBe('>');
	expect(vm.filterValue).toBe('5');
});

it('receiveValue toma el indicador de brecha y las cuatro columnas de la fórmula', () => {
	const { vm, dataset } = setup();
	vm.Variable.IsGap = true;
	vm.Variable.Data = 'O';
	vm.Variable.DataColumn = dataset.Columns[0];
	vm.Variable.GapData = 'O';
	vm.Variable.GapDataColumn = dataset.Columns[1];
	vm.receiveValue();
	expect(vm.isGap).toBe(true);
	expect(vm.newVariable === dataset.Columns[0]).toBeTruthy();
	expect(vm.newGapVariable === dataset.Columns[1]).toBeTruthy();
	expect(vm.newNormalization.Caption).toBe('[Ninguna]');
	expect(vm.newGapNormalization.Caption).toBe('[Ninguna]');
});

it('show trabaja sobre una copia, recuerda el filtro original y abre el diálogo', () => {
	const { vm } = setup();
	const variable = makeVariable({ CutMode: null }, { Data: 'N', FilterValue: 'lat\t>\t5' });
	vm.show({ Id: 20 }, variable);
	expect(variable.Symbology.CutMode).toBe('S');
	expect(vm.Variable === variable).toBe(false);
	expect(vm.originalFilterValue).toBe('lat\t>\t5');
	expect(vm.useFilter).toBe(true);
	expect(vm.showDialog).toBe(true);
	expect(vm.Level).toEqual({ Id: 20 });
});

it('show propone la escala de normalización 100 si la variable no la tiene definida', () => {
	const { vm } = setup();
	vm.show({ Id: 20 }, makeVariable({}, { Data: 'N', NormalizationScale: null }));
	expect(vm.Variable.NormalizationScale).toBe(100);
	vm.show({ Id: 20 }, makeVariable({}, { Data: 'N', NormalizationScale: 1000 }));
	expect(vm.Variable.NormalizationScale).toBe(1000);
});

it('show permite guardar con Enter desde el campo del valor del filtro', async () => {
	const { vm, refs } = setup();
	const saves = [];
	vm.Save = function () { saves.push(1); };
	vm.show({ Id: 20 }, makeVariable({}, { Data: 'N' }));
	await waitTimers(80);
	expect(refs.operator.$el.validity).toEqual({});
	expect(refs.filterVal.$el.onkeydown({ keyCode: 13 })).toBe(false);
	refs.filterVal.$el.onkeydown({ keyCode: 65 });
	expect(saves).toHaveLength(1);
});

it('hide cierra el diálogo', () => {
	const { vm } = setup();
	vm.showDialog = true;
	vm.hide();
	expect(vm.showDialog).toBe(false);
});

describe('VariableFormulaPopup: filtro');

function withFilter(vm, dataset, operator, value) {
	vm.useFilter = true;
	vm.filterVariable = dataset.Columns[0];
	vm.filterOperator = operator;
	vm.filterValue = value;
}

it('sin filtro activo borra el valor del filtro de la variable', () => {
	const { vm } = setup();
	vm.Variable.FilterValue = 'lat\t>\t5';
	vm.useFilter = false;
	expect(vm.updateFilterValues()).toBe(true);
	expect(vm.Variable.FilterValue).toBeNull();
});

it('un filtro incompleto avisa qué falta', () => {
	const { vm, dataset, browser } = setup();
	vm.useFilter = true;
	vm.filterVariable = null;
	expect(vm.updateFilterValues()).toBe(false);
	withFilter(vm, dataset, '>', '');
	expect(vm.updateFilterValues()).toBe(false);
	withFilter(vm, dataset, '>', null);
	expect(vm.updateFilterValues()).toBe(false);
	withFilter(vm, dataset, null, '5');
	expect(vm.updateFilterValues()).toBe(false);
	expect(browser.alerts).toEqual([
		'Debe indicar una variable para el filtro.',
		'Debe indicar un valor para el filtro.',
		'Debe indicar un valor para el filtro.',
		'Debe indicar un operador para el filtro.',
	]);
});

it('un valor de texto sin comillas se rechaza, y con comillas o numérico se acepta', () => {
	const { vm, dataset, browser } = setup();
	withFilter(vm, dataset, '=', 'Norte');
	expect(vm.updateFilterValues()).toBe(false);
	expect(browser.alerts).toEqual(['Los valores de filtro de tipo texto deben indicarse entre comillas ("valor")']);
	withFilter(vm, dataset, '=', "'Norte'");
	expect(vm.updateFilterValues()).toBe(true);
	withFilter(vm, dataset, '=', '"Norte"');
	expect(vm.updateFilterValues()).toBe(true);
	withFilter(vm, dataset, '>', '12,5');
	expect(vm.updateFilterValues()).toBe(true);
	expect(vm.Variable.FilterValue).toBe('lat\t>\t12,5');
});

describe('VariableFormulaPopup: updateValues');

it('una columna categórica pasa a ser la variable de corte y quita la normalización', () => {
	const { vm, dataset } = setup();
	vm.newVariable = dataset.Columns[2];
	vm.newNormalization = dataset.Columns[1];
	vm.updateValues();
	expect(vm.Variable.Data).toBe('O');
	expect(vm.Variable.DataColumn === dataset.Columns[2]).toBeTruthy();
	expect(vm.Variable.DataColumnIsCategorical).toBe(true);
	expect(vm.Variable.Symbology.CutMode).toBe('V');
	expect(vm.Variable.Symbology.CutColumn === dataset.Columns[2]).toBeTruthy();
	expect(vm.Variable.Normalization).toBeNull();
});

it('una columna numérica toma su normalización', () => {
	const { vm, dataset } = setup();
	vm.newVariable = dataset.Columns[1];
	vm.newNormalization = dataset.Columns[0];
	vm.updateValues();
	expect(vm.Variable.DataColumnIsCategorical).toBe(false);
	expect(vm.Variable.Normalization).toBe('O');
	expect(vm.Variable.NormalizationColumn === dataset.Columns[0]).toBeTruthy();
});

it('al dejar de ser categórica la variable vuelve a categoría única y pierde la columna de corte', () => {
	const { vm, dataset } = setup();
	vm.Variable.DataColumnIsCategorical = true;
	vm.Variable.Symbology.CutMode = 'V';
	vm.Variable.Symbology.CutColumn = dataset.Columns[2];
	vm.newVariable = dataset.Columns[1];
	vm.newNormalization = vm.Dataset.GetNullColumn()[0];
	vm.updateValues();
	expect(vm.Variable.Symbology.CutMode).toBe('S');
	expect(vm.Variable.Symbology.CutColumn).toBeNull();
});

it('una brecha toma los datos de la segunda variable y detecta si comparte el mismo total', () => {
	const { vm, dataset } = setup();
	vm.isGap = true;
	vm.newVariable = dataset.Columns[1];
	vm.newNormalization = dataset.Columns[0];
	vm.newGapVariable = dataset.Columns[0];
	vm.newGapNormalization = dataset.Columns[0];
	vm.updateValues();
	expect(vm.Variable.IsGap).toBe(true);
	expect(vm.Variable.GapData).toBe('O');
	expect(vm.Variable.GapDataColumn === dataset.Columns[0]).toBeTruthy();
	expect(vm.Variable.HasGapSameTotal).toBe(true);
	vm.newGapNormalization = dataset.Columns[1];
	vm.updateValues();
	expect(vm.Variable.HasGapSameTotal).toBe(false);
});

it('sin brecha borra los datos de la segunda variable', () => {
	const { vm, dataset } = setup();
	vm.Variable.GapData = 'O';
	vm.Variable.GapDataColumn = dataset.Columns[0];
	vm.Variable.HasGapSameTotal = true;
	vm.isGap = false;
	vm.newVariable = dataset.Columns[1];
	vm.newNormalization = vm.Dataset.GetNullColumn()[0];
	vm.updateValues();
	expect([vm.Variable.GapData, vm.Variable.GapDataColumn, vm.Variable.GapNormalization, vm.Variable.GapNormalizationColumn]).toEqual([null, null, null, null]);
	expect(vm.Variable.HasGapSameTotal).toBe(false);
});

describe('VariableFormulaPopup: Save');

function prepareSave(vm, dataset) {
	vm.useFilter = false;
	vm.isGap = false;
	vm.newVariable = dataset.Columns[1];
	vm.newNormalization = vm.Dataset.GetNullColumn()[0];
	vm.newGapVariable = vm.Dataset.GetNullColumn()[0];
	vm.newGapNormalization = vm.Dataset.GetNullColumn()[0];
	vm.Variable.Data = 'O';
}

it('Save exige una variable para la fórmula', () => {
	const { vm, browser, refs } = setup();
	vm.Variable.Data = null;
	vm.Save();
	expect(browser.alerts).toEqual(['Debe indicar una variable para el valor para la fórmula.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save no guarda si el filtro es inválido', () => {
	const { vm, refs } = setup();
	vm.useFilter = true;
	vm.filterVariable = null;
	vm.Save();
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save de una brecha exige la segunda variable y normalizaciones coherentes', () => {
	const { vm, dataset, browser, refs } = setup();
	prepareSave(vm, dataset);
	vm.isGap = true;
	vm.Save();
	expect(browser.alerts).toEqual(['Debe indicar una variable para el valor de la segunda variable para la fórmula.']);
	vm.newGapVariable = dataset.Columns[0];
	vm.newNormalization = dataset.Columns[0];
	vm.newGapNormalization = vm.Dataset.GetNullColumn()[0];
	vm.Save();
	expect(browser.alerts[1]).toBe('La normalización debe operar igual en ambas variable (con normalización o sin normalización).');
	expect(refs.invoker.saved).toHaveLength(0);
});

it('Save sin cambio de filtro graba la variable', async () => {
	const { vm, dataset, refs } = setup();
	prepareSave(vm, dataset);
	vm.originalFilterValue = null;
	vm.showDialog = true;
	vm.Save();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.UpdateVariable).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([vm.Level, vm.Variable]);
	await flushPromises();
	expect(vm.showDialog).toBe(false);
});

it('Save con un filtro distinto del original regenera las escalas al grabar', () => {
	const { vm, dataset, refs } = setup();
	prepareSave(vm, dataset);
	vm.originalFilterValue = 'lat\t>\t5';
	vm.Save();
	expect(refs.invoker.saved[0][0] === dataset.ScaleGenerator).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.ScaleGenerator.RegenAndSaveVariable).toBeTruthy();
});
