import { describe, it, expect } from './_harness.mjs';
import querystring from 'node:querystring';
import NewPassword from '@/credentials/views/NewPassword.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, quiet, captureUnhandled,
	makeWait, makeMessageBox,
} from './fixtures.mjs';

const GET_VALIDATE = 'GET /services/authentication/ValidateCode';
const POST_RESET = 'POST /services/authentication/ResetPassword';

function setup(options) {
	const opts = options || {};
	const env = setupGlobals({ serverLoaded: opts.serverLoaded });
	const wait = makeWait();
	const messagebox = makeMessageBox();
	const vm = mountLite(NewPassword, {
		route: { path: '/newPassword', query: opts.query || {} },
		refs: { wait, messagebox },
	});
	callHook(NewPassword, vm, 'created');
	return { env, vm, wait, messagebox };
}

const VALID_QUERY = { email: 'ana@mail.com', code: '123456' };

describe('NewPassword: datos iniciales');

it('parte en el paso 1 con el formulario limpio', () => {
	const { vm } = setup();
	expect(vm.step).toBe(1);
	expect(vm.password).toBe('');
	expect(vm.passwordCheck).toBe('');
	expect(vm.hasMessages).toBe(false);
	expect(vm.serverError).toBe('');
});

describe('NewPassword.mounted');

it('con un email inválido en la query avisa y no sigue (no lee el código ni consulta)', () => {
	for (const email of [undefined, '', 'sin-arroba']) {
		const { vm, messagebox, env } = setup({ query: { email, code: '123456' } });
		callHook(NewPassword, vm, 'mounted');
		expect(messagebox.messages).toEqual(['Debe ingresar un correo electrónico válido']);
		expect(vm.code).toBe('');
		expect(env.messages.listenerCount('serverLoaded')).toBe(0);
		expect(axios.calls).toHaveLength(0);
	}
});

it('con un código ausente o que no tiene exactamente 6 dígitos avisa y no consulta', () => {
	for (const code of [undefined, '', '12345', '1234567', 'abcdef']) {
		const { vm, messagebox } = setup({ query: { email: 'ana@mail.com', code } });
		callHook(NewPassword, vm, 'mounted');
		expect(messagebox.messages).toEqual(['Debe indicar el código.']);
		expect(axios.calls).toHaveLength(0);
	}
});

it('con parámetros válidos y el servidor ya cargado valida el código de inmediato', async () => {
	const { vm, messagebox } = setup({ serverLoaded: true, query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'OK' } });
	callHook(NewPassword, vm, 'mounted');
	await settle();
	expect(vm.email).toBe('ana@mail.com');
	expect(vm.code).toBe('123456');
	expect(axios.calls[0].config.params).toEqual({ u: 'ana@mail.com', c: '123456' });
	expect(messagebox.messages).toHaveLength(0);
});

it('con el servidor sin cargar espera el evento serverLoaded antes de validar', async () => {
	const { env, vm } = setup({ query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'OK' } });
	callHook(NewPassword, vm, 'mounted');
	expect(env.messages.listenerCount('serverLoaded')).toBe(1);
	expect(axios.calls).toHaveLength(0);
	env.messages.$emit('serverLoaded');
	await settle();
	expect(axios.calls).toHaveLength(1);
});

describe('NewPassword.validateCode');

it('si el servidor informa un error de código lo muestra', async () => {
	const { vm, messagebox } = setup({ serverLoaded: true, query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'ERROR', message: 'El código venció' } });
	callHook(NewPassword, vm, 'mounted');
	await settle();
	expect(messagebox.messages).toEqual(['El código venció']);
});

it('msgClosed vuelve a la raíz del sitio', () => {
	const { env, vm } = setup();
	vm.msgClosed();
	expect(env.document.location).toBe('/');
});

describe('NewPassword: validaciones');

it('la contraseña es obligatoria y exige al menos 6 caracteres', () => {
	const { vm } = setup();
	vm.password = '';
	expect(vm.$v.password.$invalid).toBe(true);
	vm.password = 'abcde';
	expect(vm.$v.password.$invalid).toBe(true);
	vm.password = 'abcdef';
	expect(vm.$v.password.$invalid).toBe(false);
});

it('la confirmación debe coincidir con la contraseña', () => {
	const { vm } = setup();
	vm.password = 'abcdef';
	vm.passwordCheck = 'abcdeg';
	expect(vm.$v.passwordCheck.$invalid).toBe(true);
	vm.passwordCheck = 'abcdef';
	expect(vm.$v.passwordCheck.$invalid).toBe(false);
});

describe('NewPassword.next');

it('con contraseña corta o confirmación distinta marca el error y no envía', () => {
	const cases = [['abc', 'abc'], ['abcdef', 'otra-clave']];
	cases.forEach(function (pair) {
		const { vm, wait } = setup({ query: VALID_QUERY });
		vm.password = pair[0];
		vm.passwordCheck = pair[1];
		vm.next();
		expect(vm.$v.$dirty).toBe(true);
		expect(vm.hasMessages).toBe(true);
		expect(wait.started).toBe(0);
		expect(axios.calls).toHaveLength(0);
	});
});

function readyToReset() {
	const ctx = setup({ serverLoaded: true, query: VALID_QUERY });
	serve({ [GET_VALIDATE]: { status: 'OK' } });
	callHook(NewPassword, ctx.vm, 'mounted');
	ctx.vm.password = 'abcdef';
	ctx.vm.passwordCheck = 'abcdef';
	return ctx;
}

it('restablece la contraseña con email y código de la query, y va a /users/', async () => {
	const { env, vm, wait } = readyToReset();
	axios.calls.length = 0;
	serve({ [POST_RESET]: { status: 'OK' } });
	vm.next();
	expect(wait.started).toBe(1);
	await settle();
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', p: 'abcdef', c: '123456' });
	expect(env.document.location).toBe('/users/');
	expect(wait.stopped).toBe(0);
});

it('borra el error anterior apenas inicia el intento', async () => {
	const { vm } = readyToReset();
	serve({ [POST_RESET]: { status: 'OK' } });
	vm.serverError = 'error viejo';
	vm.next();
	expect(vm.serverError).toBe('');
	await settle();
});

it('si el servidor rechaza el cambio muestra su mensaje, detiene la espera y no navega', async () => {
	const { env, vm, wait } = readyToReset();
	serve({ [POST_RESET]: { status: 'ERROR', message: 'Código inválido' } });
	vm.next();
	await settle();
	expect(vm.serverError).toBe('Código inválido');
	expect(wait.stopped).toBe(1);
	expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = readyToReset();
	serve({ [POST_RESET]: new Error('Network Error') });
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(reasons).toHaveLength(1);
});

it('en el paso 2 solo inicia la espera y va a /users/, sin llamar al servidor', () => {
	const { env, vm, wait } = readyToReset();
	axios.calls.length = 0;
	vm.step = 2;
	vm.next();
	expect(wait.started).toBe(1);
	expect(env.document.location).toBe('/users/');
	expect(axios.calls).toHaveLength(0);
});

describe('NewPassword: utilidades de la vista');

it('removedUser vuelve al paso 1 y clearError limpia el error del servidor', () => {
	const { vm } = setup();
	vm.step = 2;
	vm.serverError = 'x';
	vm.removedUser();
	expect(vm.step).toBe(1);
	vm.clearError();
	expect(vm.serverError).toBe('');
});

it('messageClass marca md-invalid solo si se pidió y hay mensajes o error del servidor', () => {
	const { vm } = setup();
	expect(vm.messageClass(true)['md-invalid']).toBeFalsy();
	vm.hasMessages = true;
	expect(vm.messageClass(true)['md-invalid']).toBeTruthy();
	expect(vm.messageClass()['md-invalid']).toBeFalsy();
});
