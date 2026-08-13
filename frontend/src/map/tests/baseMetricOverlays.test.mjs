import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeBoundaryProperties } from './fixtures.mjs';
import { makeOverlayApi, makeOverlay, methodSource } from './_leafletOverlayHarness.mjs';
import MetricsList from '@/map/classes/MetricsList';
import ActiveBaseMetric from '@/map/classes/ActiveBaseMetric';
import SegmentedMap from '@/map/classes/SegmentedMap';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import ActiveBaseBoundary from '@/map/classes/ActiveBaseBoundary';

// Contexto: la correspondencia entre una capa y su overlay de Leaflet es
// puramente POSICIONAL (un entero `index`), nunca por identidad. MetricsList
// calcula esa posición (CalculateMapPosition, suma de largos de segmentos) y
// se la pasa a MapsApi.InsertSelectedMetricOverlay / RemoveOverlay. Basta con
// que quede desfasada un instante para que del mapa desaparezca la capa
// equivocada, sin ningún error visible.

function makeBaseMetric(name, id) {
	const properties = makeMetricProperties({
		Metric: { Id: id, Name: name, Signature: 's' },
		Versions: [makeVersion({
			Levels: [makeLevel({ Dataset: { Type: 'D', AreSegments: false, ShowInfo: true, Marker: null, Id: 1 } })],
		})],
	});
	const metric = new ActiveBaseMetric(properties);
	metric.name = name;
	return metric;
}

describe('LeafletApi: contabilidad de índices de overlays (código real del archivo)');

it('doInsertOverlay/RemoveOverlay mantienen los índices contiguos', () => {
	const api = makeOverlayApi();
	const a = makeOverlay('A');
	const b = makeOverlay('B');
	const c = makeOverlay('C');
	api.doInsertOverlay(0, a);
	api.doInsertOverlay(1, b);
	api.doInsertOverlay(2, c);
	expect(api.overlayMapTypesLayers.map(l => l.name + l.index).join(',')).toBe('A0,B1,C2');
	api.RemoveOverlay(1);
	expect(api.overlayMapTypesLayers.map(l => l.name + l.index).join(',')).toBe('A0,C1');
	expect(b.disposed).toBeTruthy();
});

it('RemoveOverlay reindexa correctamente a los posteriores (el bucle interno ya no pisa la variable del externo)', () => {
	// Ambos bucles usaban `var layer`, que es de alcance de función: el interno
	// reasignaba la variable del externo. Funcionaba de casualidad por el break
	// inmediato; con nombres distintos deja de depender de eso.
	const api = makeOverlayApi();
	const layers = ['A', 'B', 'C', 'D'].map(makeOverlay);
	layers.forEach((l, i) => api.doInsertOverlay(i, l));
	api.RemoveOverlay(0);
	expect(api.overlayMapTypesLayers.map(l => l.name + l.index).join(',')).toBe('B0,C1,D2');
});

it('RemoveOverlay identifica el overlay SOLO por índice: con uno desfasado remueve una capa ajena', () => {
	const api = makeOverlayApi();
	const a = makeOverlay('A');
	const b = makeOverlay('B');
	api.doInsertOverlay(0, a);
	api.doInsertOverlay(1, b);
	api.RemoveOverlay(0); // se pretendía quitar B, pero 0 es A
	expect(api.overlayMapTypesLayers.map(l => l.name).join(',')).toBe('B');
	expect(a.disposed).toBeTruthy();
	expect(b.disposed).toBeFalsy();
});

describe('LeafletApi: alta asíncrona de capas sin tiles (índice vigente vs. capturado)');

it('una capa base va por la vía asíncrona: useTiles() es false', () => {
	setupWindow();
	// Con useTiles() false, InsertSelectedMetricOverlay inserta primero un
	// LeafletNullOverlay y recién cuando resuelve GetMetricData() (un request
	// HTTP) llama a CreateDeckglLayer, que hace RemoveOverlay + doInsertOverlay.
	expect(makeBaseMetric('nacionales', 100).useTiles()).toBeFalsy();
});

it('tras insertarse otra capa, el índice capturado al pedir los datos ya apunta a otra capa', () => {
	// Este es el desfasaje que produce el síntoma reportado: al activar y
	// desactivar dos capas base repetidas veces, desaparece la equivocada.
	const api = makeOverlayApi();

	// Alta de "nacionales": overlay provisorio en la posición 0. Se pide su
	// data; el índice de ese momento es 0.
	const nullNacionales = makeOverlay('null-nacionales');
	const indiceCapturado = 0;
	api.doInsertOverlay(indiceCapturado, nullNacionales);

	// Antes de que resuelva, se da de alta "provinciales", que se ubica antes
	// en el segmento y empuja a "nacionales" una posición.
	api.doInsertOverlay(0, makeOverlay('null-provinciales'));

	// El índice capturado quedó viejo; el vigente lo mantiene el propio overlay.
	expect(nullNacionales.index).toBe(1);
	expect(indiceCapturado).toBe(0);
});

it('usando overlay.index (el vigente) se reemplaza el overlay correcto', () => {
	const api = makeOverlayApi();
	const nullNacionales = makeOverlay('null-nacionales');
	api.doInsertOverlay(0, nullNacionales);
	const nullProvinciales = makeOverlay('null-provinciales');
	api.doInsertOverlay(0, nullProvinciales);

	// Resuelve el pedido de "nacionales": CreateDeckglLayer usa overlay.index.
	const deckNacionales = makeOverlay('deck-nacionales');
	api.RemoveOverlay(nullNacionales.index);
	api.doInsertOverlay(nullNacionales.index, deckNacionales);

	expect(nullNacionales.disposed).toBeTruthy();
	expect(nullProvinciales.disposed).toBeFalsy();
	expect(api.overlayMapTypesLayers.map(l => l.name).sort().join(','))
		.toBe('deck-nacionales,null-provinciales');
});

describe('MetricsList: posición dentro del segmento (invariante: descendente por índice)');

// El segmento se ordena descendente por el índice en this.metrics, de modo que
// la métrica más nueva (índice 0, primera en el panel) quede última en el
// segmento: mapPos más alto = z-index más alto = dibujada arriba de todo.
function simulateInserts(list, targets) {
	const metrics = [];
	const segment = [];
	targets.forEach(function (entry) {
		const pos = list.CalculateSegmentPosition(segment, entry.target);
		const m = { name: entry.name, index: -1 };
		segment.splice(pos, 0, m);
		metrics.splice(entry.target, 0, m);
		metrics.forEach(function (x, i) { x.index = i; });
	});
	return { metrics: metrics, segment: segment };
}

function isDescending(segment) {
	for (var i = 1; i < segment.length; i++) {
		if (segment[i - 1].index < segment[i].index) {
			return false;
		}
	}
	return true;
}

it('altas por el camino habitual (AddStandardMetric, siempre en metrics[0]) dejan el segmento descendente', () => {
	setupWindow();
	const list = new MetricsList([]);
	const r = simulateInserts(list, [
		{ name: 'A', target: 0 }, { name: 'B', target: 0 }, { name: 'C', target: 0 },
	]);
	expect(r.metrics.map(m => m.name).join(',')).toBe('C,B,A');
	expect(r.segment.map(m => m.name).join(',')).toBe('A,B,C');
	expect(isDescending(r.segment)).toBeTruthy();
});

it('altas al final (AppendStandardMetric) también dejan el segmento descendente', () => {
	setupWindow();
	const list = new MetricsList([]);
	const r = simulateInserts(list, [
		{ name: 'A', target: 0 }, { name: 'B', target: 1 }, { name: 'C', target: 2 },
	]);
	expect(r.metrics.map(m => m.name).join(',')).toBe('A,B,C');
	expect(r.segment.map(m => m.name).join(',')).toBe('C,B,A');
	expect(isDescending(r.segment)).toBeTruthy();
});

it('una inserción intermedia (reordenar arrastrando) mantiene el invariante', () => {
	setupWindow();
	const list = new MetricsList([]);
	const r = simulateInserts(list, [
		{ name: 'A', target: 0 }, { name: 'B', target: 1 },
		{ name: 'C', target: 2 }, { name: 'D', target: 1 },
	]);
	expect(r.metrics.map(m => m.name).join(',')).toBe('A,D,B,C');
	expect(isDescending(r.segment)).toBeTruthy();
});

it('en un segmento vacío, la posición es 0', () => {
	setupWindow();
	const list = new MetricsList([]);
	expect(list.CalculateSegmentPosition([], 5)).toBe(0);
});

describe('MetricsList: alta y baja de capas base (todas con index -1)');

it('las capas base conservan index -1: nunca entran a this.metrics', () => {
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	segMap.MapsApi = null;
	const nacionales = makeBaseMetric('nacionales', 100);
	list.InsertNonStandardMetric(nacionales, -1);
	expect(nacionales.index).toBe(-1);
	expect(list.metrics).toHaveLength(0);
});

it('dos capas base sucesivas: la nueva se apila primera en el segmento (comportamiento sin cambios)', () => {
	// Todas las capas base tienen index -1, así que ninguna cumple
	// `index >= segment.length` y la nueva siempre cae en la posición 0. Es
	// el mismo resultado que daba el código anterior: la corrección de
	// CalculateSegmentPosition no altera el apilado de las capas base.
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	segMap.MapsApi = null;
	const nacionales = makeBaseMetric('nacionales', 100);
	const provinciales = makeBaseMetric('provinciales', 200);
	list.InsertNonStandardMetric(nacionales, -1);
	list.InsertNonStandardMetric(provinciales, -1);
	expect(list.BaseGeoShapesSegment.map(m => m.name).join(',')).toBe('provinciales,nacionales');
});

it('al quitar una capa base se calcula la posición de mapa de ESA capa, no de otra', () => {
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	const removed = [];
	const inserted = [];
	segMap.MapsApi = {
		InsertSelectedMetricOverlay(metric, pos) { inserted.push(metric.name + '@' + pos); },
		RemoveOverlay(pos) { removed.push(pos); },
	};
	const nacionales = makeBaseMetric('nacionales', 100);
	const provinciales = makeBaseMetric('provinciales', 200);
	list.InsertNonStandardMetric(nacionales, -1);
	list.InsertNonStandardMetric(provinciales, -1);
	// La segunda se inserta antes que la primera, empujándola a la posición 1.
	expect(inserted).toEqual(['nacionales@0', 'provinciales@0']);
	expect(list.BaseGeoShapesSegment.map(m => m.name).join(',')).toBe('provinciales,nacionales');

	// Quitar "nacionales" debe remover la posición 1, que es la suya ahora.
	list.Remove(nacionales, true);
	expect(removed).toEqual([1]);
	expect(list.BaseGeoShapesSegment.map(m => m.name).join(',')).toBe('provinciales');
});

describe('LeafletApi: InsertSelectedMetricOverlay no usa el índice capturado en los callbacks');

it('los callbacks asíncronos resuelven la posición desde overlay.index, no desde el index del alta', () => {
	// Guarda contra la regresión: el cuerpo de la vía sin tiles (la que usan
	// las capas base) debe llamar a CreateDeckglLayer y RemoveOverlay con
	// overlay.index, el índice vigente que mantienen doInsertOverlay y
	// RemoveOverlay, y no con el `index` recibido como parámetro, que para
	// cuando resuelve GetMetricData() puede apuntar a otra capa.
	const source = methodSource('InsertSelectedMetricOverlay');
	expect(source.includes('CreateDeckglLayer(activeMetric, data, overlay.index)')).toBeTruthy();
	expect(source.includes('CreateDeckglLayer(activeMetric, data, index)')).toBeFalsy();
	expect(source.includes('RemoveOverlay(overlay.index)')).toBeTruthy();
});

describe('SegmentedMap.ToggleBasemapMetric: reconciliación con la carga asíncrona');

// Se ejercita el método sobre un `this` mínimo, sin instanciar SegmentedMap
// (su constructor arrastra medio módulo). Mismo enfoque que el test de
// RefreshSummaries.
function makeToggleContext(loadResult) {
	const ctx = {
		SaveRoute: { UpdateRoute() {} },
		AddBaseMetricById: loadResult,
		ToggleBasemapMetric: SegmentedMap.prototype.ToggleBasemapMetric,
		ApplyBasemapMetricVisibility: SegmentedMap.prototype.ApplyBasemapMetricVisibility,
		LoadBasemapMetricLayers: SegmentedMap.prototype.LoadBasemapMetricLayers,
	};
	return ctx;
}

function makeFakeLayer(name) {
	return {
		name,
		shown: 0,
		hidden: 0,
		Show() { this.shown++; },
		Hide() { this.hidden++; },
	};
}

it('con las capas ya cargadas, alterna Show/Hide', () => {
	setupWindow();
	const ctx = makeToggleContext();
	const layer = makeFakeLayer('rutas');
	const basemapMetric = { Visible: true, layers: [layer] };
	ctx.ToggleBasemapMetric(basemapMetric);
	expect(basemapMetric.Visible).toBeFalsy();
	expect(layer.hidden).toBe(1);
	ctx.ToggleBasemapMetric(basemapMetric);
	expect(basemapMetric.Visible).toBeTruthy();
	expect(layer.shown).toBe(1);
});

it('si se apaga mientras la capa está en vuelo, al llegar se oculta', async () => {
	setupWindow();
	let resolveLoad;
	const pending = new Promise(function (r) { resolveLoad = r; });
	const ctx = makeToggleContext(function () { return pending; });
	const basemapMetric = { Visible: false, MetricIds: [1] };

	ctx.ToggleBasemapMetric(basemapMetric); // enciende y dispara la carga
	expect(basemapMetric.Visible).toBeTruthy();

	ctx.ToggleBasemapMetric(basemapMetric); // apaga antes de que resuelva
	expect(basemapMetric.Visible).toBeFalsy();

	const layer = makeFakeLayer('rutas');
	resolveLoad(layer);
	await pending;
	await Promise.resolve();

	expect(basemapMetric.layers).toEqual([layer]);
	expect(layer.hidden).toBe(1);
});

it('si se apaga y se vuelve a encender en vuelo, al llegar queda visible', async () => {
	setupWindow();
	let resolveLoad;
	const pending = new Promise(function (r) { resolveLoad = r; });
	const ctx = makeToggleContext(function () { return pending; });
	const basemapMetric = { Visible: false, MetricIds: [1] };

	ctx.ToggleBasemapMetric(basemapMetric); // enciende
	ctx.ToggleBasemapMetric(basemapMetric); // apaga
	ctx.ToggleBasemapMetric(basemapMetric); // enciende de nuevo
	expect(basemapMetric.Visible).toBeTruthy();

	const layer = makeFakeLayer('rutas');
	resolveLoad(layer);
	await pending;
	await Promise.resolve();

	expect(layer.hidden).toBe(0);
	expect(layer.shown).toBe(0); // ya viene insertada por AddBaseMetricById
});

it('un segundo encendido tras la carga no vuelve a pedir las capas', async () => {
	setupWindow();
	let pedidos = 0;
	const ctx = makeToggleContext(function () {
		pedidos++;
		return Promise.resolve(makeFakeLayer('rutas'));
	});
	const basemapMetric = { Visible: false, MetricIds: [1] };
	ctx.ToggleBasemapMetric(basemapMetric);
	await Promise.resolve();
	await Promise.resolve();
	ctx.ToggleBasemapMetric(basemapMetric); // apaga
	ctx.ToggleBasemapMetric(basemapMetric); // enciende
	expect(pedidos).toBe(1);
	expect(basemapMetric.layers).toHaveLength(1);
});

it('si el pedido de una capa falla, no rompe el resto', async () => {
	setupWindow();
	// doAddMetricById captura el error y resuelve con undefined.
	const ctx = makeToggleContext(function () { return Promise.resolve(undefined); });
	const basemapMetric = { Visible: false, MetricIds: [1] };
	ctx.ToggleBasemapMetric(basemapMetric);
	await Promise.resolve();
	await Promise.resolve();
	expect(basemapMetric.layers).toEqual([]);
});

describe('MetricsList.doInsert: no duplica una capa ya insertada');

it('un alta repetida de la misma capa no crea un segundo overlay', () => {
	// Una capa que ya está en el mapa puede recibir un segundo
	// InsertNonStandardMetric (p. ej. desde una carga asincrónica que llega
	// tarde). Duplicarla desfasa las posiciones de todos los overlays
	// siguientes, y al quitar una capa se remueve del mapa la de otra.
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	const inserted = [];
	segMap.MapsApi = {
		InsertSelectedMetricOverlay(metric, pos) { inserted.push(metric.name + '@' + pos); },
		RemoveOverlay() {},
	};
	const nacionales = makeBaseMetric('nacionales', 100);
	list.InsertNonStandardMetric(nacionales, -1);
	list.InsertNonStandardMetric(nacionales, -1); // repetido
	expect(inserted).toEqual(['nacionales@0']);
	expect(list.BaseGeoShapesSegment).toHaveLength(1);
});

it('Show() sobre una capa oculta la repone una sola vez', () => {
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	segMap.MapsApi = {
		InsertSelectedMetricOverlay() {},
		RemoveOverlay() {},
	};
	const nacionales = makeBaseMetric('nacionales', 100);
	nacionales.Show();
	nacionales.Hide();
	expect(list.BaseGeoShapesSegment).toHaveLength(0);
	nacionales.Show();
	expect(list.BaseGeoShapesSegment).toHaveLength(1);
	expect(nacionales.Visible()).toBeTruthy();
});

describe('ResolveSegment: una sola implementación decide la franja de apilamiento');

// ActiveMetric.ResolveSegment es el único lugar que decide la franja de una
// capa basada en métricas, para ambos valores de isBaseMetric. Estos tests
// fijan la tabla completa: que una clase de capas caiga en la franja
// equivocada es el riesgo que el modelo de segmentos separados busca evitar,
// y no se notaría salvo por el orden de dibujo.
function segmentFor(Clase, tipo) {
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({ Dataset: { Type: tipo, AreSegments: false, ShowInfo: true, Marker: null, Id: 1 } })],
		})],
	});
	const metric = new Clase(properties);
	metric.ResolveSegment();
	const segment = metric.objs.Segment;
	const nombres = ['LabelsSegment', 'BaseGeoShapesSegment', 'BaseLocationsSegment', 'GeoShapesSegment',
		'PatternsSegment', 'AnnotationsShapesSegment', 'LocationsSegment', 'AnnotationsLocationsSegment', 'ClippingSegment'];
	for (const nombre of nombres) {
		if (list[nombre] === segment) {
			return nombre;
		}
	}
	return null;
}

it('un indicador estándar cae en las franjas de usuario', () => {
	expect(segmentFor(ActiveSelectedMetric, 'L')).toBe('LocationsSegment');
	expect(segmentFor(ActiveSelectedMetric, 'D')).toBe('GeoShapesSegment');
	expect(segmentFor(ActiveSelectedMetric, 'S')).toBe('GeoShapesSegment');
});

it('una capa base cae en las franjas base, que se dibujan por debajo', () => {
	expect(segmentFor(ActiveBaseMetric, 'L')).toBe('BaseLocationsSegment');
	expect(segmentFor(ActiveBaseMetric, 'D')).toBe('BaseGeoShapesSegment');
	expect(segmentFor(ActiveBaseMetric, 'S')).toBe('BaseGeoShapesSegment');
});

it('un Dataset.Type desconocido falla ruidosamente, no cae en una franja al azar', () => {
	let lanzo = false;
	try {
		segmentFor(ActiveSelectedMetric, 'X');
	} catch (e) {
		lanzo = true;
	}
	expect(lanzo).toBeTruthy();
});

describe('Visibilidad: una sola bandera (this.visible) en todas las clases de capa');

it('ActiveBaseBoundary: tras Hide(), Visible() dice que no está visible', () => {
	// Hereda Show/Hide y Visible() de ActiveBoundary, así que las tres tocan
	// la misma bandera: ocultar la capa tiene que reflejarse en lo que el
	// objeto responde sobre sí mismo.
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	segMap.MapsApi = null;
	const boundary = new ActiveBaseBoundary(makeBoundaryProperties());
	expect(boundary.Visible()).toBeTruthy();
	boundary.Hide();
	expect(boundary.Visible()).toBeFalsy();
	boundary.Show();
	expect(boundary.Visible()).toBeTruthy();
});

it('ActiveBaseMetric: Show/Hide mueven la misma bandera que lee Visible()', () => {
	const segMap = setupWindow();
	const list = new MetricsList([]);
	segMap.Metrics = list;
	segMap.MapsApi = null;
	const metric = makeBaseMetric('nacionales', 100);
	expect(metric.Visible()).toBeTruthy();
	metric.Hide();
	expect(metric.Visible()).toBeFalsy();
	metric.Show();
	expect(metric.Visible()).toBeTruthy();
});

it('ActiveMetric: ChangeMetricVisibility mueve la misma bandera que lee Visible()', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties());
	metric.RefreshMap = function () {};
	expect(metric.Visible()).toBeTruthy();
	metric.ChangeMetricVisibility();
	expect(metric.Visible()).toBeFalsy();
	metric.ChangeMetricVisibility();
	expect(metric.Visible()).toBeTruthy();
});

it('Visible() de una métrica sigue exigiendo además una variable seleccionada', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties());
	expect(metric.Visible()).toBeTruthy();
	metric.SelectedLevel().SelectedVariableIndex = -1;
	expect(metric.Visible()).toBeFalsy();
});
