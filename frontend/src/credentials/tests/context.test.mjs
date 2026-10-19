import { describe, it, expect } from './_harness.mjs';
import querystring from 'node:querystring';
import Vue from 'vue';
import Vuex from 'vuex';
import { setupGlobals, axios, serve, quiet } from './fixtures.mjs';
import session from '@/common/framework/session';
import Context from '@/credentials/classes/Context';

const SERVICES = '/services/authentication/';

describe('Context: estado inicial');

it('no tiene usuario y el contador de errores parte en cero', () => {
	const context = new Context();
	expect(context.User).toBeNull();
	expect(context.ErrorSignaled).toEqual({ value: 0 });
});

describe('Context.CreateStore');

it('instala Vuex en Vue y devuelve un store sin módulos', () => {
	setupGlobals();
	const installed = Vue.uses.length;
	const store = new Context().CreateStore();
	expect(Vue.uses.slice(installed)).toEqual([Vuex]);
	expect(store instanceof Vuex.Store).toBeTruthy();
	expect(store.options).toEqual({ modules: {} });
});

describe('Context: solicitudes de lectura (GET)');

it('AccountExists envía usuario y condición de actividad, y devuelve el cuerpo', async () => {
	const env = setupGlobals();
	serve({ ['GET ' + SERVICES + 'AccountExists']: { status: 'OK' } });
	const data = await env.context.AccountExists('ana@mail.com', true);
	expect(data).toEqual({ status: 'OK' });
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].method).toBe('get');
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'AccountExists');
	expect(axios.calls[0].config.params).toEqual({ u: 'ana@mail.com', active: true });
});

it('ValidateCode envía usuario y código', async () => {
	const env = setupGlobals();
	serve({ ['GET ' + SERVICES + 'ValidateCode']: { status: 'OK', type: 'P' } });
	const data = await env.context.ValidateCode('ana@mail.com', '123456');
	expect(data).toEqual({ status: 'OK', type: 'P' });
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'ValidateCode');
	expect(axios.calls[0].config.params).toEqual({ u: 'ana@mail.com', c: '123456' });
});

describe('Context: solicitudes de escritura (POST)');

it('BeginRecover envía el usuario y la URL de retorno basada en mainHost', async () => {
	const env = setupGlobals({ mainHost: 'http://main.test' });
	serve({ ['POST ' + SERVICES + 'BeginResetPassword']: { status: 'OK' } });
	await env.context.BeginRecover('ana@mail.com');
	expect(axios.calls[0].method).toBe('post');
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'BeginResetPassword');
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', t: 'http://main.test/users/' });
});

it('ResetPassword envía usuario, contraseña y código', async () => {
	const env = setupGlobals();
	serve({ ['POST ' + SERVICES + 'ResetPassword']: { status: 'OK' } });
	await env.context.ResetPassword('ana@mail.com', '123456', 'secreta');
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'ResetPassword');
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', p: 'secreta', c: '123456' });
});

it('Activate envía todos los datos de la cuenta', async () => {
	const env = setupGlobals();
	serve({ ['POST ' + SERVICES + 'Activate']: { status: 'OK' } });
	await env.context.Activate('ana@mail.com', 'secreta', 'Ana', 'Paz', '123456', 'A');
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'Activate');
	expect(querystring.parse(axios.calls[0].body)).toEqual({
		f: 'Ana', l: 'Paz', u: 'ana@mail.com', p: 'secreta', c: '123456', t: 'A',
	});
});

describe('Context.Login / Context.Register');

it('Login envía usuario y contraseña, y devuelve el cuerpo', async () => {
	const env = setupGlobals();
	serve({ ['POST ' + SERVICES + 'Login']: { status: 'OK' } });
	const data = await env.context.Login('ana@mail.com', 'secreta');
	expect(data).toEqual({ status: 'OK' });
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', p: 'secreta' });
});

it('Login guarda el token de recordar sesión asociado a la URL del servicio', async () => {
	const env = setupGlobals();
	const url = 'http://server.test' + SERVICES + 'Login';
	serve({ ['POST ' + SERVICES + 'Login']: { status: 'OK', remember: 'tok-1' } });
	await env.context.Login('ana@mail.com', 'secreta');
	expect(session.GetRememberForUrl(url)).toBe('tok-1');
});

it('Login no guarda token si el servidor no lo envía', async () => {
	const env = setupGlobals();
	const url = 'http://server.test' + SERVICES + 'Login';
	serve({ ['POST ' + SERVICES + 'Login']: { status: 'ERROR', message: 'x' } });
	await env.context.Login('ana@mail.com', 'secreta');
	expect(session.GetRememberForUrl(url)).toBeNull();
});

it('Register envía el usuario y la URL de retorno, y guarda el token si llega', async () => {
	const env = setupGlobals({ mainHost: 'http://main.test' });
	const url = 'http://server.test' + SERVICES + 'BeginActivation';
	serve({ ['POST ' + SERVICES + 'BeginActivation']: { status: 'OK', remember: 'tok-2' } });
	const data = await env.context.Register('ana@mail.com');
	expect(data).toEqual({ status: 'OK', remember: 'tok-2' });
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', t: 'http://main.test/users/' });
	expect(session.GetRememberForUrl(url)).toBe('tok-2');
});

describe('Context: fallas de red');

it('una solicitud fallida rechaza con el error original y avisa la acción intentada', async () => {
	const env = setupGlobals();
	const failure = new Error('Network Error');
	serve({ ['GET ' + SERVICES + 'AccountExists']: failure });
	let caught = null;
	await quiet(async function () {
		try {
			await env.context.AccountExists('ana@mail.com', true);
		} catch (e) {
			caught = e;
		}
	});
	expect(caught).toBe(failure);
	expect(env.alerts).toHaveLength(1);
	expect(env.alerts[0].startsWith('No fue posible validar la cuenta.')).toBeTruthy();
});

it('Login fallido no guarda token y propaga el rechazo', async () => {
	const env = setupGlobals();
	const url = 'http://server.test' + SERVICES + 'Login';
	serve({ ['POST ' + SERVICES + 'Login']: new Error('Network Error') });
	let rejected = false;
	await quiet(async function () {
		try {
			await env.context.Login('ana@mail.com', 'secreta');
		} catch (e) {
			rejected = true;
		}
	});
	expect(rejected).toBeTruthy();
	expect(session.GetRememberForUrl(url)).toBeNull();
});
