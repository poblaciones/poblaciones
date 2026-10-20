import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, captureConsoleAsync } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import AsyncCatalog from '@/backoffice/classes/AsyncCatalog';

const URL = 'https://api.example.org/services/backoffice/GetFactories';
const CATALOG = { Column: { Name: 'columna' }, Source: { Name: 'fuente' } };

function setup() {
	axios.reset();
	return setupBackoffice();
}

function respondWithCatalog() {
	axios.respond('get', { data: CATALOG });
}

describe('AsyncCatalog: estado inicial');

it('arranca vacío, sin datos y sin carga en curso', () => {
	const catalog = new AsyncCatalog(URL);
	expect(catalog.url).toBe(URL);
	expect(catalog.list).toEqual([]);
	expect(catalog.hasData).toBeFalsy();
	expect(catalog.loading).toBeFalsy();
	expect(catalog.notifyQueue).toEqual([]);
});

describe('AsyncCatalog: Refresh');

it('pide la URL del catálogo, guarda la lista y deja de estar cargando', async () => {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	catalog.Refresh();
	expect(catalog.loading).toBeTruthy();
	await flushPromises();
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].url).toBe(URL);
	expect(catalog.list).toEqual(CATALOG);
	expect(catalog.hasData).toBeTruthy();
	expect(catalog.loading).toBeFalsy();
});

it('un fallo de red muestra el error una sola vez y libera la carga', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	const catalog = new AsyncCatalog(URL);
	await captureConsoleAsync(async function () {
		catalog.Refresh();
		await flushPromises();
	});
	expect(browser.alerts).toHaveLength(1);
	expect(catalog.hasData).toBeFalsy();
	expect(catalog.loading).toBeFalsy();
});

it('tras un fallo la próxima consulta reintenta y atiende a las que quedaron en cola', async () => {
	setup();
	axios.respond('get', new Error('boom'));
	const catalog = new AsyncCatalog(URL);
	let received = null;
	await captureConsoleAsync(async function () {
		catalog.GetAll(function (data) { received = data; });
		await flushPromises();
	});
	expect(received).toBeNull();
	respondWithCatalog();
	catalog.GetAll(function () {});
	await flushPromises();
	expect(axios.calls).toHaveLength(2);
	expect(received).toEqual(CATALOG);
});

describe('AsyncCatalog: Invalidate');

it('descarta el caché y la próxima consulta vuelve a pedir los datos', async () => {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	catalog.Refresh();
	await flushPromises();
	catalog.Invalidate();
	expect(catalog.hasData).toBeFalsy();
	catalog.GetAll(function () {});
	await flushPromises();
	expect(axios.calls).toHaveLength(2);
});

describe('AsyncCatalog: resolve');

it('sin clave entrega la lista, o una copia si se pide clonar', () => {
	setup();
	const catalog = new AsyncCatalog(URL);
	catalog.list = CATALOG;
	let delivered = null;
	catalog.resolve(function (data) { delivered = data; }, false);
	expect(delivered === CATALOG).toBeTruthy();
	catalog.resolve(function (data) { delivered = data; }, true);
	expect(delivered === CATALOG).toBeFalsy();
	expect(delivered).toEqual(CATALOG);
});

it('con clave entrega ese elemento, o una copia si se pide clonar', () => {
	setup();
	const catalog = new AsyncCatalog(URL);
	catalog.list = CATALOG;
	let delivered = null;
	catalog.resolve(function (data) { delivered = data; }, false, 'Column');
	expect(delivered === CATALOG.Column).toBeTruthy();
	catalog.resolve(function (data) { delivered = data; }, true, 'Column');
	expect(delivered === CATALOG.Column).toBeFalsy();
	expect(delivered).toEqual({ Name: 'columna' });
});

it('una clave inexistente lanza un error que la nombra', () => {
	setup();
	const catalog = new AsyncCatalog(URL);
	catalog.list = CATALOG;
	let thrown = null;
	try {
		catalog.resolve(function () {}, false, 'Faltante');
	} catch (e) {
		thrown = e;
	}
	expect(thrown.message).toBe('Element Faltante is not defined in the catalog.');
});

describe('AsyncCatalog: consultas con datos cargados');

async function makeLoadedCatalog() {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	catalog.Refresh();
	await flushPromises();
	return catalog;
}

it('Get, GetCopy y GetAll responden en el momento sin volver a pedir datos', async () => {
	const catalog = await makeLoadedCatalog();
	const received = [];
	catalog.Get('Column', function (data) { received.push(data); });
	catalog.GetCopy('Source', function (data) { received.push(data); });
	catalog.GetAll(function (data) { received.push(data); });
	expect(axios.calls).toHaveLength(1);
	expect(received[0] === catalog.list.Column).toBeTruthy();
	expect(received[1]).toEqual({ Name: 'fuente' });
	expect(received[2]).toEqual(CATALOG);
});

it('GetCopy entrega una copia que se puede modificar sin alterar el catálogo', async () => {
	const catalog = await makeLoadedCatalog();
	let copy = null;
	catalog.GetCopy('Column', function (data) { copy = data; });
	copy.Name = 'modificada';
	expect(catalog.list.Column.Name).toBe('columna');
});

describe('AsyncCatalog: consultas antes de la carga');

it('la primera consulta dispara una única carga y las siguientes esperan en cola', async () => {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	let first = null;
	let second = null;
	catalog.GetAll(function (data) { first = data; });
	catalog.GetAll(function (data) { second = data; });
	expect(axios.calls).toHaveLength(1);
	expect(catalog.notifyQueue).toHaveLength(2);
	expect(first).toBeNull();
	await flushPromises();
	expect(first).toEqual(CATALOG);
	expect(second).toEqual(CATALOG);
	expect(catalog.notifyQueue).toEqual([]);
});

it('Get y GetCopy encolados reciben el elemento pedido una vez cargado el catálogo', async () => {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	let viaGet = null;
	let viaGetCopy = null;
	catalog.Get('Column', function (data) { viaGet = data; });
	catalog.GetCopy('Source', function (data) { viaGetCopy = data; });
	await flushPromises();
	expect(viaGet === catalog.list.Column).toBeTruthy();
	expect(viaGetCopy).toEqual({ Name: 'fuente' });
	expect(viaGetCopy === catalog.list.Source).toBeFalsy();
});

describe('AsyncCatalog: versiones con promesa');

it('GetAllPromise resuelve con la lista una vez cargada', async () => {
	setup();
	respondWithCatalog();
	const catalog = new AsyncCatalog(URL);
	const data = await catalog.GetAllPromise();
	expect(data).toEqual(CATALOG);
	expect(axios.calls).toHaveLength(1);
});

it('GetCopyPromise resuelve con una copia con datos ya cargados', async () => {
	const catalog = await makeLoadedCatalog();
	const data = await catalog.GetCopyPromise('Column');
	expect(data).toEqual({ Name: 'columna' });
	expect(data === catalog.list.Column).toBeFalsy();
});
