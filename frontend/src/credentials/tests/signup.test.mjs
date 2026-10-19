import { describe, it, expect } from './_harness.mjs';
import querystring from 'node:querystring';
import session from '@/common/framework/session';
import Signup from '@/credentials/views/Signup.vue';
import {
	setupGlobals, mountLite, axios, serve, settle, quiet, captureUnhandled, makeWait, makeOpenAuth,
} from './fixtures.mjs';

const POST_REGISTER = 'POST /services/authentication/BeginActivation';

function setup() {
	const env = setupGlobals({ mainHost: 'http://main.test' });
	const wait = makeWait();
	const openAuth = makeOpenAuth();
	const vm = mountLite(Signup, { refs: { wait, openAuth } });
	return { env, vm, wait, openAuth };
}

function validForm(vm) {
	vm.email = 'ana@mail.com';
	vm.acceptTerms = true;
}

describe('Signup: datos iniciales y validaciones');

it('parte en el paso 1, sin aceptar términos y sin mensajes', () => {
	const { vm } = setup();
	expect(vm.step).toBe(1);
	expect(vm.acceptTerms).toBe(false);
	expect(vm.email).toBe('');
	expect(vm.hasMessages).toBe(false);
	expect(vm.serverError).toBe('');
	expect(vm.useFacebook).toBe(false);
});

it('el email es obligatorio y debe tener formato de email', () => {
	const { vm } = setup();
	vm.email = '';
	expect(vm.$v.email.$invalid).toBe(true);
	vm.email = 'sin-arroba';
	expect(vm.$v.email.$invalid).toBe(true);
	vm.email = 'ana@mail.com';
	expect(vm.$v.email.$invalid).toBe(false);
});

it('los términos solo se consideran aceptados con el valor true', () => {
	const { vm } = setup();
	expect(vm.$v.acceptTerms.$invalid).toBe(true);
	vm.acceptTerms = 'true';
	expect(vm.$v.acceptTerms.$invalid).toBe(true);
	vm.acceptTerms = true;
	expect(vm.$v.acceptTerms.$invalid).toBe(false);
});

describe('Signup.next');

it('sin aceptar los términos marca el error y no registra', () => {
	const { vm, wait } = setup();
	vm.email = 'ana@mail.com';
	vm.next();
	expect(vm.$v.$dirty).toBe(true);
	expect(vm.hasMessages).toBe(true);
	expect(wait.started).toBe(0);
	expect(axios.calls).toHaveLength(0);
});

it('con un email inválido marca el error y no registra', () => {
	const { vm, wait } = setup();
	validForm(vm);
	vm.email = 'ana';
	vm.next();
	expect(vm.hasMessages).toBe(true);
	expect(wait.started).toBe(0);
	expect(axios.calls).toHaveLength(0);
});

it('registra el email con la URL de retorno, detiene la espera y avanza al paso 2', async () => {
	const { vm, wait } = setup();
	validForm(vm);
	serve({ [POST_REGISTER]: { status: 'OK' } });
	vm.next();
	expect(vm.hasMessages).toBe(false);
	expect(wait.started).toBe(1);
	await settle();
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', t: 'http://main.test/users/' });
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(2);
});

it('guarda el token de recordar sesión que devuelva el registro', async () => {
	const { vm } = setup();
	validForm(vm);
	serve({ [POST_REGISTER]: { status: 'OK', remember: 'tok-3' } });
	vm.next();
	await settle();
	expect(session.GetRememberForUrl('http://server.test/services/authentication/BeginActivation')).toBe('tok-3');
});

it('borra el error anterior apenas inicia el intento', async () => {
	const { vm } = setup();
	validForm(vm);
	serve({ [POST_REGISTER]: { status: 'OK' } });
	vm.serverError = 'error viejo';
	vm.next();
	expect(vm.serverError).toBe('');
	await settle();
});

it('si el servidor rechaza el registro muestra su mensaje y no avanza', async () => {
	const { vm, wait } = setup();
	validForm(vm);
	serve({ [POST_REGISTER]: { status: 'ERROR', message: 'La cuenta ya existe' } });
	vm.next();
	await settle();
	expect(vm.serverError).toBe('La cuenta ya existe');
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(1);
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = setup();
	validForm(vm);
	serve({ [POST_REGISTER]: new Error('Network Error') });
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(1);
	expect(reasons).toHaveLength(1);
});

describe('Signup: utilidades de la vista');

it('googleSignup y facebookSignup abren la autenticación externa exigiendo los términos', () => {
	const { vm, openAuth } = setup();
	vm.googleSignup();
	vm.facebookSignup();
	expect(openAuth.shown).toEqual([
		{ url: 'http://server.test/oauthGoogle', checkTerms: true },
		{ url: 'http://server.test/oauthFacebook', checkTerms: true },
	]);
});

it('clearError limpia el error del servidor', () => {
	const { vm } = setup();
	vm.serverError = 'x';
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
