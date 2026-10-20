import { describe, it, expect } from './_harness.mjs';
import DbAdminBase from '@/common/classes/DbAdminBase';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';
import Db from '@/packs/classes/Db';
import { setupGlobals, axios, serve, settle, quiet, bodyOf } from './fixtures.mjs';

const HOST = 'http://server.test';
const PACKS = '/services/packs/';

describe('Db: herencia');

it('extiende DbAdminBase y conserva su constructor', () => {
	setupGlobals();
	const db = new Db();
	expect(db instanceof DbAdminBase).toBeTruthy();
	expect(Db.prototype.constructor).toBe(Db);
	expect(typeof db.GetCurrentUserAccount).toBe('function');
});

describe('Db: servicios de lectura (GET)');

// [método, argumentos, servicio, parámetros esperados]
const GET_CASES = [
	['GetClippingRegions', [], 'GetClippingRegions', {}],
	['GetBoundaries', [], 'GetBoundaries', {}],
	['VerifyGeoPackage', ['bk1'], 'VerifyGeoPackage', { b: 'bk1' }],
	['GetClippingRegionGeographies', [4], 'GetClippingRegionGeographies', { r: 4 }],
	['GetGeographyClippingRegions', [5], 'GetGeographyClippingRegions', { g: 5 }],
	['GetClippingRegionItems', [4, 100, 50], 'GetClippingRegionItems', { r: 4, o: 100, l: 50 }],
	['GetGeographyItems', [5, 0, 25], 'GetGeographyItems', { g: 5, o: 0, l: 25 }],
	['GetClippingRegionGeographyIntersectionItems', [6, 10, 20], 'GetClippingRegionGeographyIntersectionItems', { c: 6, o: 10, l: 20 }],
	['GetGeographyTupleCalculatedItems', [7, 0, 30], 'GetGeographyTupleCalculatedItems', { t: 7, o: 0, l: 30 }],
	['GetGeographies', [], 'GetGeographies', {}],
	['GetGradients', [], 'GetGradients', {}],
	['VerifyGradientPackage', ['bk2'], 'VerifyGradientPackage', { b: 'bk2' }],
	['GetMetricGroups', [], 'GetMetricGroups', {}],
	['GetMetricProviders', [], 'GetMetricProviders', {}],
	['GetGeographyTuples', [], 'GetGeographyTuples', {}],
];

GET_CASES.forEach(function (c) {
	it(c[0] + ' consulta ' + c[2] + ' con ' + JSON.stringify(c[3]), async () => {
		const env = setupGlobals();
		serve({ ['GET ' + PACKS + c[2]]: { ok: 1 } });
		const data = await env.db[c[0]](...c[1]);
		expect(data).toEqual({ ok: 1 });
		expect(axios.calls).toHaveLength(1);
		expect(axios.calls[0].method).toBe('get');
		expect(axios.calls[0].url).toBe(HOST + PACKS + c[2]);
		expect(axios.calls[0].config.params).toEqual(c[3]);
	});
});

describe('Db: servicios de escritura (POST)');

const ENTITY = { Id: 9, Caption: 'Algo' };

// [método, argumento, servicio, cuerpo esperado, ¿devuelve la respuesta?]
const POST_CASES = [
	['UpdateBoundary', ENTITY, 'UpdateBoundary', { b: ENTITY }, false],
	['DeleteBoundary', ENTITY, 'DeleteBoundary', { b: '9' }, false],
	['UpdateBoundaryVersion', ENTITY, 'UpdateBoundaryVersion', { v: ENTITY }, true],
	['DeleteBoundaryVersion', ENTITY, 'DeleteBoundaryVersion', { v: '9' }, false],
	['MoveBoundaryUp', ENTITY, 'MoveBoundaryUp', { b: '9' }, true],
	['MoveBoundaryDown', ENTITY, 'MoveBoundaryDown', { b: '9' }, true],
	['UpdateClippingRegion', ENTITY, 'UpdateClippingRegion', { r: ENTITY }, true],
	['DeleteClippingRegion', ENTITY, 'DeleteClippingRegion', { r: '9' }, false],
	['DeleteClippingRegionGeography', ENTITY, 'DeleteClippingRegionGeography', { i: '9' }, false],
	['UpdateGeography', ENTITY, 'UpdateGeography', { g: ENTITY }, false],
	['DeleteGeography', ENTITY, 'DeleteGeography', { g: '9' }, false],
	['UpdateGradient', ENTITY, 'UpdateGradient', { g: ENTITY }, false],
	['DeleteGradient', ENTITY, 'DeleteGradient', { g: '9' }, false],
	['UpdateMetricGroup', ENTITY, 'UpdateMetricGroup', { g: ENTITY }, false],
	['DeleteMetricGroup', ENTITY, 'DeleteMetricGroup', { g: '9' }, false],
	['UpdateMetricProvider', ENTITY, 'UpdateMetricProvider', { p: ENTITY }, false],
	['DeleteMetricProvider', ENTITY, 'DeleteMetricProvider', { p: '9' }, false],
	['UpdateGeographyTuple', ENTITY, 'UpdateGeographyTuple', { t: ENTITY }, false],
	['DeleteGeographyTuple', ENTITY, 'DeleteGeographyTuple', { t: '9' }, false],
];

POST_CASES.forEach(function (c) {
	const returns = c[4] ? 'devuelve la respuesta del servidor' : 'no devuelve la respuesta del servidor';
	it(c[0] + ' envía ' + JSON.stringify(c[3]) + ' a ' + c[2] + ' y ' + returns, async () => {
		const env = setupGlobals();
		serve({ ['POST ' + PACKS + c[2]]: { Id: 77 } });
		const data = await env.db[c[0]](c[1]);
		expect(axios.calls).toHaveLength(1);
		expect(axios.calls[0].method).toBe('post');
		expect(axios.calls[0].url).toBe(HOST + PACKS + c[2]);
		expect(bodyOf(axios.calls[0])).toEqual(c[3]);
		if (c[4]) {
			expect(data).toEqual({ Id: 77 });
		} else {
			expect(data).toBe(undefined);
		}
	});
});

it('una falla de red rechaza con el error original y avisa la acción intentada', async () => {
	const env = setupGlobals();
	const failure = new Error('Network Error');
	serve({ ['POST ' + PACKS + 'UpdateBoundary']: failure });
	let caught = null;
	await quiet(async function () {
		try {
			await env.db.UpdateBoundary(ENTITY);
		} catch (e) {
			caught = e;
		}
	});
	await settle();
	expect(caught).toBe(failure);
	expect(env.alerts[0].startsWith('No fue posible actualizar la delimitación.')).toBeTruthy();
});

describe('Db: URLs de procesos por pasos');

// [método de inicio, método de paso, servicio de inicio, servicio de paso]
const STEP_CASES = [
	['GetStartClippingRegionImportUrl', 'GetStepClippingRegionImportUrl', 'StartImportClippingRegion', 'StepImportClippingRegion'],
	['GetStartClippingRegionGeographyCalculateUrl', 'GetStepClippingRegionGeographyCalculateUrl', 'StartCalculateClippingRegionGeography', 'StepCalculateClippingRegionGeography'],
	['GetStartGeographyClippingRegionsCalculateUrl', 'GetStepGeographyClippingRegionsCalculateUrl', 'StartCalculateGeographyClippingRegions', 'StepCalculateGeographyClippingRegions'],
	['GetStartGeographyImportUrl', 'GetStepGeographyImportUrl', 'StartImportGeography', 'StepImportGeography'],
	['GetStartGradientImportUrl', 'GetStepGradientImportUrl', 'StartImportGradient', 'StepImportGradient'],
	['GetStartGeographyTupleCalculateUrl', 'GetStepGeographyTupleCalculateUrl', 'StartCalculateGeographyTuple', 'StepCalculateGeographyTuple'],
];

STEP_CASES.forEach(function (c) {
	it(c[0] + ' y ' + c[1] + ' apuntan a ' + c[2] + ' y ' + c[3], () => {
		const env = setupGlobals();
		expect(env.db[c[0]]()).toBe(HOST + PACKS + c[2]);
		expect(env.db[c[1]]()).toBe(HOST + PACKS + c[3]);
	});
});

it('las URLs siguen el host vigente al momento de la llamada', () => {
	const env = setupGlobals();
	window.host = 'http://tx.test';
	expect(env.db.GetStepGradientImportUrl()).toBe('http://tx.test/services/packs/StepImportGradient');
});

describe('Db.LoadMetadata');

it('pide los metadatos y devuelve un ActiveMetadata sin obra, con las listas recibidas', async () => {
	const env = setupGlobals();
	const response = {
		Metadata: { Id: 12, Abstract: 'x' },
		Files: [{ Id: 1 }], Sources: [{ Id: 2 }], Institutions: [{ Id: 3 }],
	};
	serve({ ['GET ' + PACKS + 'GetMetadata']: response });
	const metadata = await env.db.LoadMetadata({ Id: 12 });
	expect(axios.calls[0].config.params).toEqual({ m: 12 });
	expect(metadata instanceof ActiveMetadata).toBe(true);
	expect(metadata.Work).toBeNull();
	expect(metadata.properties).toEqual({ Id: 12, Abstract: 'x' });
	expect(metadata.Files).toEqual([{ Id: 1 }]);
	expect(metadata.Sources).toEqual([{ Id: 2 }]);
	expect(metadata.Institutions).toEqual([{ Id: 3 }]);
	expect(metadata.Path()).toBe('admin');
});
