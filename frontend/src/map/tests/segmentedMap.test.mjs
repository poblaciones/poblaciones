import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
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
