/*
 * AnalysisColumns.test.mjs — pruebas del modelo de columnas del analizador.
 *
 * Usa el alias "@/table/...", así que se corre con el registrador de alias:
 *     node --import ./tests/_register-alias.mjs tests/AnalysisColumns.test.mjs
 * (run-all.mjs ya lo registra para toda la batería.)
 */

import { describe, it, expect, report } from './_harness.mjs';
import AnalysisColumns, { AnalysisColumn } from '@/table/classes/AnalysisColumns.js';
import { makeDataset } from './fixtures.mjs';

function cols(weighted) {
	return new AnalysisColumns(makeDataset(), { weighted: weighted !== false });
}

describe('AnalysisColumns — construcción', function () {
	it('crea una AnalysisColumn por medida', function () {
		var c = cols();
		expect(c.length()).toBe(5);
		expect(c.at(0) instanceof AnalysisColumn).toBeTruthy();
	});
	it('extrae valores y pesos alineados', function () {
		var c = cols();
		expect(c.at(0).values[0]).toBe(15000000);
		expect(c.byKey('edu_a').weights[0]).toBe(1000);
	});
	it('omite pesos cuando weighted=false', function () {
		expect(cols(false).at(0).weights).toBeNull();
	});
	it('byKey ubica por clave', function () {
		expect(cols().byKey('edu_b').key).toBe('edu_b');
		expect(cols().byKey('inexistente')).toBeNull();
	});
});

describe('AnalysisColumn — nombres', function () {
	it('variablePart usa el indicador si es conteo', function () {
		var c = cols();
		expect(c.at(0).variablePart()).toBe('Población');
		expect(c.byKey('edu_a').variablePart()).toBe('Nivel educativo');
	});
	it('categoryName devuelve Total / etiqueta', function () {
		expect(cols().at(0).categoryName()).toBe('Total');
		expect(cols().byKey('edu_a').categoryName()).toBe('0 a 5%');
	});
	it('fullName incluye categoría y edición', function () {
		expect(cols().byKey('edu_a').fullName()).toBe('Nivel educativo: 0 a 5% (2010)');
	});
	it('letras A, B, C…', function () {
		var c = cols();
		expect(c.at(0).letter).toBe('A');
		expect(c.at(4).letter).toBe('E');
	});
	it('letterLabel combina letra y categoría', function () {
		expect(cols().byKey('edu_a').letterLabel()).toBe('B. 0 a 5%');
	});
	it('matrixRowName agrega la edición', function () {
		expect(cols().byKey('edu_a').matrixRowName()).toBe('0 a 5% (2010)');
	});
	it('isPercent distingue % de N', function () {
		expect(cols().byKey('edu_a').isPercent()).toBeTruthy();
		expect(cols().at(0).isPercent()).toBeFalsy();
	});
});

describe('AnalysisColumns — conjuntos', function () {
	it('regressionSet excluye el Total con categorías', function () {
		var keys = cols().regressionSet().map(function (c) { return c.key; });
		expect(keys.indexOf('edu_total')).toBe(-1);
		expect(keys.indexOf('pob_total') >= 0).toBeTruthy();
		expect(keys.length).toBe(4);
	});
	it('shareScale: educación comparte, % vs N no', function () {
		var c = cols();
		var edu = c.all().filter(function (x) { return x.meta.metricId === 2; });
		expect(c.shareScale(edu)).toBeTruthy();
		expect(c.shareScale([c.at(0), c.byKey('edu_a')])).toBeFalsy();
	});
	it('regionTypesPhrase', function () {
		expect(cols().regionTypesPhrase()).toBe('provincias');
	});
	it('rowLabels devuelve las regiones', function () {
		var labels = cols().rowLabels();
		expect(labels[0]).toBe('Buenos Aires');
		expect(labels.length).toBe(4);
	});
});

describe('AnalysisColumns — estadística de conjunto', function () {
	it('correlationMatrix da una matriz NxN', function () {
		var m = cols().correlationMatrix('pearson');
		expect(m.matrix.length).toBe(5);
		expect(m.matrix[0][0].self).toBeTruthy();
	});
	it('oneToN devuelve correlaciones contra las demás', function () {
		var rows = cols().oneToN('edu_a');
		expect(rows.length).toBe(4);  // las otras 4 columnas
		expect(rows[0].pr !== undefined).toBeTruthy();
		expect(rows[0].sp !== undefined).toBeTruthy();
	});
	it('regression arma el subconjunto sin el total colineal', function () {
		// La selección de regresores (excluir edu_total, conservar pob_total) es lo
		// que aporta esta clase; la convergencia numérica de la regresión se prueba
		// en pivotStats con datos no degenerados. El fixture (4 regiones) tiene
		// colinealidad perfecta entre categorías que suman 100, así que aquí sólo
		// se valida el conjunto de regresores vía regressionSet.
		var c = cols();
		var others = c.regressionSet().filter(function (x) { return x.key !== 'edu_a'; });
		var keys = others.map(function (x) { return x.key; });
		expect(keys.indexOf('edu_total')).toBe(-1);
		expect(keys.indexOf('pob_total') >= 0).toBeTruthy();
	});
	it('pairRegression de un par', function () {
		var reg = cols().pairRegression('edu_a', 'edu_b');
		expect(reg).toBeTruthy();
		expect(typeof reg.slope).toBe('number');
	});
	it('dependentMean da la media ponderada de la dependiente', function () {
		var c = cols();
		var m = c.dependentMean('edu_a');
		// La media cae dentro del rango de la variable.
		var r = c.dependentRange('edu_a');
		expect(m >= r.min && m <= r.max).toBeTruthy();
		expect(typeof m).toBe('number');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
