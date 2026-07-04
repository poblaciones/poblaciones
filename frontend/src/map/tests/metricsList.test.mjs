import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import MetricsList from '@/map/classes/MetricsList';

// Capa falsa con el contrato mínimo que MetricsList exige. resolveTo indica a
// qué segmento de apilamiento va (se resuelve contra la lista al insertarse).
function makeLayer(list, resolveTo, overrides) {
	const layer = Object.assign({
		index: -1,
		IsLocked: false,
		isBoundary: false,
		isBaseMetric: false,
		properties: { Metric: { Id: 0 } },
		objs: { Segment: null },
		Visible() { return true; },
		ResolveSegment() { this.objs.Segment = list[resolveTo]; },
		UpdateSummary() {},
		UpdateRanking() {},
		GetVariableById() { return null; },
	}, overrides);
	return layer;
}

function makeList() {
	setupWindow();
	return new MetricsList([]);
}

describe('MetricsList: inserción y orden');

it('AddStandardMetric agrega, indexa y ubica en su segmento', () => {
	const list = makeList();
	const layer = makeLayer(list, 'GeoShapesSegment', { properties: { Metric: { Id: 7 } } });
	list.AddStandardMetric(layer);
	expect(list.metrics).toHaveLength(1);
	expect(layer.index).toBe(0);
	expect(list.GeoShapesSegment).toHaveLength(1);
	expect(list.GeoShapesSegment[0]).toBe(layer);
});

it('una capa no visible entra a metrics pero no a su segmento', () => {
	const list = makeList();
	const layer = makeLayer(list, 'GeoShapesSegment', { Visible() { return false; } });
	list.AddStandardMetric(layer);
	expect(list.metrics).toHaveLength(1);
	expect(list.GeoShapesSegment).toHaveLength(0);
});

it('AddStandardMetric inserta después de las capas bloqueadas', () => {
	const list = makeList();
	const locked = makeLayer(list, 'GeoShapesSegment', { IsLocked: true });
	const first = makeLayer(list, 'GeoShapesSegment');
	const second = makeLayer(list, 'GeoShapesSegment');
	list.AddStandardMetric(locked);
	list.AddStandardMetric(first);
	list.AddStandardMetric(second);
	// La última agregada queda inmediatamente después de las bloqueadas.
	expect(list.metrics[0]).toBe(locked);
	expect(list.metrics[1]).toBe(second);
	expect(list.metrics[2]).toBe(first);
});

it('updateMetricIndexes mantiene los índices contiguos tras remover', () => {
	const list = makeList();
	const a = makeLayer(list, 'GeoShapesSegment');
	const b = makeLayer(list, 'LocationsSegment');
	const c = makeLayer(list, 'GeoShapesSegment');
	list.AppendStandardMetric(a);
	list.AppendStandardMetric(b);
	list.AppendStandardMetric(c);
	list.Remove(b);
	expect(a.index).toBe(0);
	expect(c.index).toBe(1);
	expect(b.index).toBe(-1);
	expect(list.LocationsSegment).toHaveLength(0);
});

describe('MetricsList: posición absoluta en el mapa (z-order)');

it('CalculateMapPosition suma los largos de los segmentos previos', () => {
	const list = makeList();
	const label = makeLayer(list, 'LabelsSegment');
	const shape = makeLayer(list, 'GeoShapesSegment');
	const location = makeLayer(list, 'LocationsSegment');
	list.AppendNonStandardMetric(label);
	list.AppendStandardMetric(shape);
	list.AppendStandardMetric(location);
	// Orden de segmentos: Labels, BaseGeoShapes, BaseLocations, GeoShapes,
	// Patterns, AnnotationsShapes, Locations, AnnotationsLocations, Clipping.
	expect(list.CalculateMapPosition(list.LabelsSegment, 0)).toBe(0);
	expect(list.CalculateMapPosition(list.GeoShapesSegment, 0)).toBe(1);
	expect(list.CalculateMapPosition(list.LocationsSegment, 0)).toBe(2);
});

it('una capa base se apila debajo de las capas de datos aunque se agregue después', () => {
	const list = makeList();
	const shape = makeLayer(list, 'GeoShapesSegment');
	const base = makeLayer(list, 'BaseGeoShapesSegment', { isBaseMetric: true });
	list.AppendStandardMetric(shape);
	list.AppendNonStandardMetric(base);
	expect(list.CalculateMapPosition(list.BaseGeoShapesSegment, 0)).toBe(0);
	expect(list.CalculateMapPosition(list.GeoShapesSegment, 0)).toBe(1);
});

describe('MetricsList: movimiento y búsqueda');

it('MoveFrom desplaza contando desde las capas bloqueadas', () => {
	const list = makeList();
	const locked = makeLayer(list, 'GeoShapesSegment', { IsLocked: true });
	const a = makeLayer(list, 'GeoShapesSegment');
	const b = makeLayer(list, 'GeoShapesSegment');
	list.AppendStandardMetric(locked);
	list.AppendStandardMetric(a);
	list.AppendStandardMetric(b);
	list.MoveFrom(0, 1); // mueve "a" (primera no bloqueada) al lugar de "b"
	expect(list.metrics[0]).toBe(locked);
	expect(list.metrics[1]).toBe(b);
	expect(list.metrics[2]).toBe(a);
});

it('GetMetricById ignora boundaries y capas base', () => {
	const list = makeList();
	const metric = makeLayer(list, 'GeoShapesSegment', { properties: { Metric: { Id: 5 } } });
	const boundary = makeLayer(list, 'PatternsSegment', { isBoundary: true, properties: { Id: 5, Metric: { Id: 5 } } });
	list.AppendStandardMetric(boundary);
	list.AppendStandardMetric(metric);
	expect(list.GetMetricById(5)).toBe(metric);
	expect(list.GetBoundaryById(5)).toBe(boundary);
});
