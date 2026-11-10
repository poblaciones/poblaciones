/*
 * ActiveRoute.test.mjs — pruebas de serialización/parseo de la ruta.
 *
 * Correr:
 *     node --import ./tests/_register-alias.mjs tests/ActiveRoute.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActiveRoute from '@/table/classes/ActiveRoute.js';

// Helper: arma secciones, compone a query, parsea de vuelta.
function roundTrip(sections) {
	return ActiveRoute.parseQuery(ActiveRoute.composeQuery(sections));
}

describe('round-trip de columnas', function () {
	it('preserva el id (metric) y las versiones múltiples por índice', function () {
		var sections = {
			columns: [{ id: 42, versionIndexes: [0, 1], levelIndex: 2, variableIndex: 3, summary: 'I', selection: {} }],
		};
		var back = roundTrip(sections);
		expect(back.columns).toHaveLength(1);
		expect(back.columns[0].id).toBe(42);
		expect(back.columns[0].versionIndexes).toEqual([0, 1]);
		expect(back.columns[0].levelIndex).toBe(2);
		expect(back.columns[0].variableIndex).toBe(3);
	});
	it('una sola versión también sobrevive', function () {
		var sections = { columns: [{ id: 1, versionIndexes: [0], levelIndex: 1, variableIndex: 2, selection: {} }] };
		var back = roundTrip(sections);
		expect(back.columns[0].versionIndexes).toEqual([0]);
	});
	it('los defaults (nivel 0, variable 0, summary N) se omiten y vuelven como default', function () {
		var sections = { columns: [{ id: 7, versionIndexes: [0], levelIndex: 0, variableIndex: 0, summary: 'N', selection: {} }] };
		var q = ActiveRoute.composeQuery(sections);
		// El token de la columna no debe contener l, a ni s (van por defecto).
		expect(/[!]l|[!]a|[!]s/.test(q.c || '')).toBeFalsy();
		var back = ActiveRoute.parseQuery(q);
		expect(back.columns[0].levelIndex).toBe(0);
		expect(back.columns[0].variableIndex).toBe(0);
	});
});

describe('round-trip de selección de categorías', function () {
	it('preserva labels e includeTotal por índice de versión', function () {
		var sections = {
			columns: [{
				id: 9, versionIndexes: [0], levelIndex: 0, variableIndex: 0,
				selection: { 0: { labels: [101, 102], includeTotal: true } }
			}],
		};
		var back = roundTrip(sections);
		var sel = back.columns[0].selection;
		expect(sel).toBeTruthy();
		expect(sel[0].labels).toEqual([101, 102]);
		expect(sel[0].includeTotal).toBeTruthy();
	});
});

describe('round-trip del árbol de filas', function () {
	it('preserva la raíz y sus elementos restringidos', function () {
		var sections = { columns: [], tree: { root: 1, checked: [10, 11], entries: [] } };
		var back = roundTrip(sections);
		expect(back.tree.root).toBe(1);
		expect(back.tree.checked).toEqual([10, 11]);
		expect(back.tree.entries).toHaveLength(0);
	});
	it('una raíz sin restricción no lleva lista de elementos', function () {
		var q = ActiveRoute.composeQuery({ columns: [], tree: { root: 1, checked: null, entries: [] } });
		expect(q.r).toBe('1');
		expect(q.x === undefined).toBeTruthy();
	});
	it('preserva elementos desplegados y niveles abiertos o restringidos', function () {
		var entries = [
			{ path: [10], open: true, checked: null },
			{ path: [10, 2], open: true, checked: [201, 202] },
			{ path: [10, 3], open: false, checked: [301] },
			{ path: [10, 2, 201], open: true, checked: null }
		];
		var back = roundTrip({ columns: [], tree: { root: 1, checked: [10], entries: entries } });
		expect(back.tree.entries).toHaveLength(4);
		expect(back.tree.entries[0].path).toEqual([10]);
		expect(back.tree.entries[1].path).toEqual([10, 2]);
		expect(back.tree.entries[1].open).toBeTruthy();
		expect(back.tree.entries[1].checked).toEqual([201, 202]);
		expect(back.tree.entries[2].open).toBeFalsy();
		expect(back.tree.entries[2].checked).toEqual([301]);
		expect(back.tree.entries[3].path).toEqual([10, 2, 201]);
	});
});

describe('lugares desde el visor', function () {
	it('cada lugar es un id con sus ancestros como alternativas', function () {
		var back = roundTrip({ columns: [], places: [[500, 50, 5], [600]] });
		expect(back.places).toHaveLength(2);
		expect(back.places[0]).toEqual([500, 50, 5]);
		expect(back.places[1]).toEqual([600]);
	});
	it('la sugerencia de la vista actual se conserva', function () {
		var back = roundTrip({ columns: [], suggestion: [70, 7] });
		expect(back.suggestion).toEqual([70, 7]);
	});
	it('arma la URL de la tabla con la base indicada', function () {
		var url = ActiveRoute.tableUrl({ columns: [], places: [[5]] }, 'https://mapas/table/12/');
		expect(url).toBe('https://mapas/table/12/#/view?p=5');
	});
});

describe('query vacía', function () {
	it('sin secciones devuelve estructura vacía', function () {
		var back = ActiveRoute.parseQuery({});
		expect(back.columns).toHaveLength(0);
		expect(back.tree).toBeNull();
		expect(back.places).toHaveLength(0);
		expect(ActiveRoute.hasContent(back)).toBeFalsy();
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
