import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises } from './fixtures.mjs';
import WorkSearch from '@/backoffice/classes/WorkSearch';

// Doble de Db.SearchUserWorks que deja resolver o rechazar cada consulta a mano.
function installPendingDb(browser) {
	const pending = [];
	browser.window.Db.SearchUserWorks = function (text, limit) {
		const call = { text: text, limit: limit };
		call.promise = new Promise(function (resolve, reject) {
			call.resolve = resolve;
			call.reject = reject;
		});
		pending.push(call);
		return call.promise;
	};
	return pending;
}

function emptyGroup() {
	return { Items: [], HasMore: false };
}

function makeResponse(overrides) {
	return Object.assign({ Works: emptyGroup(), Datasets: emptyGroup(), Metrics: emptyGroup() }, overrides);
}

describe('WorkSearch: ReadResponse');

it('convierte cada grupo con su tipo, título, contexto y destino', () => {
	const search = new WorkSearch(5);
	const response = makeResponse({
		Works: { Items: [{ Id: 1, Caption: 'Obra', Type: 'R' }], HasMore: false },
		Datasets: { Items: [{ Id: 2, Caption: 'Datos', WorkCaption: 'Obra', WorkType: 'R', WorkId: 1 }], HasMore: false },
		Metrics: {
			Items: [{ LevelId: 9, Caption: 'Tasa', VersionCaption: 'v2', DatasetCaption: 'Datos', WorkCaption: 'Obra', WorkType: 'R', WorkId: 1, DatasetId: 2 }],
			HasMore: false,
		},
	});
	const read = search.ReadResponse(response);
	expect(read.failed).toBeFalsy();
	expect(read.truncatedKinds).toEqual([]);
	expect(read.results).toEqual([
		{ id: 1, kind: 'cartography', caption: 'Obra', context: '', tag: '', route: { path: '/cartographies/1' } },
		{ id: 2, kind: 'dataset', caption: 'Datos', context: 'Cartografía: Obra', tag: '', route: { path: '/cartographies/1/datasets/2/data' } },
		{
			id: 9, kind: 'metric', caption: 'Tasa (v2)', context: 'Dataset: Datos · Cartografía: Obra', tag: '',
			route: { path: '/cartographies/1/datasets/2/metrics', query: { level: '9' } },
		},
	]);
});

it('marca con la etiqueta de datos públicos los resultados de tipo P', () => {
	const search = new WorkSearch(5);
	const response = makeResponse({
		Works: { Items: [{ Id: 1, Caption: 'Obra', Type: 'P' }], HasMore: false },
		Datasets: { Items: [{ Id: 2, Caption: 'Datos', WorkCaption: 'Obra', WorkType: 'P', WorkId: 1 }], HasMore: false },
	});
	const read = search.ReadResponse(response);
	expect(read.results[0].tag).toBe('Datos públicos');
	expect(read.results[1].tag).toBe('Datos públicos');
});

it('informa los grupos truncados por HasMore, en el orden de los grupos', () => {
	const search = new WorkSearch(5);
	const response = makeResponse({
		Works: { Items: [], HasMore: true },
		Metrics: { Items: [], HasMore: true },
	});
	expect(search.ReadResponse(response).truncatedKinds).toEqual(['cartography', 'metric']);
});

it('una respuesta sin grupos falla con su error, sin ocultarlo', () => {
	const search = new WorkSearch(5);
	let thrown = null;
	try {
		search.ReadResponse({});
	} catch (e) {
		thrown = e;
	}
	expect(thrown instanceof TypeError).toBeTruthy();
});

describe('WorkSearch: Search');

it('consulta con el texto y el límite por grupo y resuelve con los resultados', async () => {
	const browser = setupBackoffice();
	const pending = installPendingDb(browser);
	const search = new WorkSearch(7);
	const promise = search.Search('poblacion');
	expect(pending[0].text).toBe('poblacion');
	expect(pending[0].limit).toBe(7);
	pending[0].resolve(makeResponse({ Works: { Items: [{ Id: 1, Caption: 'Obra', Type: 'R' }], HasMore: false } }));
	const outcome = await promise;
	expect(outcome.failed).toBeFalsy();
	expect(outcome.results).toHaveLength(1);
});

it('una consulta superada por otra resuelve null y solo la última devuelve resultados', async () => {
	const browser = setupBackoffice();
	const pending = installPendingDb(browser);
	const search = new WorkSearch(5);
	const first = search.Search('a');
	const second = search.Search('ab');
	pending[1].resolve(makeResponse());
	pending[0].resolve(makeResponse());
	expect(await first).toBeNull();
	expect((await second).failed).toBeFalsy();
});

it('si el servidor no responde resuelve con failed en true y sin resultados', async () => {
	const browser = setupBackoffice();
	const pending = installPendingDb(browser);
	const search = new WorkSearch(5);
	const promise = search.Search('a');
	pending[0].reject(new Error('sin conexión'));
	const outcome = await promise;
	expect(outcome).toEqual({ results: null, truncatedKinds: [], failed: true });
});

it('un fallo de una consulta superada resuelve null en lugar de failed', async () => {
	const browser = setupBackoffice();
	const pending = installPendingDb(browser);
	const search = new WorkSearch(5);
	const first = search.Search('a');
	search.Search('ab');
	pending[0].reject(new Error('sin conexión'));
	expect(await first).toBeNull();
});

it('Cancel descarta la respuesta de la consulta en curso', async () => {
	const browser = setupBackoffice();
	const pending = installPendingDb(browser);
	const search = new WorkSearch(5);
	const promise = search.Search('a');
	search.Cancel();
	pending[0].resolve(makeResponse());
	expect(await promise).toBeNull();
	await flushPromises();
});
