import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import { methodSource } from './_leafletOverlayHarness.mjs';
import SegmentedMap from '@/map/classes/SegmentedMap';
import BasemapLayerSet from '@/map/classes/BasemapLayerSet';

function configLayers() {
	return [
		{ Id: 1, Type: 'L', Caption: 'Etiquetas', RouteTag: null, Metadata: { Id: 10 } },
		{ Id: 2, Type: 'R', Caption: 'Relieve', RouteTag: 'e', HideOnSatellite: true,
			Raster: { Url: 'http://t/{z}/{x}/{y}', Tms: true, MaxNativeZoom: 12, MaxZoom: 16, Opacity: 40 } },
		{ Id: 3, Type: 'M', Caption: 'Rutas', RouteTag: 'u', MetricIds: [5, 6] },
		{ Id: 4, Type: 'B', Caption: 'Provincias', RouteTag: 'j', BoundaryIds: [1] },
	];
}

describe('BasemapLayerSet.Build: forma de ejecución de las capas');

it('solo etiquetas arranca visible; indicadores y delimitaciones sin capas pedidas', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	expect(layers.map(l => l.Visible)).toEqual([true, false, false, false]);
	expect(layers[2].layers).toBeNull();
	expect(layers[2].loadPromise).toBeNull();
});

it('no modifica la configuración recibida', () => {
	const config = configLayers();
	BasemapLayerSet.Build(config);
	expect(config[0].Visible === undefined).toBeTruthy();
});

it('sin configuración devuelve una lista vacía', () => {
	expect(BasemapLayerSet.Build(null)).toEqual([]);
	expect(BasemapLayerSet.Build(undefined)).toEqual([]);
});

it('GetLoadable devuelve solo indicadores y delimitaciones, con las mismas referencias', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	const loadable = BasemapLayerSet.GetLoadable(layers);
	expect(loadable).toHaveLength(2);
	expect(loadable[0]).toBe(layers[2]);
	expect(loadable[1]).toBe(layers[3]);
});

it('GetByRouteTag y GetById encuentran la capa o devuelven null', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	expect(BasemapLayerSet.GetByRouteTag(layers, 'e')).toBe(layers[1]);
	expect(BasemapLayerSet.GetByRouteTag(layers, 'z')).toBeNull();
	expect(BasemapLayerSet.GetById(layers, 4)).toBe(layers[3]);
	expect(BasemapLayerSet.GetById(layers, 99)).toBeNull();
});

describe('BasemapLayerSet.GetStartActive: estado inicial por cartografía');

it('sin lista del servidor rige el default por tipo: solo etiquetas activas', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	expect(layers.map(l => BasemapLayerSet.GetStartActive(l, undefined))).toEqual([true, false, false, false]);
	expect(layers.map(l => BasemapLayerSet.GetStartActive(l, null))).toEqual([true, false, false, false]);
});

it('con lista, respeta lo indicado y usa el default para las capas ausentes', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	const start = [{ Id: 1, StartActive: false }, { Id: 3, StartActive: true }];
	expect(layers.map(l => BasemapLayerSet.GetStartActive(l, start))).toEqual([false, false, true, false]);
});

describe('BasemapLayerSet.GetRasterOptions: opciones del TileLayer');

it('traduce la configuración y expresa la opacidad en fracción', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	const raster = BasemapLayerSet.GetRasterOptions(layers[1]);
	expect(raster.Url).toBe('http://t/{z}/{x}/{y}');
	expect(raster.Options).toEqual({ tms: true, maxNativeZoom: 12, maxZoom: 16 });
	expect(raster.Opacity).toBeCloseTo(0.4, 5);
});

it('sin opacidad ni zooms usa 50% y omite los zooms', () => {
	const raster = BasemapLayerSet.GetRasterOptions({ Raster: { Url: 'u', Tms: false, MaxNativeZoom: null, MaxZoom: null, Opacity: null } });
	expect(raster.Options).toEqual({ tms: false });
	expect(raster.Opacity).toBeCloseTo(0.5, 5);
});

describe('SegmentedMap: estado inicial de capas base');

function hasCall(calls, expected) {
	return calls.some(c => JSON.stringify(c) === JSON.stringify(expected));
}

function makeStartContext(startLayers) {
	const layers = BasemapLayerSet.Build(configLayers());
	const calls = [];
	const ctx = {
		toolbarStates: { showLabels: true, basemapLayers: layers },
		calls,
		MapsApi: { SetRasterState(id, v) { calls.push(['SetRasterState', id, v]); } },
		UpdateLabelsVisibility() { calls.push(['UpdateLabelsVisibility', ctx.toolbarStates.showLabels]); },
		ToggleBasemapMetric(layer) { calls.push(['ToggleBasemapMetric', layer.Id]); layer.Visible = !layer.Visible; },
		SetBasemapRasterVisible: SegmentedMap.prototype.SetBasemapRasterVisible,
	};
	SegmentedMap.prototype.ApplyBasemapLayersStartup.call(ctx, startLayers);
	return ctx;
}

it('sin lista (cartografías preexistentes) deja etiquetas activas y el resto apagado', () => {
	const ctx = makeStartContext(undefined);
	expect(ctx.toolbarStates.showLabels).toBe(true);
	expect(ctx.toolbarStates.basemapLayers.map(l => l.Visible)).toEqual([true, false, false, false]);
	expect(ctx.calls.filter(c => c[0] === 'ToggleBasemapMetric')).toEqual([]);
});

it('con lista apaga etiquetas, enciende el raster y carga los indicadores activos', () => {
	const ctx = makeStartContext([
		{ Id: 1, StartActive: false }, { Id: 2, StartActive: true },
		{ Id: 3, StartActive: true }, { Id: 4, StartActive: false }]);
	expect(ctx.toolbarStates.showLabels).toBe(false);
	expect(ctx.toolbarStates.basemapLayers.map(l => l.Visible)).toEqual([true, true, true, false]);
	expect(hasCall(ctx.calls, ['SetRasterState', 2, true])).toBeTruthy();
	expect(hasCall(ctx.calls, ['ToggleBasemapMetric', 3])).toBeTruthy();
	expect(hasCall(ctx.calls, ['UpdateLabelsVisibility', false])).toBeTruthy();
});

describe('SegmentedMap: alternancia de rasters y rutas heredadas');

it('ToggleBasemapRaster invierte el estado, avisa al mapa y actualiza la ruta', () => {
	const calls = [];
	const ctx = {
		MapsApi: { SetRasterState(id, v) { calls.push(['SetRasterState', id, v]); } },
		MapTypeChanged() { calls.push(['MapTypeChanged']); },
		SaveRoute: { UpdateRoute() { calls.push(['UpdateRoute']); } },
		SetBasemapRasterVisible: SegmentedMap.prototype.SetBasemapRasterVisible,
	};
	const raster = { Id: 2, Visible: false };
	SegmentedMap.prototype.ToggleBasemapRaster.call(ctx, raster);
	expect(raster.Visible).toBe(true);
	expect(calls).toEqual([['SetRasterState', 2, true], ['MapTypeChanged'], ['UpdateRoute']]);
});

it('SetBasemapRastersByRouteTag aplica el estado solo a los rasters con esa letra', () => {
	const layers = BasemapLayerSet.Build(configLayers());
	const calls = [];
	const ctx = {
		toolbarStates: { basemapLayers: layers },
		MapsApi: { SetRasterState(id, v) { calls.push([id, v]); } },
		SetBasemapRasterVisible: SegmentedMap.prototype.SetBasemapRasterVisible,
	};
	SegmentedMap.prototype.SetBasemapRastersByRouteTag.call(ctx, 'e', true);
	expect(calls).toEqual([[2, true]]);
	SegmentedMap.prototype.SetBasemapRastersByRouteTag.call(ctx, 'q', true);
	expect(calls).toHaveLength(1);
});

describe('SegmentedMap.EnsureBasemapLayerLoaded: descargas desde el popup de metadatos');

function makeLoadContext() {
	const ctx = {
		loads: 0,
		EnsureBasemapLayerLoaded: SegmentedMap.prototype.EnsureBasemapLayerLoaded,
		LoadBasemapMetricLayers(layer) {
			ctx.loads++;
			layer.layers.push({ name: 'activa' });
			layer.loadPromise = Promise.resolve();
		},
	};
	return ctx;
}

it('pide las capas una sola vez y las devuelve', async () => {
	const ctx = makeLoadContext();
	const layer = { Visible: false, layers: null, loadPromise: null };
	const first = await ctx.EnsureBasemapLayerLoaded(layer);
	const second = await ctx.EnsureBasemapLayerLoaded(layer);
	expect(first).toHaveLength(1);
	expect(second).toBe(first);
	expect(ctx.loads).toBe(1);
});

it('con las capas ya cargadas no vuelve a pedirlas', async () => {
	const ctx = makeLoadContext();
	const layers = [{ name: 'existente' }];
	const result = await ctx.EnsureBasemapLayerLoaded({ Visible: true, layers: layers, loadPromise: null });
	expect(result).toBe(layers);
	expect(ctx.loads).toBe(0);
});

describe('LeafletApi.CheckBaseLayer: rasters parametrizados');

function makeLeafletContext(mapType, rasters, zoom, showLabels) {
	const LeafletApiStatic = { RasterName(id) { return 'raster_' + id; } };
	const build = function (name) {
		return new Function('LeafletApi', 'return (' + methodSource(name) + ')')(LeafletApiStatic);
	};
	const ctx = {
		mapTypeState: mapType,
		showLabels: showLabels,
		MIN_ZOOM_LABELS: 15,
		map: { getZoom() { return zoom; } },
		rasterLayers: rasters,
		rasterStates: {},
		selected: null,
		IsSatelliteType() { return this.mapTypeState === 's' || this.mapTypeState === 'h'; },
		SetBaseMap(name) { this.selected = name; },
	};
	ctx.GetVisibleRasterNames = build('GetVisibleRasterNames');
	ctx.CheckBaseLayer = build('CheckBaseLayer');
	return ctx;
}

const RASTERS = [{ Id: 2, HideOnSatellite: true }, { Id: 7, HideOnSatellite: false }];

it('sin rasters encendidos pide solo la capa del tipo de mapa', () => {
	const ctx = makeLeafletContext('r', RASTERS, 16, true);
	ctx.CheckBaseLayer();
	expect(ctx.selected).toBe('roadmap');
});

it('agrega los rasters encendidos en el orden del panel', () => {
	const ctx = makeLeafletContext('c', RASTERS, 10, true);
	ctx.rasterStates = { 2: true, 7: true };
	ctx.CheckBaseLayer();
	expect(ctx.selected).toBe('colored_no_labels,raster_2,raster_7');
});

it('en satélite omite los rasters que piden no renderizarse y deja las etiquetas arriba', () => {
	const ctx = makeLeafletContext('s', RASTERS, 16, true);
	ctx.rasterStates = { 2: true, 7: true };
	ctx.CheckBaseLayer();
	expect(ctx.selected).toBe('satellite,raster_7,roadmap_only_labels');
});

it('en mapa en blanco no dibuja rasters', () => {
	const ctx = makeLeafletContext('b', RASTERS, 16, true);
	ctx.rasterStates = { 2: true, 7: true };
	ctx.CheckBaseLayer();
	expect(ctx.selected).toBe('blank');
});
