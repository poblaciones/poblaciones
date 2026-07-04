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
			rows: [], filters: []
		};
		var back = roundTrip(sections);
		expect(back.columns).toHaveLength(1);
		expect(back.columns[0].id).toBe(42);
		expect(back.columns[0].versionIndexes).toEqual([0, 1]);
		expect(back.columns[0].levelIndex).toBe(2);
		expect(back.columns[0].variableIndex).toBe(3);
	});
	it('una sola versión también sobrevive', function () {
		var sections = { columns: [{ id: 1, versionIndexes: [0], levelIndex: 1, variableIndex: 2, selection: {} }], rows: [], filters: [] };
		var back = roundTrip(sections);
		expect(back.columns[0].versionIndexes).toEqual([0]);
	});
	it('los defaults (nivel 0, variable 0, summary N) se omiten y vuelven como default', function () {
		var sections = { columns: [{ id: 7, versionIndexes: [0], levelIndex: 0, variableIndex: 0, summary: 'N', selection: {} }], rows: [], filters: [] };
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
			rows: [], filters: []
		};
		var back = roundTrip(sections);
		var sel = back.columns[0].selection;
		expect(sel).toBeTruthy();
		expect(sel[0].labels).toEqual([101, 102]);
		expect(sel[0].includeTotal).toBeTruthy();
	});
});

describe('round-trip de regiones', function () {
	it('preserva delimitación completa (whole)', function () {
		var sections = { columns: [], rows: [{ id: 5, whole: true }], filters: [] };
		var back = roundTrip(sections);
		expect(back.rows[0].id).toBe(5);
		expect(back.rows[0].whole).toBeTruthy();
	});
	it('preserva items seleccionados', function () {
		var sections = { columns: [], rows: [{ id: 5, whole: false, items: [11, 12, 13] }], filters: [] };
		var back = roundTrip(sections);
		expect(back.rows[0].items).toEqual([11, 12, 13]);
	});
});

describe('query vacía', function () {
	it('sin secciones devuelve estructura vacía', function () {
		var back = ActiveRoute.parseQuery({});
		expect(back.columns).toHaveLength(0);
		expect(back.rows).toHaveLength(0);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
