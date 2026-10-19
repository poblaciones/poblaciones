import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import session from '@/common/framework/session';

const URL_A = 'https://api.example.org/services/x';
const URL_A_OTHER_PATH = 'https://api.example.org/otro/camino';
const URL_B = 'https://api.example.org:8443/services/x';

describe('session: identificador de sesión por host');

it('GetSessionForUrl devuelve null si no hay sesión guardada', () => {
	setupBrowser();
	expect(session.GetSessionForUrl(URL_A)).toBeNull();
});

it('SetSessionForUrl guarda por host (con puerto) y lo comparte entre rutas del mismo host', () => {
	const browser = setupBrowser();
	session.SetSessionForUrl(URL_A, 'abc');
	expect(browser.storage.dump()).toEqual({ 'sessionId_api.example.org': 'abc' });
	expect(session.GetSessionForUrl(URL_A_OTHER_PATH)).toBe('abc');
	expect(session.GetSessionForUrl(URL_B)).toBeNull();
});

it('SetSessionForUrl no vuelve a escribir un valor idéntico', () => {
	const browser = setupBrowser();
	let writes = 0;
	const originalSetItem = browser.storage.setItem;
	browser.storage.setItem = function (key, value) {
		writes++;
		originalSetItem.call(browser.storage, key, value);
	};
	session.SetSessionForUrl(URL_A, 'abc');
	session.SetSessionForUrl(URL_A, 'abc');
	expect(writes).toBe(1);
});

describe('session: ReceiveSession');

it('guarda el session-id que llega en los headers de la respuesta', () => {
	setupBrowser();
	session.ReceiveSession(URL_A, { headers: { 'session-id': 'nuevo' } });
	expect(session.GetSessionForUrl(URL_A)).toBe('nuevo');
});

it('sin session-id y sin sesión previa no escribe nada', () => {
	const browser = setupBrowser();
	session.ReceiveSession(URL_A, { headers: {} });
	expect(browser.storage.dump()).toEqual({});
});

it('sin session-id y con sesión previa guarda el texto "null" (localStorage convierte null a texto)', () => {
	setupBrowser();
	session.SetSessionForUrl(URL_A, 'vieja');
	session.ReceiveSession(URL_A, { headers: {} });
	expect(session.GetSessionForUrl(URL_A)).toBe('null');
});

describe('session: token de recordar');

it('Set/Get/ClearRememberForUrl guardan y borran por host', () => {
	const browser = setupBrowser();
	session.SetRememberForUrl(URL_A, 'tok');
	expect(browser.storage.dump()).toEqual({ 'rememberToken_api.example.org': 'tok' });
	expect(session.GetRememberForUrl(URL_A_OTHER_PATH)).toBe('tok');
	session.ClearRememberForUrl(URL_A);
	expect(session.GetRememberForUrl(URL_A)).toBeNull();
});

it('RememberKey distingue puertos', () => {
	expect(session.RememberKey(URL_A)).toBe('rememberToken_api.example.org');
	expect(session.RememberKey(URL_B)).toBe('rememberToken_api.example.org:8443');
});

describe('session: AddSession (headers de una solicitud)');

it('sin sesión ni token devuelve los parámetros sin crear headers', () => {
	setupBrowser();
	const params = { a: 1 };
	const result = session.AddSession(URL_A, params);
	expect(result).toBe(params);
	expect(result.headers).toBe(undefined);
});

it('agrega session-id y remember-token cuando existen', () => {
	setupBrowser();
	session.SetSessionForUrl(URL_A, 'abc');
	session.SetRememberForUrl(URL_A, 'tok');
	const result = session.AddSession(URL_A, {});
	expect(result.headers).toEqual({ 'session-id': 'abc', 'remember-token': 'tok' });
});

it('conserva los headers que la solicitud ya traía', () => {
	setupBrowser();
	session.SetSessionForUrl(URL_A, 'abc');
	const result = session.AddSession(URL_A, { headers: { Accept: 'json' } });
	expect(result.headers).toEqual({ Accept: 'json', 'session-id': 'abc' });
});

it('agrega solo el token cuando no hay sesión', () => {
	setupBrowser();
	session.SetRememberForUrl(URL_A, 'tok');
	const result = session.AddSession(URL_A, {});
	expect(result.headers).toEqual({ 'remember-token': 'tok' });
});
