import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeBoundaryProperties } from './fixtures.mjs';
import SegmentedMap from '@/map/classes/SegmentedMap';

// RefreshSummaries se llama en cada movimiento de mapa / cambio de clipping
// (Clipping.js). Se caracteriza el guard agregado: solo se salta la
// actualización cuando el panel de estadísticas está colapsado Y la leyenda
// flotante está minimizada (nada visible que muestre el resultado). Se prueba
// contra el prototipo directamente (SegmentedMap.prototype.RefreshSummaries.call),
// sin instanciar la clase completa, dado el peso de su constructor.

function makeMetric() {
	const calls = { summary: 0, ranking: 0 };
	return {
		calls,
		UpdateSummary() { this.calls.summary++; },
		UpdateRanking() { this.calls.ranking++; },
	};
}

function callRefreshSummaries(collapsed, legendMinimized, metrics) {
	setupWindow();
	const fakeThis = {
		toolbarStates: { collapsed: collapsed, legendMinimized: legendMinimized },
		Metrics: { metrics: metrics },
	};
	SegmentedMap.prototype.RefreshSummaries.call(fakeThis);
}

describe('SegmentedMap.RefreshSummaries: se salta solo con todo oculto a la vez');

it('actualiza normalmente si el panel de estadísticas está visible', () => {
	const metric = makeMetric();
	callRefreshSummaries(false, true, [metric]);
	expect(metric.calls.summary).toBe(1);
	expect(metric.calls.ranking).toBe(1);
});

it('actualiza normalmente si la leyenda no está minimizada, aunque el panel esté colapsado', () => {
	const metric = makeMetric();
	callRefreshSummaries(true, false, [metric]);
	expect(metric.calls.summary).toBe(1);
});

it('se salta la actualización solo cuando ambos están ocultos', () => {
	const metric = makeMetric();
	callRefreshSummaries(true, true, [metric]);
	expect(metric.calls.summary).toBe(0);
	expect(metric.calls.ranking).toBe(0);
});

// Recientes (ActiveRecents): un indicador o delimitación agregado como base
// (isBaseMetric, ej. desde una comparación) no es una navegación del usuario
// hacia ese contenido, así que no debe ofrecerse después en "Visto
// recientemente".
describe('SegmentedMap.AddMetricBySelectedMetricInfo: no registra como reciente un indicador base');

function callAddMetricBySelectedMetricInfo(isBaseMetric) {
	setupWindow();
	const registerCalls = [];
	const fakeThis = {
		Metrics: { AppendNonStandardMetric() {}, AddStandardMetric() {} },
		Recents: { RegisterMetric(id, caption) { registerCalls.push({ id, caption }); } },
	};
	SegmentedMap.prototype.AddMetricBySelectedMetricInfo.call(fakeThis, makeMetricProperties(), null, isBaseMetric);
	return registerCalls;
}

it('un indicador estándar se registra como reciente', () => {
	const registerCalls = callAddMetricBySelectedMetricInfo(false);
	expect(registerCalls).toHaveLength(1);
});

it('un indicador base (isBaseMetric) no se registra como reciente', () => {
	const registerCalls = callAddMetricBySelectedMetricInfo(true);
	expect(registerCalls).toHaveLength(0);
});

describe('SegmentedMap.AddBoundaryById: no registra como reciente una delimitación base');

function callAddBoundaryById(isBaseMetric) {
	setupWindow();
	const registerCalls = [];
	const boundaryData = makeBoundaryProperties();
	const fakeThis = {
		Get() { return Promise.resolve({ data: boundaryData }); },
		Metrics: { AppendNonStandardMetric() {}, AddStandardMetric() {} },
		Session: { Content: { AddBoundary() {} } },
		Recents: { RegisterBoundary(id, caption) { registerCalls.push({ id, caption }); } },
	};
	return SegmentedMap.prototype.AddBoundaryById.call(fakeThis, boundaryData.Id, isBaseMetric).then(function () {
		return registerCalls;
	});
}

it('una delimitación estándar se registra como reciente', async () => {
	const registerCalls = await callAddBoundaryById(false);
	expect(registerCalls).toHaveLength(1);
});

it('una delimitación base (isBaseMetric) no se registra como reciente', async () => {
	const registerCalls = await callAddBoundaryById(true);
	expect(registerCalls).toHaveLength(0);
});
