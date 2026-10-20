import { describe, it, expect } from './_harness.mjs';
import Vue from 'vue';
import Vuex from 'vuex';
import AsyncCatalog from '@/backoffice/classes/AsyncCatalog.js';
import Context from '@/packs/classes/Context';
import { setupGlobals } from './fixtures.mjs';

describe('Context: estado inicial');

it('no tiene usuario ni cartografías y el contador de errores parte en cero', () => {
	const context = new Context();
	expect(context.User).toBeNull();
	expect(context.Cartographies).toEqual([]);
	expect(context.CartographiesStarted).toBe(false);
	expect(context.ErrorSignaled).toEqual({ value: 0 });
});

describe('Context.Initialize');

it('crea los catálogos asincrónicos apuntando a los servicios del host actual', () => {
	const env = setupGlobals({ initialize: false });
	env.context.Initialize();
	const expected = {
		Factory: '/services/backoffice/GetFactories',
		Geographies: '/services/backoffice/GetAllGeographies',
		ClippingRegions: '/services/packs/GetClippingRegions',
		BoundaryGroups: '/services/packs/GetBoundaryGroups',
		Sources: '/services/admin/GetAllPublicSources',
		Institutions: '/services/admin/GetAllPublicInstitutions',
	};
	Object.keys(expected).forEach(function (name) {
		expect(env.context[name] instanceof AsyncCatalog).toBeTruthy();
		expect(env.context[name].url).toBe('http://server.test' + expected[name]);
		expect(env.context[name].hasData).toBe(false);
	});
});

it('usa el host vigente al momento de inicializar (no el anterior)', () => {
	const env = setupGlobals({ initialize: false });
	window.host = 'http://tx.test';
	env.context.Initialize();
	expect(env.context.ClippingRegions.url).toBe('http://tx.test/services/packs/GetClippingRegions');
});

describe('Context.GetCreateFileUrl');

it('arma la URL de carga de fragmentos con el bucket', () => {
	const env = setupGlobals();
	expect(env.context.GetCreateFileUrl('abc')).toBe('http://server.test/services/backoffice/PostImportChunk?b=abc');
});

describe('Context.CreateStore');

it('instala Vuex en Vue y devuelve un store sin módulos', () => {
	const env = setupGlobals();
	const installed = Vue.uses.length;
	const store = env.context.CreateStore();
	expect(Vue.uses.slice(installed)).toEqual([Vuex]);
	expect(store instanceof Vuex.Store).toBeTruthy();
	expect(store.options).toEqual({ modules: {} });
});

describe('Context: permisos por privilegio');

// Privilegios: A administrador, E editor de datos públicos, L lector de
// datos públicos, P usuario estándar.
const MATRIX = {
	A: { IsAdmin: true, IsAdminReader: true, IsDataAdmin: true, CanCreatePublicData: true, CanAccessAdminSite: true },
	E: { IsAdmin: false, IsAdminReader: true, IsDataAdmin: true, CanCreatePublicData: true, CanAccessAdminSite: true },
	L: { IsAdmin: false, IsAdminReader: true, IsDataAdmin: false, CanCreatePublicData: false, CanAccessAdminSite: true },
	P: { IsAdmin: false, IsAdminReader: false, IsDataAdmin: false, CanCreatePublicData: false, CanAccessAdminSite: false },
};

Object.keys(MATRIX).forEach(function (privileges) {
	it('el privilegio ' + privileges + ' resuelve cada permiso según lo esperado', () => {
		const env = setupGlobals({ privileges });
		Object.keys(MATRIX[privileges]).forEach(function (method) {
			expect(env.context[method]()).toBe(MATRIX[privileges][method]);
		});
	});
});

it('un privilegio desconocido no concede ningún permiso', () => {
	const env = setupGlobals({ privileges: 'X' });
	Object.keys(MATRIX.P).forEach(function (method) {
		expect(env.context[method]()).toBe(false);
	});
});
