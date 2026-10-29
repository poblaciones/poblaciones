// Dobles para ActiveGrid: una grilla jqxGrid falsa que registra sus llamadas y
// un dataset real con columnas, cuyas operaciones contra el servidor se
// reemplazan por espías.
import { setupBackoffice, mountLite } from './fixtures.mjs';
import ActiveGrid from '@/backoffice/components/ActiveGrid.vue';
import { makeActive, makeColumn } from './activeDatasetFixtures.mjs';

const NUMBER = 5;
const STRING = 1;

export function makeGrid(overrides) {
	const grid = {
		calls: [],
		selectedIndexes: [],
		rows: [],
		rowCount: 0,
		pagesize: 50,
		rowData: {},
		sortInformation: null,
		record(name, args) {
			grid.calls.push([name].concat(args));
		},
		showloadelement() { grid.record('showloadelement', []); },
		hideloadelement() { grid.record('hideloadelement', []); },
		setcellvalue(...args) { grid.record('setcellvalue', args); },
		getselectedrowindexes() { return grid.selectedIndexes; },
		getdatainformation() { return { rowscount: grid.rowCount }; },
		getrows() { return grid.rows; },
		getrowdata(index) { return grid.rowData[index]; },
		getrowid(index) { return 'id' + index; },
		getsortinformation() { return grid.sortInformation; },
		clearselection() { grid.record('clearselection', []); },
		unselectrow(...args) { grid.record('unselectrow', args); },
		showcolumn(...args) { grid.record('showcolumn', args); },
		hidecolumn(...args) { grid.record('hidecolumn', args); },
		selectrow(...args) { grid.record('selectrow', args); },
		ensurerowvisible(...args) { grid.record('ensurerowvisible', args); },
		sortby(...args) { grid.record('sortby', args); },
		removesort() { grid.record('removesort', []); },
		deleterow(...args) { grid.record('deleterow', args); },
		clear() { grid.record('clear', []); },
		gotopage(...args) { grid.record('gotopage', args); },
		exportdata(...args) { grid.record('exportdata', args); },
		updatebounddata(...args) { grid.record('updatebounddata', args); },
	};
	return Object.assign(grid, overrides);
}

export function makeGridDataset() {
	const dataset = makeActive({ Id: 5, Type: 'R' });
	dataset.Columns = [
		makeColumn(1, 'lat', NUMBER),
		makeColumn(2, 'lon', NUMBER),
		makeColumn(3, 'codigo', STRING, { FieldWidth: 3 }),
		makeColumn(4, 'poligono', STRING, { FieldWidth: 1 }),
	];
	dataset.Labels = {};
	dataset.spied = [];
	function spy(name, result) {
		dataset[name] = function (...args) {
			dataset.spied.push([name].concat(args));
			return result();
		};
	}
	spy('UpdateRowValues', function () { return Promise.resolve(); });
	spy('DeleteRows', function () { return Promise.resolve(); });
	spy('SkipRows', function () { return Promise.resolve(); });
	spy('SkipAllRows', function () { return Promise.resolve(); });
	spy('DeleteColumns', function () { return Promise.resolve(); });
	spy('ReloadColumns', function () { return Promise.resolve(); });
	spy('CreateRow', function () { return Promise.resolve(77); });
	spy('GetDistinctColumnValues', function () { return Promise.resolve(['a', 'b']); });
	dataset.ScaleGenerator.affected = [];
	for (const name of ['RegenAndSaveVariablesAffectedByDeletedDataColumnIds', 'RegenAndSaveVariablesAffectedByDeletedCutColumnsIds',
		'RegenAndSaveVariablesAffectedByDeletedSequenceIds', 'RegenAndSaveVariablesAffectedByLabelChange']) {
		dataset.ScaleGenerator[name] = function (arg) { dataset.ScaleGenerator.affected.push([name, arg]); };
	}
	return dataset;
}

function makePopup() {
	return { shown: [], show(...args) { this.shown.push(args); }, showAutoRecode(...args) { this.shown.push(['auto'].concat(args)); } };
}

export function setupGrid(propsData, gridOverrides) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	context.CurrentDataset = dataset;
	context.CurrentWork = { properties: { Id: 3 }, CanEdit() { return true; }, GetGridExportUrl() { return 'export-url'; } };
	const grid = makeGrid(gridOverrides);
	const refs = {
		activeGrid: grid,
		Relocate: Object.assign(makePopup(), { newLat: 1.5, newLon: 2.5 }),
		FixCode: Object.assign(makePopup(), { newValue: 'XYZ' }),
		FixPolygon: Object.assign(makePopup(), { newValue: 'POLY' }),
		columnEdit: makePopup(),
		columnMenu: makePopup(),
		valuesPopup: makePopup(),
		fieldCalculator: makePopup(),
		importPopup: makePopup(),
		dictionaryPopup: makePopup(),
		confirmDialog: makePopup(),
		confirmColumnDialog: makePopup(),
		stepper: { startUrl: null, stepUrl: null, args: null, closed: 0, Close() { this.closed++; }, Start() { return Promise.resolve(); } },
		invoker: {
			messages: [],
			calls: [],
			doMessage(...args) { this.messages.push(args); return Promise.resolve(); },
			call(method) { this.calls.push(method); },
		},
	};
	const vm = mountLite(ActiveGrid, { propsData: propsData || {}, mocks: { $refs: refs } });
	vm.source = { id: 'internal__Id', totalrecords: 0 };
	vm.DataPager.cleared = 0;
	vm.DataPager.Clear = function () { vm.DataPager.cleared++; };
	return { vm: vm, grid: grid, dataset: dataset, refs: refs, context: context, browser: browser };
}
