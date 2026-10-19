import { describe, it, expect } from './_harness.mjs';
import Vue from 'vue';
import Router from 'vue-router';
import router, { constantRouterMap } from '@/credentials/router/router.js';

function routeByPath(path) {
	return constantRouterMap.filter(function (r) { return r.path === path; })[0];
}

describe('router: instalación');

it('registra vue-router como plugin de Vue', () => {
	expect(Vue.uses.includes(Router)).toBeTruthy();
});

it('exporta un Router creado con la tabla de rutas y desplazamiento al tope', () => {
	expect(router instanceof Router).toBeTruthy();
	expect(router.options.routes).toBe(constantRouterMap);
	expect(router.options.scrollBehavior()).toEqual({ y: 0 });
});

describe('router: tabla de rutas');

it('define las rutas esperadas en orden, con el comodín al final', () => {
	const paths = constantRouterMap.map(function (r) { return r.path; });
	expect(paths).toEqual(['/404', '', '/signin', '/newPassword', '/activate', '/recover', '/signup', '*']);
});

it('la raíz redirige a /signin', () => {
	expect(routeByPath('').redirect).toBe('/signin');
});

it('cualquier ruta desconocida redirige a /404', () => {
	expect(routeByPath('*').redirect).toBe('/404');
});

it('cada pantalla tiene nombre y título', () => {
	const expected = {
		'/signin': ['Ingresar', 'Ingresar'],
		'/newPassword': ['ChangePassword', 'Restablecer contraseña'],
		'/activate': ['Activar', 'Activar cuenta'],
		'/recover': ['Recuperar', 'Restablecer contraseña'],
		'/signup': ['Empezar', 'Crear cuenta'],
	};
	Object.keys(expected).forEach(function (path) {
		const route = routeByPath(path);
		expect(route.name).toBe(expected[path][0]);
		expect(route.meta.title).toBe(expected[path][1]);
	});
});

it('las pantallas y la página 404 se cargan de forma diferida', () => {
	['/404', '/signin', '/newPassword', '/activate', '/recover', '/signup'].forEach(function (path) {
		expect(typeof routeByPath(path).component).toBe('function');
	});
});

it('las pantallas de credenciales no se ocultan; la 404 sí', () => {
	expect(routeByPath('/404').hidden).toBeTruthy();
	['/signin', '/newPassword', '/activate', '/recover', '/signup'].forEach(function (path) {
		expect(routeByPath(path).hidden).toBe(false);
	});
});
