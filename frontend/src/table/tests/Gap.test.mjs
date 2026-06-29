/*
 * Verifica la matemática de las variables de brecha (gap), de forma autocontenida
 * (sin depender del helper del visor): el delta de incidencia y el ponderador.
 * Replica las fórmulas que el código aplica (pivotValue.valueTuple + helper
 * calculateValue para el delta; weightFromCell para el ponderador), para fijar el
 * comportamiento esperado y detectar regresiones en la aritmética.
 */

import { describe, it, expect, report } from './_harness.mjs';

// Réplica de helper.calculateValue para tuples de gap (los términos ya vienen
// normalizados: value/normalization).
function calcTerm(value, normalization) {
	if (normalization === 0) return 0;
	if (normalization == null) return value;
	return value / normalization;
}
function calcGap(tuple) {
	var v1 = calcTerm(tuple.value, tuple.normalization);
	var v2 = calcTerm(tuple.valueGap, tuple.normalizationGap);
	return tuple.isPercentage ? (v2 - v1) : ((v2 / v1 - 1) * 100);
}

// Réplica de la rama de gap de valueTuple (modo incidencia).
function gapTuple(variable, cell) {
	var scale = variable.NormalizationScale || 1;
	return {
		isGap: true,
		isPercentage: scale === 100,
		value: Number(cell.Value),
		normalization: Number(cell.Total) / scale,
		valueGap: Number(cell.ValueGap),
		normalizationGap: Number(cell.TotalGap) / scale
	};
}

// Réplica de la rama TOTAL_WEIGHTED de weightFromCell para gap.
function gapWeight(meta, cell) {
	var total = Number(cell.Total);
	if (meta.isGap && cell.TotalGap != null) {
		var totalGap = Number(cell.TotalGap);
		return meta.hasGapSameTotal ? total : (total + totalGap);
	}
	return total;
}

describe('Gap — delta de incidencia', function () {
	it('variable porcentual (scale 100): el delta es la resta de puntos', function () {
		// Con scale 100: term1 = 20/(100/100) = 20 ; term2 = 35 ; delta = 15 puntos.
		var variable = { IsGap: true, NormalizationScale: 100 };
		var cell = { Value: 20, Total: 100, ValueGap: 35, TotalGap: 100 };
		var t = gapTuple(variable, cell);
		expect(t.isPercentage).toBe(true);
		expect(calcGap(t)).toBeCloseTo(15, 6);
	});

	it('variable no porcentual: el delta es la variación relativa en %', function () {
		// term1 = 50/200 = 0.25 ; term2 = 90/200 = 0.45 ; (0.45/0.25 - 1)*100 = 80%.
		var variable = { IsGap: true, NormalizationScale: 1 };
		var cell = { Value: 50, Total: 200, ValueGap: 90, TotalGap: 200 };
		var t = gapTuple(variable, cell);
		expect(t.isPercentage).toBe(false);
		expect(calcGap(t)).toBeCloseTo(80, 6);
	});
});

describe('Gap — ponderador', function () {
	it('suma Total + TotalGap cuando no comparten total', function () {
		var meta = { isGap: true, hasGapSameTotal: false };
		expect(gapWeight(meta, { Total: 120, TotalGap: 80 })).toBe(200);
	});

	it('usa un solo total cuando HasGapSameTotal (no sobrepondera)', function () {
		var meta = { isGap: true, hasGapSameTotal: true };
		expect(gapWeight(meta, { Total: 120, TotalGap: 120 })).toBe(120);
	});

	it('sin gap, el ponderador es el Total', function () {
		var meta = { isGap: false, hasGapSameTotal: false };
		expect(gapWeight(meta, { Total: 150, TotalGap: null })).toBe(150);
	});
});

describe('Gap — saneo de resultados no finitos', function () {
	// Cuando el término base es 0, la variación relativa es indefinida (división
	// por cero → NaN/Infinity). El valor mostrado debe ser no-mostrable, no NaN.
	function gapResult(scale, cell) {
		var t = gapTuple({ NormalizationScale: scale, IsGap: true }, cell);
		var r = calcGap(t);
		return isFinite(r) ? r : '-';
	}
	it('base 0 con gap 0 (variación indefinida) → no-mostrable', function () {
		expect(gapResult(1, { Value: 0, Total: 17379, ValueGap: 0, TotalGap: 18536 })).toBe('-');
	});
	it('base 0 con gap > 0 (variación infinita) → no-mostrable', function () {
		expect(gapResult(1, { Value: 0, Total: 17379, ValueGap: 6193, TotalGap: 18536 })).toBe('-');
	});
	it('valores válidos → delta numérico', function () {
		expect(gapResult(1, { Value: 7090, Total: 17379, ValueGap: 6193, TotalGap: 18536 })).toBeCloseTo(-18.1038, 3);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
