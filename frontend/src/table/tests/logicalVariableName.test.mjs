/*
 * logicalVariableName.test.mjs — desambiguación de variables homónimas en un nivel.
 *     node --import ./tests/_register-alias.mjs tests/logicalVariableName.test.mjs
 */
import { describe, it, expect, report } from './_harness.mjs';
import logicalVariableName from '@/table/classes/logicalVariableName.js';

function lvl(vars) { return { Variables: vars }; }

describe('logicalVariableName', function () {
	it('en el caso sano (sin homónimas) devuelve el Name tal cual', function () {
		var a = { Id: 1, Name: 'Población' };
		var b = { Id: 2, Name: 'Hogares' };
		var level = lvl([a, b]);
		expect(logicalVariableName(level, a)).toBe('Población');
		expect(logicalVariableName(level, b)).toBe('Hogares');
	});

	it('desambigua homónimas del mismo nivel por orden de aparición (#2, #3)', function () {
		var a = { Id: 1, Name: 'Población' };   // primera: sin sufijo
		var b = { Id: 2, Name: 'Población' };   // segunda: #2
		var c = { Id: 3, Name: 'Población' };   // tercera: #3
		var level = lvl([a, b, c]);
		expect(logicalVariableName(level, a)).toBe('Población');
		expect(logicalVariableName(level, b)).toBe('Población #2');
		expect(logicalVariableName(level, c)).toBe('Población #3');
	});

	it('cuenta solo las homónimas: otras variables en el medio no corren el ordinal', function () {
		var a = { Id: 1, Name: 'Población' };
		var x = { Id: 9, Name: 'Otra' };
		var b = { Id: 2, Name: 'Población' };
		var level = lvl([a, x, b]);
		expect(logicalVariableName(level, a)).toBe('Población');
		expect(logicalVariableName(level, x)).toBe('Otra');
		expect(logicalVariableName(level, b)).toBe('Población #2');
	});

	it('sin nivel devuelve el Name (no rompe)', function () {
		expect(logicalVariableName(null, { Id: 1, Name: 'Población' })).toBe('Población');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
