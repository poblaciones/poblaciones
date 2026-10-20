import { describe, it, expect } from './_harness.mjs';
import UserPopup from '@/admins/views/Users/UserPopup.vue';
import {
	setupGlobals, mountLite, axios, serve, settle, bodyOf, makeInvoker, makeFocusable,
} from './fixtures.mjs';

function setup() {
	const env = setupGlobals({ privileges: 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(UserPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

function user(overrides) {
	return Object.assign({ Id: 5, Firstname: 'Ana', Lastname: 'Paz', Email: 'ana@mail.com', Privileges: 'P' }, overrides || {});
}

const GET_KEYS = 'GET /services/admin/GetUserKeys';

describe('UserPopup.show');

it('trabaja sobre una copia del usuario y reinicia los campos de edición', () => {
	const { vm } = setup();
	const original = user();
	serve({ [GET_KEYS]: [] });
	Object.assign(vm, { password: 'x', verification: 'y', keys: [{ key_id: 1 }], newKeyDescription: 'z' });
	vm.show(original);
	expect(vm.user).toEqual(original);
	expect(vm.user === original).toBe(false);
	expect(vm.password).toBe('');
	expect(vm.verification).toBe('');
	expect(vm.keys).toEqual([]);
	expect(vm.newKeyDescription).toBe('');
	expect(vm.activateEdit).toBe(true);
});

it('enfoca el campo nombre a los 100 ms', () => {
	const { env, vm, inputName } = setup();
	serve({ [GET_KEYS]: [] });
	vm.show(user());
	expect(env.timers.pending).toHaveLength(1);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('carga los keys solo si el usuario ya existe', async () => {
	const { vm } = setup();
	serve({ [GET_KEYS]: [{ key_id: 1 }] });
	vm.show(user({ Id: null }));
	await settle();
	expect(axios.calls).toHaveLength(0);
	vm.show(user({ Id: 5 }));
	await settle();
	expect(axios.calls[0].config.params).toEqual({ u: 5 });
	expect(vm.keys).toEqual([{ key_id: 1 }]);
});

describe('UserPopup.save');

it('con contraseña que no coincide con la verificación avisa y no guarda', () => {
	const { env, vm } = setup();
	vm.user = user();
	vm.password = 'clave1';
	vm.verification = 'clave2';
	vm.save();
	expect(env.alerts).toEqual(['La contraseña y la verificación no coinciden.']);
	expect(axios.calls).toHaveLength(0);
	expect(vm.$emitted).toHaveLength(0);
});

it('con contraseña vacía guarda sin validar la verificación', async () => {
	const { vm } = setup();
	serve({ 'POST /services/admin/UpdateUser': {} });
	vm.user = user();
	vm.verification = 'cualquiera';
	vm.save();
	await settle();
	expect(axios.calls).toHaveLength(1);
});

it('guarda usuario, contraseña y verificación, cierra la edición y avisa con el usuario editado', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/admin/UpdateUser': {} });
	vm.activateEdit = true;
	vm.user = user({ Firstname: 'Ana María' });
	vm.password = 'clave1';
	vm.verification = 'clave1';
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ u: user({ Firstname: 'Ana María' }), p: 'clave1', v: 'clave1' });
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.user] }]);
});

describe('UserPopup: keys');

it('loadKeys usa una lista vacía cuando el servidor no devuelve datos', async () => {
	const { vm } = setup();
	vm.user = user();
	serve({ [GET_KEYS]: null });
	vm.loadKeys();
	await settle();
	expect(vm.keys).toEqual([]);
});

it('createKey ignora descripciones vacías o de solo espacios', async () => {
	const { vm } = setup();
	vm.user = user();
	for (const text of ['', '   ']) {
		vm.newKeyDescription = text;
		vm.createKey();
	}
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('createKey crea el key con la descripción recortada, muestra la clave en claro y recarga la lista', async () => {
	const { vm } = setup();
	vm.user = user();
	serve({
		'POST /services/admin/CreateUserKey': { plain_key: 'abc123' },
		[GET_KEYS]: [{ key_id: 1 }],
	});
	vm.newKeyDescription = '  mi servicio  ';
	vm.createKey();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ u: '5', description: 'mi servicio' });
	expect(vm.plainKeyToShow).toBe('abc123');
	expect(vm.showPlainKeyDialog).toBe(true);
	expect(vm.newKeyDescription).toBe('');
	expect(vm.keys).toEqual([{ key_id: 1 }]);
});

it('toggleKey envía 1 o 0 según el key esté activo', async () => {
	const { vm } = setup();
	serve({ 'POST /services/admin/UpdateUserKey': {} });
	vm.toggleKey({ key_id: 3, key_active: true });
	vm.toggleKey({ key_id: 4, key_active: false });
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ key_id: '3', active: '1' });
	expect(bodyOf(axios.calls[1])).toEqual({ key_id: '4', active: '0' });
});

it('deleteKey no elimina si el usuario no confirma', async () => {
	const { env, vm } = setup();
	env.confirmAnswer = false;
	vm.deleteKey({ key_id: 3, key_description: 'servicio' });
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('deleteKey confirma nombrando el key (por descripción o, si falta, por id), lo elimina y recarga', async () => {
	const { env, vm } = setup();
	vm.user = user();
	serve({ 'GET /services/admin/DeleteUserKey': {}, [GET_KEYS]: [] });
	vm.deleteKey({ key_id: 3, key_description: 'servicio' });
	vm.deleteKey({ key_id: 4, key_description: '' });
	await settle();
	expect(env.confirms).toEqual([
		'¿Eliminar el key "servicio"? Esta acción no se puede deshacer.',
		'¿Eliminar el key "4"? Esta acción no se puede deshacer.',
	]);
	expect(axios.calls.map(function (c) { return c.url.split('/').pop(); })).toEqual([
		'DeleteUserKey', 'DeleteUserKey', 'GetUserKeys', 'GetUserKeys',
	]);
	expect(axios.calls[0].config.params).toEqual({ key_id: 3 });
});

it('copyPlainKey copia la clave al portapapeles cuando está disponible', () => {
	const { env, vm } = setup();
	vm.plainKeyToShow = 'abc123';
	vm.copyPlainKey();
	expect(env.clipboard).toEqual(['abc123']);
});

it('copyPlainKey no falla si el navegador no ofrece portapapeles', () => {
	const { env, vm } = setup();
	Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
	vm.plainKeyToShow = 'abc123';
	vm.copyPlainKey();
	expect(env.clipboard).toEqual([]);
});

it('closePlainKeyDialog borra la clave en claro y cierra el diálogo', () => {
	const { vm } = setup();
	vm.plainKeyToShow = 'abc123';
	vm.showPlainKeyDialog = true;
	vm.closePlainKeyDialog();
	expect(vm.plainKeyToShow).toBe('');
	expect(vm.showPlainKeyDialog).toBe(false);
});

describe('UserPopup.formatDate');

it('devuelve vacío cuando no hay fecha', () => {
	const { vm } = setup();
	expect(vm.formatDate('')).toBe('');
	expect(vm.formatDate(null)).toBe('');
	expect(vm.formatDate(undefined)).toBe('');
});

it('incluye día, año y hora de la fecha indicada', () => {
	const { vm } = setup();
	const text = vm.formatDate('2024-05-03T12:30:00');
	expect(text.includes('2024')).toBeTruthy();
	expect(text.includes('3')).toBeTruthy();
	expect(text.includes('30')).toBeTruthy();
});
