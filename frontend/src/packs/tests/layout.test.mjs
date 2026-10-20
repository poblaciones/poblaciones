import { describe, it, expect } from './_harness.mjs';
import Layout from '@/packs/views/Layout.vue';
import { setupGlobals, mountLite, callHook, triggerWatch } from './fixtures.mjs';

function setup(path, privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const vm = mountLite(Layout, { route: { path, query: {} } });
	return { env, vm };
}

describe('Layout: datos y computed');

it('parte sin revisiones pendientes', () => {
	expect(setup('/boundaries').vm.pendingReviews).toBe(0);
});

it('isAdmin, isDataAdmin e isAdminReader reflejan los privilegios del usuario', () => {
	const expected = {
		A: [true, true, true],
		E: [false, true, true],
		L: [false, false, true],
		P: [false, false, false],
	};
	Object.keys(expected).forEach(function (privileges) {
		const { vm } = setup('/boundaries', privileges);
		expect([vm.isAdmin, vm.isDataAdmin, vm.isAdminReader]).toEqual(expected[privileges]);
	});
});

it('showTabs expone las cartografías del Context', () => {
	const { env, vm } = setup('/boundaries');
	expect(vm.showTabs).toBe(env.context.Cartographies);
});

describe('Layout: navegación');

it('isPath compara con la ruta actual', () => {
	const { vm } = setup('/regions');
	expect(vm.isPath('/regions')).toBe(true);
	expect(vm.isPath('/boundaries')).toBe(false);
});

it('mounted fija el título y limpia la obra y el dataset actuales', () => {
	const { env, vm } = setup('/boundaries');
	env.context.CurrentWork = { Id: 1 };
	env.context.CurrentDataset = { Id: 2 };
	callHook(Layout, vm, 'mounted');
	expect(env.document.title).toBe('Poblaciones');
	expect(env.context.CurrentWork).toBeNull();
	expect(env.context.CurrentDataset).toBeNull();
});

it('al cambiar la ruta se vuelve a evaluar la carga diferida sin efectos', () => {
	const { vm } = setup('/regions');
	triggerWatch(Layout, vm, '$route', { path: '/regions' }, { path: '/boundaries' });
	expect(vm.pendingReviews).toBe(0);
});

it('beforeRouteUpdate deja continuar la navegación', () => {
	const { vm } = setup('/boundaries');
	let continued = 0;
	Layout.beforeRouteUpdate.call(vm, {}, {}, function () { continued++; });
	expect(continued).toBe(1);
});
