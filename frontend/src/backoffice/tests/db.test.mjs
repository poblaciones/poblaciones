import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, parseBody } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import Db from '@/backoffice/classes/Db';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import DbAdminBase from '@/common/classes/DbAdminBase';

const BASE = 'https://api.example.org/services/backoffice/';

function setup() {
	axios.reset();
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.BooleanKeys = { WorkTopBarPublish: 1 };
	context.User = { Privileges: 'P', User: 'ana@x.org', Firstname: 'Ana', Lastname: 'Pérez', Email: 'ana@x.org' };
	context.Cartographies = [];
	context.CartographiesStarted = false;
	const db = new Db();
	browser.window.Db = db;
	return { browser: browser, db: db, context: context };
}

function makeWorkData(id, title, datasetCount) {
	const datasets = [];
	for (let n = 1; n <= datasetCount; n++) {
		datasets.push({ Id: id * 100 + n, Geocoded: false });
	}
	return {
		Work: { Id: id, Type: 'R', Metadata: { Id: 9, Title: title, Url: '/map/x', LastOnline: null } },
		Datasets: datasets,
		Permissions: [], Files: [], Sources: [], Institutions: [], Icons: [], ExtraMetrics: [],
		Onboarding: { Steps: [] },
	};
}

// Responde GetWorkInfo con el trabajo indicado y el resto de los GET con lista vacía.
function respondWork(workData) {
	axios.respondByUrl('get', {
		[BASE + 'GetWorkInfo']: { data: workData },
		[BASE + 'GetWorkMetricVersions?w=' + workData.Work.Id]: { data: [] },
	});
}

function makeRouter() {
	return { pushed: [], push(destination) { this.pushed.push(destination); } };
}

describe('Db: estado inicial');

it('arranca sin trabajos y sin selección, y hereda las operaciones de cuenta de DbAdminBase', () => {
	const db = new Db();
	expect(db.Works).toEqual([]);
	expect(db.WorksCache).toEqual({});
	expect(db.SelectedWorkIndex).toBe(-1);
	expect(db instanceof DbAdminBase).toBeTruthy();
	expect(typeof db.GetCurrentUserAccount).toBe('function');
});

describe('Db: direcciones de servicios');

it('arma las URL de clonado, eliminación, publicación y revocación', () => {
	const db = new Db();
	setupBackoffice();
	expect(db.GetStartWorkCloneUrl(4, 'Copia de Obra & más')).toBe(BASE + 'StartCloneWork?w=4&n=Copia%20de%20Obra%20%26%20m%C3%A1s');
	expect(db.GetStepWorkCloneUrl()).toBe(BASE + 'StepCloneWork');
	expect(db.GetStartWorkDeleteUrl(4)).toBe(BASE + 'StartDeleteWork?w=4');
	expect(db.GetStepWorkDeleteUrl()).toBe(BASE + 'StepDeleteWork');
	expect(db.GetStartWorkPublishUrl(4)).toBe(BASE + 'StartPublishWork?w=4');
	expect(db.GetStepWorkPublishUrl()).toBe(BASE + 'StepPublishWork');
	expect(db.GetStartWorkRevokeUrl(4)).toBe(BASE + 'StartRevokeWork?w=4');
	expect(db.GetStepWorkRevokeUrl()).toBe(BASE + 'StepRevokeWork');
});

describe('Db: caché de trabajos');

it('ReleaseWork quita el trabajo del caché y tolera uno que no está', () => {
	const { db } = setup();
	db.WorksCache[3] = {};
	db.ReleaseWork(3);
	expect(db.WorksCache[3]).toBe(undefined);
	db.ReleaseWork(99);
});

it('ReceiveCurrentWork crea el trabajo, lo deja como actual, lo cachea y titula la página', async () => {
	const { db, context, browser } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 0));
	db.ReceiveCurrentWork(makeWorkData(3, 'Obra uno', 0));
	expect(context.CurrentWork instanceof ActiveWork).toBeTruthy();
	expect(db.WorksCache[3] === context.CurrentWork).toBeTruthy();
	expect(globalThis.document.title).toBe('Poblaciones - Obra uno');
	await flushPromises();
});

it('ReceiveCurrentWork reutiliza el trabajo ya cacheado en lugar de crear otro', async () => {
	const { db, context } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 0));
	db.ReceiveCurrentWork(makeWorkData(3, 'Obra uno', 0));
	const first = context.CurrentWork;
	db.ReceiveCurrentWork(makeWorkData(3, 'Otro título', 0));
	expect(context.CurrentWork === first).toBeTruthy();
	expect(globalThis.document.title).toBe('Poblaciones - Obra uno');
	await flushPromises();
});

describe('Db: BindWork');

it('con el trabajo en caché lo deja como actual sin consultar al servidor', async () => {
	const { db, context } = setup();
	const cached = { properties: { Id: 3 } };
	db.WorksCache[3] = cached;
	await db.BindWork(3);
	expect(context.CurrentWork === cached).toBeTruthy();
	expect(axios.calls).toHaveLength(0);
});

it('sin caché lo consulta por su identificador y lo cachea', async () => {
	const { db, context } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 1));
	await db.BindWork(3);
	expect(axios.calls[0].url).toBe(BASE + 'GetWorkInfo');
	expect(axios.calls[0].config.params).toEqual({ w: 3 });
	expect(context.CurrentWork.properties.Id).toBe(3);
	expect(db.WorksCache[3] === context.CurrentWork).toBeTruthy();
	await flushPromises();
});

it('RebindCurrentWork descarta el caché y vuelve a pedir el trabajo', async () => {
	const { db, context } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 0));
	await db.BindWork(3);
	await flushPromises();
	const first = context.CurrentWork;
	await db.RebindCurrentWork();
	await flushPromises();
	expect(context.CurrentWork === first).toBeFalsy();
	expect(context.CurrentWork.properties.Id).toBe(3);
});

describe('Db: BindDataset');

it('deja el dataset como actual y lo selecciona, interpretando el identificador como número', () => {
	const { db, context } = setup();
	const dataset = { selected: 0, Selected() { this.selected++; } };
	let askedFor = null;
	context.CurrentWork = { GetActiveDatasetById(id) { askedFor = id; return dataset; } };
	db.BindDataset('301');
	expect(askedFor).toBe(301);
	expect(context.CurrentDataset === dataset).toBeTruthy();
	expect(dataset.selected).toBe(1);
});

it('con un dataset inexistente no cambia el actual', () => {
	const { db, context } = setup();
	context.CurrentWork = { GetActiveDatasetById() { return null; } };
	context.CurrentDataset = 'previo';
	db.BindDataset(5);
	expect(context.CurrentDataset).toBe('previo');
});

describe('Db: reenlaces con navegación');

it('RebindAndFocusMetadataContent vuelve a cargar el trabajo y navega a su contenido', async () => {
	const { db } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 0));
	await db.BindWork(3);
	await flushPromises();
	const router = makeRouter();
	await db.RebindAndFocusMetadataContent(router);
	await flushPromises();
	expect(router.pushed).toEqual([{ path: '/cartographies/3/content' }]);
});

it('RebindAndFocusLastDataset enlaza y navega al último dataset', async () => {
	const { db, browser } = setup();
	const bound = [];
	db.BindDataset = function (id) { bound.push(id); };
	respondWork(makeWorkData(3, 'Obra uno', 2));
	await db.BindWork(3);
	await flushPromises();
	respondWork(makeWorkData(3, 'Obra uno', 2));
	const router = makeRouter();
	await db.RebindAndFocusLastDataset(router);
	await flushPromises();
	expect(bound).toEqual([302]);
	expect(router.pushed).toEqual([{ path: '/cartographies/3/datasets/302' }]);
});

it('RebindAndGeorreferenceLastDataset marca el dataset para georreferenciar y navega a esa solapa', async () => {
	const { db, context } = setup();
	db.BindDataset = function () {};
	respondWork(makeWorkData(3, 'Obra uno', 2));
	await db.BindWork(3);
	await flushPromises();
	respondWork(makeWorkData(3, 'Obra uno', 2));
	const router = makeRouter();
	await db.RebindAndGeorreferenceLastDataset(router);
	await flushPromises();
	expect(context.CurrentWork.Datasets[1].GeoreferenceOnce).toBeTruthy();
	expect(router.pushed).toEqual([{ path: '/cartographies/3/datasets/302/georeference' }]);
});

it('sin datasets, los reenlaces al último dataset navegan al contenido de la cartografía', async () => {
	const { db } = setup();
	respondWork(makeWorkData(3, 'Obra uno', 0));
	await db.BindWork(3);
	await flushPromises();
	for (const method of ['RebindAndFocusLastDataset', 'RebindAndGeorreferenceLastDataset']) {
		respondWork(makeWorkData(3, 'Obra uno', 0));
		const router = makeRouter();
		await db[method](router);
		await flushPromises();
		expect(router.pushed).toEqual([{ path: '/cartographies/3/content' }]);
	}
});

describe('Db: listado de trabajos');

it('LoadWorks guarda los trabajos, selecciona el primero y actualiza las cartografías del contexto', async () => {
	const { db, context } = setup();
	axios.respond('get', { data: [{ Id: 1 }, { Id: 2 }] });
	await db.LoadWorks();
	expect(axios.calls[0].url).toBe(BASE + 'GetCurrentUserWorks');
	expect(db.Works).toEqual([{ Id: 1 }, { Id: 2 }]);
	expect(db.SelectedWorkIndex).toBe(0);
	expect(context.Cartographies).toEqual([{ Id: 1 }, { Id: 2 }]);
	expect(context.CartographiesStarted).toBeTruthy();
});

it('LoadWorks sin trabajos deja la selección en -1 y marca la carga como iniciada', async () => {
	const { db, context } = setup();
	axios.respond('get', { data: [] });
	await db.LoadWorks();
	expect(db.SelectedWorkIndex).toBe(-1);
	expect(context.CartographiesStarted).toBeTruthy();
});

it('SearchUserWorks consulta con el texto y el límite y devuelve solo los datos', async () => {
	const { db } = setup();
	axios.respond('get', { data: { Works: { Items: [] } } });
	const data = await db.SearchUserWorks('pobl', 5);
	expect(axios.calls[0].url).toBe(BASE + 'SearchUserWorks');
	expect(axios.calls[0].config.params).toEqual({ q: 'pobl', l: 5 });
	expect(data).toEqual({ Works: { Items: [] } });
});

it('SearchUserWorks rechaza sin abrir un diálogo cuando el servidor falla', async () => {
	const { db, browser } = setup();
	axios.respond('get', new Error('sin conexión'));
	let caught = null;
	try {
		await db.SearchUserWorks('pobl', 5);
	} catch (e) {
		caught = e;
	}
	expect(caught.message).toBe('sin conexión');
	expect(browser.alerts).toHaveLength(0);
});

it('CreateWork completa los datos del listado, agrega el trabajo a las cartografías y lo devuelve', async () => {
	const { db, context } = setup();
	axios.respond('get', { data: { Id: 12, Type: 'R' } });
	const created = await db.CreateWork('Nueva obra', 'R');
	expect(axios.calls[0].config.params).toEqual({ c: 'Nueva obra', t: 'R' });
	expect(created.Caption).toBe('Nueva obra');
	expect(created.UpdateUser).toBe('Ana Pérez');
	expect(created.DatasetCount).toBe(0);
	expect(created.MetricCount).toBe(0);
	expect(created.GeorreferencedCount).toBe(0);
	expect(created.MetadataLastOnline).toBeNull();
	expect(created.PreviewId).toBeNull();
	expect(/^\d{4}-\d{2}-\d{2} /.test(created.Updated)).toBeTruthy();
	expect(context.Cartographies[0] === created).toBeTruthy();
});

it('RenameWork cambia el título de la cartografía indicada y deja las demás', () => {
	const { db, context } = setup();
	context.Cartographies = [{ Id: 1, Caption: 'A' }, { Id: 2, Caption: 'B' }];
	db.RenameWork(2, 'Nuevo');
	expect(context.Cartographies[0].Caption).toBe('A');
	expect(context.Cartographies[1].Caption).toBe('Nuevo');
	db.RenameWork(99, 'X');
});

describe('Db: acciones sobre una cartografía');

const WORK_ACTIONS = [
	['PromoteExample', 'PromoteExample'],
	['HideExample', 'HideExample'],
	['DemoteExample', 'DemoteExample'],
	['ArchiveWork', 'ArchiveWork'],
	['UnarchiveWork', 'UnarchiveWork'],
	['PromoteWork', 'PromoteWork'],
	['DemoteWork', 'DemoteWork'],
];

it('cada acción envía por POST el identificador del trabajo al servicio correspondiente', async () => {
	const { db } = setup();
	axios.respond('post', { data: 'ok' });
	for (const [method, service] of WORK_ACTIONS) {
		await db[method](7);
		const call = axios.calls[axios.calls.length - 1];
		expect(call.url).toBe(BASE + service);
		expect(parseBody(call)).toEqual({ w: '7' });
	}
});

it('cada acción ejecuta el callback una sola vez al terminar, si se lo pasa', async () => {
	const { db } = setup();
	axios.respond('post', { data: 'ok' });
	for (const [method] of WORK_ACTIONS) {
		let called = 0;
		await db[method](7, function () { called++; });
		expect(called).toBe(1);
	}
});

it('una acción que falla no ejecuta el callback', async () => {
	const { db } = setup();
	axios.respond('post', new Error('boom'));
	let called = 0;
	let caught = null;
	const originalError = console.error;
	console.error = function () {};
	try {
		await db.ArchiveWork(7, function () { called++; });
	} catch (e) {
		caught = e;
	} finally {
		console.error = originalError;
	}
	expect(caught.message).toBe('boom');
	expect(called).toBe(0);
});

it('GetWorkPreview, ServerClipboardCopy y ServerClipboardPaste usan sus servicios', async () => {
	const { db } = setup();
	axios.respond('get', { data: 'vista' });
	axios.respond('post', { data: 'ok' });
	expect(await db.GetWorkPreview(3)).toBe('vista');
	expect(axios.calls[0].config.params).toEqual({ w: 3 });
	await db.ServerClipboardCopy('texto');
	expect(axios.calls[1].url).toBe(BASE + 'ClipboardCopy');
	expect(parseBody(axios.calls[1])).toEqual({ t: 'texto' });
	await db.ServerClipboardPaste();
	expect(axios.calls[2].url).toBe(BASE + 'ClipboardPaste');
});
