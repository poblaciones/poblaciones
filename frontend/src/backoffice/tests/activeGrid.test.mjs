import { describe, it, expect } from './_harness.mjs';
import { flushPromises } from './fixtures.mjs';
import ActiveGrid from '@/backoffice/components/ActiveGrid.vue';
import { setupGrid } from './activeGridFixtures.mjs';

describe('ActiveGrid: propiedades y estado');

it('toma el dataset y el trabajo del contexto y usa siempre la grilla paginada', () => {
	const { vm, dataset, context } = setupGrid();
	expect(vm.Dataset === dataset).toBeTruthy();
	expect(vm.Work === context.CurrentWork).toBeTruthy();
	expect(vm.usePagedGrid).toBeTruthy();
	expect(vm.gridwidth).toBe(700);
	expect(vm.statusBarText).toBe('');
	expect(vm.deleteDisabled).toBeTruthy();
});

it('isShapesPolygon es verdadero solo para datasets de tipo S', () => {
	const { vm, dataset } = setupGrid();
	expect(vm.isShapesPolygon).toBeFalsy();
	dataset.properties.Type = 'S';
	expect(vm.isShapesPolygon).toBeTruthy();
});

it('al montar crea la grilla solo si las columnas ya están cargadas', () => {
	const loaded = setupGrid();
	let created = 0;
	loaded.vm.createGrid = function () { created++; };
	ActiveGrid.mounted.call(loaded.vm);
	expect(created).toBe(1);
	const unloaded = setupGrid();
	unloaded.dataset.Columns = null;
	unloaded.vm.createGrid = function () { created++; };
	ActiveGrid.mounted.call(unloaded.vm);
	expect(created).toBe(1);
});

describe('ActiveGrid: edición de celdas');

function makeCell(datafield, value, row) {
	let rowIndex = row;
	if (row === undefined) {
		rowIndex = 0;
	}
	return { datafield: datafield, value: value, row: rowIndex };
}

it('si el valor no cambió no valida ni graba', () => {
	const { vm, dataset } = setupGrid();
	expect(vm.validateCellEdit(makeCell('lat', 5), '5')).toBeTruthy();
	expect(dataset.spied).toHaveLength(0);
});

it('rechaza un valor no numérico en una columna numérica y acepta uno numérico o vacío', () => {
	const { vm } = setupGrid();
	vm.getIdByIndex = function () { return 10; };
	expect(vm.validateCellEdit(makeCell('lat', 1), 'abc')).toEqual({ result: false, message: 'El valor debe ser numérico.' });
	expect(vm.validateCellEdit(makeCell('lat', 1), '12.5')).toBe(true);
	expect(vm.validateCellEdit(makeCell('lat', 1), '')).toBe(true);
});

it('rechaza un texto más largo que el ancho del campo, con un mensaje propio para un carácter', () => {
	const { vm } = setupGrid();
	expect(vm.validateCellEdit(makeCell('codigo', 'a'), 'abcd')).toEqual({ result: false, message: 'El valor no puede exceder los 3 caracteres.' });
	expect(vm.validateCellEdit(makeCell('poligono', 'a'), 'ab')).toEqual({ result: false, message: 'El valor no puede tener más de un caracter.' });
});

it('un valor válido y distinto se graba en la fila seleccionada y oculta la espera al terminar', async () => {
	const { vm, dataset, grid } = setupGrid({}, { rowData: { 2: { internal__Id: 40 } } });
	const result = vm.validateCellEdit(makeCell('codigo', 'ab', 2), 'abc');
	expect(result).toBe(true);
	expect(dataset.spied).toEqual([['UpdateRowValues', 40, [{ columnId: 3, value: 'abc' }]]]);
	expect(grid.calls[0][0]).toBe('showloadelement');
	await flushPromises();
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
});

it('un número en blanco se graba como nulo', () => {
	const { vm, dataset } = setupGrid({}, { rowData: { 0: { internal__Id: 40 } } });
	vm.validateCellEdit(makeCell('lat', 7), '');
	expect(dataset.spied[0][2]).toEqual([{ columnId: 1, value: null }]);
});

it('si el servidor rechaza el cambio restaura el valor anterior y descarta el caché de páginas', async () => {
	const { vm, dataset, grid } = setupGrid({}, { rowData: { 0: { internal__Id: 40 } } });
	dataset.UpdateRowValues = function () { return Promise.reject(new Error('rechazado')); };
	vm.validateCellEdit(makeCell('codigo', 'ab', 0), 'abc');
	await flushPromises();
	expect(grid.calls.some(function (call) { return call[0] === 'setcellvalue' && call[3] === 'ab'; })).toBeTruthy();
	expect(vm.DataPager.cleared).toBe(1);
});

describe('ActiveGrid: descarga');

it('arma las direcciones de descarga y de archivo con el dataset y el trabajo', () => {
	const { vm } = setupGrid();
	expect(vm.getStartDownloadUrl()).toBe('https://api.example.org/services/backoffice/StartDatasetDownload');
	expect(vm.getStepDownloadUrl()).toBe('https://api.example.org/services/backoffice/StepDatasetDownload');
	expect(vm.urlArgs('x')).toBe('t=x&d=5&w=3');
	expect(vm.getFileUrl('x')).toBe('https://api.example.org/services/backoffice/GetDatasetFile?t=x&d=5&w=3');
});

it('startDownload configura el avance y, al terminar, entrega el archivo y cierra el avance', async () => {
	const { vm, refs } = setupGrid();
	const sent = [];
	vm.sendFile = function (format) { sent.push(format); };
	vm.startDownload('xls');
	expect(refs.stepper.startUrl).toBe(vm.getStartDownloadUrl());
	expect(refs.stepper.args).toEqual({ d: 5, t: 'xls' });
	await flushPromises();
	expect(sent).toEqual(['xls']);
	expect(refs.stepper.closed).toBe(1);
});

it('las exportaciones usan la dirección de exportación del trabajo', () => {
	const { vm, grid } = setupGrid();
	vm.excelBtnOnClick();
	vm.csvBtnOnClick();
	expect(grid.calls).toEqual([
		['exportdata', 'xls', 'dataset', true, null, false, 'export-url'],
		['exportdata', 'csv', 'dataset', true, null, false, 'export-url'],
	]);
});

describe('ActiveGrid: coordenadas');

it('parseCoord acepta coma decimal, vacío y grados decimales', () => {
	const { vm } = setupGrid();
	expect(vm.parseCoord('-34,5')).toBe(-34.5);
	expect(vm.parseCoord(12)).toBe(12);
	expect(vm.parseCoord('')).toBe('');
});

it('convertToDecimal pasa grados, minutos y segundos a decimal y niega las orientaciones S, W y O', () => {
	const { vm } = setupGrid();
	expect(vm.convertToDecimal('34°30\'0"N')).toBeCloseTo(34.5, 6);
	expect(vm.convertToDecimal('34°30\'0"S')).toBeCloseTo(-34.5, 6);
	expect(vm.convertToDecimal('58°22\'30"W')).toBeCloseTo(-58.375, 6);
	expect(vm.convertToDecimal('58°22\'30"o')).toBeCloseTo(-58.375, 6);
	expect(vm.convertToDecimal('58°22\'30,0"E')).toBeCloseTo(58.375, 6);
});

it('parseCoord interpreta grados, minutos y segundos cuando incluye el símbolo de grado', () => {
	const { vm } = setupGrid();
	expect(vm.parseCoord('34°30\'0"S')).toBeCloseTo(-34.5, 6);
});

it('relocate abre el selector de posición con la latitud y longitud de la fila elegida', () => {
	const { vm, refs } = setupGrid({}, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { lat: '-34,5', lon: '-58.4' } } });
	const coord = { latitude: 1, longitude: 2 };
	vm.relocate(coord);
	expect(vm.currentGeorreferenceEdit === coord).toBeTruthy();
	expect(refs.Relocate.shown).toEqual([[-34.5, -58.4]]);
});

it('relocated graba la nueva posición, la refleja en la fila y oculta la espera', async () => {
	const { vm, dataset, grid } = setupGrid({}, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { internal__Id: 40 } } });
	vm.currentGeorreferenceEdit = { latitude: 1, longitude: 2 };
	vm.relocated();
	expect(dataset.spied).toEqual([['UpdateRowValues', 40, [{ columnId: 1, value: 1.5 }, { columnId: 2, value: 2.5 }]]]);
	const sets = grid.calls.filter(function (call) { return call[0] === 'setcellvalue'; });
	expect(sets).toEqual([['setcellvalue', 0, 'lat', 1.5], ['setcellvalue', 0, 'lon', 2.5]]);
	expect(vm.DataPager.cleared).toBe(2);
	await flushPromises();
	expect(grid.calls[grid.calls.length - 1][0]).toBe('hideloadelement');
});

it('fixCode abre la corrección con el código actual de la fila', () => {
	const { vm, refs } = setupGrid({}, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { codigo: 'AB' } } });
	const codeRef = { codes: 3 };
	vm.fixCode(codeRef);
	expect(vm.currentGeorreferenceEdit === codeRef).toBeTruthy();
	expect(refs.FixCode.shown).toEqual([['AB']]);
});

it('fixedCode graba el código corregido en la columna de códigos', () => {
	const { vm, dataset } = setupGrid({}, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { internal__Id: 40 } } });
	vm.currentGeorreferenceEdit = { codes: 3 };
	vm.fixedCode();
	expect(dataset.spied).toEqual([['UpdateRowValues', 40, [{ columnId: 3, value: 'XYZ' }]]]);
});

it('fixedPolygon graba el polígono corregido en la columna de polígonos de la georreferenciación', () => {
	const { vm, dataset } = setupGrid({ georeferenceParameters: { polygon: 4 } }, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { internal__Id: 40 } } });
	vm.fixedPolygon();
	expect(dataset.spied).toEqual([['UpdateRowValues', 40, [{ columnId: 4, value: 'POLY' }]]]);
});

it('fixPolygon abre la corrección con el polígono actual de la fila', () => {
	const { vm, refs } = setupGrid({ georeferenceParameters: { polygon: 4 } }, { selectedIndexes: [0], rowCount: 1, rowData: { 0: { poligono: 'POLYGON((0 0))' } } });
	vm.fixPolygon();
	expect(refs.FixPolygon.shown).toEqual([['POLYGON((0 0))']]);
});

describe('ActiveGrid: selección y contador de filas');

it('selectionChanged habilita las acciones según la cantidad de filas seleccionadas', () => {
	const { vm, grid } = setupGrid({}, { rowCount: 10, rows: [{}] });
	grid.selectedIndexes = [];
	vm.selectionChanged();
	expect([vm.deleteDisabled, vm.skipDisabled, vm.relocateDisabled, vm.fixDisabled]).toEqual([true, true, true, true]);
	grid.selectedIndexes = [3];
	vm.selectionChanged();
	expect([vm.deleteDisabled, vm.skipDisabled, vm.relocateDisabled, vm.fixDisabled]).toEqual([false, false, false, false]);
	grid.selectedIndexes = [3, 4];
	vm.selectionChanged();
	expect([vm.deleteDisabled, vm.skipDisabled, vm.relocateDisabled, vm.fixDisabled]).toEqual([false, false, true, true]);
});

it('updateCount informa la cantidad de filas, en singular o plural, con separador de miles', () => {
	const { vm } = setupGrid();
	vm.updateCount(1);
	expect(vm.statusBarText).toBe('1 fila.');
	vm.updateCount(12345);
	expect(vm.statusBarText).toBe('12.345 filas.');
	vm.updateCount(0);
	expect(vm.statusBarText).toBe('0 filas.');
	expect(vm.skipAllDisabled).toBeTruthy();
});

it('updateCount con varias filas seleccionadas informa cuántas de cuántas', () => {
	const { vm, grid } = setupGrid();
	grid.selectedIndexes = [0, 1, 2];
	grid.rowCount = 5000;
	vm.updateCount(5000);
	expect(vm.selectedRowsCount).toBe(3);
	expect(vm.statusBarText).toBe('3 de 5000 filas.');
});

it('updateCount sin parámetro toma la cantidad de la grilla, y la da por cero si la grilla no tiene filas', () => {
	const { vm, grid } = setupGrid();
	grid.rowCount = 40;
	grid.rows = [{}];
	vm.updateCount();
	expect(vm.statusBarText).toBe('40 filas.');
	grid.rows = [];
	vm.updateCount();
	expect(vm.statusBarText).toBe('0 filas.');
});

it('con errores visibles y una fila seleccionada muestra el problema de esa fila', () => {
	const { vm, grid } = setupGrid({ showingErrors: true }, { rowCount: 3, rows: [{}], rowData: { 1: { internal__Err: 'Código inexistente' } } });
	grid.selectedIndexes = [1];
	vm.updateCount(3);
	expect(vm.problemText).toBe('Código inexistente');
});

describe('ActiveGrid: ordenamiento');

it('currentSortDirection traduce el orden de la grilla a asc o desc y es null si no ordena por esa columna', () => {
	const { vm, grid, dataset } = setupGrid();
	const column = dataset.Columns[0];
	grid.sortInformation = { sortcolumn: 'lat', sortdirection: { ascending: true, descending: false } };
	expect(vm.currentSortDirection(column)).toBe('asc');
	grid.sortInformation = { sortcolumn: 'lat', sortdirection: { ascending: false, descending: true } };
	expect(vm.currentSortDirection(column)).toBe('desc');
	grid.sortInformation = { sortcolumn: 'otra', sortdirection: { ascending: true } };
	expect(vm.currentSortDirection(column)).toBeNull();
});

it('si la grilla no responde usa el último orden recordado', () => {
	const { vm, grid, dataset } = setupGrid();
	grid.getsortinformation = function () { throw new Error('sin grilla'); };
	vm.sortState = { lat: 'desc' };
	expect(vm.currentSortDirection(dataset.Columns[0])).toBe('desc');
	expect(vm.currentSortDirection(dataset.Columns[1])).toBeNull();
});

it('menuSortAsc, menuSortDesc y menuSortNone ordenan la grilla y recuerdan el estado sin mutar el anterior', () => {
	const { vm, grid, dataset } = setupGrid();
	const before = vm.sortState;
	vm.menuSortAsc(dataset.Columns[0]);
	vm.menuSortDesc(dataset.Columns[1]);
	expect(vm.sortState).toEqual({ lat: 'asc', lon: 'desc' });
	expect(before).toEqual({});
	vm.menuSortNone(dataset.Columns[0]);
	expect(vm.sortState).toEqual({ lon: 'desc' });
	expect(grid.calls).toEqual([['sortby', 'lat', 'asc'], ['sortby', 'lon', 'desc'], ['removesort']]);
});

describe('ActiveGrid: menú de columna');

it('openColumnMenu busca el encabezado desde el botón y abre el menú con la columna de su texto', () => {
	const { vm, refs, grid } = setupGrid();
	grid.sortInformation = null;
	const span = { textContent: 'codigo' };
	const header = { classList: { contains(name) { return name === 'jqx-grid-column-header'; } }, querySelector() { return span; }, parentNode: null };
	const btn = { parentNode: { parentNode: header }, getBoundingClientRect() { return { left: 1, top: 2 }; } };
	vm.openColumnMenu(btn);
	expect(refs.columnMenu.shown).toHaveLength(1);
	expect(refs.columnMenu.shown[0][0].Id).toBe(3);
	expect(refs.columnMenu.shown[0][1]).toEqual({ left: 1, top: 2 });
	expect(refs.columnMenu.shown[0][2]).toBeNull();
});

it('openColumnMenu no hace nada si no encuentra el encabezado o su texto', () => {
	const { vm, refs } = setupGrid();
	vm.openColumnMenu({ parentNode: null, getBoundingClientRect() { return {}; } });
	const header = { classList: { contains() { return true; } }, querySelector() { return null; }, parentNode: null };
	vm.openColumnMenu({ parentNode: header, getBoundingClientRect() { return {}; } });
	expect(refs.columnMenu.shown).toHaveLength(0);
});

it('attachOneHeaderMenu ignora encabezados ya procesados o sin texto', () => {
	const { vm } = setupGrid();
	const marked = { getAttribute() { return '1'; } };
	vm.attachOneHeaderMenu(marked);
	const empty = { getAttribute() { return null; }, querySelector() { return null; } };
	vm.attachOneHeaderMenu(empty);
});

it('attachOneHeaderMenu instala un botón que abre el menú sin propagar el clic', () => {
	const { vm } = setupGrid();
	const listeners = {};
	const created = { className: '', title: '', addEventListener(name, handler) { listeners[name] = handler; } };
	globalThis.document.createElement = function () { return created; };
	const appended = [];
	const inner = { appendChild(node) { appended.push(node); } };
	const attributes = {};
	const header = {
		getAttribute(name) { return attributes[name] || null; },
		setAttribute(name, value) { attributes[name] = value; },
		querySelector() { return {}; },
		firstElementChild: inner,
	};
	const opened = [];
	vm.openColumnMenu = function (btn) { opened.push(btn); };
	vm.attachOneHeaderMenu(header);
	expect(attributes['data-mp-menu']).toBe('1');
	expect(created.className).toBe('mpColumnMenuButton');
	expect(created.title).toBe('Acciones de la columna');
	expect(appended).toEqual([created]);
	const event = { stopped: 0, prevented: 0, stopPropagation() { this.stopped++; }, preventDefault() { this.prevented++; } };
	listeners.click(event);
	expect(opened).toEqual([created]);
	expect(event.stopped).toBe(1);
	expect(event.prevented).toBe(1);
	vm.attachOneHeaderMenu(header);
	expect(appended).toHaveLength(1);
});

it('attachHeaderMenus instala el menú en cada encabezado de la grilla, si la grilla existe', async () => {
	const { vm, refs } = setupGrid();
	const attached = [];
	vm.attachOneHeaderMenu = function (header) { attached.push(header); };
	refs.activeGrid.$el = { querySelectorAll() { return ['h1', 'h2']; } };
	vm.attachHeaderMenus();
	await flushPromises();
	expect(attached).toEqual(['h1', 'h2']);
	refs.activeGrid.$el = null;
	vm.attachHeaderMenus();
	await flushPromises();
	expect(attached).toHaveLength(2);
});

describe('ActiveGrid: acciones de columna');

it('menuModify abre la edición de la columna y newColumn pide una columna nueva al catálogo', () => {
	const { vm, refs, context, dataset } = setupGrid();
	vm.menuModify(dataset.Columns[0]);
	expect(refs.columnEdit.shown[0][0].Id).toBe(1);
	context.Factory = { GetCopy(type, callback) { callback({ Type: type }); } };
	vm.newColumn();
	expect(refs.columnEdit.shown[1]).toEqual([{ Type: 'Column' }]);
});

it('columnEdited recarga las columnas del dataset con un mensaje', () => {
	const { vm, refs, dataset } = setupGrid();
	vm.columnEdited();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información del dataset');
	expect(refs.invoker.messages[0][1] === dataset).toBeTruthy();
});

it('menuCategories abre las categorías de la columna y, al guardar, regenera las variables afectadas y recarga', async () => {
	const { vm, refs, dataset } = setupGrid();
	dataset.Labels = { 1: [{ Value: 1 }] };
	vm.menuCategories(dataset.Columns[0]);
	expect(vm.valuesPopupReset).toBeTruthy();
	await flushPromises();
	const [column, values, canEdit, saved, destroyed] = refs.valuesPopup.shown[0];
	expect(column.Id).toBe(1);
	expect(values).toEqual([{ Value: 1 }]);
	expect(canEdit).toBe(true);
	saved();
	expect(dataset.ScaleGenerator.affected).toEqual([['RegenAndSaveVariablesAffectedByLabelChange', column]]);
	expect(vm.valuesPopupReset).toBeFalsy();
	destroyed.call(vm);
});

it('menuCategories de una columna sin etiquetas abre la lista vacía', async () => {
	const { vm, refs, dataset } = setupGrid();
	vm.menuCategories(dataset.Columns[1]);
	await flushPromises();
	expect(refs.valuesPopup.shown[0][1]).toEqual([]);
});

it('menuAutoRecode trae los valores distintos y abre la recodificación automática', async () => {
	const { vm, refs, dataset } = setupGrid();
	vm.menuAutoRecode(dataset.Columns[2]);
	let closed = 0;
	refs.invoker.calls[0](function () { closed++; });
	await flushPromises();
	expect(dataset.spied[0]).toEqual(['GetDistinctColumnValues', 3]);
	expect(refs.valuesPopup.shown[0].slice(0, 3)).toEqual(['auto', dataset.Columns[2], ['a', 'b']]);
	expect(closed).toBe(1);
});

it('menuDelete pide confirmación nombrando la columna y deleteColumnConfirmed la elimina y regenera las variables afectadas', async () => {
	const { vm, refs, dataset } = setupGrid();
	vm.menuDelete(dataset.Columns[2]);
	expect(vm.deleteColumnText.startsWith('La columna «codigo» junto con sus datos será eliminada.')).toBeTruthy();
	await flushPromises();
	expect(refs.confirmColumnDialog.shown).toHaveLength(1);
	vm.deleteColumnConfirmed();
	await flushPromises();
	expect(dataset.spied[0]).toEqual(['DeleteColumns', [3]]);
	expect(dataset.ScaleGenerator.affected.map(function (item) { return item[0]; })).toEqual([
		'RegenAndSaveVariablesAffectedByDeletedDataColumnIds',
		'RegenAndSaveVariablesAffectedByDeletedCutColumnsIds',
		'RegenAndSaveVariablesAffectedByDeletedSequenceIds',
	]);
	expect(vm.pendingDeleteColumn).toBeNull();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información del dataset');
});

it('abrir los diálogos de importación, diccionario y confirmación delega en sus componentes', () => {
	const { vm, refs } = setupGrid();
	vm.upload();
	vm.openDictionary();
	vm.confirmDelete();
	expect(refs.importPopup.shown).toHaveLength(1);
	expect(refs.dictionaryPopup.shown).toHaveLength(1);
	expect(refs.confirmDialog.shown).toHaveLength(1);
});
