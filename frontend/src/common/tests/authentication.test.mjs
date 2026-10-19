import { describe, it, expect } from './_harness.mjs';
import { setupBrowser, flushPromises } from './fixtures.mjs';
import axios from './_stubs/axios.cjs';
import authentication from '@/common/js/authentication';
import session from '@/common/framework/session';

const OLD_HOST = 'https://main.example.org';
const SERVER = 'https://server.example.org';

function setup() {
	axios.reset();
	const browser = setupBrowser();
	browser.window.host = OLD_HOST;
	browser.initializeCalls = 0;
	browser.window.Context = { Initialize() { browser.initializeCalls++; } };
	return browser;
}

function respondToConfiguration(configuration) {
	const results = {};
	results[OLD_HOST + '/services/backoffice/GetTransactionServer'] = { data: { Server: SERVER } };
	results[SERVER + '/services/backoffice/GetConfiguration'] = { data: configuration };
	axios.respondByUrl('get', results);
}

describe('authentication: loadHeaderBar');

it('con usuario identificado: pasa al servidor dinámico, inicializa el contexto y entrega la configuración', async () => {
	const browser = setup();
	respondToConfiguration({ User: { Logged: true } });
	const received = [];
	authentication.loadHeaderBar(function (configuration) { received.push(configuration); });
	await flushPromises();
	expect(browser.window.mainHost).toBe(OLD_HOST);
	expect(browser.window.host).toBe(SERVER);
	expect(browser.initializeCalls).toBe(1);
	expect(received).toHaveLength(1);
	expect(received[0].DynamicServer).toBe(SERVER);
});

it('con usuario no identificado: borra el token de recordar y redirige al ingreso, sin llamar al setter', async () => {
	const browser = setup();
	session.SetRememberForUrl(SERVER, 'tok');
	respondToConfiguration({ User: { Logged: false } });
	let setterCalls = 0;
	authentication.loadHeaderBar(function () { setterCalls++; });
	await flushPromises();
	expect(setterCalls).toBe(0);
	expect(session.GetRememberForUrl(SERVER)).toBeNull();
	expect(browser.document.location.startsWith(OLD_HOST + '/cr#')).toBeTruthy();
});

describe('authentication: URLs y redirecciones');

it('backofficeUrl y redirectBackoffice usan el host principal más /users', () => {
	const browser = setup();
	expect(authentication.backofficeUrl()).toBe(OLD_HOST + '/users');
	browser.window.mainHost = 'https://principal.example.org';
	authentication.redirectBackoffice();
	expect(browser.document.location).toBe('https://principal.example.org/users');
});

it('redirectAdmin usa el host principal más /admins', () => {
	const browser = setup();
	authentication.redirectAdmin();
	expect(browser.document.location).toBe(OLD_HOST + '/admins');
});

it('loginUrl, registerUrl y homeUrl delegan en redirectLogin', () => {
	const browser = setup();
	browser.window.SegMap = { Configuration: { HomePage: 'https://home.example.org' } };
	expect(authentication.loginUrl('http://destino.org')).toBe(OLD_HOST + '/cr#?to=http%3A%2F%2Fdestino.org&ask=1');
	expect(authentication.registerUrl().startsWith(OLD_HOST + '/cr#/signup?to=')).toBeTruthy();
	expect(authentication.homeUrl()).toBe('https://home.example.org');
});

it('redirectLogin, redirectRegister y redirectHome cambian document.location', () => {
	const browser = setup();
	browser.window.SegMap = { Configuration: { HomePage: 'https://home.example.org' } };
	authentication.redirectLogin();
	expect(browser.document.location.startsWith(OLD_HOST + '/cr#?to=')).toBeTruthy();
	authentication.redirectRegister();
	expect(browser.document.location.startsWith(OLD_HOST + '/cr#/signup?to=')).toBeTruthy();
	authentication.redirectHome();
	expect(browser.document.location).toBe('https://home.example.org');
});

describe('authentication: logoff');

it('pide el cierre de sesión, borra el token de recordar y navega a la página que indica el servidor', async () => {
	const browser = setup();
	const logoffUrl = OLD_HOST + '/authenticate/logoff';
	session.SetRememberForUrl(logoffUrl, 'tok');
	axios.respond('post', { data: 'https://home.example.org' });
	authentication.logoff();
	await flushPromises();
	expect(axios.calls[0].url).toBe(logoffUrl);
	expect(session.GetRememberForUrl(logoffUrl)).toBeNull();
	expect(browser.document.location).toBe('https://home.example.org');
});
