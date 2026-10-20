import { describe, it, expect } from './_harness.mjs';
import querystring from 'node:querystring';
import tokenTypeEnum from '@/common/enums/tokenTypeEnum';
import Activate from '@/credentials/views/Activate.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, quiet, captureUnhandled,
	makeWait, makeMessageBox,
} from './fixtures.mjs';

const GET_VALIDATE = 'GET /services/authentication/ValidateCode';
const GET_EXISTS = 'GET /services/authentication/AccountExists';
const POST_ACTIVATE = 'POST /services/authentication/Activate';
const VALID_QUERY = { email: 'ana@mail.com', code: '123456' };

function setup(options) {
	const opts = options || {};
	const env = setupGlobals({ serverLoaded: opts.serverLoaded });
	const wait = makeWait();
	const messagebox = makeMessageBox();
	const nombre = { focused: 0, $el: { focus() { nombre.focused++; } } };
	const vm = mountLite(Activate, {
		route: { path: '/activate', query: opts.query || {} },
		refs: { wait, messagebox, nombre },
	});
	return { env, vm, wait, messagebox, nombre };
}

describe('Activate: datos iniciales');

it('parte con el formulario vacío y sin mensajes', () => {
	const { vm } = setup();
	expect(vm.firstname).toBe('');
	expect(vm.lastname).toBe('');
	expect(vm.email).toBe('');
	expect(vm.code).toBe('');
	expect(vm.type).toBe('');
	expect(vm.password).toBe('');
	expect(vm.passwordCheck).toBe('');
	expect(vm.hasMessages).toBe(false);
	expect(vm.serverError).toBe('');
});

describe('Activate.mounted');

it('toma email y código de la query y enfoca el campo nombre a los 250 ms', () => {
	const { env, vm, nombre } = setup({ query: VALID_QUERY });
	callHook(Activate, vm, 'mounted');
	expect(vm.email).toBe('ana@mail.com');
	expect(vm.code).toBe('123456');
	expect(env.timers.pending).toHaveLength(1);
	expect(env.timers.pending[0].ms).toBe(250);
	expect(nombre.focused).toBe(0);
	env.timers.flush();
	expect(nombre.focused).toBe(1);
});

it('con el servidor sin cargar espera el evento serverLoaded antes de validar el código', async () => {
	const { env, vm } = setup({ query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'ERROR', message: 'x' } });
	callHook(Activate, vm, 'mounted');
	expect(env.messages.listenerCount('serverLoaded')).toBe(1);
	expect(axios.calls).toHaveLength(0);
	env.messages.$emit('serverLoaded');
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(axios.calls[0].config.params).toEqual({ u: 'ana@mail.com', c: '123456' });
});

it('con el servidor ya cargado valida el código de inmediato', async () => {
	const { env, vm } = setup({ serverLoaded: true, query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'ERROR', message: 'x' } });
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(env.messages.listenerCount('serverLoaded')).toBe(0);
	expect(axios.calls).toHaveLength(1);
});

it('con un email inválido avisa; con un código mal formado avisa que debe indicarlo', () => {
	const a = setup({ query: { email: 'sin-arroba', code: '123456' } });
	callHook(Activate, a.vm, 'mounted');
	expect(a.messagebox.messages).toEqual(['Debe ingresar un correo electrónico válido']);
	const b = setup({ query: { email: 'ana@mail.com', code: '12ab' } });
	callHook(Activate, b.vm, 'mounted');
	expect(b.messagebox.messages).toEqual(['Debe indicar el código.']);
});

it('con parámetros inválidos avisa solo del primer problema y no consulta al servidor ni espera su carga', async () => {
	const { env, vm, messagebox } = setup({ serverLoaded: true, query: { email: 'sin-arroba', code: '12ab' } });
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(messagebox.messages).toEqual(['Debe ingresar un correo electrónico válido']);
	expect(axios.calls).toHaveLength(0);
	const pending = setup({ query: { email: 'ana@mail.com', code: '12ab' } });
	callHook(Activate, pending.vm, 'mounted');
	expect(pending.messagebox.messages).toEqual(['Debe indicar el código.']);
	expect(pending.env.messages.listenerCount('serverLoaded')).toBe(0);
	expect(env.messages.listenerCount('serverLoaded')).toBe(0);
});

describe('Activate.validateCode');

function mounted(query) {
	const ctx = setup({ serverLoaded: true, query: query || VALID_QUERY });
	return ctx;
}

it('si el servidor informa un error de código lo muestra y no consulta la cuenta', async () => {
	const { vm, messagebox } = mounted();
	serve({ [GET_VALIDATE]: { status: 'ERROR', message: 'El código venció' } });
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(messagebox.messages).toEqual(['El código venció']);
	expect(axios.calls).toHaveLength(1);
});

it('con un código de activación guarda el tipo y no consulta la cuenta', async () => {
	const { vm } = mounted();
	serve({ [GET_VALIDATE]: { status: 'OK', type: tokenTypeEnum.Activation } });
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(vm.type).toBe(tokenTypeEnum.Activation);
	expect(axios.calls).toHaveLength(1);
});

it('con un permiso sobre una cuenta ya iniciada va directo a /users/', async () => {
	const { env, vm } = mounted();
	serve({
		[GET_VALIDATE]: { status: 'OK', type: tokenTypeEnum.Permission },
		[GET_EXISTS]: { status: 'OK', loggedNow: true },
	});
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(axios.calls[1].config.params).toEqual({ u: 'ana@mail.com', active: true });
	expect(env.document.location).toBe('/users/');
});

it('con un permiso sobre una cuenta sin sesión lleva al ingreso conservando email y código', async () => {
	const { env, vm } = mounted();
	serve({
		[GET_VALIDATE]: { status: 'OK', type: tokenTypeEnum.Permission },
		[GET_EXISTS]: { status: 'OK', loggedNow: false },
	});
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(vm.$router.pushed).toEqual([{ path: '/signin', query: { email: 'ana@mail.com', code: '123456' } }]);
	expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
});

it('con un permiso sobre una cuenta que no existe no navega', async () => {
	const { env, vm } = mounted();
	serve({
		[GET_VALIDATE]: { status: 'OK', type: tokenTypeEnum.Permission },
		[GET_EXISTS]: { status: 'ERROR', message: 'x' },
	});
	callHook(Activate, vm, 'mounted');
	await settle();
	expect(vm.$router.pushed).toHaveLength(0);
	expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
});

describe('Activate: validaciones');

it('nombre y apellido son obligatorios', () => {
	const { vm } = setup();
	expect(vm.$v.firstname.$invalid).toBe(true);
	expect(vm.$v.lastname.$invalid).toBe(true);
	vm.firstname = 'Ana';
	vm.lastname = 'Paz';
	expect(vm.$v.firstname.$invalid).toBe(false);
	expect(vm.$v.lastname.$invalid).toBe(false);
});

it('la contraseña exige 6 caracteres y la confirmación debe coincidir', () => {
	const { vm } = setup();
	vm.password = 'abcde';
	expect(vm.$v.password.$invalid).toBe(true);
	vm.password = 'abcdef';
	expect(vm.$v.password.$invalid).toBe(false);
	vm.passwordCheck = 'otra';
	expect(vm.$v.passwordCheck.$invalid).toBe(true);
	vm.passwordCheck = 'abcdef';
	expect(vm.$v.passwordCheck.$invalid).toBe(false);
});

describe('Activate.next');

function filled() {
	const ctx = setup({ query: VALID_QUERY });
	Object.assign(ctx.vm, {
		firstname: 'Ana', lastname: 'Paz', email: 'ana@mail.com', code: '123456',
		type: tokenTypeEnum.Activation, password: 'abcdef', passwordCheck: 'abcdef',
	});
	return ctx;
}

it('con datos incompletos marca el error y no activa', () => {
	const { vm, wait } = filled();
	vm.lastname = '';
	vm.next();
	expect(vm.$v.$dirty).toBe(true);
	expect(vm.hasMessages).toBe(true);
	expect(wait.started).toBe(0);
	expect(axios.calls).toHaveLength(0);
});

it('activa la cuenta con todos los datos y, sin destino del servidor, va a /users/', async () => {
	const { env, vm, wait } = filled();
	serve({ [POST_ACTIVATE]: { status: 'OK' } });
	vm.next();
	expect(wait.started).toBe(1);
	await settle();
	expect(querystring.parse(axios.calls[0].body)).toEqual({
		f: 'Ana', l: 'Paz', u: 'ana@mail.com', p: 'abcdef', c: '123456', t: tokenTypeEnum.Activation,
	});
	expect(wait.stopped).toBe(1);
	expect(env.document.location).toBe('/users/');
});

it('si el servidor indica un destino navega hacia él', async () => {
	const { env, vm } = filled();
	serve({ [POST_ACTIVATE]: { status: 'OK', target: 'http://main.test/map/' } });
	vm.next();
	await settle();
	expect(env.document.location).toBe('http://main.test/map/');
});

it('borra el error anterior apenas inicia el intento', async () => {
	const { vm } = filled();
	serve({ [POST_ACTIVATE]: { status: 'OK' } });
	vm.serverError = 'error viejo';
	vm.next();
	expect(vm.serverError).toBe('');
	await settle();
});

it('si el servidor rechaza la activación muestra su mensaje, detiene la espera y no navega', async () => {
	const { env, vm, wait } = filled();
	serve({ [POST_ACTIVATE]: { status: 'ERROR', message: 'Código vencido' } });
	vm.next();
	await settle();
	expect(vm.serverError).toBe('Código vencido');
	expect(wait.stopped).toBe(1);
	expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = filled();
	serve({ [POST_ACTIVATE]: new Error('Network Error') });
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(reasons).toHaveLength(1);
});

describe('Activate: utilidades de la vista');

it('msgClosed vuelve a la raíz del sitio', () => {
	const { env, vm } = setup();
	vm.msgClosed();
	expect(env.document.location).toBe('/');
});

it('clearError limpia el error y messageClass refleja mensajes o error del servidor', () => {
	const { vm } = setup();
	vm.serverError = 'x';
	expect(vm.messageClass(true)['md-invalid']).toBeTruthy();
	vm.clearError();
	expect(vm.serverError).toBe('');
	expect(vm.messageClass(true)['md-invalid']).toBeFalsy();
	expect(vm.messageClass()['md-invalid']).toBeFalsy();
});
