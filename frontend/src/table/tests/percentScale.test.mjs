/*
 * percentScale.test.mjs — el techo escalonado para ejes en puntos porcentuales.
 */

import { describe, it, expect, report } from './_harness.mjs';
import percentScaleMax from '@/table/js/percentScale.js';

describe('percentScaleMax', function () {
	it('máximo real menor a 0.5 puntos → techo 1', function () {
		expect(percentScaleMax(0)).toBe(1);
		expect(percentScaleMax(0.2)).toBe(1);
		expect(percentScaleMax(0.49)).toBe(1);
	});
	it('máximo real desde 0.5 hasta 1 punto → techo 5', function () {
		expect(percentScaleMax(0.5)).toBe(5);
		expect(percentScaleMax(0.7)).toBe(5);
		expect(percentScaleMax(1)).toBe(5);
	});
	it('máximo real hasta 10 puntos → techo 25', function () {
		expect(percentScaleMax(1.01)).toBe(25);
		expect(percentScaleMax(3)).toBe(25);
		expect(percentScaleMax(10)).toBe(25);
	});
	it('máximo real hasta 25 puntos → techo 50', function () {
		expect(percentScaleMax(10.01)).toBe(50);
		expect(percentScaleMax(18)).toBe(50);
		expect(percentScaleMax(25)).toBe(50);
	});
	it('máximo real por encima de 25 (incluido cerca de 100 por redondeo) → techo 100', function () {
		expect(percentScaleMax(25.01)).toBe(100);
		expect(percentScaleMax(60)).toBe(100);
		expect(percentScaleMax(100)).toBe(100);
		expect(percentScaleMax(100.3)).toBe(100);   // fil%: compone ~100 con margen de redondeo
	});
	it('valores inválidos caen al techo por defecto (100)', function () {
		expect(percentScaleMax(null)).toBe(100);
		expect(percentScaleMax(undefined)).toBe(100);
		expect(percentScaleMax(NaN)).toBe(100);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
