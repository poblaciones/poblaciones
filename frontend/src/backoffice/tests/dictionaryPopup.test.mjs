import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import DictionaryPopup from '@/backoffice/views/Dataset/DictionaryPopup.vue';
import { makeGrid, makeGridDataset } from './activeGridFixtures.mjs';

globalThis.jqx = { dataAdapter: function (source) { this.source = source; } };

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup(gridOverrides) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.Columns.forEach(function (column, index) { column.Order = index + 1; });
	dataset.orderCalls = [];
	dataset.cancelCalls = [];
	dataset.SetColumnOrder = function (list, success, failure) {
		dataset.orderCalls.push({ list: list, success: success, failure: failure });
		return function (reason) { dataset.cancelCalls.push(reason); };
	};
	context.CurrentDataset = dataset;
	context.CurrentWork = { properties: { Id: 3 }, canEdit: true, CanEdit() { return this.canEdit; }, GetGridExportUrl() { return 'export-url'; } };
	const grid = makeGrid(gridOverrides);
	grid.getrowid = function (index) { return dataset.Columns[index].Id; };
	grid.refreshed = 0;
	grid.refresh = function () { grid.refreshed++; };
	const refs = {
		columnsGrid: grid,
		invoker: { calls: [], messages: [], call(method) { this.calls.push(method); }, doMessage(...args) { this.messages.push(args); } },
		valuesPopup: { shown: [], show(...args) { this.shown.push(['show'].concat(args)); }, showAutoRecode(...args) { this.shown.push(['auto'].concat(args)); } },
		edit: { shown: [], newShown: 0, show(column) { this.shown.push(column); }, showNew() { this.newShown++; } },
		confirmDialog: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(DictionaryPopup, { mocks: { $refs: refs } });
	return { vm: vm, grid: grid, dataset: dataset, refs: refs, context: context, browser: browser };
}

function names(grid) {
	return grid.calls.map(function (call) { return call[0]; });
}

describe('DictionaryPopup: estado inicial');

it('define un origen con los once campos de la variable y arranca cerrado y sin acciones habilitadas', () => {
	const { vm } = setup();
	expect(vm.source.datafields.map(function (field) { return field.name; })).toEqual([
		'Id', 'Variable', 'Summary', 'Format', 'Measure', 'Alignment', 'Decimals', 'ColumnWidth', 'FieldWidth', 'Label', 'ValueLabels',
	]);
	expect(vm.open).toBeFalsy();
	expect([vm.upDisabled, vm.downDisabled, vm.modifyDisabled, vm.deleteDisabled, vm.valuesDisabled, vm.autoRecodeDisabled]).toEqual([true, true, true, true, true, true]);
	expect(vm.columns).toHaveLength(11);
	expect(vm.columns[0].pinned).toBeTruthy();
	expect(vm.columns[0].cellsrenderer === vm.numberrenderer).toBeTruthy();
});

it('canEdit refleja el permiso del trabajo y es falso sin trabajo', () => {
	const { vm, context } = setup();
	expect(vm.canEdit).toBe(true);
	context.CurrentWork.canEdit = false;
	expect(vm.canEdit).toBe(false);
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
});

describe('DictionaryPopup: contenido');

it('Match devuelve el título de la lista o "No reconocido"', () => {
	const { vm, dataset } = setup();
	expect(vm.Match([{ Id: 1, Caption: 'Uno' }], 1)).toBe('Uno');
	expect(vm.Match([{ Id: 1, Caption: 'Uno' }], 9)).toBe('No reconocido');
	expect(vm.AlignmentToString(1)).toBe('Derecha');
	expect(vm.FormatToString(99)).toBe('No reconocido');
	expect(vm.MeasureToString(dataset.ValidMeasures()[0].Id)).toBe(dataset.ValidMeasures()[0].Caption);
});

it('getData sin dataset o sin columnas devuelve una lista vacía', () => {
	const { vm, context, dataset } = setup();
	dataset.Columns = [];
	expect(vm.getData()).toEqual([]);
	dataset.Columns = null;
	expect(vm.getData()).toEqual([]);
	context.CurrentDataset = null;
	expect(vm.getData()).toEqual([]);
});

it('getData arma una fila por columna con sus propiedades y el resumen como Sí o No', () => {
	const { vm, dataset } = setup();
	dataset.Columns[0].UseInSummary = true;
	dataset.Columns[0].Label = 'Latitud';
	const data = vm.getData();
	expect(data).toHaveLength(4);
	expect(data[0].slice(0, 3)).toEqual([1, 'lat', 'Sí']);
	expect(data[1][2]).toBe('No');
	expect(data[0][9]).toBe('Latitud');
});

it('getData agrega la primera categoría de la columna entre llaves, si tiene', () => {
	const { vm, dataset } = setup();
	dataset.Labels = { 1: [{ Value: 1, Caption: 'Uno' }, { Value: 2, Caption: 'Dos' }], 2: [] };
	const data = vm.getData();
	expect(data[0][10]).toBe('{1, Uno} ...');
	expect(data[1][10]).toBe('');
	expect(data[2][10]).toBe('');
});

describe('DictionaryPopup: selección');

it('selectedIds e selectedIndexes leen la grilla, y selectedColumn devuelve la columna elegida', () => {
	const { vm, grid, dataset } = setup({ selectedIndexes: [2, 0] });
	expect(vm.selectedIndexes()).toEqual([0, 2]);
	expect(vm.selectedIds()).toEqual([3, 1]);
	expect(vm.selectedId()).toBe(3);
	expect(vm.selectedColumn() === dataset.Columns[2]).toBeTruthy();
	grid.selectedIndexes = [];
	expect(vm.selectedId()).toBeNull();
	expect(vm.selectedColumn()).toBeNull();
});

it('allSelectedAreString exige que todas las columnas seleccionadas sean de texto', () => {
	const { vm, grid } = setup({ selectedIndexes: [2, 3] });
	expect(vm.allSelectedAreString()).toBe(true);
	grid.selectedIndexes = [0, 2];
	expect(vm.allSelectedAreString()).toBe(false);
});

it('selectionChanged habilita modificar, categorías, eliminar, recodificar y mover según la selección', () => {
	const { vm, grid } = setup({ rowCount: 4, rows: [{}] });
	vm.source.totalrecords = 4;
	grid.selectedIndexes = [];
	vm.selectionChanged();
	expect([vm.modifyDisabled, vm.valuesDisabled, vm.deleteDisabled, vm.autoRecodeDisabled, vm.upDisabled, vm.downDisabled])
		.toEqual([true, true, true, true, true, true]);
	grid.selectedIndexes = [2];
	vm.selectionChanged();
	expect([vm.modifyDisabled, vm.valuesDisabled, vm.deleteDisabled, vm.autoRecodeDisabled, vm.upDisabled, vm.downDisabled])
		.toEqual([false, false, false, false, false, false]);
	grid.selectedIndexes = [0];
	vm.selectionChanged();
	expect([vm.upDisabled, vm.autoRecodeDisabled]).toEqual([true, true]);
	grid.selectedIndexes = [3];
	vm.selectionChanged();
	expect(vm.downDisabled).toBe(true);
	grid.selectedIndexes = [2, 3];
	vm.selectionChanged();
	expect([vm.modifyDisabled, vm.autoRecodeDisabled]).toEqual([true, true]);
});

it('updateCount informa filas en singular o plural y cuántas hay seleccionadas', () => {
	const { vm, grid } = setup();
	vm.updateCount(1);
	expect(vm.statusBarText).toBe('1 fila.');
	grid.selectedIndexes = [0, 1, 2];
	vm.updateCount(4);
	expect(vm.statusBarText).toBe('3 de 4 filas.');
	grid.rowCount = 12;
	vm.updateCount();
	expect(vm.statusBarText).toBe('3 de 12 filas.');
});

it('las exportaciones usan la dirección de exportación del trabajo', () => {
	const { vm, grid } = setup();
	vm.excelBtnOnClick();
	vm.csvBtnOnClick();
	expect(grid.calls).toEqual([
		['exportdata', 'xls', 'variables', true, null, false, 'export-url'],
		['exportdata', 'csv', 'variables', true, null, false, 'export-url'],
	]);
});

describe('DictionaryPopup: reordenamiento');

it('keepOrderState guarda las columnas con su orden y la selección, solo si no hay un guardado en curso', () => {
	const { vm, dataset } = setup({ selectedIndexes: [1] });
	vm.orderChangedList = { 9: 9 };
	vm.keepOrderState();
	expect(vm.orderSelectedIndexes).toEqual([1]);
	expect(vm.orderRestoreColumns.map(function (item) { return item.order; })).toEqual([1, 2, 3, 4]);
	expect(vm.orderRestoreColumns[0].col === dataset.Columns[0]).toBeTruthy();
	expect(vm.orderChangedList).toEqual({});
	vm.orderCancel = function () {};
	vm.orderRestoreColumns = ['previo'];
	vm.keepOrderState();
	expect(vm.orderRestoreColumns).toEqual(['previo']);
});

it('swapOrder intercambia posición y orden de las columnas, registra el cambio y mueve la selección', () => {
	const { vm, grid, dataset } = setup();
	vm.swapOrder(1, 0);
	expect(dataset.Columns.map(function (column) { return column.Id; })).toEqual([2, 1, 3, 4]);
	expect(dataset.Columns.map(function (column) { return column.Order; })).toEqual([1, 2, 3, 4]);
	expect(vm.orderChangedList).toEqual({ 2: 1, 1: 2 });
	expect(grid.calls).toEqual([['selectrow', 0], ['unselectrow', 1]]);
});

it('upOnClick mueve hacia arriba las columnas seleccionadas y guarda el orden', () => {
	const { vm, dataset } = setup({ selectedIndexes: [1] });
	vm.upOnClick();
	expect(dataset.Columns.map(function (column) { return column.Id; })).toEqual([2, 1, 3, 4]);
	expect(dataset.orderCalls).toHaveLength(1);
	expect(dataset.orderCalls[0].list).toEqual({ 2: 1, 1: 2 });
});

it('downOnClick mueve hacia abajo las columnas seleccionadas y guarda el orden', () => {
	const { vm, dataset } = setup({ selectedIndexes: [1] });
	vm.downOnClick();
	expect(dataset.Columns.map(function (column) { return column.Id; })).toEqual([1, 3, 2, 4]);
	expect(dataset.orderCalls[0].list).toEqual({ 3: 2, 2: 3 });
});

it('saveOrderChanges cancela el guardado anterior, muestra la espera y la oculta al confirmarse', () => {
	const { vm, grid, dataset } = setup();
	const previous = [];
	vm.orderCancel = function (reason) { previous.push(reason); };
	vm.orderChangedList = { 1: 2 };
	vm.saveOrderChanges();
	expect(previous).toEqual(['cancelled']);
	expect(names(grid)).toEqual(['showloadelement']);
	expect(typeof vm.orderCancel).toBe('function');
	dataset.orderCalls[0].success();
	expect(names(grid)).toEqual(['showloadelement', 'hideloadelement']);
	expect(vm.orderCancel).toBeNull();
});

it('revertState ignora la cancelación de un guardado reemplazado', () => {
	const { vm, dataset } = setup();
	const before = dataset.Columns;
	vm.revertState('cancelled');
	expect(dataset.Columns === before).toBeTruthy();
});

it('revertState restaura el orden y la selección anteriores y avisa del error', () => {
	const { vm, grid, dataset, browser } = setup({ selectedIndexes: [1] });
	vm.keepOrderState();
	vm.swapOrder(1, 0);
	vm.orderCancel = function () {};
	vm.revertState('sin conexión');
	expect(dataset.Columns.map(function (column) { return column.Id; })).toEqual([1, 2, 3, 4]);
	expect(dataset.Columns.map(function (column) { return column.Order; })).toEqual([1, 2, 3, 4]);
	expect(vm.orderCancel).toBeNull();
	expect(grid.calls.filter(function (call) { return call[0] === 'selectrow' && call[1] === 1; }).length >= 1).toBeTruthy();
	expect(browser.alerts).toEqual(['No se ha podido realizar la operación. sin conexión']);
});

describe('DictionaryPopup: teclado');

function pressKey(vm, keyCode, ctrlKey) {
	return vm.handlekeyboardnavigation({ keyCode: keyCode, ctrlKey: Boolean(ctrlKey) });
}

it('sin permiso de edición ignora el teclado', () => {
	const { vm, context } = setup();
	context.CurrentWork.canEdit = false;
	expect(pressKey(vm, 38, true)).toBe(false);
});

it('Ctrl+flecha mueve y Suprimir y Enter piden confirmar y modificar, según lo habilitado', () => {
	const { vm } = setup();
	const calls = [];
	vm.upOnClick = function () { calls.push('up'); };
	vm.downOnClick = function () { calls.push('down'); };
	vm.confirmDelete = function () { calls.push('delete'); };
	vm.showModify = function () { calls.push('modify'); };
	vm.upDisabled = false;
	vm.downDisabled = false;
	vm.deleteDisabled = false;
	vm.modifyDisabled = false;
	expect(pressKey(vm, 38, true)).toBe(true);
	expect(pressKey(vm, 40, true)).toBe(true);
	expect(pressKey(vm, 46)).toBe(false);
	expect(pressKey(vm, 13)).toBe(false);
	expect(calls).toEqual(['up', 'down', 'delete', 'modify']);
	vm.upDisabled = true;
	vm.deleteDisabled = true;
	pressKey(vm, 38, true);
	pressKey(vm, 46);
	expect(calls).toHaveLength(4);
});

it('confirmDelete abre el diálogo de confirmación', () => {
	const { vm, refs } = setup();
	vm.confirmDelete();
	expect(refs.confirmDialog.shown).toBe(1);
});

describe('DictionaryPopup: baja de variables');

it('deleteOnClick elimina las columnas seleccionadas, regenera las variables afectadas y recarga las columnas', async () => {
	const { vm, grid, dataset, refs } = setup({ selectedIndexes: [1, 2], rowCount: 4, rows: [{}] });
	vm.deleteOnClick();
	expect(dataset.spied[0]).toEqual(['DeleteColumns', [2, 3]]);
	await flushPromises();
	expect(dataset.ScaleGenerator.affected.map(function (item) { return item[0]; })).toEqual([
		'RegenAndSaveVariablesAffectedByDeletedDataColumnIds',
		'RegenAndSaveVariablesAffectedByDeletedCutColumnsIds',
		'RegenAndSaveVariablesAffectedByDeletedSequenceIds',
	]);
	expect(grid.calls.filter(function (call) { return call[0] === 'deleterow'; })).toEqual([['deleterow', [2, 3]]]);
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información del dataset');
});

it('si la baja falla oculta la espera sin modificar la grilla', async () => {
	const { vm, grid, dataset } = setup({ selectedIndexes: [1] });
	dataset.DeleteColumns = function () { return Promise.reject(new Error('rechazado')); };
	vm.deleteOnClick();
	await flushPromises();
	expect(names(grid)).toEqual(['showloadelement', 'hideloadelement']);
});

describe('DictionaryPopup: categorías y recodificación');

it('valuesOnClick abre las categorías de la columna elegida y, al guardar, regenera las variables y recarga', async () => {
	const { vm, refs, dataset } = setup({ selectedIndexes: [0] });
	dataset.Labels = { 1: [{ Value: 1 }] };
	vm.valuesOnClick();
	expect(vm.valuesPopupReset).toBeTruthy();
	await flushPromises();
	const [kind, column, values, canEdit, saved, destroyed] = refs.valuesPopup.shown[0];
	expect(kind).toBe('show');
	expect(column.Id).toBe(1);
	expect(values).toEqual([{ Value: 1 }]);
	expect(canEdit).toBe(true);
	saved();
	expect(dataset.ScaleGenerator.affected).toEqual([['RegenAndSaveVariablesAffectedByLabelChange', column]]);
	expect(vm.valuesPopupReset).toBeFalsy();
	vm.valuesPopupReset = true;
	destroyed();
	expect(vm.valuesPopupReset).toBeFalsy();
});

it('valuesOnClick de una columna sin categorías abre la lista vacía', async () => {
	const { vm, refs } = setup({ selectedIndexes: [1] });
	vm.valuesOnClick();
	await flushPromises();
	expect(refs.valuesPopup.shown[0][2]).toEqual([]);
});

it('startAutoRecode trae los valores distintos de la columna y abre la recodificación automática', async () => {
	const { vm, refs, dataset } = setup({ selectedIndexes: [2] });
	vm.startAutoRecode();
	let closed = 0;
	refs.invoker.calls[0](function () { closed++; });
	await flushPromises();
	expect(dataset.spied[0]).toEqual(['GetDistinctColumnValues', 3]);
	expect(refs.valuesPopup.shown[0].slice(0, 3)).toEqual(['auto', dataset.Columns[2], ['a', 'b']]);
	expect(closed).toBe(1);
});

describe('DictionaryPopup: apertura y carga de la grilla');

it('show llena el origen de datos antes de abrir y carga la grilla cuando está lista', () => {
	const { vm, grid } = setup();
	vm.show();
	expect(vm.source.localdata).toHaveLength(4);
	expect(vm.source.totalrecords).toBe(4);
	expect(vm.open).toBeTruthy();
	expect(grid.calls.some(function (call) { return call[0] === 'updatebounddata'; })).toBeTruthy();
});

it('gridIsReady exige la grilla y su API de enlace de datos', () => {
	const { vm, grid } = setup();
	expect(vm.gridIsReady()).toBe(true);
	grid.updatebounddata = undefined;
	expect(vm.gridIsReady()).toBe(false);
	vm.$refs.columnsGrid = undefined;
	expect(vm.gridIsReady()).toBe(false);
});

it('waitForGrid ejecuta el callback enseguida si la grilla está lista', () => {
	const { vm } = setup();
	let called = 0;
	vm.waitForGrid(function () { called++; }, 5);
	expect(called).toBe(1);
});

it('waitForGrid reintenta hasta que la grilla esté lista y se rinde al agotar los intentos', async () => {
	const { vm, grid } = setup();
	const original = grid.updatebounddata;
	grid.updatebounddata = undefined;
	let called = 0;
	vm.waitForGrid(function () { called++; }, 5);
	expect(called).toBe(0);
	grid.updatebounddata = original;
	await waitTimers(60);
	expect(called).toBe(1);
	grid.updatebounddata = undefined;
	vm.waitForGrid(function () { called++; }, 0);
	await waitTimers(60);
	expect(called).toBe(1);
});

it('loadData actualiza el origen, refresca la grilla si puede, oculta la espera y recalcula el contador', () => {
	const { vm, grid } = setup();
	vm.loadData();
	expect(vm.source.localdata).toHaveLength(4);
	expect(grid.refreshed).toBe(1);
	expect(names(grid)).toEqual(['updatebounddata', 'hideloadelement']);
	expect(vm.statusBarText).toBe('0 filas.');
});

it('loadData no hace nada si la grilla no está lista', () => {
	const { vm, grid } = setup();
	grid.updatebounddata = undefined;
	vm.loadData();
	expect(vm.source.localdata).toEqual([]);
});

it('los cambios de dataset o de columnas recargan la grilla solo con el diálogo abierto', () => {
	const { vm, grid } = setup();
	DictionaryPopup.watch.Dataset.call(vm);
	DictionaryPopup.watch['Dataset.Columns'].call(vm);
	expect(grid.calls).toHaveLength(0);
	vm.open = true;
	DictionaryPopup.watch.Dataset.call(vm);
	DictionaryPopup.watch['Dataset.Columns'].call(vm);
	expect(grid.calls.filter(function (call) { return call[0] === 'updatebounddata'; })).toHaveLength(2);
});

describe('DictionaryPopup: edición');

it('addOnClick abre el alta de una variable nueva en el popup de columna', () => {
	const { vm, refs } = setup();
	vm.addOnClick();
	expect(refs.edit.newShown).toBe(1);
	expect(refs.edit.shown).toHaveLength(0);
});

it('showModify abre la edición de la columna seleccionada y no hace nada sin selección', () => {
	const { vm, grid, refs, dataset } = setup({ selectedIndexes: [1] });
	vm.showModify();
	expect(refs.edit.shown[0] === dataset.Columns[1]).toBeTruthy();
	grid.selectedIndexes = [];
	vm.showModify();
	expect(refs.edit.shown).toHaveLength(1);
});

it('el doble clic abre las categorías sobre su columna y la edición sobre el resto, solo con permiso', () => {
	const { vm, context } = setup();
	const opened = [];
	vm.valuesOnClick = function () { opened.push('values'); };
	vm.showModify = function () { opened.push('modify'); };
	vm.dblClickModify({ args: { column: { datafield: 'ValueLabels' } } });
	vm.dblClickModify({ args: { column: { datafield: 'Variable' } } });
	context.CurrentWork.canEdit = false;
	vm.dblClickModify({ args: { column: { datafield: 'Variable' } } });
	expect(opened).toEqual(['values', 'modify']);
});

it('refreshOnClick y reloadColumns recargan las columnas del dataset, y completeEditOnClick recarga los datos', () => {
	const { vm, grid, refs, dataset } = setup();
	vm.refreshOnClick();
	expect(vm.statusBarText).toBe('');
	expect(refs.invoker.messages[0][1] === dataset).toBeTruthy();
	vm.completeEditOnClick();
	expect(names(grid)[0]).toBe('showloadelement');
	expect(grid.calls.some(function (call) { return call[0] === 'updatebounddata'; })).toBeTruthy();
});

it('showError oculta la espera y avisa del error', () => {
	const { vm, grid, browser } = setup();
	vm.showError('falló');
	expect(names(grid)).toEqual(['hideloadelement']);
	expect(browser.alerts).toEqual(['No se ha podido realizar la operación. falló']);
});

describe('DictionaryPopup: renderizado de celdas');

it('numberrenderer numera las filas desde 1 y columnsrenderer centra el texto del encabezado', () => {
	const { vm } = setup();
	expect(vm.numberrenderer(0, 'n', 4)).toBe('<div style="text-align: center; margin-top: 9px;">5</div>');
	expect(vm.columnsrenderer('Variable')).toBe('<div style="text-align: center; cursor: pointer; margin-top: 9px;">Variable</div>');
});
