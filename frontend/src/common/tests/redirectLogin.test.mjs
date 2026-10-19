import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import login from '@/common/js/redirectLogin';

describe('redirectLogin: mainHost');

it('devuelve window.mainHost', () => {
	setupBrowser();
	expect(login.mainHost()).toBe('https://main.example.org');
});

it('lanza un error claro si la configuración del servidor todavía no llegó', () => {
	const browser = setupBrowser();
	browser.window.mainHost = undefined;
	let message = null;
	try {
		login.mainHost();
	} catch (e) {
		message = e.message;
	}
	expect(message.startsWith('window.mainHost no está definido')).toBeTruthy();
});

describe('redirectLogin: URLs de ingreso y registro');

it('AppendParam usa ? o & según haya query y codifica el valor', () => {
	expect(login.AppendParam('http://a/b', 'to', 'x y')).toBe('http://a/b?to=x%20y');
	expect(login.AppendParam('http://a/b?q=1', 'to', 'x&y')).toBe('http://a/b?q=1&to=x%26y');
});

it('loginUrl vuelve a la ubicación actual por defecto y pide identificación (ask=1)', () => {
	setupBrowser();
	expect(login.loginUrl()).toBe('https://main.example.org/cr#?to=http%3A%2F%2Flocalhost%2Fapp%23%2Finicio&ask=1');
});

it('loginUrl con destino explícito usa ese destino', () => {
	setupBrowser();
	expect(login.loginUrl('http://otro.org/x')).toBe('https://main.example.org/cr#?to=http%3A%2F%2Fotro.org%2Fx&ask=1');
});

it('registerUrl apunta a /cr#/signup y vuelve a la ubicación actual', () => {
	setupBrowser();
	expect(login.registerUrl()).toBe('https://main.example.org/cr#/signup?to=http%3A%2F%2Flocalhost%2Fapp%23%2Finicio&ask=1');
});

describe('redirectLogin: redirecciones');

it('redirectLogin y redirectRegister asignan la URL correspondiente a document.location', () => {
	const browser = setupBrowser();
	login.redirectLogin();
	expect(browser.document.location).toBe(login.loginUrl.call(login, 'http://localhost/app#/inicio'));
	browser.document.location = 'http://localhost/app#/inicio';
	login.redirectRegister();
	expect(browser.document.location.startsWith('https://main.example.org/cr#/signup?to=')).toBeTruthy();
});

it('homeUrl usa HomePage de la configuración del mapa o "#" si no hay configuración', () => {
	const browser = setupBrowser();
	expect(login.homeUrl()).toBe('#');
	browser.window.SegMap = { Configuration: { HomePage: 'https://home.example.org' } };
	expect(login.homeUrl()).toBe('https://home.example.org');
});

it('redirectHome asigna homeUrl a document.location', () => {
	const browser = setupBrowser();
	browser.window.SegMap = { Configuration: { HomePage: 'https://home.example.org' } };
	login.redirectHome();
	expect(browser.document.location).toBe('https://home.example.org');
});
