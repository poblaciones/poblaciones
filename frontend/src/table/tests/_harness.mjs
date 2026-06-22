/*
 * _harness.mjs — micro-framework de pruebas sin dependencias.
 *
 * No requiere runner externo. Provee describe/it/expect y un resumen final.
 * Cada archivo de test lo importa y al final llama a report() (o se usa
 * run-all.mjs que agrega varios).
 *
 * Uso individual:
 *     node table-tests/pivotStats.test.mjs
 * Uso de toda la batería:
 *     node table-tests/run-all.mjs
 */

var _suites = [];
var _current = null;
var _stats = { pass: 0, fail: 0, failures: [] };
var _pending = [];   // promesas de tests async aún en curso

export function describe(name, fn) {
	_current = { name: name };
	_suites.push(_current);
	fn();
	_current = null;
}

export function it(name, fn) {
	var suiteName = _current ? _current.name : '(suelto)';
	function pass() { _stats.pass++; console.log('  \u2713 ' + name); }
	function fail(e) {
		_stats.fail++;
		_stats.failures.push({ suite: suiteName, test: name, error: e.message });
		console.log('  \u2717 ' + name);
		console.log('      ' + e.message);
	}
	var r;
	try {
		r = fn();
	} catch (e) { fail(e); return; }
	if (r && typeof r.then === 'function') {
		// Test async: se encola para esperarlo antes del reporte.
		_pending.push(r.then(pass, fail));
	} else {
		pass();
	}
}

// Espera a que terminen los tests async encolados.
export async function flush() {
	await Promise.all(_pending);
	_pending = [];
}

// Comparaciones. Para floats se usa una tolerancia configurable.
export function expect(actual) {
	return {
		toBe: function (expected) {
			if (actual !== expected) {
				throw new Error('esperaba ' + fmt(expected) + ' pero recibió ' + fmt(actual));
			}
		},
		toEqual: function (expected) {
			if (JSON.stringify(actual) !== JSON.stringify(expected)) {
				throw new Error('esperaba ' + JSON.stringify(expected) + ' pero recibió ' + JSON.stringify(actual));
			}
		},
		toBeCloseTo: function (expected, tol) {
			tol = (tol == null) ? 1e-6 : tol;
			if (!(Math.abs(actual - expected) <= tol)) {
				throw new Error('esperaba ' + expected + ' \u00b1 ' + tol + ' pero recibió ' + actual);
			}
		},
		toBeNull: function () {
			if (actual !== null) throw new Error('esperaba null pero recibió ' + fmt(actual));
		},
		toBeTruthy: function () {
			if (!actual) throw new Error('esperaba un valor verdadero pero recibió ' + fmt(actual));
		},
		toBeFalsy: function () {
			if (actual) throw new Error('esperaba un valor falso pero recibió ' + fmt(actual));
		},
		toHaveLength: function (n) {
			if (!actual || actual.length !== n) {
				throw new Error('esperaba longitud ' + n + ' pero recibió ' + (actual ? actual.length : 'undefined'));
			}
		}
	};
}

function fmt(v) {
	if (typeof v === 'object') return JSON.stringify(v);
	return String(v);
}

export async function report() {
	await flush();
	console.log('');
	console.log('────────────────────────────────────');
	console.log('  ' + _stats.pass + ' pasaron, ' + _stats.fail + ' fallaron');
	if (_stats.fail > 0) {
		console.log('');
		_stats.failures.forEach(function (f) {
			console.log('  \u2717 [' + f.suite + '] ' + f.test);
			console.log('      ' + f.error);
		});
	}
	console.log('────────────────────────────────────');
	return _stats.fail === 0;
}

export function exitCode() {
	return _stats.fail === 0 ? 0 : 1;
}
