import { describe, it, expect } from './_harness.mjs';
import DbAdminBase from '@/common/classes/DbAdminBase';
import Db from '@/admins/classes/Db';
import { setupGlobals, axios, serve, settle, quiet, bodyOf } from './fixtures.mjs';

const HOST = 'http://server.test';

describe('Db: herencia');

it('extiende DbAdminBase y conserva su constructor', () => {
	setupGlobals();
	const db = new Db();
	expect(db instanceof DbAdminBase).toBeTruthy();
	expect(Db.prototype.constructor).toBe(Db);
	expect(typeof db.GetCurrentUserAccount).toBe('function');
});

describe('Db: servicios de lectura (GET)');

const GET_CASES = [
	['UpdateWorkIndexing', [{ Id: 5, IsIndexed: true }], '/services/admin/UpdateWorkIndexing', { w: 5, v: '1' }],
	['UpdateWorkIndexing', [{ Id: 5, IsIndexed: false }], '/services/admin/UpdateWorkIndexing', { w: 5, v: '0' }],
	['UpdateWorkSegmentedCrawling', [{ Id: 6, SegmentedCrawling: true }], '/services/admin/UpdateWorkSegmentedCrawling', { w: 6, v: '1' }],
	['UpdateWorkSegmentedCrawling', [{ Id: 6, SegmentedCrawling: 0 }], '/services/admin/UpdateWorkSegmentedCrawling', { w: 6, v: '0' }],
	['GetUsers', [], '/services/admin/GetUsers', {}],
	['CalculateSpaceUsage', [], '/services/admin/UpdateWorkSpaceUsage', {}],
	['GetWorks', ['P', 12], '/services/admin/GetWorks', { f: 'P', t: 12 }],
	['GetStatistics', ['2024-05'], '/services/admin/GetStatistics', { m: '2024-05' }],
	['ProcessStatistics', ['2024-05'], '/services/admin/ProcessStatistics', { m: '2024-05' }],
	['GetReviews', [], '/services/admin/GetReviews', {}],
	['GetUserKeys', [9], '/services/admin/GetUserKeys', { u: 9 }],
	['DeleteUserKey', [3], '/services/admin/DeleteUserKey', { key_id: 3 }],
	['LoginAs', [{ Id: 4 }], '/services/admin/LoginAs', { u: 4 }],
];

GET_CASES.forEach(function (c) {
	const name = c[0];
	it(name + ' consulta ' + c[2] + ' con ' + JSON.stringify(c[3]), async () => {
		const env = setupGlobals();
		serve({ ['GET ' + c[2]]: { ok: 1 } });
		const data = await env.db[name](...c[1]);
		expect(data).toEqual({ ok: 1 });
		expect(axios.calls).toHaveLength(1);
		expect(axios.calls[0].method).toBe('get');
		expect(axios.calls[0].url).toBe(HOST + c[2]);
		expect(axios.calls[0].config.params).toEqual(c[3]);
	});
});

describe('Db: servicios de escritura (POST)');

it('CreateUserKey envía el usuario y la descripción', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/admin/CreateUserKey': { plain_key: 'k' } });
	const data = await env.db.CreateUserKey(9, 'mi key');
	expect(data).toEqual({ plain_key: 'k' });
	expect(axios.calls[0].url).toBe(HOST + '/services/admin/CreateUserKey');
	expect(bodyOf(axios.calls[0])).toEqual({ u: '9', description: 'mi key' });
});

it('UpdateUserKey envía el id del key junto con los campos a modificar', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/admin/UpdateUserKey': {} });
	await env.db.UpdateUserKey(3, { active: 1, key_description: 'x' });
	expect(bodyOf(axios.calls[0])).toEqual({ key_id: '3', active: '1', key_description: 'x' });
});

it('UpdateReview envía la revisión completa y devuelve la respuesta del servidor', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/admin/UpdateReview': { Id: 8, Decision: 'A' } });
	const data = await env.db.UpdateReview({ Id: 8, Decision: 'A' });
	expect(data).toEqual({ Id: 8, Decision: 'A' });
	expect(bodyOf(axios.calls[0])).toEqual({ r: { Id: 8, Decision: 'A' } });
});

it('UpdateUser envía usuario, contraseña y verificación, y no devuelve la respuesta', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/admin/UpdateUser': { Id: 3 } });
	const data = await env.db.UpdateUser({ Id: 3, Email: 'a@b.com' }, 'clave', 'clave');
	expect(data).toBe(undefined);
	expect(bodyOf(axios.calls[0])).toEqual({ u: { Id: 3, Email: 'a@b.com' }, p: 'clave', v: 'clave' });
});

describe('Db: operaciones con callback');

it('PromoteWork envía el id de la obra e invoca el callback al terminar', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/backoffice/PromoteWork': {} });
	let called = 0;
	await env.db.PromoteWork(7, function () { called++; });
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/PromoteWork');
	expect(bodyOf(axios.calls[0])).toEqual({ w: '7' });
	expect(called).toBe(1);
});

it('DemoteWork envía el id de la obra e invoca el callback al terminar', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/backoffice/DemoteWork': {} });
	let called = 0;
	await env.db.DemoteWork(7, function () { called++; });
	expect(axios.calls[0].url).toBe(HOST + '/services/backoffice/DemoteWork');
	expect(bodyOf(axios.calls[0])).toEqual({ w: '7' });
	expect(called).toBe(1);
});

it('PromoteWork y DemoteWork admiten no recibir callback', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/backoffice/PromoteWork': {}, 'POST /services/backoffice/DemoteWork': {} });
	await env.db.PromoteWork(7);
	await env.db.DemoteWork(7);
	expect(axios.calls).toHaveLength(2);
});

it('DeleteReview envía la revisión e invoca el callback; sin callback no falla', async () => {
	const env = setupGlobals();
	serve({ 'POST /services/admin/DeleteReview': {} });
	let called = 0;
	await env.db.DeleteReview({ Id: 2 }, function () { called++; });
	await env.db.DeleteReview({ Id: 2 }, null);
	expect(bodyOf(axios.calls[0])).toEqual({ r: { Id: 2 } });
	expect(called).toBe(1);
});

it('DeleteUser envía el id del usuario e invoca el callback; sin callback no falla', async () => {
	const env = setupGlobals();
	serve({ 'GET /services/admin/DeleteUser': {} });
	let called = 0;
	await env.db.DeleteUser({ Id: 4 }, function () { called++; });
	await env.db.DeleteUser({ Id: 4 });
	expect(axios.calls[0].config.params).toEqual({ u: 4 });
	expect(called).toBe(1);
});

it('si la solicitud falla no se invoca el callback y se rechaza con el error original', async () => {
	const env = setupGlobals();
	const failure = new Error('Network Error');
	serve({ 'POST /services/backoffice/PromoteWork': failure });
	let called = 0;
	let caught = null;
	await quiet(async function () {
		try {
			await env.db.PromoteWork(7, function () { called++; });
		} catch (e) {
			caught = e;
		}
	});
	expect(caught).toBe(failure);
	expect(called).toBe(0);
	await settle();
	expect(env.alerts).toHaveLength(1);
	expect(env.alerts[0].startsWith('No fue posible promover la cartografía.')).toBeTruthy();
});

describe('Db: URLs de procesos por pasos');

it('arman las URLs de inicio con el id de obra y las de paso sin parámetros', () => {
	const env = setupGlobals();
	expect(env.db.GetStartWorkDeleteUrl(5)).toBe(HOST + '/services/backoffice/StartDeleteWork?w=5');
	expect(env.db.GetStepWorkDeleteUrl()).toBe(HOST + '/services/backoffice/StepDeleteWork');
	expect(env.db.GetStartWorkPublishUrl(5)).toBe(HOST + '/services/backoffice/StartPublishWork?w=5');
	expect(env.db.GetStepWorkPublishUrl()).toBe(HOST + '/services/backoffice/StepPublishWork');
	expect(env.db.GetStartWorkRevokeUrl(5)).toBe(HOST + '/services/backoffice/StartRevokeWork?w=5');
	expect(env.db.GetStepWorkRevokeUrl()).toBe(HOST + '/services/backoffice/StepRevokeWork');
	expect(env.db.GetStepWorkCloneUrl()).toBe(HOST + '/services/backoffice/StepCloneWork');
});

it('la URL de clonado codifica el nombre nuevo', () => {
	const env = setupGlobals();
	expect(env.db.GetStartWorkCloneUrl(5, 'Mi obra & más'))
		.toBe(HOST + '/services/backoffice/StartCloneWork?w=5&n=Mi%20obra%20%26%20m%C3%A1s');
});

it('las URLs siguen el host vigente al momento de la llamada', () => {
	const env = setupGlobals();
	window.host = 'http://tx.test';
	expect(env.db.GetStepWorkDeleteUrl()).toBe('http://tx.test/services/backoffice/StepDeleteWork');
});
