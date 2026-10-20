import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, parseBody } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import ActiveWork from '@/backoffice/classes/ActiveWork';

const BASE = 'https://api.example.org/services/backoffice/';

function setup(privileges) {
	axios.reset();
	const browser = setupBackoffice(privileges || 'P');
	const context = browser.window.Context;
	context.BooleanKeys = { WorkTopBarPublish: 1 };
	context.User = { Privileges: privileges || 'P', User: 'ana@x.org', Firstname: 'Ana', Lastname: 'Pérez', Email: 'ana@x.org' };
	context.privacyUpdates = [];
	context.UpdatePrivacy = function (id, value) { context.privacyUpdates.push([id, value]); };
	browser.window.Db.loadWorksCalls = 0;
	browser.window.Db.LoadWorks = function () { browser.window.Db.loadWorksCalls++; };
	return browser;
}

function makeWorkInfo(workOverrides, infoOverrides) {
	const work = Object.assign({
		Id: 3,
		Type: 'R',
		IsIndexed: false,
		IsPrivate: false,
		AccessLink: null,
		Startup: { Type: 'M' },
		MetadataChanged: false,
		DatasetLabelsChanged: false,
		DatasetDataChanged: false,
		MetricLabelsChanged: false,
		MetricDataChanged: false,
		Metadata: { Id: 9, Title: 'Obra', Url: '/map/abc', LastOnline: '2024-01-01' },
	}, workOverrides);
	return Object.assign({
		Work: work,
		Datasets: [{ Id: 1, Geocoded: true }, { Id: 2, Geocoded: false }],
		Permissions: [],
		Files: [],
		Sources: [],
		Institutions: [],
		StatsMonths: [],
		StatsQuarters: [],
		PendingReviewSince: null,
		ArkUrl: null,
		Startup: { Type: 'M' },
		ExtraMetrics: [],
		Icons: [],
		Onboarding: { Steps: [] },
	}, infoOverrides);
}

// Crea el trabajo y deja correr la carga inicial de versiones de indicadores,
// para que los tests vean solo las llamadas que ellos provocan.
async function makeWork(workOverrides, infoOverrides, workList, versions) {
	axios.respond('get', { data: versions || [] });
	const work = new ActiveWork(makeWorkInfo(workOverrides, infoOverrides), workList || []);
	await flushPromises();
	axios.calls = [];
	axios.respond('get', { data: 'ok' });
	axios.respond('post', { data: 'ok' });
	return work;
}

function lastCall() {
	return axios.calls[axios.calls.length - 1];
}

describe('ActiveWork: construcción');

it('envuelve cada dataset, selecciona el primero y reinicia el indicador de cambios de la barra', async () => {
	const browser = setup();
	const work = await makeWork();
	expect(work.Datasets).toHaveLength(2);
	expect(work.Datasets[0].Work === work).toBeTruthy();
	expect(work.SelectedDatasetIndex).toBe(0);
	expect(browser.window.Context.BooleanKeys.WorkTopBarPublish).toBe(0);
	expect(work.Metadata.Work === work).toBeTruthy();
});

it('pide al servidor las versiones de indicadores del trabajo al crearse', async () => {
	setup();
	axios.respond('get', { data: [] });
	new ActiveWork(makeWorkInfo(), []);
	expect(axios.calls[0].url).toBe(BASE + 'GetWorkMetricVersions?w=3');
	await flushPromises();
});

it('sin datasets no selecciona ninguno', async () => {
	setup();
	const work = await makeWork({}, { Datasets: [] });
	expect(work.Datasets).toHaveLength(0);
	expect(work.SelectedDatasetIndex).toBe(-1);
	expect(work.SelectedDataset()).toBeNull();
});

it('si la información no trae datasets queda sin elementos y sin selección', async () => {
	setup();
	const work = await makeWork({}, { Datasets: undefined });
	expect(work.Datasets).toHaveLength(0);
	expect(work.SelectedDatasetIndex).toBe(-1);
});

it('SelectedDataset devuelve el dataset del índice seleccionado', async () => {
	setup();
	const work = await makeWork();
	work.SelectedDatasetIndex = 1;
	expect(work.SelectedDataset().properties.Id).toBe(2);
});

describe('ActiveWork: tipo y búsqueda de datasets');

it('IsPublicData y ThisWorkLabel dependen del tipo del trabajo', async () => {
	setup();
	const publicWork = await makeWork({ Type: 'P' });
	expect(publicWork.IsPublicData()).toBeTruthy();
	expect(publicWork.ThisWorkLabel()).toBe('estos datos públicos');
	const regular = await makeWork({ Type: 'R' });
	expect(regular.IsPublicData()).toBeFalsy();
	expect(regular.ThisWorkLabel()).toBe('esta cartografía');
});

it('GetActiveDatasetById devuelve el dataset o null', async () => {
	setup();
	const work = await makeWork();
	expect(work.GetActiveDatasetById(2).properties.Id).toBe(2);
	expect(work.GetActiveDatasetById(99)).toBeNull();
});

describe('ActiveWork: permisos');

it('un administrador edita y administra aunque el trabajo esté indexado', async () => {
	setup('A');
	const work = await makeWork({ IsIndexed: true });
	expect(work.CanEdit()).toBeTruthy();
	expect(work.CanAdmin()).toBeTruthy();
	expect(work.ReadOnlyCausedByIndexing()).toBeFalsy();
});

it('un editor edita los datos públicos aunque estén indexados, pero no los administra por ello', async () => {
	setup('E');
	const work = await makeWork({ Type: 'P', IsIndexed: true });
	expect(work.CanEdit()).toBeTruthy();
	expect(work.ReadOnlyCausedByIndexing()).toBeFalsy();
	expect(work.CanAdmin()).toBeFalsy();
});

it('un trabajo indexado es de solo lectura para quien no es administrador ni editor de datos públicos', async () => {
	setup('P');
	const permissions = [{ User: { Email: 'ana@x.org' }, Permission: 'A' }];
	const work = await makeWork({ IsIndexed: true }, { Permissions: permissions });
	expect(work.CanEdit()).toBeFalsy();
	expect(work.ReadOnlyCausedByIndexing()).toBeTruthy();
});

it('CanEdit exige un permiso propio distinto de solo lectura', async () => {
	setup('P');
	const own = [{ User: { Email: 'ana@x.org' }, Permission: 'E' }];
	expect((await makeWork({}, { Permissions: own })).CanEdit()).toBeTruthy();
	const readOnly = [{ User: { Email: 'ana@x.org' }, Permission: 'V' }];
	expect((await makeWork({}, { Permissions: readOnly })).CanEdit()).toBeFalsy();
	const other = [{ User: { Email: 'otra@x.org' }, Permission: 'A' }];
	expect((await makeWork({}, { Permissions: other })).CanEdit()).toBeFalsy();
});

it('CanAdmin exige un permiso propio de administración', async () => {
	setup('P');
	const admin = [{ User: { Email: 'ana@x.org' }, Permission: 'A' }];
	expect((await makeWork({}, { Permissions: admin })).CanAdmin()).toBeTruthy();
	const editor = [{ User: { Email: 'ana@x.org' }, Permission: 'E' }];
	expect((await makeWork({}, { Permissions: editor })).CanAdmin()).toBeFalsy();
});

it('IsLastAdministrator es verdadero solo si el ítem es administrador y no queda otro', async () => {
	setup();
	const first = { Id: 1, Permission: 'A' };
	const second = { Id: 2, Permission: 'A' };
	const editor = { Id: 3, Permission: 'E' };
	const alone = await makeWork({}, { Permissions: [first, editor] });
	expect(alone.IsLastAdministrator(first)).toBeTruthy();
	expect(alone.IsLastAdministrator(editor)).toBeFalsy();
	const pair = await makeWork({}, { Permissions: [first, second] });
	expect(pair.IsLastAdministrator(first)).toBeFalsy();
});

it('AddPermission pide el alta y agrega el permiso devuelto', async () => {
	setup();
	const work = await makeWork();
	axios.respond('get', { data: { Id: 8, Permission: 'E' } });
	await work.AddPermission('otra@x.org', 'E', true);
	expect(lastCall().url).toBe(BASE + 'AddWorkPermission');
	expect(lastCall().config.params).toEqual({ u: 'otra@x.org', w: 3, p: 'E', n: true });
	expect(work.Permissions).toEqual([{ Id: 8, Permission: 'E' }]);
});

it('DeletePermission pide la baja y quita el permiso de la lista', async () => {
	setup();
	const permission = { Id: 8, Permission: 'E', User: { Email: 'x' } };
	const work = await makeWork({}, { Permissions: [permission] });
	await work.DeletePermission(permission);
	expect(lastCall().config.params).toEqual({ p: 8, w: 3 });
	expect(work.Permissions).toHaveLength(0);
});

describe('ActiveWork: cambios y publicación');

it('HasChanges es verdadero si la barra lo indica, si nunca se publicó o si algún indicador de cambio está activo', async () => {
	setup();
	const clean = await makeWork();
	clean.properties.Metadata.LastOnline = '2024-01-01';
	setupContextKey(0);
	expect(clean.HasChanges()).toBeFalsy();
	setupContextKey(1);
	expect(clean.HasChanges()).toBeTruthy();
	setupContextKey(0);
	clean.properties.Metadata.LastOnline = null;
	expect(clean.HasChanges()).toBeTruthy();
	clean.properties.Metadata.LastOnline = '2024-01-01';
	for (const flag of ['MetadataChanged', 'DatasetLabelsChanged', 'DatasetDataChanged', 'MetricLabelsChanged', 'MetricDataChanged']) {
		clean.properties[flag] = true;
		expect(clean.HasChanges()).toBeTruthy();
		clean.properties[flag] = false;
	}
});

function setupContextKey(value) {
	globalThis.window.Context.BooleanKeys.WorkTopBarPublish = value;
}

it('WorkChanged marca la barra y actualiza solo la fila de su trabajo en el listado', async () => {
	setup();
	const list = [{ Id: 1, HasChanges: 0 }, { Id: 3, HasChanges: 0 }];
	const work = await makeWork({}, {}, list);
	work.WorkChanged();
	expect(globalThis.window.Context.BooleanKeys.WorkTopBarPublish).toBe(1);
	expect(list[1].HasChanges).toBe(1);
	expect(list[1].UpdateUser).toBe('Ana Pérez');
	expect(/^\d{4}-\d{2}-\d{2} /.test(list[1].Updated)).toBeTruthy();
	expect(list[0].HasChanges).toBe(0);
	expect(list[1].MetadataLastOnline).toBe(undefined);
});

it('WorkPublished limpia los cambios, registra la publicación y borra la vista previa', async () => {
	setup();
	const list = [{ Id: 3, HasChanges: 1, PreviewId: 'p1' }];
	const work = await makeWork({}, {}, list);
	work.WorkPublished();
	expect(list[0].HasChanges).toBe(0);
	expect(list[0].PreviewId).toBeNull();
	expect(list[0].LastOnlineUser).toBe('Ana Pérez');
	expect(typeof list[0].MetadataLastOnline).toBe('string');
	expect(typeof work.properties.Metadata.LastOnline).toBe('number');
	expect(globalThis.window.Context.BooleanKeys.WorkTopBarPublish).toBe(0);
});

it('CalculateListItemStatus distingue clonación fallida, sin publicar, con cambios y publicada', () => {
	const status = ActiveWork.CalculateListItemStatus;
	expect(status({ Unfinished: true }).tag).toBe('unfinished');
	expect(status({ Metadata: null }).tag).toBe('unpublished');
	expect(status({ Metadata: {}, MetadataLastOnline: null }).tag).toBe('unpublished');
	expect(status({ Metadata: {}, MetadataLastOnline: 'x', HasChanges: 1 }).tag).toBe('published_changes');
	expect(status({ Metadata: {}, MetadataLastOnline: 'x', HasChanges: 0 }).tag).toBe('published');
});

it('CalculateListItemStatus agrega la visibilidad privada a la etiqueta salvo en la clonación fallida', () => {
	const status = ActiveWork.CalculateListItemStatus;
	expect(status({ Metadata: {}, MetadataLastOnline: 'x', HasChanges: 0, IsPrivate: true }).label).toBe('Publicada - Visiblidad: Privada');
	expect(status({ Metadata: {}, MetadataLastOnline: 'x', HasChanges: 0, IsPrivate: false }).label).toBe('Publicada');
	expect(status({ Unfinished: true, IsPrivate: true }).label).toBe('Clonación fallida');
});

it('UpdateDatasetGeorreferencedCount cuenta los datasets georreferenciados', async () => {
	setup();
	const work = await makeWork();
	expect(work.UpdateDatasetGeorreferencedCount()).toEqual({ DatasetCount: 2, GeorreferencedCount: 1 });
});

it('UpdateDatasetGeorreferencedCount anota en el listado la cantidad de datasets y la de georreferenciados', async () => {
	setup();
	const list = [{ Id: 3, DatasetCount: 0, GeorreferencedCount: 0 }];
	const work = await makeWork({}, {}, list);
	work.UpdateDatasetGeorreferencedCount();
	expect(list[0].DatasetCount).toBe(2);
	expect(list[0].GeorreferencedCount).toBe(1);
});

describe('ActiveWork: direcciones');

it('PublicUrl devuelve null sin URL y agrega el enlace de acceso si existe', async () => {
	setup();
	const withoutUrl = await makeWork({ Metadata: { Url: null, LastOnline: null } });
	expect(withoutUrl.PublicUrl()).toBeNull();
	const plain = await makeWork({ AccessLink: null });
	expect(plain.PublicUrl()).toBe('/map/abc');
	const withLink = await makeWork({ AccessLink: 'xyz' });
	expect(withLink.PublicUrl()).toBe('/map/abc/xyz');
});

it('PublicTableUrl reemplaza el prefijo /map/ por /table/', async () => {
	setup();
	const work = await makeWork({ AccessLink: 'xyz' });
	expect(work.PublicTableUrl()).toBe('/table/abc/xyz');
});

it('arma las URL de exportación, prueba, carga e importación con el identificador del trabajo', async () => {
	setup();
	const work = await makeWork();
	expect(work.GetGridExportUrl()).toBe(BASE + 'ExportGridService?w=3');
	expect(work.GetStartWorkTestUrl()).toBe(BASE + 'StartTestWork?w=3');
	expect(work.GetStepWorkTestUrl()).toBe(BASE + 'StepTestWork');
	expect(work.GetUploadUrl()).toBe(BASE + 'UploadFile');
	expect(work.GetDatasetFileImportUrl(true)).toBe(BASE + 'Dataset/CreateMultiImportFile?k=1');
	expect(work.GetDatasetFileImportUrl(false)).toBe(BASE + 'Dataset/CreateMultiImportFile?k=0');
	expect(work.GetStepDatasetFileImportUrl()).toBe(BASE + 'Dataset/StepMultiImportFile');
	expect(work.PreviewMapTarget()).toBe('_mapPbl3');
	expect(work.PreviewTableTarget()).toBe('_tablePbl3');
});

describe('ActiveWork: niveles de indicadores');

const VERSIONS = [
	{ Levels: [{ Id: 10, MetricVersion: { Id: 1 } }, { Id: 11, MetricVersion: { Id: 2 } }] },
	{ Levels: [{ Id: 12, MetricVersion: { Id: 1 } }] },
];

it('GetLevelToUse devuelve el último nivel que corresponde a la versión', async () => {
	setup();
	const work = await makeWork();
	expect(work.GetLevelToUse(VERSIONS, { Id: 1 }).Id).toBe(12);
	expect(work.GetLevelToUse(VERSIONS, { Id: 2 }).Id).toBe(11);
});

it('GetLevelToUse falla si ningún nivel corresponde a la versión', async () => {
	setup();
	const work = await makeWork();
	let message = null;
	try {
		work.GetLevelToUse(VERSIONS, { Id: 99 });
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('No se ha encontrado el nivel para este indicador.');
});

it('GetHighestLevelForVersion trae las variables del nivel elegido y las deja en él', async () => {
	setup();
	const work = await makeWork({}, {}, [], VERSIONS);
	axios.respond('get', { data: [{ Id: 500 }] });
	const level = await work.GetHighestLevelForVersion({ Id: 1 });
	expect(level.Id).toBe(12);
	expect(level.Variables).toEqual([{ Id: 500 }]);
	expect(lastCall().url).toBe(BASE + 'GetMetricVersionLevelVariables');
	expect(lastCall().config.params).toEqual({ w: 3, l: 12 });
});

describe('ActiveWork: servicios de consulta');

it('cada consulta usa su servicio y sus parámetros', async () => {
	setup();
	const work = await makeWork();
	const cases = [
		[function () { return work.GetMetricsList(); }, 'GetWorkMetricsList', { w: 3 }],
		[function () { return work.GetWorkStatistics('2024-05'); }, 'GetWorkStatistics', { w: 3, m: '2024-05' }],
		[function () { return work.VerifyDatasetsImportFile('b1', 'xlsx'); }, 'Dataset/VerifyDatasetsImportFile', { b: 'b1', fe: 'xlsx' }],
		[function () { return work.GetMetricVersionsByMetric({ Id: 4 }); }, 'GetMetricVersionsByMetric', { m: 4, w: 3 }],
		[function () { return work.GetGeographyItems(6); }, 'GetGeographyItems', { g: 6 }],
		[function () { return work.GetStepImage(2); }, 'GetStepImage', { w: 3, s: 2 }],
		[function () { return work.RequestReview(); }, 'RequestReview', { w: 3 }],
	];
	for (const [call, service, params] of cases) {
		await call();
		expect(lastCall().url).toBe(BASE + service);
		expect(lastCall().config.params).toEqual(params);
	}
});

describe('ActiveWork: escrituras que marcan cambios');

it('CreateNewDataset pide el alta, marca el cambio y recarga el listado de trabajos', async () => {
	const browser = setup();
	const list = [{ Id: 3, HasChanges: 0 }];
	const work = await makeWork({}, {}, list);
	axios.respond('get', { data: { Id: 77 } });
	const data = await work.CreateNewDataset('Nuevo');
	expect(data).toEqual({ Id: 77 });
	expect(lastCall().config.params).toEqual({ w: 3, t: 'Nuevo' });
	expect(list[0].HasChanges).toBe(1);
	expect(browser.window.Db.loadWorksCalls).toBe(1);
});

it('las consultas de indicadores adicionales marcan el cambio y envían sus parámetros', async () => {
	setup();
	const list = [{ Id: 3, HasChanges: 0 }];
	const work = await makeWork({}, {}, list);
	await work.AppendExtraMetric({ Id: 4 });
	expect(lastCall().url).toBe(BASE + 'AppendExtraMetric');
	expect(lastCall().config.params).toEqual({ w: 3, m: 4 });
	await work.UpdateExtraMetricStart({ Id: 4, StartActive: true });
	expect(lastCall().config.params).toEqual({ w: 3, m: 4, a: 1 });
	await work.UpdateExtraMetricStart({ Id: 4, StartActive: false });
	expect(lastCall().config.params.a).toBe(0);
	await work.RemoveExtraMetric({ Id: 4 });
	expect(lastCall().url).toBe(BASE + 'RemoveExtraMetric');
	expect(list[0].HasChanges).toBe(1);
});

it('DeleteIcon pide la baja y quita el ícono de la lista', async () => {
	setup();
	const work = await makeWork({}, { Icons: [{ Id: 1 }, { Id: 2 }] });
	await work.DeleteIcon(1);
	expect(lastCall().config.params).toEqual({ w: 3, i: 1 });
	expect(work.Icons).toEqual([{ Id: 2 }]);
});

it('las escrituras por POST envían el identificador del trabajo y sus datos', async () => {
	setup();
	const list = [{ Id: 3, HasChanges: 0 }];
	const work = await makeWork({}, {}, list);
	await work.CreateIcon('casa', 'imagen');
	expect(lastCall().url).toBe(BASE + 'CreateWorkIcon');
	expect(parseBody(lastCall())).toEqual({ w: '3', n: 'casa', iwm: 'imagen' });
	await work.UpdateIcon(5, 'nuevo');
	expect(parseBody(lastCall())).toEqual({ w: '3', i: '5', n: 'nuevo' });
	await work.UpdateOnboardingStep({ Id: 1 }, 'img');
	expect(lastCall().url).toBe(BASE + 'UpdateOnboardingStep');
	expect(JSON.parse(parseBody(lastCall()).s)).toEqual({ Id: 1 });
	await work.UpdateStartup();
	expect(lastCall().url).toBe(BASE + 'UpdateStartup');
	expect(JSON.parse(parseBody(lastCall()).s)).toEqual({ Type: 'M' });
	expect(list[0].HasChanges).toBe(1);
});

it('UpdateOnboarding envía la bienvenida y sus pasos', async () => {
	setup();
	const work = await makeWork({}, { Onboarding: { Enabled: true, Steps: [{ Id: 1 }] } });
	await work.UpdateOnboarding();
	const body = parseBody(lastCall());
	expect(JSON.parse(body.o).Enabled).toBeTruthy();
	expect(JSON.parse(body.s)).toEqual([{ Id: 1 }]);
});

it('UpdateVisibility envía el enlace y la privacidad y la refleja en el contexto', async () => {
	const browser = setup();
	const work = await makeWork({ IsPrivate: true, AccessLink: 'abc' });
	await work.UpdateVisibility();
	expect(lastCall().config.params).toEqual({ w: 3, l: 'abc', p: '1' });
	expect(browser.window.Context.privacyUpdates).toEqual([[3, true]]);
	work.properties.IsPrivate = false;
	await work.UpdateVisibility();
	expect(lastCall().config.params.p).toBe('0');
});

it('UpdateMultilevelMatrix envía la matriz de cada dataset por su identificador y marca el cambio', async () => {
	setup();
	const list = [{ Id: 3, HasChanges: 0 }];
	const work = await makeWork({}, {}, list);
	work.Datasets[0].properties.MultilevelMatrix = [[1, 2]];
	work.Datasets[1].properties.MultilevelMatrix = null;
	await work.UpdateMultilevelMatrix();
	expect(lastCall().url).toBe(BASE + 'UpdateMultilevelMatrix');
	expect(lastCall().config.params).toEqual({ w: 3, d: { 1: [[1, 2]], 2: null } });
	expect(list[0].HasChanges).toBe(1);
});
