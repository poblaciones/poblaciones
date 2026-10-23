import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import ValuesPopup from '@/backoffice/views/Dataset/ValuesPopup.vue';
import { makeGrid, makeGridDataset } from './activeGridFixtures.mjs';

globalThis.jqx = { dataAdapter: function (source) { this.source = source; } };

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeRow(id, value, caption, order, extra) {
	return Object.assign({ Id: id, Value: value, Caption: caption, Order: order, Count: -1, Dirty: 0 }, extra);
}

function setup(gridOverrides) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.convertCalls = [];
	dataset.ConvertExcelLabelsFile = function (workId, data) { dataset.convertCalls.push(['excel', workId, data]); return Promise.resolve([{ Value: '1', Caption: 'Uno' }]); };
	dataset.ConvertCsvLabelsFile = function (workId, data) { dataset.convertCalls.push(['csv', workId, data]); return Promise.resolve([{ Value: '2', Caption: 'Dos' }, { Value: '3', Caption: 'Tres' }]); };
	dataset.UpdateLabels = function (column, dirty, deleted) { dataset.spied.push(['UpdateLabels', column, dirty, deleted]); return Promise.resolve([{ Id: 9 }]); };
	dataset.AutoRecodeValues = function (column, rows, name, label) { dataset.spied.push(['AutoRecodeValues', column, rows, name, label]); return Promise.resolve(); };
	context.CurrentDataset = dataset;
	context.CurrentWork = { properties: { Id: 3 }, canEdit: true, CanEdit() { return this.canEdit; }, GetGridExportUrl() { return 'export-url'; } };
	const grid = makeGrid(gridOverrides);
	const invoker = { calls: [], messages: [], call(method) { this.calls.push(method); }, doMessage(...args) { this.messages.push(args); } };
	const inputs = { focused: [] };
	const vm = mountLite(ValuesPopup, {
		mocks: {
			$refs: {
				valuesGrid: grid,
				invoker: invoker,
				inputValue: { focus() { inputs.focused.push('value'); } },
				inputLabel: { focus() { inputs.focused.push('label'); } },
			},
		},
	});
	return { vm: vm, grid: grid, dataset: dataset, invoker: invoker, inputs: inputs, browser: browser, context: context };
}

function loadRows(vm, rows) {
	vm.source.localdata = rows;
	vm.source.totalrecords = rows.length;
}

describe('ValuesPopup: estado inicial');

it('define el origen de datos con los cinco campos de la grilla y arranca cerrado', () => {
	const { vm } = setup();
	expect(vm.source.datatype).toBe('array');
	expect(vm.source.id).toBe('Id');
	expect(vm.source.datafields.map(function (field) { return field.name; })).toEqual(['Id', 'Value', 'Caption', 'Order', 'Count', 'Dirty']);
	expect(vm.openPopup).toBeFalsy();
	expect(vm.canEdit).toBeTruthy();
	expect(vm.deletedList).toEqual([]);
	expect(vm.columns.map(function (column) { return column.datafield; })).toEqual(['Value', 'Caption', 'Count']);
});

describe('ValuesPopup: getData');

it('sin datos devuelve una lista vacía', () => {
	const { vm } = setup();
	vm.bindData = null;
	expect(vm.getData()).toEqual([]);
	vm.bindData = [];
	expect(vm.getData()).toEqual([]);
});

it('numera el orden desde 1, marca como modificadas las filas cuyo orden cambió y usa -1 si falta la cantidad', () => {
	const { vm } = setup();
	vm.bindData = [{ Id: 1, Value: 'a', Caption: 'A', Order: 1 }, { Id: 2, Value: 'b', Caption: 'B', Order: 5, Count: 7 }];
	const data = vm.getData();
	expect(data.map(function (row) { return row.Order; })).toEqual([1, 2]);
	expect(data.map(function (row) { return row.Count; })).toEqual([-1, 7]);
	expect(data.map(function (row) { return Boolean(row.Dirty); })).toEqual([false, true]);
});

it('con markDirty marca todas las filas como modificadas', () => {
	const { vm } = setup();
	vm.bindData = [{ Id: 1, Value: 'a', Caption: 'A', Order: 1 }];
	expect(vm.getData(1)[0].Dirty).toBe(1);
});

describe('ValuesPopup: selección');

it('selectedIndexes ordena los índices y selectedIndex y selectedId toman el primero', () => {
	const { vm } = setup({ selectedIndexes: [3, 1, 2] });
	expect(vm.selectedIndexes()).toEqual([1, 2, 3]);
	expect(vm.selectedIndex()).toBe(1);
	expect(vm.selectedIds()).toEqual(['id3', 'id1', 'id2']);
	expect(vm.selectedId()).toBe('id3');
});

it('sin selección selectedIndex, selectedId y selectedValueLabel son null', () => {
	const { vm } = setup({ selectedIndexes: [] });
	expect(vm.selectedIndex()).toBeNull();
	expect(vm.selectedId()).toBeNull();
	expect(vm.selectedValueLabel()).toBeNull();
});

it('selectedValueLabel devuelve la fila seleccionada del origen de datos', () => {
	const { vm } = setup({ selectedIndexes: [1] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2)]);
	expect(vm.selectedValueLabel().Value).toBe('b');
});

it('selectionChanged habilita modificar, eliminar y mover según la selección y su posición', () => {
	const { vm, grid } = setup({ rowCount: 3, rows: [{}] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2), makeRow(3, 'c', 'C', 3)]);
	grid.selectedIndexes = [];
	vm.selectionChanged();
	expect([vm.modifyDisabled, vm.deleteDisabled, vm.upDisabled, vm.downDisabled]).toEqual([true, true, true, true]);
	grid.selectedIndexes = [1];
	vm.selectionChanged();
	expect([vm.modifyDisabled, vm.deleteDisabled, vm.upDisabled, vm.downDisabled]).toEqual([false, false, false, false]);
	grid.selectedIndexes = [0];
	vm.selectionChanged();
	expect(vm.upDisabled).toBeTruthy();
	grid.selectedIndexes = [2];
	vm.selectionChanged();
	expect(vm.downDisabled).toBeTruthy();
	grid.selectedIndexes = [0, 1];
	vm.selectionChanged();
	expect(vm.modifyDisabled).toBeTruthy();
});

describe('ValuesPopup: contador');

it('updateCount informa la cantidad en singular o plural y cuántas están seleccionadas', () => {
	const { vm, grid } = setup();
	vm.updateCount(1);
	expect(vm.statusBarText).toBe('1 etiqueta.');
	vm.updateCount(12345);
	expect(vm.statusBarText).toBe('12.345 etiquetas.');
	grid.selectedIndexes = [0, 1];
	vm.updateCount(50);
	expect(vm.statusBarText).toBe('2 de 50 etiquetas.');
});

it('updateCount sin cantidad la toma de la grilla y sin grilla no hace nada', () => {
	const { vm, grid } = setup();
	grid.rowCount = 8;
	vm.updateCount();
	expect(vm.statusBarText).toBe('8 etiquetas.');
	vm.$refs = {};
	vm.statusBarText = 'previo';
	vm.updateCount();
	expect(vm.statusBarText).toBe('previo');
});

describe('ValuesPopup: importación y exportación');

it('las exportaciones usan la dirección de exportación del trabajo', () => {
	const { vm, grid } = setup();
	vm.excelExportBtnOnClick();
	vm.csvExportBtnOnClick();
	expect(grid.calls).toEqual([
		['exportdata', 'xls', 'etiquetas', true, null, false, 'export-url'],
		['exportdata', 'csv', 'etiquetas', true, null, false, 'export-url'],
	]);
});

it('triggerImport abre el selector de archivos del componente correspondiente, o su raíz si no tiene input', () => {
	const { vm } = setup();
	const clicks = [];
	vm.$refs.csvUpload = { $el: { querySelector() { return { click() { clicks.push('input'); } }; } } };
	vm.$refs.excelUpload = { $el: { querySelector() { return null; }, click() { clicks.push('raíz'); } } };
	vm.triggerImport('csv');
	vm.triggerImport('excel');
	expect(clicks).toEqual(['input', 'raíz']);
});

it('triggerImport no hace nada si el componente no existe', () => {
	const { vm } = setup();
	vm.triggerImport('csv');
	vm.$refs.excelUpload = {};
	vm.triggerImport('excel');
});

it('importar un Excel o un CSV convierte el archivo en el servidor y carga las etiquetas recibidas', async () => {
	const { vm, dataset } = setup();
	vm.excelImportBtn('datos-excel');
	await flushPromises();
	expect(dataset.convertCalls[0]).toEqual(['excel', 3, 'datos-excel']);
	expect(vm.source.localdata.map(function (row) { return row.Value; })).toEqual(['1']);
	vm.csvImportBtn('datos-csv');
	await flushPromises();
	expect(dataset.convertCalls[1]).toEqual(['csv', 3, 'datos-csv']);
	expect(vm.source.localdata.map(function (row) { return row.Caption; })).toEqual(['Dos', 'Tres']);
});

it('receiveConvertedData reemplaza las etiquetas por las recibidas como nuevas, y descarta las existentes', () => {
	const { vm } = setup();
	loadRows(vm, [makeRow(5, 'x', 'X', 1), makeRow(0, 'y', 'Y', 2), makeRow(6, 'z', 'Z', 3)]);
	vm.receiveConvertedData([{ Value: 'a', Caption: 'A' }, { Value: 'b', Caption: 'B' }]);
	expect(vm.deletedList).toEqual([5, 6]);
	expect(vm.source.localdata).toEqual([
		{ Id: 0, Value: 'a', Caption: 'A', Order: 1, Count: -1, Dirty: 1 },
		{ Id: 0, Value: 'b', Caption: 'B', Order: 2, Count: -1, Dirty: 1 },
	]);
});

it('clearAllLabels junta los identificadores existentes para eliminar y vacía la lista', () => {
	const { vm } = setup();
	loadRows(vm, [makeRow(5, 'x', 'X', 1), makeRow(0, 'y', 'Y', 2)]);
	vm.clearAllLabels();
	expect(vm.deletedList).toEqual([5]);
	expect(vm.source.localdata).toEqual([]);
});

describe('ValuesPopup: orden');

it('upOnClick y downOnClick intercambian el orden de las filas seleccionadas y las marcan como modificadas', () => {
	const { vm, grid } = setup({ selectedIndexes: [1] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2), makeRow(3, 'c', 'C', 3)]);
	vm.upOnClick();
	expect(vm.source.localdata.map(function (row) { return row.Value; })).toEqual(['b', 'a', 'c']);
	expect(vm.source.localdata[0].Order).toBe(1);
	expect(vm.source.localdata[1].Order).toBe(2);
	expect(vm.source.localdata[0].Dirty).toBe(1);
	expect(grid.calls.filter(function (call) { return call[0] === 'selectrow'; })).toEqual([['selectrow', 0]]);
	grid.selectedIndexes = [0];
	vm.downOnClick();
	expect(vm.source.localdata.map(function (row) { return row.Value; })).toEqual(['a', 'b', 'c']);
});

it('swapOrder en una recodificación automática mueve las etiquetas y deja cada valor en su posición', () => {
	const { vm } = setup();
	vm.doingAutoRecode = true;
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2)]);
	vm.swapOrder(0, 1);
	expect(vm.source.localdata.map(function (row) { return row.Value; })).toEqual(['a', 'b']);
	expect(vm.source.localdata.map(function (row) { return row.Caption; })).toEqual(['B', 'A']);
});

describe('ValuesPopup: teclado');

function pressKey(vm, keyCode, ctrlKey) {
	return vm.handlekeyboardnavigation({ keyCode: keyCode, ctrlKey: Boolean(ctrlKey) });
}

it('sin permiso de edición ignora el teclado', () => {
	const { vm } = setup();
	vm.canEdit = false;
	expect(pressKey(vm, 38, true)).toBe(false);
});

it('Ctrl+flecha mueve las filas solo si el movimiento está habilitado y el trabajo se puede editar', () => {
	const { vm, context } = setup();
	const moves = [];
	vm.upOnClick = function () { moves.push('up'); };
	vm.downOnClick = function () { moves.push('down'); };
	vm.upDisabled = false;
	vm.downDisabled = false;
	expect(pressKey(vm, 38, true)).toBe(true);
	expect(pressKey(vm, 40, true)).toBe(true);
	vm.upDisabled = true;
	pressKey(vm, 38, true);
	context.CurrentWork.canEdit = false;
	pressKey(vm, 40, true);
	expect(moves).toEqual(['up', 'down']);
});

it('Suprimir elimina y Enter modifica, si están habilitados', () => {
	const { vm } = setup();
	const calls = [];
	vm.deleteOnClick = function () { calls.push('delete'); };
	vm.showModify = function () { calls.push('modify'); };
	vm.deleteDisabled = false;
	vm.modifyDisabled = false;
	expect(pressKey(vm, 46)).toBe(false);
	expect(pressKey(vm, 13)).toBe(false);
	vm.deleteDisabled = true;
	vm.modifyDisabled = true;
	pressKey(vm, 46);
	pressKey(vm, 13);
	expect(calls).toEqual(['delete', 'modify']);
});

describe('ValuesPopup: baja de etiquetas');

it('deleteOnClick quita las filas seleccionadas y recuerda para eliminar solo las que ya existen en el servidor', () => {
	const { vm, grid } = setup({ selectedIndexes: [0, 1, 2] });
	loadRows(vm, [makeRow(5, 'a', 'A', 1), makeRow(0, 'b', 'B', 2), makeRow(7, 'c', 'C', 3), makeRow(8, 'd', 'D', 4)]);
	vm.deleteOnClick();
	expect(vm.deletedList.slice().sort()).toEqual([5, 7]);
	expect(vm.source.localdata.map(function (row) { return row.Value; })).toEqual(['d']);
	expect(grid.calls[grid.calls.length - 1][0]).toBe('clearselection');
});

describe('ValuesPopup: alta y edición');

it('getMaxOrder devuelve el mayor orden, con mínimo 1', () => {
	const { vm } = setup();
	loadRows(vm, []);
	expect(vm.getMaxOrder()).toBe(1);
	loadRows(vm, [makeRow(1, 'a', 'A', 3), makeRow(2, 'b', 'B', 7)]);
	expect(vm.getMaxOrder()).toBe(7);
});

it('repeatedValue detecta un valor ya existente, excepto el de la propia fila que se edita', () => {
	const { vm, grid } = setup({ selectedIndexes: [0] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2)]);
	vm.CurrentIsNew = true;
	vm.CurrentVarValue = 'a';
	expect(vm.repeatedValue()).toBeTruthy();
	vm.CurrentVarValue = 'z';
	expect(vm.repeatedValue()).toBeFalsy();
	vm.CurrentIsNew = false;
	vm.CurrentVarValue = 'a';
	expect(vm.repeatedValue()).toBeFalsy();
	grid.selectedIndexes = [1];
	expect(vm.repeatedValue()).toBeTruthy();
});

it('create abre el formulario vacío para una etiqueta nueva y enfoca el valor', async () => {
	const { vm, inputs } = setup();
	vm.CurrentVarValue = 'viejo';
	vm.create();
	expect(vm.CurrentVarValue).toBe('');
	expect(vm.CurrentVarLabel).toBe('');
	expect(vm.CurrentIsNew).toBeTruthy();
	expect(vm.activateEdit).toBeTruthy();
	await waitTimers(130);
	expect(inputs.focused).toEqual(['value']);
});

it('showModify abre el formulario con la fila seleccionada y enfoca la etiqueta; sin selección no hace nada', async () => {
	const { vm, grid, inputs } = setup({ selectedIndexes: [1] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1), makeRow(2, 'b', 'B', 2)]);
	vm.showModify();
	expect(vm.CurrentVarValue).toBe('b');
	expect(vm.CurrentVarLabel).toBe('B');
	expect(vm.CurrentIsNew).toBeFalsy();
	await waitTimers(130);
	expect(inputs.focused).toEqual(['label']);
	grid.selectedIndexes = [];
	vm.activateEdit = false;
	vm.showModify();
	expect(vm.activateEdit).toBeFalsy();
});

function startEdit(vm, isNew, value, label) {
	vm.CurrentIsNew = isNew;
	vm.CurrentVarValue = value;
	vm.CurrentVarLabel = label;
	vm.activateEdit = true;
	vm.column = { Format: 1, FieldWidth: 5, Id: 3 };
}

it('completeEditOnClick rechaza un valor repetido', () => {
	const { vm, browser } = setup();
	loadRows(vm, [makeRow(1, 'a', 'A', 1)]);
	startEdit(vm, true, ' a ', 'Otra');
	vm.completeEditOnClick();
	expect(browser.alerts).toEqual(["Ya existe un elemento para el valor 'a'."]);
	expect(vm.activateEdit).toBeTruthy();
});

it('completeEditOnClick valida la longitud de los textos', () => {
	const { vm, browser } = setup();
	loadRows(vm, []);
	startEdit(vm, true, 'demasiado', 'X');
	vm.completeEditOnClick();
	expect(browser.alerts).toEqual(['La longitud del valor debe ser menor o igual a 5 caracteres.']);
});

it('completeEditOnClick exige un entero en las columnas numéricas', () => {
	const { vm, browser } = setup();
	loadRows(vm, []);
	vm.column = { Format: 5, FieldWidth: 5, Id: 3 };
	for (const value of ['1.5', '1,5', 'abc']) {
		vm.CurrentIsNew = true;
		vm.CurrentVarValue = value;
		vm.completeEditOnClick();
	}
	expect(browser.alerts).toEqual([
		'El valor debe ser un número entero (sin decimales).',
		'El valor debe ser un número entero (sin decimales).',
		'El valor debe ser numérico.',
	]);
});

it('completeEditOnClick agrega una etiqueta nueva al final con el orden siguiente y la selecciona', () => {
	const { vm, grid } = setup();
	loadRows(vm, [makeRow(1, 'a', 'A', 1)]);
	startEdit(vm, true, 'b', 'Be');
	vm.completeEditOnClick();
	expect(vm.source.localdata[1]).toEqual({ Id: 0, Value: 'b', Caption: 'Be', Order: 2, Count: 0, Dirty: 1 });
	expect(vm.activateEdit).toBeFalsy();
	expect(grid.calls.some(function (call) { return call[0] === 'selectrow' && call[1] === 1; })).toBeTruthy();
});

it('completeEditOnClick modifica la etiqueta seleccionada y la marca como modificada', () => {
	const { vm } = setup({ selectedIndexes: [0] });
	loadRows(vm, [makeRow(1, 'a', 'A', 1)]);
	startEdit(vm, false, 'a', 'Nueva');
	vm.completeEditOnClick();
	expect(vm.source.localdata[0].Caption).toBe('Nueva');
	expect(vm.source.localdata[0].Dirty).toBe(1);
	expect(vm.activateEdit).toBeFalsy();
});

it('en una recodificación automática no valida valores repetidos', () => {
	const { vm, browser } = setup();
	vm.doingAutoRecode = true;
	loadRows(vm, [makeRow(1, 'a', 'A', 1)]);
	startEdit(vm, true, 'a', 'Otra');
	vm.completeEditOnClick();
	expect(browser.alerts).toEqual([]);
});

it('getDirtyList devuelve solo las filas modificadas', () => {
	const { vm } = setup();
	loadRows(vm, [makeRow(1, 'a', 'A', 1, { Dirty: 1 }), makeRow(2, 'b', 'B', 2), makeRow(3, 'c', 'C', 3, { Dirty: 1 })]);
	expect(vm.getDirtyList().map(function (row) { return row.Id; })).toEqual([1, 3]);
});

describe('ValuesPopup: guardado');

it('save avisa y no guarda una recodificación con un nombre de variable ya existente', () => {
	const { vm, invoker, browser } = setup();
	vm.doingAutoRecode = true;
	vm.newName = 'lat';
	vm.save();
	expect(browser.alerts).toEqual(['Ya existe una variable con ese nombre de variable.']);
	expect(invoker.calls).toHaveLength(0);
});

it('save de etiquetas envía las modificadas y las eliminadas, actualiza las etiquetas del dataset y cierra', async () => {
	const { vm, dataset, invoker } = setup();
	const reloaded = [];
	vm.column = { Id: 3 };
	vm.reloadRowCallback = function (data) { reloaded.push(data); };
	vm.openPopup = true;
	vm.deletedList = [8];
	loadRows(vm, [makeRow(1, 'a', 'A', 1, { Dirty: 1 }), makeRow(2, 'b', 'B', 2)]);
	vm.save();
	let closed = 0;
	invoker.calls[0](function () { closed++; });
	await flushPromises();
	expect(dataset.spied[0][0]).toBe('UpdateLabels');
	expect(dataset.spied[0][2].map(function (row) { return row.Id; })).toEqual([1]);
	expect(dataset.spied[0][3]).toEqual([8]);
	expect(dataset.Labels[3]).toEqual([{ Id: 9 }]);
	expect(reloaded).toEqual([[{ Id: 9 }]]);
	expect(vm.openPopup).toBeFalsy();
	expect(closed).toBe(1);
});

it('save de una recodificación automática crea la variable nueva, recarga las columnas y cierra', async () => {
	const { vm, dataset, invoker } = setup();
	vm.doingAutoRecode = true;
	vm.newName = 'codigo_recodificada';
	vm.newLabel = 'Código';
	vm.column = { Id: 3 };
	vm.openPopup = true;
	loadRows(vm, [makeRow(0, 'a', 'A', 1, { Dirty: 1 })]);
	vm.save();
	let closed = 0;
	invoker.calls[0](function () { closed++; });
	await flushPromises();
	expect(dataset.spied[0].slice(0, 2)).toEqual(['AutoRecodeValues', { Id: 3 }]);
	expect(dataset.spied[0].slice(3)).toEqual(['codigo_recodificada', 'Código']);
	expect(invoker.messages[0][0]).toBe('Obteniendo información del dataset');
	expect(vm.openPopup).toBeFalsy();
	expect(closed).toBe(1);
});

describe('ValuesPopup: apertura');

it('loadData carga las filas, muestra la columna de ocurrencias solo en una recodificación y actualiza la grilla', () => {
	const { vm, grid } = setup();
	vm.bindData = [{ Id: 1, Value: 'a', Caption: 'A', Order: 1 }];
	vm.loadData();
	expect(vm.source.localdata).toHaveLength(1);
	expect(vm.source.totalrecords).toBe(1);
	expect(grid.calls.filter(function (call) { return call[0] === 'hidecolumn'; })).toEqual([['hidecolumn', 'Count']]);
	vm.doingAutoRecode = true;
	vm.loadData();
	expect(grid.calls.filter(function (call) { return call[0] === 'showcolumn'; })).toEqual([['showcolumn', 'Count']]);
	expect(grid.calls.filter(function (call) { return call[0] === 'updatebounddata'; })).toHaveLength(2);
});

it('refreshData actualiza la grilla, oculta la espera y recalcula el contador', () => {
	const { vm, grid } = setup();
	vm.refreshData();
	expect(grid.calls.map(function (call) { return call[0]; })).toEqual(['updatebounddata', 'hideloadelement']);
});

it('show copia la lista recibida, abre el diálogo y carga las filas en el siguiente ciclo', async () => {
	const { vm } = setup();
	const original = [{ Id: 1, Value: 'a', Caption: 'A', Order: 1 }];
	const reload = function () {};
	const destroy = function () {};
	vm.show({ Id: 3 }, original, true, reload, destroy);
	expect(vm.openPopup).toBeTruthy();
	expect(vm.canEdit).toBe(true);
	expect(vm.bindData).toEqual(original);
	expect(vm.bindData === original).toBeFalsy();
	expect(vm.reloadRowCallback === reload).toBeTruthy();
	expect(vm.message).toBe('<p>Especifique las etiquetas que desea utilizar para la variable selecionada.</p>');
	await flushPromises();
	expect(vm.source.localdata).toHaveLength(1);
});

it('showGeographyValues muestra los valores sin permiso de edición ni columna', async () => {
	const { vm } = setup();
	vm.showGeographyValues([{ Id: 1, Value: 'a', Caption: 'A', Order: 1 }], null);
	expect(vm.canEdit).toBe(false);
	expect(vm.column).toBeNull();
	expect(vm.openPopup).toBeTruthy();
	await flushPromises();
	expect(vm.source.localdata).toHaveLength(1);
});

it('showAutoRecode propone un nombre de variable único y la etiqueta de la columna, y abre con edición habilitada', () => {
	const { vm } = setup();
	const column = { Id: 3, Variable: 'codigo', Label: 'Código postal' };
	vm.showAutoRecode(column, [], null);
	expect(vm.doingAutoRecode).toBeTruthy();
	expect(vm.newName).toBe('codigo_recodificada');
	expect(vm.newLabel).toBe('Código postal');
	expect(vm.canEdit).toBe(true);
	expect(vm.openPopup).toBeTruthy();
});

it('en una recodificación automática show explica el reemplazo de valores por números', () => {
	const { vm } = setup();
	vm.doingAutoRecode = true;
	vm.show({ Id: 3 }, [], true, null, null);
	expect(vm.message.startsWith('<p>La variable seleccionada será utilizada para crear una variable numérica con etiquetas.</p>')).toBeTruthy();
});

it('onClosed ejecuta el callback de cierre si existe', () => {
	const { vm } = setup();
	vm.onClosed();
	let called = 0;
	vm.destroyCallback = function () { called++; };
	vm.onClosed();
	expect(called).toBe(1);
});
