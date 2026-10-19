import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeCallRecorder } from './fixtures.mjs';
import FrameRouter from '@/map/router/FrameRouter';
import BasemapRouter from '@/map/router/BasemapRouter';
import FeatureInfoRouter from '@/map/router/FeatureInfoRouter';
import ZoomFeatureRouter from '@/map/router/ZoomFeatureRouter';
import LeftPanelRouter from '@/map/router/LeftPanelRouter';
import ClippingRouter from '@/map/router/ClippingRouter';

// Routers de bloques de ruta no cubiertos por routes.test.mjs (que ya
// caracteriza FrameRouter.frameFromRoute y SelectedInfoRouter). Acá van los
// de salida a ruta y los de paneles/feature/clipping, contra el mock de
// window.SegMap de fixtures.

describe('FrameRouter: ruta de salida');

it('calculateCenterAsCoordinate devuelve el punto medio del envelope', () => {
        const router = new FrameRouter();
        const center = router.calculateCenterAsCoordinate({ Min: { Lat: -35, Lon: -59 }, Max: { Lat: -34, Lon: -58 } });
        expect(center.Lat).toBe(-34.5);
        expect(center.Lon).toBe(-58.5);
});

it('ToRoute emite [lat recortada, lon recortada, zoom con z]; sin coord usa el centro', () => {
        setupWindow();
        const router = new FrameRouter();
        const route = router.ToRoute({ Lat: -34.6117521234, Lon: -58.4 });
        expect(route[0]).toBeCloseTo(-34.611752, 6);
        expect(route[1]).toBeCloseTo(-58.4, 6);
        expect(route[2]).toBe('10z');
        const centerRoute = router.ToRoute();
        expect(centerRoute).toEqual([0, 0, '10z']);
});

describe('BasemapRouter: ruta de salida');

function makeBasemapSegMap() {
        const segMap = setupWindow();
        const calls = [];
        segMap.mapTypeState = 'r';
        segMap.GetMapTypeState = function () { return segMap.mapTypeState; };
        segMap.SetShowElevation = function (v) { calls.push(['SetShowElevation', v]); };
        segMap.SetMapTypeState = function (t) { calls.push(['SetMapTypeState', t]); };
        segMap.ToggleBasemapMetric = function (layer) { calls.push(['ToggleBasemapMetric', layer.RouteTag]); };
        segMap.toolbarStates = { showLabels: true, showElevation: false, basemapMetrics: [] };
        segMap.routerCalls = calls;
        return segMap;
}

it('con el mapa base por default la ruta queda vacía (no se serializa)', () => {
        const segMap = makeBasemapSegMap();
        expect(new BasemapRouter().ToRoute()).toEqual([]);
});

it('etiquetas apagadas, elevación y métricas de base visibles se acumulan al mapType', () => {
        const segMap = makeBasemapSegMap();
        const router = new BasemapRouter();
        segMap.toolbarStates.showLabels = false;
        expect(router.ToRoute()).toEqual(['rn']);
        segMap.toolbarStates.showElevation = true;
        expect(router.ToRoute()).toEqual(['rne']);
        segMap.toolbarStates.basemapMetrics = [{ Visible: true, RouteTag: 't' }, { Visible: false, RouteTag: 'x' }];
        expect(router.ToRoute()).toEqual(['rnet']);
        segMap.mapTypeState = 's';
        expect(router.ToRoute()).toEqual(['snet']);
});

it('una métrica de base invisible no suma su tag', () => {
        const segMap = makeBasemapSegMap();
        segMap.toolbarStates.basemapMetrics = [{ Visible: false, RouteTag: 't' }];
        expect(new BasemapRouter().ToRoute()).toEqual([]);
});

it('frameFromRoute interpreta mapType, n (sin etiquetas) y e (elevación), y marca métricas visibles', () => {
        const segMap = makeBasemapSegMap();
        const metric = { Visible: false, RouteTag: 't' };
        segMap.toolbarStates.basemapMetrics = [metric];
        const router = new BasemapRouter();
        const frame = router.frameFromRoute(['st']);
        expect(frame.MapType).toBe('s');
        expect(frame.ShowLabels).toBeTruthy();
        expect(frame.Elevation).toBeFalsy();
        expect(frame.VisibleBaseMetrics).toEqual([metric]);
        expect(metric.Visible).toBe(true);
        expect(router.frameFromRoute(['rn']).ShowLabels).toBeFalsy();
        expect(router.frameFromRoute(['re']).Elevation).toBeTruthy();
});

it('FromRoute aplica el estado del mapa y activa las métricas viajadas en la ruta', () => {
        const segMap = makeBasemapSegMap();
        const metric = { Visible: false, RouteTag: 't' };
        segMap.toolbarStates.basemapMetrics = [metric];
        new BasemapRouter().FromRoute(['st']);
        expect(segMap.routerCalls).toEqual([
                ['SetShowElevation', false],
                ['SetMapTypeState', 's'],
                ['ToggleBasemapMetric', 't'],
        ]);
        // el router habilita y deshabilita SaveRoute alrededor de la restauración
        expect(segMap.SaveRoute.Disabled).toBe(false);
});

describe('FeatureInfoRouter: feature solicitado por ruta');

it('ToRoute arma los pares f/l/v/x del FeatureInfoKey, o null si no hay clave', () => {
        setupWindow();
        window.Panels = { Content: { FeatureInfoKey: null } };
        const router = new FeatureInfoRouter();
        expect(router.ToRoute()).toBe(null);
        window.Panels.Content.FeatureInfoKey = { Id: 7, MetricId: 3, VariableId: 9, Exceptions: null };
        expect(router.ToRoute()).toEqual([['f', 7], ['l', 3, null], ['v', 9, null], ['x', null, null]]);
        window.Panels.Content.FeatureInfoKey.Exceptions = ['e1'];
        expect(router.ToRoute()[3]).toEqual(['x', ['e1'], null]);
});

it('FromRoute avisa al InfoWindow con métrica, variable, excepciones y fid numérico', () => {
        const segMap = setupWindow();
        segMap.InfoWindow = makeCallRecorder();
        const router = new FeatureInfoRouter();
        router.FromRoute({ f: '123', l: '3', v: '9', x: 'e1' });
        expect(segMap.InfoWindow.calls).toHaveLength(1);
        expect(segMap.InfoWindow.calls[0].method).toBe('InfoRequested');
        expect(segMap.InfoWindow.calls[0].args[0]).toEqual({});
        expect(segMap.InfoWindow.calls[0].args[1]).toEqual({ MetricId: 3, VariableId: 9, Exceptions: 'e1' });
        expect(segMap.InfoWindow.calls[0].args[2]).toBe(123);
});

it('FromRoute soporta el formato viejo de fid entre [@ y @]', () => {
        const segMap = setupWindow();
        segMap.InfoWindow = makeCallRecorder();
        new FeatureInfoRouter().FromRoute({ f: '[@456@]' });
        expect(segMap.InfoWindow.calls[0].args[2]).toBe(456);
});

it('FromRoute sin args no avisa al InfoWindow', () => {
        const segMap = setupWindow();
        segMap.InfoWindow = makeCallRecorder();
        new FeatureInfoRouter().FromRoute(null);
        expect(segMap.InfoWindow.calls).toHaveLength(0);
});

describe('ZoomFeatureRouter: bloque j=');

it('GetSettings declara el bloque y ToRoute no persiste nada', () => {
        const router = new ZoomFeatureRouter();
        expect(router.GetSettings().blockSignature).toBe('j=');
        expect(router.ToRoute()).toBe(null);
});

it('FromRoute aplica la región de clipping cuando la ruta la trae', () => {
        const segMap = setupWindow();
        segMap.Clipping = makeCallRecorder();
        const router = new ZoomFeatureRouter();
        router.FromRoute({ r: '55' });
        expect(segMap.Clipping.calls[0]).toEqual({ method: 'SetClippingRegion', args: [55, true, false] });
        router.FromRoute({});
        router.FromRoute(null);
        expect(segMap.Clipping.calls).toHaveLength(1);
});

describe('LeftPanelRouter: bloque p=');

it('ToRoute emite el estado del panel izquierdo solo si tiene contenido', () => {
        setupWindow();
        window.Panels = { Left: { hasContent: true, collapsed: false } };
        const router = new LeftPanelRouter();
        expect(router.ToRoute()).toEqual([['c', 0, 0]]);
        window.Panels.Left.collapsed = true;
        expect(router.ToRoute()).toEqual([['c', 1, 0]]);
        window.Panels.Left.hasContent = false;
        expect(router.ToRoute()).toEqual([]);
});

it('FromRoute setea collapsed desde la ruta (default false)', () => {
        setupWindow();
        window.Panels = { Left: { hasContent: true, collapsed: false } };
        const router = new LeftPanelRouter();
        router.FromRoute({ c: '1' });
        expect(window.Panels.Left.collapsed).toBe(true);
        router.FromRoute({});
        expect(window.Panels.Left.collapsed).toBe(false);
});

describe('ClippingRouter: parseo y comparación del clipping');

it('getClippingCircle arma centro y radio (como strings) y null con partes insuficientes', () => {
        const router = new ClippingRouter();
        expect(router.getClippingCircle('-34.6,-58.4,0.5,0.5')).toEqual({
                Center: { Lat: '-34.6', Lon: '-58.4' },
                Radius: { Lat: '0.5', Lon: '0.5' },
        });
        expect(router.getClippingCircle('a,b,c')).toBe(null);
        expect(router.getClippingCircle(null)).toBe(null);
});

it('clippingFromRoute parsea regiones (a enteros), círculo y nivel', () => {
        const clipping = new ClippingRouter().clippingFromRoute({ r: '5,6', c: '-34.6,-58.4,0.5,0.5', l: 'rev1' });
        expect(clipping.ClippingRegionIds).toEqual([5, 6]);
        expect(clipping.ClippingCircle).toEqual({ Center: { Lat: '-34.6', Lon: '-58.4' }, Radius: { Lat: '0.5', Lon: '0.5' } });
        expect(clipping.ClippingLevelName).toBe('rev1');
});

it('clippingFromRoute sin args devuelve todo null', () => {
        const clipping = new ClippingRouter().clippingFromRoute(null);
        expect(clipping.ClippingRegionIds).toBe(null);
        expect(clipping.ClippingCircle).toBe(null);
        expect(clipping.ClippingLevelName).toBe(null);
});

it('clippingChanged detecta ids, círculos agregados y quitados', () => {
        const router = new ClippingRouter();
        const frame = { ClippingRegionIds: null, ClippingCircle: null };
        expect(router.clippingChanged(frame, { ClippingRegionIds: null, ClippingCircle: null, ClippingLevelName: null })).toBe(false);
        expect(router.clippingChanged(frame, { ClippingRegionIds: [5], ClippingCircle: null, ClippingLevelName: null })).toBe(true);
        expect(router.clippingChanged(frame, { ClippingRegionIds: null, ClippingCircle: { Center: { Lat: 1, Lon: 2 }, Radius: { Lat: 3, Lon: 4 } }, ClippingLevelName: null })).toBe(true);
});

it('clippingChanged compara el círculo por centro y radio', () => {
        const router = new ClippingRouter();
        const frame = { ClippingRegionIds: null, ClippingCircle: { Center: { Lat: 1, Lon: 2 }, Radius: { Lat: 3, Lon: 4 } } };
        expect(router.clippingChanged(frame, { ClippingRegionIds: null, ClippingCircle: { Center: { Lat: 1, Lon: 2 }, Radius: { Lat: 3, Lon: 4 } }, ClippingLevelName: null })).toBe(false);
        expect(router.clippingChanged(frame, { ClippingRegionIds: null, ClippingCircle: { Center: { Lat: 9, Lon: 2 }, Radius: { Lat: 3, Lon: 4 } }, ClippingLevelName: null })).toBe(true);
});

// El chequeo `ids !== levelName` (marcado TODO Bugfix en el código) hace que
// cualquier ClippingLevelName en la ruta cuente como cambio, incluso con ids
// idénticos: se caracteriza tal cual es.
it('clippingChanged marca cambio siempre que la ruta traiga level name (TODO Bugfix)', () => {
        const router = new ClippingRouter();
        const frame = { ClippingRegionIds: null, ClippingCircle: null };
        expect(router.clippingChanged(frame, { ClippingRegionIds: null, ClippingCircle: null, ClippingLevelName: 'rev1' })).toBe(true);
});

function makeClippingSegMap() {
        const segMap = setupWindow();
        segMap.Clipping = {
                clipping: { Region: { SelectedLevelIndex: 0, Levels: [{ Revision: 'r1' }, { Revision: 'r2' }] } },
                FrameHasNoClipping() { return false; },
        };
        return segMap;
}

it('ToRoute emite nivel, regiones y círculo cuando hay clipping', () => {
        const segMap = makeClippingSegMap();
        segMap.frame.ClippingRegionIds = [5, 6];
        segMap.frame.ClippingCircle = { Center: { Lat: -34.6, Lon: -58.4 }, Radius: { Lat: 0.5, Lon: 0.5 } };
        expect(new ClippingRouter().ToRoute()).toEqual([
                ['l', 'r1', ''],
                ['r', '5,6'],
                ['c', '-34.6,-58.4,0.5,0.5'],
        ]);
});

it('ToRoute en el último nivel emite el level vacío; sin clipping y en último nivel, ruta vacía', () => {
        const segMap = makeClippingSegMap();
        const router = new ClippingRouter();
        // último nivel (índice 1 de 2): clippingLevel queda '', pero el frame tiene clipping → sale el par vacío
        segMap.Clipping.clipping.Region.SelectedLevelIndex = 1;
        expect(router.ToRoute()).toEqual([['l', '', '']]);
        // sin clipping en el frame y level vacío: nada
        segMap.Clipping.FrameHasNoClipping = function () { return true; };
        expect(router.ToRoute()).toEqual([]);
        // nivel intermedio sin clipping en el frame: igual viaja el level
        segMap.Clipping.clipping.Region.SelectedLevelIndex = 0;
        expect(router.ToRoute()).toEqual([['l', 'r1', '']]);
});
