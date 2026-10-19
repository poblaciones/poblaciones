import { describe, it, expect } from './_harness.mjs';
import session from '@/common/framework/session';
import OpenAuth from '@/credentials/views/OpenAuth.vue';
import { setupGlobals, mountLite, callHook } from './fixtures.mjs';

const LOGIN_URL = 'http://server.test';

function makeForm() {
	const form = { action: '', submitted: 0 };
	form.submit = function () { form.submitted++; };
	return form;
}

function setup(options) {
	const opts = options || {};
	const env = setupGlobals({ mainHost: 'http://main.test' });
	const form = makeForm();
	const vm = mountLite(OpenAuth, {
		props: opts.props,
		route: { path: '/signin', query: opts.query || {} },
		refs: { theForm: form },
	});
	return { env, vm, form };
}

function validEvent(win, overrides) {
	return Object.assign({
		source: win,
		origin: 'http://server.test',
		data: { type: 'oauthLogin', sessionId: 'sess-1', rememberToken: 'rem-1' },
	}, overrides || {});
}

describe('OpenAuth.target');

it('sin destino en la query vuelve al backoffice del host principal', () => {
	expect(setup().vm.target).toBe('http://main.test/users/#/');
});

it('con destino en la query usa ese destino', () => {
	expect(setup({ query: { to: 'http://main.test/map/' } }).vm.target).toBe('http://main.test/map/');
});

describe('OpenAuth: ciclo de vida');

it('escucha los mensajes de la ventana al montarse y deja de hacerlo al destruirse', () => {
	const { env, vm } = setup();
	callHook(OpenAuth, vm, 'mounted');
	callHook(OpenAuth, vm, 'beforeDestroy');
	expect(env.listeners).toEqual([
		{ action: 'add', name: 'message', fn: vm.receiveMessage },
		{ action: 'remove', name: 'message', fn: vm.receiveMessage },
	]);
});

describe('OpenAuth.receiveMessage');

it('con un mensaje válido guarda la sesión y el token de recordar, y navega al destino', () => {
	const { env, vm } = setup();
	const win = {};
	vm.keepWindow = win;
	vm.receiveMessage(validEvent(win));
	expect(session.GetSessionForUrl(LOGIN_URL)).toBe('sess-1');
	expect(session.GetRememberForUrl(LOGIN_URL)).toBe('rem-1');
	expect(env.document.location).toBe('http://main.test/users/#/');
});

it('sin token de recordar guarda solo la sesión', () => {
	const { vm } = setup();
	const win = {};
	vm.keepWindow = win;
	vm.receiveMessage(validEvent(win, { data: { type: 'oauthLogin', sessionId: 'sess-1' } }));
	expect(session.GetSessionForUrl(LOGIN_URL)).toBe('sess-1');
	expect(session.GetRememberForUrl(LOGIN_URL)).toBeNull();
});

it('navega al destino indicado en la query', () => {
	const { env, vm } = setup({ query: { to: 'http://main.test/map/' } });
	const win = {};
	vm.keepWindow = win;
	vm.receiveMessage(validEvent(win));
	expect(env.document.location).toBe('http://main.test/map/');
});

it('ignora los mensajes que no provienen de la ventana abierta, del origen del servidor o con datos incompletos', () => {
	const win = {};
	const cases = {
		'otra ventana': { source: {} },
		'otro origen': { origin: 'http://otro.test' },
		'sin datos': { data: null },
		'tipo distinto': { data: { type: 'otro', sessionId: 's' } },
		'sin sessionId': { data: { type: 'oauthLogin' } },
		'sessionId vacío': { data: { type: 'oauthLogin', sessionId: '' } },
	};
	Object.keys(cases).forEach(function (name) {
		const { env, vm } = setup();
		vm.keepWindow = win;
		vm.receiveMessage(validEvent(win, cases[name]));
		expect(env.storage.dump()).toEqual({});
		expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
	});
});

it('ignora todo mensaje si todavía no se abrió ninguna ventana y la fuente es otra', () => {
	const { env, vm } = setup();
	vm.receiveMessage(validEvent({}));
	expect(env.storage.dump()).toEqual({});
});

describe('OpenAuth.show');

it('exigiendo términos sin haberlos aceptado avisa y no abre nada', () => {
	const { env, vm, form } = setup({ props: { terms: false } });
	vm.show('http://server.test/oauthGoogle', true);
	expect(env.alerts).toEqual(["Debe aceptar los 'Términos y condiciones' para poder continuar."]);
	expect(env.opened).toHaveLength(0);
	expect(form.submitted).toBe(0);
	expect(form.action).toBe('');
});

it('abre la ventana de autenticación y envía el formulario a la URL indicada', () => {
	const { env, vm, form } = setup({ props: { terms: true } });
	vm.show('http://server.test/oauthGoogle', true);
	expect(form.action).toBe('http://server.test/oauthGoogle');
	expect(env.opened).toHaveLength(1);
	expect(env.opened[0].url).toBe('about:blank');
	expect(env.opened[0].name).toBe('openAuthWin');
	expect(env.opened[0].features.includes('width=600')).toBeTruthy();
	expect(env.opened[0].features.includes('height=450')).toBeTruthy();
	expect(vm.keepWindow).toBe(env.opened[0]);
	expect(form.submitted).toBe(1);
});

it('sin exigir términos abre la ventana aunque no estén aceptados', () => {
	const { env, vm, form } = setup({ props: { terms: false } });
	vm.show('http://server.test/oauthFacebook');
	expect(env.alerts).toHaveLength(0);
	expect(env.opened).toHaveLength(1);
	expect(form.submitted).toBe(1);
});

it('cierra la ventana anterior antes de abrir una nueva', () => {
	const { env, vm } = setup();
	const previous = { closed: false, close() { previous.closed = true; } };
	vm.keepWindow = previous;
	vm.show('http://server.test/oauthGoogle');
	expect(previous.closed).toBe(true);
	expect(vm.keepWindow).toBe(env.opened[0]);
});
