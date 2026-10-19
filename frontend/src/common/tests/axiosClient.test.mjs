import { describe, it, expect } from './_harness.mjs';
import { setupBrowser, captureConsoleAsync, flushPromises } from './fixtures.mjs';
import axios from './_stubs/axios.cjs';
import axiosClient from '@/common/js/axiosClient';
import session from '@/common/framework/session';

const URL = 'https://api.example.org/services/x';

function setup() {
	axios.reset();
	return setupBrowser();
}

describe('axiosClient.get');

it('envía los argumentos como params y la URL actual en el header Full-Url', async () => {
	setup();
	axios.respond('get', { data: 'ok' });
	await axiosClient.get(URL, { a: 1 });
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].url).toBe(URL);
	expect(axios.calls[0].config).toEqual({ params: { a: 1 }, headers: { 'Full-Url': 'http://localhost/app#/inicio' } });
});

it('serializa a JSON los argumentos que son arreglos (y modifica el objeto recibido)', async () => {
	setup();
	axios.respond('get', { data: 'ok' });
	const args = { ids: [1, 2], n: 5 };
	await axiosClient.get(URL, args);
	expect(axios.calls[0].config.params).toEqual({ ids: '[1,2]', n: 5 });
	expect(args.ids).toBe('[1,2]');
});

it('agrega la sesión y el token guardados para ese host', async () => {
	setup();
	session.SetSessionForUrl(URL, 'abc');
	session.SetRememberForUrl(URL, 'tok');
	axios.respond('get', { data: 'ok' });
	await axiosClient.get(URL, {});
	expect(axios.calls[0].config.headers['session-id']).toBe('abc');
	expect(axios.calls[0].config.headers['remember-token']).toBe('tok');
});

it('guarda la sesión que devuelve el servidor', async () => {
	setup();
	axios.respond('get', { data: 'ok', headers: { 'session-id': 'nueva' } });
	await axiosClient.get(URL, {});
	expect(session.GetSessionForUrl(URL)).toBe('nueva');
});

it('un header error-header no vacío convierte la respuesta en error y no guarda la sesión', async () => {
	setup();
	const response = { data: 'x', headers: { 'error-header': 'detalle', 'session-id': 'nueva' } };
	axios.respond('get', response);
	let caught = null;
	try {
		await axiosClient.get(URL, {});
	} catch (e) {
		caught = e;
	}
	expect(caught.message).toBe('Request failed');
	expect(caught.response.data).toBe('x');
	expect(session.GetSessionForUrl(URL)).toBeNull();
});

it('un error-header vacío no cuenta como error', async () => {
	setup();
	axios.respond('get', { data: 'ok', headers: { 'error-header': '' } });
	const res = await axiosClient.get(URL, {});
	expect(res.data).toBe('ok');
});

describe('axiosClient.getPromise');

it('se resuelve con los datos de la respuesta', async () => {
	setup();
	axios.respond('get', { data: { Id: 7 } });
	const data = await axiosClient.getPromise(URL, {}, 'cargar');
	expect(data).toEqual({ Id: 7 });
});

it('ante un error muestra el diálogo con la acción intentada y rechaza con el error original', async () => {
	const browser = setup();
	const failure = new Error('Request failed with status code 500');
	axios.respond('get', failure);
	let caught = null;
	await captureConsoleAsync(async function () {
		try {
			await axiosClient.getPromise(URL, {}, 'cargar los datos');
		} catch (e) {
			caught = e;
		}
	});
	expect(caught).toBe(failure);
	expect(browser.alerts).toHaveLength(1);
	expect(browser.alerts[0].startsWith('No ha sido posible cargar los datos.')).toBeTruthy();
});

describe('axiosClient.getCallback');

it('invoca el callback sin argumentos al terminar', async () => {
	setup();
	axios.respond('get', { data: 'ok' });
	const received = [];
	axiosClient.getCallback(URL, {}, function (...args) { received.push(args); }, 'cargar');
	await flushPromises();
	expect(received).toEqual([[]]);
});

it('admite un callback nulo', async () => {
	setup();
	axios.respond('get', { data: 'ok' });
	axiosClient.getCallback(URL, {}, null, 'cargar');
	await flushPromises();
	expect(axios.calls).toHaveLength(1);
});

describe('axiosClient.post');

it('envía el cuerpo como formulario codificado y los headers de contenido y URL actual', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	await axiosClient.post(URL, { a: 1, b: 'x y' });
	expect(axios.calls[0].body).toBe('a=1&b=x%20y');
	expect(axios.calls[0].config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
	expect(axios.calls[0].config.headers['Full-Url']).toBe('http://localhost/app#/inicio');
});

it('serializa a JSON los argumentos que son objetos o arreglos', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	await axiosClient.post(URL, { lista: [1, 2], objeto: { k: 1 } });
	expect(axios.calls[0].body).toBe('lista=%5B1%2C2%5D&objeto=%7B%22k%22%3A1%7D');
});

it('agrega la sesión guardada y guarda la que devuelve el servidor', async () => {
	setup();
	session.SetSessionForUrl(URL, 'abc');
	axios.respond('post', { data: 'ok', headers: { 'session-id': 'otra' } });
	await axiosClient.post(URL, {});
	expect(axios.calls[0].config.headers['session-id']).toBe('abc');
	expect(session.GetSessionForUrl(URL)).toBe('otra');
});

it('un error-header no vacío rechaza con el error y la respuesta', async () => {
	setup();
	axios.respond('post', { data: 'x', headers: { 'error-header': 'detalle' } });
	let caught = null;
	try {
		await axiosClient.post(URL, {});
	} catch (e) {
		caught = e;
	}
	expect(caught.message).toBe('Request failed');
	expect(caught.response.data).toBe('x');
});

describe('axiosClient.postPromise y postCallback');

it('postPromise se resuelve con los datos de la respuesta', async () => {
	setup();
	axios.respond('post', { data: 'listo' });
	expect(await axiosClient.postPromise(URL, {}, 'guardar')).toBe('listo');
});

it('postPromise ante un error muestra el diálogo y rechaza', async () => {
	const browser = setup();
	axios.respond('post', new Error('Request failed with status code 401'));
	let rejected = false;
	await captureConsoleAsync(async function () {
		try {
			await axiosClient.postPromise(URL, {}, 'guardar');
		} catch (e) {
			rejected = true;
		}
	});
	expect(rejected).toBeTruthy();
	expect(browser.alerts[0].startsWith('El usuario actual no posee los permisos suficientes para guardar.')).toBeTruthy();
});

it('postCallback entrega los datos de la respuesta al callback', async () => {
	setup();
	axios.respond('post', { data: { Id: 3 } });
	const received = [];
	axiosClient.postCallback(URL, {}, function (data) { received.push(data); }, 'guardar');
	await flushPromises();
	expect(received).toEqual([{ Id: 3 }]);
});

it('postCallback admite un callback nulo', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	axiosClient.postCallback(URL, {}, null, 'guardar');
	await flushPromises();
	expect(axios.calls).toHaveLength(1);
});
