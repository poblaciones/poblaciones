import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import TileRequest from '@/map/classes/TileRequest';

// Pedido de un tile del mapa: un request de datos (compartible entre tiles
// vía bloque) y uno de geografía, con cancelación de ambos. Se prueba el
// ensamblado de respuestas y la cancelación contra mocks livianos; los
// requests HTTP reales (startDataRequest/startGeographyRequest) quedan fuera.

function makeTileRequest() {
        const processCalls = [];
        const overlay = {
                activeSelectedMetric: { GetDataService() { return null; } },
                geographyService: { url: null },
                process(mapDone, dataDone, gradient, key, div, x, y, zoom) {
                        processCalls.push({ mapDone, dataDone, gradient, key, div, x, y, zoom });
                },
        };
        const request = new TileRequest(
                { Release() {} }, { Release() {} }, overlay,
                { x: 3, y: 5 }, 10, 'k1', 'div1'
        );
        return { overlay, processCalls, request };
}

describe('TileRequest: completitud del pedido');

it('sin datos no está completo; al llegar el data (sin geography) procesa', () => {
        const { processCalls, request } = makeTileRequest();
        // Main null && ... → la función devuelve null (falsy), no false literal
        expect(request.requestIsComplete()).toBeFalsy();
        request.processDataResponse({ Rows: 3 });
        expect(request.dataDone.Main).toEqual({ Rows: 3 });
        expect(request.requestIsComplete()).toBe(true);
        expect(processCalls).toHaveLength(1);
        expect(processCalls[0].mapDone).toBe(null);
        expect(processCalls[0].dataDone.Main).toEqual({ Rows: 3 });
        expect(processCalls[0].x).toBe(3);
        expect(processCalls[0].y).toBe(5);
        expect(processCalls[0].zoom).toBe(10);
        expect(processCalls[0].key).toBe('k1');
        expect(processCalls[0].div).toBe('div1');
});

it('con geography pendiente no procesa hasta llegar mapDone', () => {
        const { overlay, processCalls, request } = makeTileRequest();
        overlay.geographyService.url = 'http://geo';
        request.processDataResponse({ Rows: 3 });
        expect(processCalls).toHaveLength(0);
        request.mapDone = { features: [] };
        request.ProcessResultsIfCompleted();
        expect(processCalls).toHaveLength(1);
});

it('processDataResponse con subset extrae la celda indicada', () => {
        const { request } = makeTileRequest();
        request.subset = ['A', 'B'];
        request.processDataResponse({ Data: { A: { B: { Rows: 1 } } } });
        expect(request.dataDone.Main).toEqual({ Rows: 1 });
});

it('processDataResponse ignora la respuesta si el pedido fue cancelado', () => {
        const { processCalls, request } = makeTileRequest();
        request.CancelHttpRequests();
        request.processDataResponse({ Rows: 3 });
        expect(request.dataDone.Main).toBe(null);
        expect(processCalls).toHaveLength(0);
});

describe('TileRequest: datos paginados de geografía');

it('receiveMapData guarda el gradiente y concatena las páginas sobre la primera', () => {
        const { request } = makeTileRequest();
        const page1 = { Data: { features: ['f1'] }, Gradient: 'g1' };
        request.receiveMapData(page1);
        request.receiveMapData({ Data: { features: ['f2'] } });
        expect(request.gradient).toBe('g1');
        expect(request.prevMapData).toBe(page1);
        // la segunda página se concatena dentro del objeto de la primera
        expect(page1.Data.features).toEqual(['f1', 'f2']);
});

it('un gradiente de una página posterior reemplaza al anterior', () => {
        const { request } = makeTileRequest();
        request.receiveMapData({ Data: { features: [] }, Gradient: 'g1' });
        request.receiveMapData({ Data: { features: [] }, Gradient: 'g2' });
        expect(request.gradient).toBe('g2');
});

describe('TileRequest: cancelación');

it('CancelHttpRequests cancela sus dos pedidos y libera los pre-cancel', () => {
        const { request } = makeTileRequest();
        const released = [];
        const cancel1 = [];
        const cancel2 = [];
        request.cancel1 = function (m) { cancel1.push(m); };
        request.cancel2 = function (m) { cancel2.push(m); };
        request.preCancel1 = 'p1';
        request.preCancel1Queue = { Release(p) { released.push(p); } };
        request.preCancel2 = 'p2';
        request.preCancel2Queue = { Release(p) { released.push(p); } };
        request.CancelHttpRequests();
        expect(request.cancelled).toBe(true);
        expect(cancel1).toEqual(['cancelled']);
        expect(cancel2).toEqual(['cancelled']);
        expect(released).toEqual(['p1', 'p2']);
});

it('con un bloque compartido delega la cancelación del data y cancela su geografía propia', () => {
        const { request } = makeTileRequest();
        const blockCalls = [];
        request.dataBlockRequest = { CancelHttpRequests() { blockCalls.push(1); } };
        const cancel1 = [];
        const cancel2 = [];
        request.cancel1 = function (m) { cancel1.push(m); };
        request.cancel2 = function (m) { cancel2.push(m); };
        request.CancelHttpRequests();
        expect(blockCalls).toHaveLength(1);
        expect(cancel1).toHaveLength(0);
        expect(cancel2).toEqual(['cancelled']);
});

it('allSubscribersAreCancelled refleja el estado de los suscriptos al bloque', () => {
        const { request } = makeTileRequest();
        expect(request.allSubscribersAreCancelled()).toBe(true);
        const sub1 = { cancelled: false };
        request.dataSubscribe(sub1);
        expect(request.allSubscribersAreCancelled()).toBe(false);
        sub1.cancelled = true;
        expect(request.allSubscribersAreCancelled()).toBe(true);
});

it('notifyDataSubscribers reparte la respuesta a los suscriptos', () => {
        const { request } = makeTileRequest();
        const received = [];
        request.dataSubscribe({ processDataResponse(d) { received.push(d); } });
        request.notifyDataSubscribers({ Rows: 9 });
        expect(received).toEqual([{ Rows: 9 }]);
});
