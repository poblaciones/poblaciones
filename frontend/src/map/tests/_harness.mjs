// Micro-harness de tests del módulo map. Mismo contrato que el del módulo
// tabla: describe/it/expect con soporte async (cola interna) y lista CERRADA
// de matchers: toBe, toEqual, toBeCloseTo, toBeNull, toBeTruthy, toBeFalsy,
// toHaveLength. No agregar matchers sin actualizar las pautas.

let passed = 0;
let failed = 0;
const failures = [];
const queue = [];
let currentSuite = '';

export function describe(name, fn) {
	queue.push({ type: 'suite', name });
	if (fn) {
		fn();
	}
}

export function it(name, fn) {
	queue.push({ type: 'test', name, fn });
}

function fail(message) {
	throw new Error(message);
}

function deepEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
		return false;
	}
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) {
		return false;
	}
	for (const key of keysA) {
		if (!deepEqual(a[key], b[key])) {
			return false;
		}
	}
	return true;
}

export function expect(actual) {
	return {
		toBe(expected) {
			if (actual !== expected) {
				fail('esperado ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
			}
		},
		toEqual(expected) {
			if (!deepEqual(actual, expected)) {
				fail('esperado (deep) ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
			}
		},
		toBeCloseTo(expected, digits = 2) {
			const tolerance = Math.pow(10, -digits) / 2;
			if (typeof actual !== 'number' || Math.abs(actual - expected) > tolerance) {
				fail('esperado ~' + expected + ' (±' + tolerance + '), obtenido ' + actual);
			}
		},
		toBeNull() {
			if (actual !== null) {
				fail('esperado null, obtenido ' + JSON.stringify(actual));
			}
		},
		toBeTruthy() {
			if (!actual) {
				fail('esperado truthy, obtenido ' + JSON.stringify(actual));
			}
		},
		toBeFalsy() {
			if (actual) {
				fail('esperado falsy, obtenido ' + JSON.stringify(actual));
			}
		},
		toHaveLength(expected) {
			if (!actual || actual.length !== expected) {
				fail('esperado length ' + expected + ', obtenido ' + (actual ? actual.length : actual));
			}
		},
	};
}

export async function report() {
	for (const entry of queue) {
		if (entry.type === 'suite') {
			currentSuite = entry.name;
		} else {
			try {
				await entry.fn();
				passed++;
			} catch (e) {
				failed++;
				failures.push({ suite: currentSuite, test: entry.name, message: e.message });
			}
		}
	}
	for (const f of failures) {
		console.error('FALLO  [' + f.suite + '] ' + f.test + '\n       ' + f.message);
	}
	console.log(passed + ' pasaron, ' + failed + ' fallaron');
	if (failed > 0) {
		process.exitCode = 1;
	}
}
