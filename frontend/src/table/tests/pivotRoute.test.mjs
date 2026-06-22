/*
 * pivotRoute.test.mjs — pruebas de serialización/parseo de la ruta.
 *
 * Correr:
 *     node table-tests/pivotRoute.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import { ComposeQuery, ParseQuery } from '../classes/pivotRoute.js';

// Helper: arma secciones, compone a query, parsea de vuelta.
function roundTrip(sections) {
	return ParseQuery(ComposeQuery(sections));
}

describe('round-trip de columnas', function () {
	it('preserva el id y las versiones múltiples', function () {
		var sections = {
			columns: [{ id: 42, versionIds: [2010, 2022], levelId: 5, variableId: 7, summary: 'I', selection: {} }],
			rows: [], filters: []
		};
		var back = roundTrip(sections);
		expect(back.columns).toHaveLength(1);
		expect(back.columns[0].id).toBe(42);
		expect(back.columns[0].versionIds).toEqual([2010, 2022]);
	});
	it('una sola versión también sobrevive', function () {
		var sections = { columns: [{ id: 1, versionIds: [2010], levelId: 2, variableId: 3, selection: {} }], rows: [], filters: [] };
		var back = roundTrip(sections);
		expect(back.columns[0].versionIds).toEqual([2010]);
	});
});

describe('round-trip de selección de categorías', function () {
	it('preserva labels e includeTotal por versión', function () {
		var sections = {
			columns: [{
				id: 9, versionIds: [2010], levelId: 1, variableId: 1,
				selection: { 2010: { labels: [101, 102], includeTotal: true } }
			}],
			rows: [], filters: []
		};
		var back = roundTrip(sections);
		var sel = back.columns[0].selection;
		expect(sel).toBeTruthy();
		expect(sel[2010].labels).toEqual([101, 102]);
		expect(sel[2010].includeTotal).toBeTruthy();
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
		var back = ParseQuery({});
		expect(back.columns).toHaveLength(0);
		expect(back.rows).toHaveLength(0);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
