import { describe, it, expect } from './_harness.mjs';
import Vue from 'vue';
import err from '@/common/framework/err';
import session from '@/common/framework/session';
import App from '@/admins/App.vue';
import { setupGlobals, mountLite, callHook, axios, serve, settle } from './fixtures.mjs';

const CONFIG_URL = 'http://tx.test/services/backoffice/GetConfiguration';
const FACTORIES_URL = 'http://tx.test/services/backoffice/GetFactories';

describe('App: datos iniciales');

it('parte sin usuario ni obras, con el menú de cartografías y el Context global', () => {
	const env = setupGlobals();
	const vm = mountLite(App);
	expect(vm.user).toBeNull();
	expect(vm.works).toBeNull();
	expect(vm.menu).toEqual([{ caption: 'Cartografías', link: 'cartographies' }]);
	expect(vm.context).toBe(env.context);
});

describe('App.RegisterErrorHandler');

it('instala el manejador de errores común en Vue y en window.onerror', () => {
	setupGlobals();
	Vue.resetConfig();
	mountLite(App).RegisterErrorHandler();
	expect(Vue.config.errorHandler).toBe(err.HandleError);
	expect(window.onerror).toBe(err.HandleError);
});

describe('App.LoadData');

it('inicia la sesión: guarda usuario y configuración y refresca el catálogo de fábricas', async () => {
	const env = setupGlobals();
	const vm = mountLite(App);
	serve({ 'GET /services/backoffice/GetFactories': { User: {} } });
	const data = { User: { Privileges: 'A', Logged: true }, Other: 1 };
	vm.LoadData(data);
	await settle();
	expect(vm.user).toBe(data.User);
	expect(env.context.User).toBe(data.User);
	expect(env.context.Configuration).toBe(data);
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].url).toBe('http://server.test/services/backoffice/GetFactories');
	expect(env.context.Factory.hasData).toBe(true);
});

describe('App.InitializePage');

it('con una sesión activa adopta el servidor de transacciones y carga el usuario', async () => {
	const env = setupGlobals();
	serve({
		'GET /services/backoffice/GetTransactionServer': { Server: 'http://tx.test' },
		['GET ' + CONFIG_URL]: { User: { Logged: true, Privileges: 'E' } },
		['GET ' + FACTORIES_URL]: {},
	});
	const vm = mountLite(App);
	vm.InitializePage();
	await settle();
	expect(window.mainHost).toBe('http://server.test');
	expect(window.host).toBe('http://tx.test');
	expect(vm.user).toEqual({ Logged: true, Privileges: 'E' });
	expect(env.context.User.Privileges).toBe('E');
	expect(env.context.Configuration.DynamicServer).toBe('http://tx.test');
	expect(env.context.Factory.url).toBe(FACTORIES_URL);
	expect(axios.calls[axios.calls.length - 1].url).toBe(FACTORIES_URL);
});

it('sin sesión activa limpia el token recordado y redirige al ingreso sin cargar usuario', async () => {
	const env = setupGlobals();
	session.SetRememberForUrl('http://tx.test', 'tok');
	serve({
		'GET /services/backoffice/GetTransactionServer': { Server: 'http://tx.test' },
		['GET ' + CONFIG_URL]: { User: { Logged: false } },
	});
	const vm = mountLite(App);
	vm.InitializePage();
	await settle();
	expect(vm.user).toBeNull();
	expect(session.GetRememberForUrl('http://tx.test')).toBeNull();
	expect(typeof env.document.location).toBe('string');
	expect(env.document.location.startsWith('http://server.test/cr#?to=')).toBeTruthy();
	expect(env.document.location.endsWith('&ask=1')).toBeTruthy();
});

describe('App.mounted');

it('registra el manejador de errores e inicia la página', async () => {
	setupGlobals();
	Vue.resetConfig();
	serve({
		'GET /services/backoffice/GetTransactionServer': { Server: 'http://tx.test' },
		['GET ' + CONFIG_URL]: { User: { Logged: true, Privileges: 'A' } },
		['GET ' + FACTORIES_URL]: {},
	});
	const vm = mountLite(App);
	callHook(App, vm, 'mounted');
	await settle();
	expect(Vue.config.errorHandler).toBe(err.HandleError);
	expect(vm.user.Privileges).toBe('A');
});
