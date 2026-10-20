import { describe, it, expect } from './_harness.mjs';
import Layout from '@/admins/views/Layout.vue';
import { setupGlobals, mountLite, callHook, triggerWatch } from './fixtures.mjs';

function makeList() {
	const list = { loaded: 0 };
	list.loadData = function () { list.loaded++; };
	return list;
}

function setup(path, privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const worksList = makeList();
	const usersList = makeList();
	const vm = mountLite(Layout, {
		route: { path, query: {} },
		refs: { worksList, usersList },
	});
	return { env, vm, worksList, usersList };
}

describe('Layout: datos iniciales');

it('parte sin revisiones pendientes', () => {
	expect(setup('/public').vm.pendingReviews).toBe(0);
});

describe('Layout: computed');

it('isAdmin, isDataAdmin e isAdminReader reflejan los privilegios del usuario', () => {
	const expected = {
		A: [true, true, true],
		E: [false, true, true],
		L: [false, false, true],
		P: [false, false, false],
	};
	Object.keys(expected).forEach(function (privileges) {
		const { vm } = setup('/public', privileges);
		expect([vm.isAdmin, vm.isDataAdmin, vm.isAdminReader]).toEqual(expected[privileges]);
	});
});

it('showTabs y showPublic exponen las cartografías del Context', () => {
	const { env, vm } = setup('/public');
	expect(vm.showTabs).toBe(env.context.Cartographies);
	expect(vm.showPublic).toBe(env.context.Cartographies);
});

it('filter es P en /public y R en cualquier otra ruta', () => {
	expect(setup('/public').vm.filter).toBe('P');
	['/works', '/users', '/reviews', '/stats'].forEach(function (path) {
		expect(setup(path).vm.filter).toBe('R');
	});
});

describe('Layout.isPath');

it('compara con la ruta actual', () => {
	const { vm } = setup('/users');
	expect(vm.isPath('/users')).toBe(true);
	expect(vm.isPath('/works')).toBe(false);
});

describe('Layout.checkLazyLoading');

it('en /works carga solo la lista de obras', () => {
	const { vm, worksList, usersList } = setup('/works');
	vm.checkLazyLoading();
	expect(worksList.loaded).toBe(1);
	expect(usersList.loaded).toBe(0);
});

it('en /users carga solo la lista de usuarios', () => {
	const { vm, worksList, usersList } = setup('/users');
	vm.checkLazyLoading();
	expect(worksList.loaded).toBe(0);
	expect(usersList.loaded).toBe(1);
});

it('en las demás pestañas no carga nada', () => {
	['/public', '/reviews', '/stats'].forEach(function (path) {
		const { vm, worksList, usersList } = setup(path);
		vm.checkLazyLoading();
		expect(worksList.loaded + usersList.loaded).toBe(0);
	});
});

describe('Layout: ciclo de vida y navegación');

it('mounted fija el título, limpia la obra y el dataset actuales y carga la pestaña activa', () => {
	const { env, vm, worksList } = setup('/works');
	env.context.CurrentWork = { Id: 1 };
	env.context.CurrentDataset = { Id: 2 };
	callHook(Layout, vm, 'mounted');
	expect(env.document.title).toBe('Poblaciones');
	expect(env.context.CurrentWork).toBeNull();
	expect(env.context.CurrentDataset).toBeNull();
	expect(worksList.loaded).toBe(1);
});

it('al cambiar la ruta vuelve a evaluar la carga diferida', () => {
	const { vm, usersList } = setup('/users');
	triggerWatch(Layout, vm, '$route', { path: '/users' }, { path: '/public' });
	expect(usersList.loaded).toBe(1);
});

it('beforeRouteUpdate deja continuar la navegación', () => {
	const { vm } = setup('/public');
	let continued = 0;
	Layout.beforeRouteUpdate.call(vm, {}, {}, function () { continued++; });
	expect(continued).toBe(1);
});

it('pendingUpdated guarda la cantidad de revisiones pendientes', () => {
	const { vm } = setup('/public');
	vm.pendingUpdated(4);
	expect(vm.pendingReviews).toBe(4);
});
