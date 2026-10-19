import { describe, it, expect } from './_harness.mjs';
import session from '@/common/framework/session';
import Login from '@/credentials/views/Login.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, quiet, captureUnhandled,
	makeWait, makeOpenAuth,
} from './fixtures.mjs';

const SERVICES = '/services/authentication/';
const GET_EXISTS = 'GET ' + SERVICES + 'AccountExists';
const GET_VALIDATE = 'GET ' + SERVICES + 'ValidateCode';
const POST_LOGIN = 'POST ' + SERVICES + 'Login';

function setup(options) {
	const opts = options || {};
	const env = setupGlobals({ serverLoaded: opts.serverLoaded });
	const wait = makeWait();
	const openAuth = makeOpenAuth();
	const vm = mountLite(Login, {
		route: { path: '/signin', query: opts.query || {} },
		refs: { wait, openAuth },
	});
	return { env, vm, wait, openAuth };
}

function paramsOf(call) {
	return call.config.params;
}

describe('Login: datos iniciales');

it('parte en el paso 1 sin mensajes ni credenciales', () => {
	const { vm } = setup();
	expect(vm.step).toBe(1);
	expect(vm.hasMessages).toBe(false);
	expect(vm.email).toBe('');
	expect(vm.password).toBe('');
	expect(vm.serverError).toBe('');
});

it('no ofrece ingreso con Facebook', () => {
	expect(setup().vm.useFacebook).toBe(false);
});

describe('Login.created');

it('toma el email de la query y, si el servidor aún no cargó, espera el evento serverLoaded sin consultar', () => {
	const { env, vm } = setup({ query: { email: 'ana@mail.com', code: '123456' } });
	callHook(Login, vm, 'created');
	expect(vm.step).toBe(1);
	expect(vm.email).toBe('ana@mail.com');
	expect(env.messages.listenerCount('serverLoaded')).toBe(1);
	expect(axios.calls).toHaveLength(0);
});

it('al llegar serverLoaded valida el email recibido por query', async () => {
	const { env, vm } = setup({ query: { email: 'ana@mail.com', code: '123456' } });
	serve({ [GET_EXISTS]: { status: 'OK' }, [GET_VALIDATE]: { status: 'OK' } });
	callHook(Login, vm, 'created');
	env.messages.$emit('serverLoaded');
	await settle();
	expect(axios.calls).toHaveLength(2);
	expect(vm.step).toBe(2);
});

it('si el servidor ya cargó valida de inmediato y no se suscribe al evento', async () => {
	const { env, vm } = setup({ serverLoaded: true, query: { email: 'ana@mail.com', code: '123456' } });
	serve({ [GET_EXISTS]: { status: 'OK' }, [GET_VALIDATE]: { status: 'OK' } });
	callHook(Login, vm, 'created');
	await settle();
	expect(env.messages.listenerCount('serverLoaded')).toBe(0);
	expect(vm.step).toBe(2);
});

describe('Login.validateEmail');

it('sin email no consulta', async () => {
	const { vm } = setup({ query: { code: '123456' } });
	callHook(Login, vm, 'created');
	vm.validateEmail();
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('con un email inválido no consulta', async () => {
	const { vm } = setup({ query: { email: 'no-es-un-email', code: '123456' } });
	callHook(Login, vm, 'created');
	vm.validateEmail();
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('con un código ausente o que no tiene exactamente 6 dígitos no consulta', async () => {
	for (const code of [undefined, '', '12345', '1234567', 'abcdef', '12 456']) {
		const { vm } = setup({ query: { email: 'ana@mail.com', code } });
		callHook(Login, vm, 'created');
		vm.validateEmail();
		await settle();
		expect(axios.calls).toHaveLength(0);
	}
});

it('consulta la cuenta activa y valida el código, y pasa al paso 2', async () => {
	const { vm } = setup({ query: { email: 'ana@mail.com', code: '123456' } });
	serve({ [GET_EXISTS]: { status: 'OK' }, [GET_VALIDATE]: { status: 'OK' } });
	callHook(Login, vm, 'created');
	vm.validateEmail();
	await settle();
	expect(paramsOf(axios.calls[0])).toEqual({ u: 'ana@mail.com', active: true });
	expect(paramsOf(axios.calls[1])).toEqual({ u: 'ana@mail.com', c: '123456' });
	expect(vm.step).toBe(2);
});

it('si la cuenta no existe no valida el código ni avanza', async () => {
	const { vm } = setup({ query: { email: 'ana@mail.com', code: '123456' } });
	serve({ [GET_EXISTS]: { status: 'ERROR', message: 'No existe' } });
	callHook(Login, vm, 'created');
	vm.validateEmail();
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(vm.step).toBe(1);
});

it('si el código no es válido no avanza', async () => {
	const { vm } = setup({ query: { email: 'ana@mail.com', code: '123456' } });
	serve({ [GET_EXISTS]: { status: 'OK' }, [GET_VALIDATE]: { status: 'ERROR' } });
	callHook(Login, vm, 'created');
	vm.validateEmail();
	await settle();
	expect(axios.calls).toHaveLength(2);
	expect(vm.step).toBe(1);
});

describe('Login.next: paso 1 (email)');

it('con el email vacío o inválido marca el error, toca el formulario y no consulta', () => {
	for (const email of ['', undefined, 'sin-arroba', 'a@b']) {
		const { vm, wait } = setup();
		vm.email = email;
		vm.next();
		expect(vm.$v.$dirty).toBe(true);
		expect(vm.hasMessages).toBe(true);
		expect(wait.started).toBe(0);
		expect(axios.calls).toHaveLength(0);
	}
});

it('con un email válido inicia la espera, consulta la cuenta y pasa al paso 2', async () => {
	const { vm, wait } = setup();
	serve({ [GET_EXISTS]: { status: 'OK' } });
	vm.email = 'ana@mail.com';
	vm.next();
	expect(vm.hasMessages).toBe(false);
	expect(wait.started).toBe(1);
	await settle();
	expect(paramsOf(axios.calls[0])).toEqual({ u: 'ana@mail.com', active: true });
	expect(vm.step).toBe(2);
	expect(wait.stopped).toBe(0);
});

it('si el servidor rechaza la cuenta muestra su mensaje, detiene la espera y se queda en el paso 1', async () => {
	const { vm, wait } = setup();
	serve({ [GET_EXISTS]: { status: 'ERROR', message: 'La cuenta no existe' } });
	vm.email = 'ana@mail.com';
	vm.next();
	await settle();
	expect(vm.serverError).toBe('La cuenta no existe');
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(1);
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = setup();
	serve({ [GET_EXISTS]: new Error('Network Error') });
	vm.email = 'ana@mail.com';
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(1);
	expect(reasons).toHaveLength(1);
	expect(reasons[0].message).toBe('Network Error');
});

describe('Login.next: paso 2 (contraseña)');

function atPasswordStep() {
	const ctx = setup();
	ctx.vm.email = 'ana@mail.com';
	ctx.vm.step = 2;
	return ctx;
}

it('con la contraseña vacía marca el error y no inicia sesión', () => {
	const { vm, wait } = atPasswordStep();
	vm.password = '';
	vm.next();
	expect(vm.hasMessages).toBe(true);
	expect(wait.started).toBe(0);
	expect(axios.calls).toHaveLength(0);
});

it('inicia sesión con email y contraseña y, sin destino, va a /users/', async () => {
	const { env, vm, wait } = atPasswordStep();
	serve({ [POST_LOGIN]: { status: 'OK' } });
	vm.password = 'secreta';
	vm.next();
	expect(wait.started).toBe(1);
	await settle();
	expect(axios.calls[0].url).toBe('http://server.test' + SERVICES + 'Login');
	expect(env.document.location).toBe('/users/');
	expect(wait.stopped).toBe(0);
});

it('si la query trae un destino (to) navega hacia él', async () => {
	const ctx = setup({ query: { to: 'http://main.test/map/#/obra' } });
	ctx.vm.email = 'ana@mail.com';
	ctx.vm.step = 2;
	ctx.vm.password = 'secreta';
	serve({ [POST_LOGIN]: { status: 'OK' } });
	ctx.vm.next();
	await settle();
	expect(ctx.env.document.location).toBe('http://main.test/map/#/obra');
});

it('borra el error anterior apenas inicia el intento', async () => {
	const { vm } = atPasswordStep();
	serve({ [POST_LOGIN]: { status: 'OK' } });
	vm.password = 'secreta';
	vm.serverError = 'error viejo';
	vm.next();
	expect(vm.serverError).toBe('');
	await settle();
});

it('guarda el token de recordar sesión que entregue el servidor', async () => {
	const { vm } = atPasswordStep();
	serve({ [POST_LOGIN]: { status: 'OK', remember: 'tok-9' } });
	vm.password = 'secreta';
	vm.next();
	await settle();
	expect(session.GetRememberForUrl('http://server.test' + SERVICES + 'Login')).toBe('tok-9');
});

it('si el servidor rechaza las credenciales muestra su mensaje y no navega', async () => {
	const { env, vm, wait } = atPasswordStep();
	serve({ [POST_LOGIN]: { status: 'ERROR', message: 'Contraseña incorrecta' } });
	vm.password = 'mala';
	vm.next();
	await settle();
	expect(vm.serverError).toBe('Contraseña incorrecta');
	expect(wait.stopped).toBe(1);
	expect(env.document.location.href).toBe('http://localhost/credentials/#/signin');
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = atPasswordStep();
	serve({ [POST_LOGIN]: new Error('Network Error') });
	vm.password = 'secreta';
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(reasons).toHaveLength(1);
});

describe('Login: utilidades de la vista');

it('removedUser limpia el error y vuelve al paso 1', () => {
	const { vm } = setup();
	vm.step = 2;
	vm.serverError = 'x';
	vm.removedUser();
	expect(vm.step).toBe(1);
	expect(vm.serverError).toBe('');
});

it('clearError limpia el error del servidor', () => {
	const { vm } = setup();
	vm.serverError = 'x';
	vm.clearError();
	expect(vm.serverError).toBe('');
});

it('messageClass marca md-invalid solo si se pidió y hay mensajes o error del servidor', () => {
	const { vm } = setup();
	expect(vm.messageClass()['md-invalid']).toBeFalsy();
	expect(vm.messageClass(true)['md-invalid']).toBeFalsy();
	vm.hasMessages = true;
	expect(vm.messageClass(true)['md-invalid']).toBeTruthy();
	expect(vm.messageClass(false)['md-invalid']).toBeFalsy();
	vm.hasMessages = false;
	vm.serverError = 'x';
	expect(vm.messageClass(true)['md-invalid']).toBeTruthy();
});

it('googleLogin y facebookLogin abren la autenticación externa del servidor sin exigir términos', () => {
	const { openAuth, vm } = setup();
	vm.googleLogin();
	vm.facebookLogin();
	expect(openAuth.shown).toEqual([
		{ url: 'http://server.test/oauthGoogle', checkTerms: undefined },
		{ url: 'http://server.test/oauthFacebook', checkTerms: undefined },
	]);
});
