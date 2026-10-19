import { describe, it, expect } from './_harness.mjs';
import { setupBrowser, captureConsoleAsync } from './fixtures.mjs';
import axios from './_stubs/axios.cjs';
import DbAdminBase from '@/common/classes/DbAdminBase';

const HOST = 'https://server.example.org';

function setup() {
	axios.reset();
	const browser = setupBrowser();
	browser.window.host = HOST;
	browser.window.Context = { ErrorSignaled: { value: 0 }, User: { Firstname: 'A', Lastname: 'B', Settings: { tema: 'claro' } } };
	return browser;
}

function lastGetUrl() {
	return axios.calls[axios.calls.length - 1].url;
}

describe('DbAdminBase: cuenta del usuario');

it('GetCurrentUserAccount y GetCurrentUserDiskUsage piden los datos al servicio', async () => {
	setup();
	axios.respond('get', { data: { Email: 'a@b.com' } });
	const db = new DbAdminBase();
	expect(await db.GetCurrentUserAccount()).toEqual({ Email: 'a@b.com' });
	expect(lastGetUrl()).toBe(HOST + '/services/backoffice/GetCurrentUserAccount');
	await db.GetCurrentUserDiskUsage();
	expect(lastGetUrl()).toBe(HOST + '/services/backoffice/GetCurrentUserDiskUsage');
});

it('UpdateUserName envía nombre y apellido, y recién después los actualiza en el contexto', async () => {
	const browser = setup();
	axios.respond('post', { data: null });
	const db = new DbAdminBase();
	const pending = db.UpdateUserName('Ana', 'Pérez');
	expect(browser.window.Context.User.Firstname).toBe('A');
	await pending;
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/UpdateCurrentUserName');
	expect(axios.calls[0].body).toBe('f=Ana&l=P%C3%A9rez');
	expect(browser.window.Context.User.Firstname).toBe('Ana');
	expect(browser.window.Context.User.Lastname).toBe('Pérez');
});

it('UpdateUserName no falla si el contexto no tiene usuario', async () => {
	const browser = setup();
	browser.window.Context.User = null;
	axios.respond('post', { data: null });
	await new DbAdminBase().UpdateUserName('Ana', 'Pérez');
	expect(axios.calls).toHaveLength(1);
});

it('ChangePassword envía actual, nueva y verificación', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	await new DbAdminBase().ChangePassword('vieja', 'nueva', 'nueva');
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/ChangeCurrentUserPassword');
	expect(axios.calls[0].body).toBe('c=vieja&n=nueva&v=nueva');
});

it('DeleteAccount hace el pedido de eliminación sin argumentos', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	await new DbAdminBase().DeleteAccount();
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/DeleteCurrentUserAccount');
	expect(axios.calls[0].body).toBe('');
});

describe('DbAdminBase: preferencias de usuario');

it('GetUserSetting devuelve el valor guardado o el valor por defecto si no existe', () => {
	setup();
	const db = new DbAdminBase();
	expect(db.GetUserSetting('tema', 'x')).toBe('claro');
	expect(db.GetUserSetting('inexistente', 'defecto')).toBe('defecto');
});

it('GetUserSetting devuelve un valor guardado falsy (no lo confunde con ausente)', () => {
	const browser = setup();
	browser.window.Context.User.Settings.activo = false;
	expect(new DbAdminBase().GetUserSetting('activo', true)).toBeFalsy();
});

it('SetUserSetting actualiza de inmediato y envía el valor serializado a JSON', async () => {
	const browser = setup();
	axios.respond('post', { data: 'ok' });
	const pending = new DbAdminBase().SetUserSetting('tema', 'oscuro');
	expect(browser.window.Context.User.Settings.tema).toBe('oscuro');
	await pending;
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/SetUserSetting');
	expect(axios.calls[0].body).toBe('k=tema&v=%22oscuro%22');
});

it('SetUserSetting no envía nada si el valor no cambió', () => {
	setup();
	const result = new DbAdminBase().SetUserSetting('tema', 'claro');
	expect(result).toBe(undefined);
	expect(axios.calls).toHaveLength(0);
});

it('SetUserSetting restaura el valor anterior y propaga el error si el servidor falla', async () => {
	const browser = setup();
	axios.respond('post', new Error('Request failed with status code 500'));
	let caught = null;
	await captureConsoleAsync(async function () {
		try {
			await new DbAdminBase().SetUserSetting('tema', 'oscuro');
		} catch (e) {
			caught = e;
		}
	});
	expect(caught.message).toBe('Request failed with status code 500');
	expect(browser.window.Context.User.Settings.tema).toBe('claro');
});
