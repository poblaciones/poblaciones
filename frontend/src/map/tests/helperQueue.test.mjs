import { describe, it, expect } from './_harness.mjs';
import h from '@/map/js/helper';
import Queue from '@/map/classes/Queue';

// helper.js concentra el cálculo y el formato de los valores que muestran los
// composers (FormatValue) y el panel de resumen. Estas pruebas fijan el
// contrato antes de tocar la presentación de segmentos.

describe('helper: formato numérico');

it('formatNum aplica decimales y locale es, y respeta los faltantes', () => {
	expect(h.formatNum(12345.67, 1)).toBe('12.345,7');
	expect(h.formatNum(3.5, 1)).toBe('3,5');
	expect(h.formatNum('')).toBe('-');
	expect(h.formatNum('-')).toBe('-');
	expect(h.formatNum('n/d')).toBe('n/d');
});

it('trimNumberCoords recorta a 6 decimales', () => {
	expect(h.trimNumberCoords(-34.6117521234)).toBeCloseTo(-34.611752, 6);
});

describe('helper: cálculo de valores');

it('calculateTerm normaliza salvo denominador nulo o ausente', () => {
	expect(h.calculateTerm(50, 2)).toBe(25);
	expect(h.calculateTerm(50, 0)).toBe(0);
	expect(h.calculateTerm(50, null)).toBe(50);
	expect(h.calculateTerm(50, undefined)).toBe(50);
});

it('buildValueTuple arma el par valor/normalización según la variable', () => {
	const variable = { HasTotals: true, NormalizationScale: 100, IsGap: false };
	const tuple = h.buildValueTuple(variable, { Value: 50, Total: 200 });
	expect(tuple.value).toBe(50);
	expect(tuple.normalization).toBe(2);
	expect(h.calculateValue(tuple)).toBe(25);
});

it('sin totales el valor va directo, sin normalización', () => {
	const variable = { HasTotals: false, IsGap: false };
	const tuple = h.buildValueTuple(variable, { Value: 7 });
	expect(tuple.normalization === undefined).toBeTruthy();
	expect(h.calculateValue(tuple)).toBe(7);
});

it('las brechas porcentuales restan los términos; las no porcentuales dan variación', () => {
	const percentGap = { HasTotals: true, NormalizationScale: 100, IsGap: true };
	const tuple = h.buildValueTuple(percentGap, { Value: 50, Total: 200, ValueGap: 60, TotalGap: 200 });
	// (60/2) - (50/2) = 5 puntos.
	expect(h.calculateValue(tuple)).toBe(5);
});

describe('helper: formato del valor calculado');

it('formatVariableValue: porcentaje para normalizadas, decimales propios si no', () => {
	expect(h.formatVariableValue({ HasTotals: true, IsGap: false }, 25)).toBe('25.0');
	expect(h.formatVariableValue({ HasTotals: false, IsGap: false, Decimals: 0 }, 1234)).toBe('1234');
	expect(h.formatVariableValue({ HasTotals: false, IsGap: false }, NaN)).toBe('-');
});

it('ResolveNormalizationCaption resuelve el sufijo según la escala', () => {
	expect(h.ResolveNormalizationCaption({ Normalization: 'población', NormalizationScale: 100 })).toBe('%');
	expect(h.ResolveNormalizationCaption({ Normalization: null })).toBe('');
});

describe('helper: claves de tile');

it('getFrameKey y getVariableFrameKey arman la clave x/y/z (con variable)', () => {
	expect(h.getFrameKey(3, 5, 10)).toBe('x=3&y=5&z=10');
	expect(h.getVariableFrameKey(9, 3, 5, 10)).toBe('v=9&x=3&y=5&z=10');
});

describe('Queue: concurrencia y deduplicación');

it('respeta el tope de requests simultáneos y arranca el siguiente al liberar', () => {
	const queue = new Queue(1);
	const started = [];
	let id1 = null;
	let id2 = null;
	queue.Enlist({}, function () { started.push('a'); }, null, (id) => { id1 = id; }, 'req-a');
	queue.Enlist({}, function () { started.push('b'); }, null, (id) => { id2 = id; }, 'req-b');
	expect(started).toEqual(['a']);
	queue.Release(id1);
	expect(started).toEqual(['a', 'b']);
	queue.Release(id2);
	expect(queue.runningRequests).toBe(0);
});

it('GetSameRequest devuelve el contexto del pedido idéntico pendiente', () => {
	const queue = new Queue(1);
	const context = { name: 'primero' };
	queue.Enlist(context, function () {}, null, () => {}, 'misma-info');
	expect(queue.GetSameRequest('misma-info')).toBe(context);
	expect(queue.GetSameRequest('otra')).toBeNull();
});

it('RequestOnceNotificationIdle se resuelve cuando la cola queda vacía', async () => {
	const queue = new Queue(2);
	let requestId = null;
	queue.Enlist({}, function () {}, null, (id) => { requestId = id; }, 'x');
	let idle = false;
	const promise = queue.RequestOnceNotificationIdle().then(() => { idle = true; });
	expect(idle).toBeFalsy();
	queue.Release(requestId);
	await promise;
	expect(idle).toBeTruthy();
});
