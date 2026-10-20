import { describe, it, expect } from './_harness.mjs';
import Vue from 'vue';
import Router from 'vue-router';
import router, { constantRouterMap } from '@/packs/router/router.js';

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
	expect(paths).toEqual(['/404', '', '/boundaries', '*']);
});

it('la raíz redirige a /boundaries y cualquier ruta desconocida a /404', () => {
	expect(routeByPath('').redirect).toBe('/boundaries');
	expect(routeByPath('*').redirect).toBe('/404');
});

it('/boundaries muestra el Layout con un alias por cada pestaña', () => {
	const route = routeByPath('/boundaries');
	expect(route.alias).toEqual(['/regions', '/geographies', '/gradients', '/groups', '/providers', '/geography-tuples']);
	expect(route.name).toBe('Inicio');
	expect(route.meta.title).toBe('Inicio');
	expect(route.hidden).toBe(true);
});

it('las pantallas y la página 404 se cargan de forma diferida', () => {
	expect(typeof routeByPath('/boundaries').component).toBe('function');
	expect(typeof routeByPath('/404').component).toBe('function');
});
