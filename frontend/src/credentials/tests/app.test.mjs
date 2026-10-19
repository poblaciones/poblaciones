import { describe, it, expect } from './_harness.mjs';
import Vue from 'vue';
import err from '@/common/framework/err';
import App from '@/credentials/App.vue';
import { setupGlobals, mountLite, callHook, axios, serve, settle, quiet, captureUnhandled } from './fixtures.mjs';

describe('App: datos iniciales');

it('expone el Context global y no tiene usuario ni obras cargadas', () => {
	const env = setupGlobals();
	const vm = mountLite(App);
	expect(vm.user).toBeNull();
	expect(vm.works).toBeNull();
	expect(vm.context).toBe(env.context);
});

describe('App.RegisterErrorHandler');

it('instala el manejador de errores común en Vue y en window.onerror', () => {
	setupGlobals();
	Vue.resetConfig();
	const vm = mountLite(App);
	vm.RegisterErrorHandler();
	expect(Vue.config.errorHandler).toBe(err.HandleError);
	expect(window.onerror).toBe(err.HandleError);
});

describe('App.InitializePage');

it('consulta el servidor de transacciones, lo adopta como host y avisa que el servidor está cargado', async () => {
	const env = setupGlobals({ mainHost: undefined });
	serve({ 'GET /services/GetTransactionServer': { Server: 'http://tx.test' } });
	let hostAtNotification = null;
	env.messages.$on('serverLoaded', function () { hostAtNotification = window.host; });
	mountLite(App).InitializePage();
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].url).toBe('http://server.test/services/GetTransactionServer');
	expect(axios.calls[0].config.params).toEqual({});
	expect(window.mainHost).toBe('http://server.test');
	expect(window.host).toBe('http://tx.test');
	expect(hostAtNotification).toBe('http://tx.test');
	expect(env.messages.emitted).toEqual(['serverLoaded']);
	expect(env.context.ServerLoaded).toBe(true);
});

it('si la consulta falla no cambia el host ni marca el servidor como cargado (el rechazo queda sin manejar)', async () => {
	const env = setupGlobals();
	serve({ 'GET /services/GetTransactionServer': new Error('Network Error') });
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { mountLite(App).InitializePage(); });
	});
	expect(window.host).toBe('http://server.test');
	expect(env.context.ServerLoaded).toBe(false);
	expect(env.messages.emitted).toHaveLength(0);
	expect(reasons).toHaveLength(1);
	expect(reasons[0].message).toBe('Network Error');
});

describe('App.mounted');

it('registra el manejador de errores e inicia la página', async () => {
	const env = setupGlobals();
	Vue.resetConfig();
	serve({ 'GET /services/GetTransactionServer': { Server: 'http://tx.test' } });
	callHook(App, mountLite(App), 'mounted');
	await settle();
	expect(Vue.config.errorHandler).toBe(err.HandleError);
	expect(env.context.ServerLoaded).toBe(true);
});
