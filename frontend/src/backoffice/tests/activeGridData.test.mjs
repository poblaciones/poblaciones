import { describe, it, expect } from './_harness.mjs';
import { flushPromises, captureConsoleAsync } from './fixtures.mjs';
import ActiveGrid from '@/backoffice/components/ActiveGrid.vue';
import { setupGrid } from './activeGridFixtures.mjs';

// jqxGrid expone un dataAdapter global; acá solo conserva el origen con que se lo creó.
globalThis.jqx = { dataAdapter: function (source) { this.source = source; } };

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function spy(vm, name) {
	const calls = [];
	vm[name] = function (...args) { calls.push(args); };
	return calls;
}

function callNames(grid) {
	return grid.calls.map(function (call) { return call[0]; });
}

function wasCalled(grid, name) {
	return callNames(grid).indexOf(name) !== -1;
}

describe('ActiveGrid: creación de la grilla');

it('createGrid con una carga en curso solo pide rehacer la grilla al terminar', () => {
	const { vm, grid } = setupGrid();
	vm.isBinding = true;
	vm.createGrid();
	expect(vm.requiresBinding).toBeTruthy();
	expect(grid.source).toBe(undefined);
	expect(vm.DataPager.cleared).toBe(0);
});

it('createGrid arma las columnas y el origen de datos y queda a la espera de la carga', () => {
	const { vm, grid, dataset } = setupGrid();
	vm.statusBarText = 'viejo';
	vm.createGrid();
	expect(vm.DataPager.cleared).toBe(1);
	expect(vm.statusBarText).toBe('');
	expect(grid.columns.map(function (column) { return column.datafield; })).toEqual(['lat', 'lon', 'codigo', 'poligono']);
	expect(vm.isBinding).toBeTruthy();
	expect(grid.source.source === vm.source).toBeTruthy();
	expect(vm.source.url).toBe(dataset.GetDataUrl());
});

it('createGrid sin columnas cargadas deja la grilla vacía', () => {
	const { vm, grid, dataset } = setupGrid();
	dataset.Columns = null;
	vm.createGrid();
	expect(grid.columns).toEqual([]);
	expect(grid.source).toBeNull();
	expect(vm.isBinding).toBeFalsy();
});

it('con errores visibles el origen consulta la dirección de errores', () => {
	const { vm, dataset } = setupGrid({ showingErrors: true });
	vm.createGrid();
	expect(vm.source.url).toBe(dataset.GetErrorsUrl());
	expect(vm.source.datafields[0].name).toBe('internal__Err');
});

it('el origen de datos define identificador, raíz y campos, y delega filtro, orden y carga', () => {
	const { vm, grid } = setupGrid();
	const source = vm.getAdapter().source;
	expect(source.datatype).toBe('json');
	expect(source.id).toBe('internal__Id');
	expect(source.root).toBe('Data');
	expect(source.cache).toBe(false);
	expect(source.datafields.map(function (field) { return field.name; })).toEqual(['lat', 'lon', 'codigo', 'poligono', 'internal__Id']);
	source.filter();
	source.sort();
	expect(grid.calls).toEqual([['updatebounddata', 'filter'], ['updatebounddata', 'sort']]);
	expect(source.loadServerData === vm.fetchData).toBeTruthy();
});

it('antes de procesar los datos del servidor guarda el total y actualiza el contador', () => {
	const { vm } = setupGrid();
	const source = vm.getAdapter().source;
	source.beforeprocessing({ TotalRows: 12345 });
	expect(vm.source.totalrecords).toBe(12345);
	expect(vm.statusBarText).toBe('12.345 filas.');
});

it('al completarse el enlace de datos libera la carga, actualiza el contador y agrega los menús de encabezado', () => {
	const { vm } = setupGrid();
	const counts = spy(vm, 'updateCount');
	const headers = spy(vm, 'attachHeaderMenus');
	vm.isBinding = true;
	vm.bindingcomplete();
	expect(vm.isBinding).toBeFalsy();
	expect(counts).toHaveLength(1);
	expect(headers).toHaveLength(1);
});

it('con errores visibles no agrega menús de encabezado, y rehace la grilla si estaba pendiente', () => {
	const { vm } = setupGrid({ showingErrors: true });
	spy(vm, 'updateCount');
	const headers = spy(vm, 'attachHeaderMenus');
	const created = spy(vm, 'createGrid');
	vm.requiresBinding = true;
	vm.bindingcomplete();
	expect(headers).toHaveLength(0);
	expect(vm.requiresBinding).toBeFalsy();
	expect(created).toHaveLength(1);
});

it('refreshOnClick rehace la grilla y rendergridrows devuelve los datos recibidos', () => {
	const { vm } = setupGrid();
	const created = spy(vm, 'createGrid');
	vm.refreshOnClick();
	expect(created).toHaveLength(1);
	expect(vm.rendergridrows({ data: [1, 2] })).toEqual([1, 2]);
});

it('al cambiar las columnas del dataset rehace la grilla, salvo que muestre errores o no haya columnas', () => {
	const { vm, dataset } = setupGrid({ showingErrors: false });
	const created = spy(vm, 'createGrid');
	ActiveGrid.watch['Dataset.Columns'].call(vm);
	expect(created).toHaveLength(1);
	dataset.Columns = null;
	ActiveGrid.watch['Dataset.Columns'].call(vm);
	expect(created).toHaveLength(1);
	const errors = setupGrid({ showingErrors: true });
	const errorsCreated = spy(errors.vm, 'createGrid');
	ActiveGrid.watch['Dataset.Columns'].call(errors.vm);
	expect(errorsCreated).toHaveLength(0);
});

describe('ActiveGrid: carga de datos');

it('fetchData pide la página directa al paginador y avisa los cambios de selección al terminar', () => {
	const { vm, grid } = setupGrid();
	grid.source = { adapter: true };
	const fetched = [];
	vm.DataPager.FetchDirect = function (...args) { fetched.push(args); };
	const selection = spy(vm, 'selectionChanged');
	const callback = function () {};
	vm.fetchData({ pagenum: 2 }, { url: 'x' }, callback);
	expect(fetched).toHaveLength(1);
	expect(fetched[0].slice(0, 4)).toEqual([{ pagenum: 2 }, { adapter: true }, { url: 'x' }, callback]);
	fetched[0][4]();
	expect(selection).toHaveLength(1);
});

it('sin grilla paginada usa la carga completa del paginador', () => {
	const { vm } = setupGrid();
	Object.defineProperty(vm, 'usePagedGrid', { value: false });
	const fetched = [];
	vm.DataPager.Fetch = function (...args) { fetched.push(args); };
	vm.fetchData({}, {}, function () {});
	expect(fetched).toHaveLength(1);
});

describe('ActiveGrid: selección de filas');

it('getSelectedRowIndexes descarta los índices fuera del rango de filas', () => {
	const { vm } = setupGrid({}, { selectedIndexes: [0, 1, 5, -1], rowCount: 3 });
	expect(vm.getSelectedRowIndexes()).toEqual([0, 1]);
});

it('getSelectedRowIndex devuelve el primero y falla si no hay filas seleccionadas', () => {
	const { vm, grid } = setupGrid({}, { selectedIndexes: [2, 1], rowCount: 3 });
	expect(vm.getSelectedRowIndex()).toBe(2);
	grid.selectedIndexes = [];
	let message = null;
	try {
		vm.getSelectedRowIndex();
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('No hay filas seleccionadas.');
});

it('getIdByIndex lee el identificador de la fila y selectedIds y selectedId lo reúnen', () => {
	const { vm, grid } = setupGrid({}, { selectedIndexes: [0, 1], rowCount: 2, rowData: { 0: { internal__Id: 10 }, 1: { internal__Id: 11 } } });
	expect(vm.getIdByIndex(1)).toBe(11);
	expect(vm.selectedIds()).toEqual([10, 11]);
	expect(vm.selectedId()).toBe(10);
	grid.selectedIndexes = [];
	expect(vm.selectedIds()).toEqual([]);
	expect(vm.selectedId()).toBeNull();
});

it('getSelectedRowData devuelve los datos de la primera fila seleccionada o una lista vacía', () => {
	const { vm, grid } = setupGrid({}, { selectedIndexes: [1], rowCount: 2, rowData: { 1: { lat: 5 } } });
	expect(vm.getSelectedRowData()).toEqual({ lat: 5 });
	grid.selectedIndexes = [];
	expect(vm.getSelectedRowData()).toEqual([]);
});

it('gridNativeSelectedIds devuelve los identificadores internos de la grilla', () => {
	const { vm } = setupGrid({}, { selectedIndexes: [0, 2], rowCount: 3 });
	expect(vm.gridNativeSelectedIds()).toEqual(['id0', 'id2']);
});

it('clearSelection limpia la selección y recalcula los botones, y no hace nada sin grilla', () => {
	const { vm, grid } = setupGrid({}, { rowCount: 1, rows: [{}] });
	vm.clearSelection();
	expect(wasCalled(grid, 'clearselection')).toBeTruthy();
	vm.$refs = {};
	vm.clearSelection();
});

it('showWait y hideWait muestran y ocultan la espera de la grilla', () => {
	const { vm, grid } = setupGrid();
	vm.showWait();
	vm.hideWait();
	expect(callNames(grid)).toEqual(['showloadelement', 'hideloadelement']);
});

describe('ActiveGrid: baja y omisión de filas');

function setupWithSelection(gridOverrides) {
	const context = setupGrid({}, Object.assign({
		selectedIndexes: [0, 1], rowCount: 10, rows: [{}], rowData: { 0: { internal__Id: 10 }, 1: { internal__Id: 11 } },
	}, gridOverrides));
	context.created = spy(context.vm, 'createGrid');
	return context;
}

it('deleteOnClick elimina en el servidor las filas seleccionadas y luego en la grilla, ocultando la espera', async () => {
	const { vm, dataset, grid } = setupWithSelection();
	vm.deleteOnClick();
	expect(dataset.spied).toEqual([['DeleteRows', [10, 11]]]);
	await flushPromises();
	expect(grid.calls.filter(function (call) { return call[0] === 'deleterow'; })).toEqual([['deleterow', 'id0'], ['deleterow', 'id1']]);
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
});

it('si el servidor rechaza la baja no toca la grilla y oculta la espera', async () => {
	const { vm, dataset, grid } = setupWithSelection();
	dataset.DeleteRows = function () { return Promise.reject(new Error('rechazado')); };
	vm.deleteOnClick();
	await flushPromises();
	expect(wasCalled(grid, 'deleterow')).toBeFalsy();
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
});

it('skipOnClick omite las filas seleccionadas en el servidor y las quita de la grilla', async () => {
	const { vm, dataset, grid } = setupWithSelection();
	vm.skipOnClick();
	expect(dataset.spied).toEqual([['SkipRows', [10, 11]]]);
	await flushPromises();
	expect(callNames(grid).filter(function (name) { return name === 'deleterow'; })).toHaveLength(2);
});

it('skipAllOnClick omite todas las filas, vacía la grilla, deshabilita el botón y avisa', async () => {
	const { vm, dataset, grid, created } = setupWithSelection();
	vm.skipAllOnClick();
	expect(dataset.spied).toEqual([['SkipAllRows']]);
	await flushPromises();
	expect(wasCalled(grid, 'clear')).toBeTruthy();
	expect(created).toHaveLength(1);
	expect(vm.skipAllDisabled).toBeTruthy();
	expect(vm.$emitted).toEqual([['submitGrid']]);
});

it('deleteSelection quita las filas, descarta el caché y recalcula botones y contador', () => {
	const { vm, grid, created } = setupWithSelection();
	vm.deleteSelection();
	expect(callNames(grid).filter(function (name) { return name === 'deleterow'; })).toHaveLength(2);
	expect(vm.DataPager.cleared).toBe(1);
	expect(created).toHaveLength(0);
	expect(vm.statusBarText).toBe('2 de 10 filas.');
});

it('deleteSelection rehace la grilla si se quitaron todas las filas o una página completa', () => {
	const all = setupWithSelection({ rowCount: 2 });
	all.vm.deleteSelection();
	expect(all.created).toHaveLength(1);
	const page = setupWithSelection({ pagesize: 2 });
	page.vm.deleteSelection();
	expect(page.created).toHaveLength(1);
});

describe('ActiveGrid: fila nueva');

it('waitBinding ejecuta el callback enseguida si no hay una carga en curso', () => {
	const { vm } = setupGrid();
	let executed = 0;
	vm.isBinding = false;
	vm.waitBinding(function () { executed++; });
	expect(executed).toBe(1);
});

it('waitBinding espera a que termine la carga y luego ejecuta el callback', async () => {
	const { vm } = setupGrid();
	let executed = 0;
	vm.isBinding = true;
	vm.waitBinding(function () { executed++; });
	expect(executed).toBe(0);
	vm.isBinding = false;
	await waitTimers(80);
	expect(executed).toBe(1);
});

it('waitBinding se rinde al agotar los intentos, ocultando la espera sin ejecutar el callback', () => {
	const { vm, grid } = setupGrid();
	let executed = 0;
	vm.isBinding = true;
	vm.waitBinding(function () { executed++; }, 0);
	expect(executed).toBe(0);
	expect(callNames(grid)).toEqual(['hideloadelement']);
});

it('findRowIndexById devuelve el índice enlazado de la fila, su posición si no lo tiene, o -1', () => {
	const { vm, grid } = setupGrid();
	grid.rows = [{ internal__Id: 5 }, { internal__Id: 7, boundindex: 9 }];
	expect(vm.findRowIndexById(7)).toBe(9);
	expect(vm.findRowIndexById('5')).toBe(0);
	expect(vm.findRowIndexById(99)).toBe(-1);
});

it('findRowIndexById devuelve -1 si la grilla no responde', () => {
	const { vm, grid } = setupGrid();
	grid.getrows = function () { throw new Error('sin grilla'); };
	expect(vm.findRowIndexById(1)).toBe(-1);
});

it('selectRowByPos deja seleccionada y visible solo la fila indicada', () => {
	const { vm, grid } = setupGrid();
	vm.selectRowByPos(4);
	expect(grid.calls).toEqual([['clearselection'], ['selectrow', 4], ['ensurerowvisible', 4]]);
});

it('jumpToLastPageAndSelect con una sola página selecciona la fila sin paginar', () => {
	const { vm, grid } = setupGrid();
	grid.rows = [{ internal__Id: 77, boundindex: 4 }];
	vm.source.totalrecords = 10;
	vm.jumpToLastPageAndSelect(77);
	expect(callNames(grid)).toEqual(['clearselection', 'selectrow', 'ensurerowvisible', 'hideloadelement']);
});

it('jumpToLastPageAndSelect con varias páginas va a la última y selecciona la fila cuando termina la carga', async () => {
	const { vm, grid } = setupGrid();
	vm.source.totalrecords = 120;
	vm.jumpToLastPageAndSelect(77);
	expect(vm.isBinding).toBeTruthy();
	expect(grid.calls[0]).toEqual(['gotopage', 2]);
	grid.rows = [{ internal__Id: 77, boundindex: 120 }];
	vm.isBinding = false;
	await waitTimers(80);
	expect(grid.calls.some(function (call) { return call[0] === 'selectrow' && call[1] === 120; })).toBeTruthy();
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
});

it('newRow crea la fila en el servidor, refresca la grilla y selecciona la fila creada', async () => {
	const { vm, dataset, grid } = setupGrid();
	grid.rows = [{ internal__Id: 77, boundindex: 3 }];
	vm.source.totalrecords = 10;
	const created = spy(vm, 'createGrid');
	vm.newRow();
	expect(callNames(grid)[0]).toBe('showloadelement');
	await flushPromises();
	expect(dataset.spied).toEqual([['CreateRow']]);
	expect(created).toHaveLength(1);
	expect(grid.calls.some(function (call) { return call[0] === 'selectrow' && call[1] === 3; })).toBeTruthy();
});

it('si la creación de la fila falla oculta la espera y registra el error', async () => {
	const { vm, dataset, grid, browser } = setupGrid();
	dataset.CreateRow = function () { return Promise.reject(new Error('sin permiso')); };
	await captureConsoleAsync(async function () {
		vm.newRow();
		await flushPromises();
	});
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});
