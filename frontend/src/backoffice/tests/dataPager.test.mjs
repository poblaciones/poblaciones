import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, captureConsoleAsync } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import DataPager from '@/backoffice/classes/DataPager';

const URL = 'https://api.example.org/services/backoffice/GetData?k=5';

function setup() {
	axios.reset();
	return setupBackoffice();
}

function makeSource(extra) {
	return Object.assign({
		url: URL,
		totalrecords: 100,
		datafields: [
			{ name: 'id', map: 0, type: 'number' },
			{ name: 'nombre', map: 1, type: 'string' },
		],
	}, extra);
}

function makeGridRequest(start, end, pagesize) {
	return { pagesize: pagesize, pagenum: 0, recordstartindex: start, recordendindex: end, sortfield: 'nombre' };
}

// Cada página responde con filas [índice global, 'fila N'].
function respondWithRows(pagesize) {
	axios.handlers.get = function (url, config) {
		const page = config.params.page;
		const rows = [];
		for (let i = 0; i < pagesize; i++) {
			const index = page * pagesize + i;
			rows.push([String(index), 'fila ' + index]);
		}
		return Promise.resolve({ data: { Data: rows }, headers: {} });
	};
}

function makeAdapter() {
	return {
		records: ['vacío'],
		loadedWith: null,
		loadjson(data, records, source) {
			this.loadedWith = { data: data, records: records };
		},
	};
}

describe('DataPager: cálculo de páginas y claves');

it('CalculatePage trunca el cociente del índice por el tamaño de página', () => {
	const pager = new DataPager();
	expect(pager.CalculatePage(0, 10)).toBe(0);
	expect(pager.CalculatePage(9, 10)).toBe(0);
	expect(pager.CalculatePage(10, 10)).toBe(1);
	expect(pager.CalculatePage(25, 10)).toBe(2);
});

it('getKey incluye la página en la clave y la escribe en la consulta recibida', () => {
	const pager = new DataPager();
	const postdata = { pagesize: 10 };
	const key = pager.getKey(postdata, 3);
	expect(postdata.page).toBe(3);
	expect(key).toBe(JSON.stringify({ pagesize: 10, page: 3 }));
});

it('hasData informa si la página ya está en el caché', () => {
	const pager = new DataPager();
	const postdata = { pagesize: 10 };
	expect(pager.hasData(postdata, 0)).toBeFalsy();
	pager.cachedPages[pager.getKey(postdata, 0)] = { Data: [] };
	expect(pager.hasData(postdata, 0)).toBeTruthy();
	expect(pager.hasData(postdata, 1)).toBeFalsy();
});

it('Clear vacía el caché y los índices recordados', () => {
	const pager = new DataPager();
	pager.cachedPages = { a: 1 };
	pager.lastRecordStartIndex = 3;
	pager.lastRecordEndIndex = 4;
	pager.Clear();
	expect(pager.cachedPages).toEqual({});
	expect(pager.lastRecordStartIndex).toBeNull();
	expect(pager.lastRecordEndIndex).toBeNull();
});

describe('DataPager: PosFromNames');

it('convierte filas posicionales en objetos con el nombre de cada campo', () => {
	const pager = new DataPager();
	const records = pager.PosFromNames(makeSource(), [['1', 'Ana'], ['2', 'Luis']]);
	expect(records).toEqual([{ id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Luis' }]);
});

it('reinterpreta como número los valores numéricos, salvo vacío y null', () => {
	const pager = new DataPager();
	const source = makeSource();
	expect(pager.PosFromNames(source, [['3.5', 'x']])[0].id).toBe(3.5);
	expect(pager.PosFromNames(source, [['', 'x']])[0].id).toBe('');
	expect(pager.PosFromNames(source, [[null, 'x']])[0].id).toBeNull();
});

it('no convierte los campos que no son numéricos', () => {
	const pager = new DataPager();
	expect(pager.PosFromNames(makeSource(), [['1', '007']])[0].nombre).toBe('007');
});

it('lanza un error si los datafields no están definidos secuencialmente según su map', () => {
	const pager = new DataPager();
	const source = makeSource({ datafields: [{ name: 'id', map: 1, type: 'number' }] });
	let thrown = null;
	try {
		pager.PosFromNames(source, []);
	} catch (e) {
		thrown = e;
	}
	expect(thrown.message).toBe('Los datafields deben estar definidos secuencialmente según su .map.');
});

describe('DataPager: GetPage');

it('con la página en caché responde sin pedirla al servidor', () => {
	setup();
	const pager = new DataPager();
	const postdata = { pagesize: 10 };
	pager.cachedPages[pager.getKey(postdata, 0)] = { Data: [] };
	let called = 0;
	pager.GetPage(postdata, 0, makeSource(), function () { called++; }, function () {});
	expect(called).toBe(1);
	expect(axios.calls).toHaveLength(0);
});

it('pide la página con la consulta como parámetros, la guarda en caché y avisa', async () => {
	setup();
	axios.respond('get', { data: { Data: [['1', 'Ana']] } });
	const pager = new DataPager();
	const postdata = { pagesize: 10 };
	let called = 0;
	pager.GetPage(postdata, 2, makeSource(), function () { called++; }, function () {});
	await flushPromises();
	expect(axios.calls[0].url).toBe(URL);
	expect(axios.calls[0].config.params.page).toBe(2);
	expect(called).toBe(1);
	expect(pager.hasData(postdata, 2).Data).toEqual([['1', 'Ana']]);
});

it('ejecuta beforeprocessing con la respuesta antes de guardarla', async () => {
	setup();
	axios.respond('get', { data: { Data: [] } });
	const pager = new DataPager();
	let seen = null;
	const source = makeSource({ beforeprocessing: function (data) { seen = data; } });
	pager.GetPage({ pagesize: 10 }, 0, source, function () {}, function () {});
	await flushPromises();
	expect(seen).toEqual({ Data: [] });
});

it('un fallo con el dataset vigente muestra el error y avisa por el callback de error', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	browser.window.Context.CurrentWork = { GetActiveDatasetById(id) { return { id: id, beingDeleted: false }; } };
	const pager = new DataPager();
	let failures = 0;
	await captureConsoleAsync(async function () {
		pager.GetPage({ pagesize: 10 }, 0, makeSource(), function () {}, function () { failures++; });
		await flushPromises();
	});
	expect(failures).toBe(1);
	expect(browser.alerts).toHaveLength(1);
});

it('un fallo cuyo dataset se está eliminando se ignora sin avisar', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	browser.window.Context.CurrentWork = { GetActiveDatasetById() { return { beingDeleted: true }; } };
	const pager = new DataPager();
	let failures = 0;
	pager.GetPage({ pagesize: 10 }, 0, makeSource(), function () {}, function () { failures++; });
	await flushPromises();
	expect(failures).toBe(0);
	expect(browser.alerts).toHaveLength(0);
});

it('un fallo sin trabajo actual o sin identificador k en la URL se ignora sin avisar', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	const pager = new DataPager();
	let failures = 0;
	pager.GetPage({ pagesize: 10 }, 0, makeSource(), function () {}, function () { failures++; });
	await flushPromises();
	browser.window.Context.CurrentWork = { GetActiveDatasetById() { return { beingDeleted: false }; } };
	pager.GetPage({ pagesize: 10 }, 1, makeSource({ url: 'https://api.example.org/services/x' }), function () {}, function () { failures++; });
	await flushPromises();
	expect(failures).toBe(0);
	expect(browser.alerts).toHaveLength(0);
});

describe('DataPager: Fetch');

it('con el rango dentro de una página entrega solo las filas pedidas', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	let result = null;
	pager.Fetch(makeGridRequest(12, 14, 10), makeAdapter(), makeSource(), function (data) { result = data; }, function () {});
	await flushPromises();
	expect(result.totalrecords).toBe(100);
	expect(result.records).toEqual([
		{ id: 12, nombre: 'fila 12' },
		{ id: 13, nombre: 'fila 13' },
		{ id: 14, nombre: 'fila 14' },
	]);
	expect(axios.calls).toHaveLength(1);
});

it('con un rango que cruza dos páginas pide ambas y entrega las filas en orden', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	let result = null;
	let completed = 0;
	pager.Fetch(makeGridRequest(8, 12, 10), makeAdapter(), makeSource(), function (data) { result = data; }, function () { completed++; });
	await flushPromises();
	expect(axios.calls).toHaveLength(2);
	expect(result.records.map(function (row) { return row.id; })).toEqual([8, 9, 10, 11, 12]);
	expect(completed).toBe(1);
});

it('pide siempre las páginas con la consulta normalizada y sin los índices del rango', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	pager.Fetch(makeGridRequest(12, 14, 10), makeAdapter(), makeSource(), function () {}, function () {});
	await flushPromises();
	const params = axios.calls[0].config.params;
	expect(params.recordstartindex).toBe(0);
	expect(params.recordendindex).toBe(0);
	expect(params.pagenum).toBe(0);
	expect(params.sortfield).toBe('nombre');
	expect(params.page).toBe(1);
});

it('no modifica la consulta original de la grilla', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	const request = makeGridRequest(12, 14, 10);
	pager.Fetch(request, makeAdapter(), makeSource(), function () {}, function () {});
	await flushPromises();
	expect(request).toEqual(makeGridRequest(12, 14, 10));
});

it('una segunda consulta sobre la misma página se resuelve desde el caché', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	let results = [];
	const collect = function (data) { results.push(data); };
	pager.Fetch(makeGridRequest(12, 14, 10), makeAdapter(), makeSource(), collect, function () {});
	await flushPromises();
	pager.Fetch(makeGridRequest(15, 16, 10), makeAdapter(), makeSource(), collect, function () {});
	await flushPromises();
	expect(axios.calls).toHaveLength(1);
	expect(results).toHaveLength(2);
	expect(results[1].records.map(function (row) { return row.id; })).toEqual([15, 16]);
});

it('con un rango de dos páginas ya en caché entrega el resultado dos veces y el segundo es erróneo (comportamiento actual)', async () => {
	setup();
	respondWithRows(10);
	const pager = new DataPager();
	const delivered = [];
	const collect = function (data) {
		delivered.push(data.records.map(function (row) { return row.id; }));
	};
	pager.Fetch(makeGridRequest(8, 12, 10), makeAdapter(), makeSource(), collect, function () {});
	await flushPromises();
	delivered.length = 0;
	pager.Fetch(makeGridRequest(8, 12, 10), makeAdapter(), makeSource(), collect, function () {});
	await flushPromises();
	expect(delivered).toEqual([[8, 9, 10, 11, 12], [0]]);
});

it('si la respuesta del servidor falla carga el adaptador vacío y entrega sus registros', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	browser.window.Context.CurrentWork = { GetActiveDatasetById() { return { beingDeleted: false }; } };
	const pager = new DataPager();
	const adapter = makeAdapter();
	let result = null;
	await captureConsoleAsync(async function () {
		pager.Fetch(makeGridRequest(0, 3, 10), adapter, makeSource(), function (data) { result = data; }, function () {});
		await flushPromises();
	});
	expect(adapter.loadedWith.records).toEqual([]);
	expect(result.records).toEqual(['vacío']);
});

describe('DataPager: FetchDirect');

it('entrega la página pedida con los campos nombrados', async () => {
	setup();
	respondWithRows(5);
	const pager = new DataPager();
	let result = null;
	pager.FetchDirect({ pagesize: 5, pagenum: 1 }, makeAdapter(), makeSource(), function (data) { result = data; }, function () {});
	await flushPromises();
	expect(result.records).toHaveLength(5);
	expect(result.records[0]).toEqual({ id: 5, nombre: 'fila 5' });
});

describe('DataPager: CutRecords');

it('recorta la primera página desde el inicio del rango hasta su final cuando el rango cruza páginas', () => {
	const pager = new DataPager();
	const postdata = { pagesize: 3 };
	pager.cachedPages[pager.getKey(postdata, 0)] = { Data: ['a', 'b', 'c'] };
	pager.cachedPages[pager.getKey(postdata, 1)] = { Data: ['d', 'e', 'f'] };
	pager.lastRecordStartIndex = 1;
	pager.lastRecordEndIndex = 4;
	expect(pager.CutRecords(postdata)).toEqual(['b', 'c', 'd', 'e']);
});

it('ignora los índices que exceden las filas de una página incompleta', () => {
	const pager = new DataPager();
	const postdata = { pagesize: 5 };
	pager.cachedPages[pager.getKey(postdata, 0)] = { Data: ['a', 'b'] };
	pager.lastRecordStartIndex = 0;
	pager.lastRecordEndIndex = 4;
	expect(pager.CutRecords(postdata)).toEqual(['a', 'b']);
});
