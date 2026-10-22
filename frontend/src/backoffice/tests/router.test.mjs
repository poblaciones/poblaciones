import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from './_harness.mjs';
import { sourceRoot } from './_paths.mjs';
import router from '@/backoffice/router/router';

const routes = router.options.routes;

// Ruta absoluta de cada registro, resolviendo las rutas hijas relativas contra su padre.
function absolutePath(parent, child) {
	if (child.startsWith('/')) {
		return child;
	}
	return parent.replace(/\/$/, '') + '/' + child;
}

function toList(value) {
	if (value === undefined) {
		return [];
	}
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
}

// Todas las rutas absolutas alcanzables: path y alias de cada registro, con sus hijos.
function collectReachablePaths() {
	const paths = [];
	for (const route of routes) {
		paths.push(route.path);
		for (const alias of toList(route.alias)) {
			paths.push(alias);
		}
		for (const child of toList(route.children)) {
			paths.push(absolutePath(route.path, child.path));
			for (const alias of toList(child.alias)) {
				paths.push(absolutePath(route.path, alias));
			}
		}
	}
	return paths;
}

function collectNamedRecords() {
	const named = [];
	for (const route of routes) {
		if (route.name !== undefined) {
			named.push(route.name);
		}
		for (const child of toList(route.children)) {
			if (child.name !== undefined) {
				named.push(child.name);
			}
		}
	}
	return named;
}

function collectComponentTargets() {
	const targets = [];
	const records = [];
	for (const route of routes) {
		records.push(route);
		for (const child of toList(route.children)) {
			records.push(child);
		}
	}
	for (const record of records) {
		if (typeof record.component === 'function') {
			const match = /import\(['"]([^'"]+)['"]\)/.exec(record.component.toString());
			targets.push(match[1]);
		}
	}
	return targets;
}

describe('router: rutas de entrada');

it('la raíz redirige a /works, que se llama Inicio y también responde en /public', () => {
	const root = routes.find(function (route) { return route.path === ''; });
	expect(root.redirect).toBe('/works');
	const works = routes.find(function (route) { return route.path === '/works'; });
	expect(works.name).toBe('Inicio');
	expect(works.alias).toEqual(['/public']);
});

it('declara /404 al principio y cierra con un comodín que redirige a /404', () => {
	expect(routes[0].path).toBe('/404');
	const last = routes[routes.length - 1];
	expect(last.path).toBe('*');
	expect(last.redirect).toBe('/404');
});

it('conserva el desplazamiento al inicio de la página al navegar', () => {
	expect(router.options.scrollBehavior()).toEqual({ y: 0 });
});

describe('router: rutas del trabajo');

it('todas las rutas con hijos usan el Layout', () => {
	for (const route of routes) {
		if (route.children) {
			expect(route.component.name).toBe('layout');
		}
	}
});

it('la edición de un dataset responde en cada solapa bajo un único componente', () => {
	const datasets = routes.find(function (route) { return route.name === 'Datasets'; });
	const edit = datasets.children.find(function (child) { return child.name === 'DatasetEdit'; });
	expect(edit.path).toBe('datasets/:datasetId/metrics');
	expect(edit.alias).toEqual([
		'datasets/:datasetId/georeference', 'datasets/:datasetId/variables',
		'datasets/:datasetId/data', 'datasets/:datasetId/identity', 'datasets/:datasetId/multilevel',
	]);
});

it('la ruta de un dataset sin solapa redirige a sus datos', () => {
	const datasets = routes.find(function (route) { return route.name === 'Datasets'; });
	const bare = datasets.children.find(function (child) { return child.path === 'datasets/:datasetId'; });
	expect(bare.redirect).toBe('datasets/:datasetId/data');
});

it('los pasos de la bienvenida comparten el componente del primer paso', () => {
	const onboarding = routes.find(function (route) { return route.name === 'Bienvenida'; });
	expect(onboarding.redirect).toBe('/cartographies/:workId/onboarding/step1');
	expect(onboarding.children[0].alias).toHaveLength(4);
});

describe('router: consistencia de la tabla');

it('cada redirección apunta a una ruta que existe', () => {
	const reachable = collectReachablePaths();
	for (const route of routes) {
		if (route.redirect !== undefined) {
			expect(reachable.indexOf(route.redirect) === -1).toBeFalsy();
		}
		for (const child of toList(route.children)) {
			if (child.redirect !== undefined) {
				expect(reachable.indexOf(absolutePath(route.path, child.redirect)) === -1).toBeFalsy();
			}
		}
	}
});

it('los nombres de ruta no se repiten', () => {
	const names = collectNamedRecords();
	const unique = names.filter(function (name, index) { return names.indexOf(name) === index; });
	expect(unique).toHaveLength(names.length);
});

it('cada componente cargado de forma diferida existe en el proyecto', () => {
	const targets = collectComponentTargets();
	expect(targets.length > 0).toBeTruthy();
	for (const target of targets) {
		const relative = target.replace(/^@\//, '');
		const candidates = [relative, relative + '.js', relative + '.vue'];
		let found = false;
		for (const candidate of candidates) {
			const full = path.join(sourceRoot, candidate);
			if (fs.existsSync(full) && fs.statSync(full).isFile()) {
				found = true;
			}
		}
		expect(found).toBeTruthy();
	}
});
