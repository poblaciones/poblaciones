import { describe, it, expect } from './_harness.mjs';
import querystring from 'node:querystring';
import Recover from '@/credentials/views/Recover.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, quiet, captureUnhandled, makeWait,
} from './fixtures.mjs';

const POST_BEGIN = 'POST /services/authentication/BeginResetPassword';

function setup() {
	const env = setupGlobals({ mainHost: 'http://main.test' });
	const wait = makeWait();
	const vm = mountLite(Recover, { refs: { wait } });
	callHook(Recover, vm, 'created');
	return { env, vm, wait };
}

describe('Recover: datos iniciales');

it('parte en el paso 1 con el formulario limpio', () => {
	const { vm } = setup();
	expect(vm.step).toBe(1);
	expect(vm.email).toBe('');
	expect(vm.code).toBe('');
	expect(vm.hasMessages).toBe(false);
	expect(vm.serverError).toBe('');
});

describe('Recover.next');

it('con el email vacío o inválido marca el error y no consulta', () => {
	for (const email of ['', 'sin-arroba']) {
		const { vm, wait } = setup();
		vm.email = email;
		vm.next();
		expect(vm.$v.$dirty).toBe(true);
		expect(vm.hasMessages).toBe(true);
		expect(wait.started).toBe(0);
		expect(axios.calls).toHaveLength(0);
	}
});

it('inicia la recuperación con la URL de retorno y avanza al paso 2', async () => {
	const { vm, wait } = setup();
	serve({ [POST_BEGIN]: { status: 'OK' } });
	vm.email = 'ana@mail.com';
	vm.next();
	expect(wait.started).toBe(1);
	await settle();
	expect(querystring.parse(axios.calls[0].body)).toEqual({ u: 'ana@mail.com', t: 'http://main.test/users/' });
	expect(vm.step).toBe(2);
	expect(wait.stopped).toBe(0);
});

it('borra el error anterior apenas inicia el intento', async () => {
	const { vm } = setup();
	serve({ [POST_BEGIN]: { status: 'OK' } });
	vm.email = 'ana@mail.com';
	vm.serverError = 'error viejo';
	vm.next();
	expect(vm.serverError).toBe('');
	await settle();
});

it('si el servidor rechaza el pedido muestra su mensaje, detiene la espera y no avanza', async () => {
	const { vm, wait } = setup();
	serve({ [POST_BEGIN]: { status: 'ERROR', message: 'No existe la cuenta' } });
	vm.email = 'ana@mail.com';
	vm.next();
	await settle();
	expect(vm.serverError).toBe('No existe la cuenta');
	expect(wait.stopped).toBe(1);
	expect(vm.step).toBe(1);
});

it('ante una falla de red muestra un error genérico, detiene la espera y relanza el error', async () => {
	const { vm, wait } = setup();
	serve({ [POST_BEGIN]: new Error('Network Error') });
	vm.email = 'ana@mail.com';
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.next(); });
	});
	expect(vm.serverError).toBe('Se produjo un error.');
	expect(wait.stopped).toBe(1);
	expect(reasons).toHaveLength(1);
});

it('fuera del paso 1 no hace nada aunque el formulario sea válido', async () => {
	const { vm, wait } = setup();
	vm.email = 'ana@mail.com';
	vm.step = 2;
	vm.next();
	await settle();
	expect(wait.started).toBe(0);
	expect(axios.calls).toHaveLength(0);
});

describe('Recover: utilidades de la vista');

it('clearError limpia el error del servidor', () => {
	const { vm } = setup();
	vm.serverError = 'x';
	vm.clearError();
	expect(vm.serverError).toBe('');
});

it('messageClass marca md-invalid solo si se pidió y hay mensajes o error del servidor', () => {
	const { vm } = setup();
	expect(vm.messageClass(true)['md-invalid']).toBeFalsy();
	vm.serverError = 'x';
	expect(vm.messageClass(true)['md-invalid']).toBeTruthy();
	expect(vm.messageClass()['md-invalid']).toBeFalsy();
});
