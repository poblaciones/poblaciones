/*
 * pivotStats.test.mjs — pruebas de las funciones estadísticas ponderadas.
 *
 * Correr:
 *     node table-tests/pivotStats.test.mjs
 * (o, para toda la batería:  node table-tests/run-all.mjs )
 */

import { describe, it, expect, report, exitCode } from './_harness.mjs';
import stats from '../js/pivotStats.js';
import { seriesUniform, seriesWeighted, pairs, corrColumns } from './fixtures.mjs';

describe('weightedMean', function () {
	it('media uniforme', function () {
		expect(stats.weightedMean(seriesUniform.values, seriesUniform.weights)).toBeCloseTo(seriesUniform.mean);
	});
	it('media ponderada (pesos no uniformes)', function () {
		expect(stats.weightedMean(seriesWeighted.values, seriesWeighted.weights)).toBeCloseTo(seriesWeighted.mean);
	});
	it('ignora nulos', function () {
		expect(stats.weightedMean([10, null, 20], [1, 1, 1])).toBeCloseTo(15);
	});
});

describe('describe', function () {
	it('min/max/mean coherentes', function () {
		var d = stats.describe(seriesUniform.values, seriesUniform.weights);
		expect(d.min).toBe(10);
		expect(d.max).toBe(60);
		expect(d.mean).toBeCloseTo(35);
		expect(d.n).toBe(6);
	});
	it('cuenta filas válidas (n) descartando nulos', function () {
		var d = stats.describe([1, 2, null, 4], [1, 1, 1, 1]);
		expect(d.n).toBe(3);
	});
});

describe('weightedPearson', function () {
	it('correlación positiva perfecta', function () {
		var r = stats.weightedPearson(pairs.x, pairs.yPos, pairs.weights);
		expect(r.r).toBeCloseTo(1, 1e-9);
		expect(r.n).toBe(5);
	});
	it('correlación negativa perfecta', function () {
		var r = stats.weightedPearson(pairs.x, pairs.yNeg, pairs.weights);
		expect(r.r).toBeCloseTo(-1, 1e-9);
	});
});

describe('weightedSpearman', function () {
	it('monótona creciente da +1', function () {
		var r = stats.weightedSpearman(pairs.x, pairs.yPos, pairs.weights);
		expect(r.r).toBeCloseTo(1, 1e-9);
	});
});

describe('correlationMatrix', function () {
	it('es asimétrica cuando los pesos difieren', function () {
		var m = stats.correlationMatrix(corrColumns, { method: 'pearson', weighting: { mode: 'auto' } });
		expect(m.symmetric).toBeFalsy();
		// A->B y B->A no coinciden por usar pesos de fila distintos
		var ab = m.matrix[0][1].r, ba = m.matrix[1][0].r;
		expect(Math.abs(ab - ba) > 1e-6).toBeTruthy();
	});
	it('diagonal marcada como self', function () {
		var m = stats.correlationMatrix(corrColumns, { method: 'pearson', weighting: { mode: 'auto' } });
		expect(m.matrix[0][0].self).toBeTruthy();
	});
});

describe('weightedLinearRegression', function () {
	it('recupera una relación lineal exacta', function () {
		// y = 3 + 2*x1 - 1*x2
		var x1 = [1, 2, 3, 4, 5, 6];
		var x2 = [2, 1, 4, 3, 6, 5];
		var y = x1.map(function (v, i) { return 3 + 2 * v - 1 * x2[i]; });
		var X = x1.map(function (v, i) { return [v, x2[i]]; });
		var reg = stats.weightedLinearRegression(y, X, null);
		expect(reg.coefficients[0]).toBeCloseTo(3, 1e-6);
		expect(reg.coefficients[1]).toBeCloseTo(2, 1e-6);
		expect(reg.coefficients[2]).toBeCloseTo(-1, 1e-6);
		expect(reg.rSquared).toBeCloseTo(1, 1e-6);
	});
});

describe('weightedSimpleRegression', function () {
	it('pendiente e intercepto de y = 2x + 1', function () {
		var xs = [1, 2, 3, 4];
		var ys = [3, 5, 7, 9];
		var reg = stats.weightedSimpleRegression(xs, ys, null);
		expect(reg.slope).toBeCloseTo(2, 1e-6);
		expect(reg.intercept).toBeCloseTo(1, 1e-6);
		expect(reg.rSquared).toBeCloseTo(1, 1e-6);
	});
});

describe('weightedQuantile', function () {
	it('mediana de una secuencia simple', function () {
		var m = stats.weightedMedian([1, 2, 3, 4, 5], [1, 1, 1, 1, 1]);
		expect(m).toBeCloseTo(3, 1e-6);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
