import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, captureConsoleAsync, parseBody, installCancelToken } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import ScaleGenerator from '@/backoffice/classes/ScaleGenerator';
import { BASE, makeWork, makeActive, makeColumn, idsOf } from './activeDatasetFixtures.mjs';

function setup() {
	axios.reset();
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.refreshedMetrics = 0;
	context.RefreshMetrics = function () { context.refreshedMetrics++; };
	browser.window.Db.loadWorksCalls = 0;
	browser.window.Db.LoadWorks = function () { browser.window.Db.loadWorksCalls++; };
	axios.respond('get', { data: 'ok' });
	axios.respond('post', { data: 'ok' });
	return browser;
}

function lastCall() {
	return axios.calls[axios.calls.length - 1];
}

function makeLevel(overrides) {
	return Object.assign({ Id: 20, MetricVersion: { Id: 30, Metric: { Id: 40 } }, Variables: [] }, overrides);
}

function makeVariable(id, overrides) {
	return Object.assign({
		Id: id, Order: id, IsDefault: false, Data: 'N', DataColumn: null, FilterValue: null, IsGap: false,
		Symbology: { CutMode: 'J', CutColumn: null },
	}, overrides);
}

describe('ActiveDataset: estado inicial');

it('arranca sin columnas ni etiquetas y con sus generadores de escalas y niveles', () => {
	const dataset = makeActive();
	expect(dataset.GeoreferenceOnce).toBeFalsy();
	expect(dataset.Labels).toBeNull();
	expect(dataset.Columns).toBeNull();
	expect(dataset.MultilevelMatrix).toEqual([]);
	expect(dataset.MetricVersionLevels).toEqual([]);
	expect(dataset.GettingColumns).toBeFalsy();
	expect(dataset.beingDeleted).toBeFalsy();
	expect(dataset.ScaleGenerator instanceof ScaleGenerator).toBeTruthy();
});

describe('ActiveDataset: alta, copia, importación y baja');

it('Create pide el alta con el título y marca el cambio del trabajo', async () => {
	setup();
	const work = makeWork();
	await makeActive({}, work).Create(3, 'Nuevo');
	expect(lastCall().url).toBe(BASE + 'CreateDataset');
	expect(lastCall().config.params).toEqual({ w: 3, t: 'Nuevo' });
	expect(work.changed).toBe(1);
});

it('CloneDataset duplica con el nombre indicado, recarga los trabajos y devuelve la respuesta', async () => {
	const browser = setup();
	axios.respond('get', { data: { Id: 99 } });
	const data = await makeActive().CloneDataset(3, 'Copia');
	expect(lastCall().config.params).toEqual({ w: 3, k: 5, n: 'Copia' });
	expect(data).toEqual({ Id: 99 });
	expect(browser.window.Db.loadWorksCalls).toBe(1);
});

it('las conversiones de etiquetas envían el contenido por POST y no marcan cambios', async () => {
	setup();
	const work = makeWork();
	const dataset = makeActive({}, work);
	await dataset.ConvertCsvLabelsFile(3, 'a,b');
	expect(lastCall().url).toBe(BASE + 'ConvertCsvLabelsFile');
	expect(parseBody(lastCall())).toEqual({ w: '3', k: '5', d: 'a,b' });
	await dataset.ConvertExcelLabelsFile(3, 'datos');
	expect(lastCall().url).toBe(BASE + 'ConvertExcelLabelsFile');
	expect(work.changed).toBe(0);
});

it('DeleteDataset marca el dataset como en eliminación y recarga los trabajos al terminar', async () => {
	const browser = setup();
	const dataset = makeActive();
	const promise = dataset.DeleteDataset(3);
	expect(dataset.beingDeleted).toBeTruthy();
	await promise;
	expect(lastCall().config.params).toEqual({ w: 3, k: 5 });
	expect(dataset.beingDeleted).toBeTruthy();
	expect(browser.window.Db.loadWorksCalls).toBe(1);
});

it('al eliminar libera la matriz multinivel si queda un solo dataset vinculado', async () => {
	setup();
	const work = makeWork();
	const dataset = makeActive({ Id: 5, MultilevelMatrix: 2 }, work);
	const partner = makeActive({ Id: 6, MultilevelMatrix: 2 }, work);
	work.Datasets = [dataset, partner];
	await dataset.DeleteDataset(3);
	expect(partner.properties.MultilevelMatrix).toBeNull();
});

it('al eliminar conserva la matriz multinivel si quedan varios datasets vinculados', async () => {
	setup();
	const work = makeWork();
	const dataset = makeActive({ Id: 5, MultilevelMatrix: 2 }, work);
	const first = makeActive({ Id: 6, MultilevelMatrix: 2 }, work);
	const second = makeActive({ Id: 7, MultilevelMatrix: 2 }, work);
	work.Datasets = [dataset, first, second];
	await dataset.DeleteDataset(3);
	expect(first.properties.MultilevelMatrix).toBe(2);
	expect(second.properties.MultilevelMatrix).toBe(2);
});

it('si la baja falla deja el dataset como no eliminado y no recarga los trabajos', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	const dataset = makeActive();
	await captureConsoleAsync(async function () {
		await dataset.DeleteDataset(3);
	});
	expect(dataset.beingDeleted).toBeFalsy();
	expect(browser.window.Db.loadWorksCalls).toBe(0);
});

describe('ActiveDataset: variables e indicadores');

it('MoveVariableUp y MoveVariableDown reordenan la lista del nivel tras la respuesta del servidor', async () => {
	setup();
	const level = makeLevel({ Variables: [makeVariable(1), makeVariable(2), makeVariable(3)] });
	const dataset = makeActive();
	await dataset.MoveVariableUp(level, level.Variables[2]);
	expect(lastCall().url).toBe(BASE + 'MoveVariableUp');
	expect(lastCall().config.params).toEqual({ v: 3, k: 5 });
	expect(idsOf(level.Variables)).toEqual([1, 3, 2]);
	await dataset.MoveVariableDown(level, level.Variables[0]);
	expect(lastCall().url).toBe(BASE + 'MoveVariableDown');
	expect(idsOf(level.Variables)).toEqual([3, 1, 2]);
});

it('DeleteVariable quita la variable del nivel tras la respuesta del servidor', async () => {
	setup();
	const level = makeLevel({ Variables: [makeVariable(1), makeVariable(2)] });
	await makeActive().DeleteVariable(level, level.Variables[0]);
	expect(lastCall().config.params).toEqual({ k: 5, l: 20, v: 1 });
	expect(idsOf(level.Variables)).toEqual([2]);
});

it('DeleteMetricVersionLevel quita el nivel y refresca trabajos, métricas y versiones', async () => {
	const browser = setup();
	const work = makeWork();
	const dataset = makeActive({}, work);
	dataset.MetricVersionLevels = [{ Id: 20 }, { Id: 21 }];
	await dataset.DeleteMetricVersionLevel({ Id: 20 });
	expect(lastCall().config.params).toEqual({ k: 5, l: 20 });
	expect(idsOf(dataset.MetricVersionLevels)).toEqual([21]);
	expect(browser.window.Db.loadWorksCalls).toBe(1);
	expect(browser.window.Context.refreshedMetrics).toBe(1);
	expect(work.MetricVersions.refreshed).toBe(1);
});

describe('ActiveDataset: UpdateVariable');

it('una variable nueva se agrega al nivel con el identificador y orden que devuelve el servidor', async () => {
	setup();
	axios.respond('post', { data: { VariableId: 70, Order: 4 } });
	const level = makeLevel({ Variables: [makeVariable(1)] });
	const variable = makeVariable(null);
	const data = await makeActive().UpdateVariable(level, variable);
	expect(data).toEqual({ VariableId: 70, Order: 4 });
	expect(variable.Id).toBe(70);
	expect(variable.Order).toBe(4);
	expect(idsOf(level.Variables)).toEqual([1, 70]);
});

it('una variable nueva ya incluida en el nivel no se duplica', async () => {
	setup();
	axios.respond('post', { data: { VariableId: 70, Order: 4 } });
	const variable = makeVariable(0);
	const level = makeLevel({ Variables: [variable] });
	await makeActive().UpdateVariable(level, variable);
	expect(level.Variables).toHaveLength(1);
	expect(variable.Id).toBe(70);
});

it('una variable existente reemplaza a la de igual identificador', async () => {
	setup();
	const level = makeLevel({ Variables: [makeVariable(1), makeVariable(2)] });
	const edited = makeVariable(2, { Order: 9 });
	await makeActive().UpdateVariable(level, edited);
	expect(level.Variables[1] === edited).toBeTruthy();
	expect(level.Variables).toHaveLength(2);
});

it('si la variable es la predeterminada desmarca a las demás', async () => {
	setup();
	const level = makeLevel({ Variables: [makeVariable(1, { IsDefault: true }), makeVariable(2)] });
	await makeActive().UpdateVariable(level, makeVariable(2, { IsDefault: true }));
	expect(level.Variables[0].IsDefault).toBeFalsy();
});

it('calcula el título de la variable y envía el nivel sin sus variables, sin alterar el original', async () => {
	const work = makeWork();
	setup();
	const level = makeLevel({ Variables: [makeVariable(1)] });
	const variable = makeVariable(1);
	await makeActive({}, work).UpdateVariable(level, variable);
	expect(variable.Caption).toBe('Conteo');
	expect(lastCall().url).toBe(BASE + 'UpdateVariable');
	const body = parseBody(lastCall());
	expect(JSON.parse(body.l).Variables).toBeNull();
	expect(JSON.parse(body.v).Caption).toBe('Conteo');
	expect(body.k).toBe('5');
	expect(level.Variables).toHaveLength(1);
	expect(work.changed).toBe(1);
});

describe('ActiveDataset: UpdateMetricVersionLevel');

it('un nivel nuevo toma los identificadores del servidor, se agrega al dataset y recarga los trabajos', async () => {
	const browser = setup();
	axios.respond('post', { data: { LevelId: 21, MetricVersionId: 31, MetricId: 41 } });
	const work = makeWork();
	const dataset = makeActive({}, work);
	const level = { Id: null, MetricVersion: { Id: null, Metric: { Id: null } }, Variables: [{ Id: 1 }] };
	const data = await dataset.UpdateMetricVersionLevel(level);
	expect(data).toEqual({ LevelId: 21, MetricVersionId: 31, MetricId: 41 });
	expect(level.Id).toBe(21);
	expect(level.MetricVersion.Id).toBe(31);
	expect(level.MetricVersion.Metric.Id).toBe(41);
	expect(dataset.MetricVersionLevels[0] === level).toBeTruthy();
	expect(JSON.parse(parseBody(lastCall()).l).Variables).toBeNull();
	expect(browser.window.Db.loadWorksCalls).toBe(1);
	expect(browser.window.Context.refreshedMetrics).toBe(1);
	expect(work.MetricVersions.refreshed).toBe(1);
});

it('un nivel existente reemplaza al anterior sin recargar los trabajos', async () => {
	const browser = setup();
	axios.respond('post', { data: { LevelId: 20, MetricVersionId: 30, MetricId: 40 } });
	const dataset = makeActive();
	dataset.MetricVersionLevels = [{ Id: 19 }, { Id: 20, Marca: 'vieja' }];
	const level = makeLevel({ Marca: 'nueva' });
	await dataset.UpdateMetricVersionLevel(level);
	expect(dataset.MetricVersionLevels).toHaveLength(2);
	expect(dataset.MetricVersionLevels[1].Marca).toBe('nueva');
	expect(browser.window.Db.loadWorksCalls).toBe(0);
	expect(browser.window.Context.refreshedMetrics).toBe(1);
});

describe('ActiveDataset: métricas calculadas');

it('arma las URL de cálculo de un nuevo indicador según su tipo', () => {
	setup();
	const dataset = makeActive();
	expect(dataset.CalculateNewMetricUrl('simple')).toBe(BASE + 'CalculateNewSimpleMetric');
	expect(dataset.StepCalculateNewMetricUrl('simple')).toBe(BASE + 'StepCalculateNewSimpleMetric');
});

it('CalculatedMetricExists devuelve si la columna ya existe para esa variable', async () => {
	setup();
	axios.respond('get', { data: { columnExists: true } });
	const exists = await makeActive().CalculatedMetricExists(8);
	expect(exists).toBeTruthy();
	expect(lastCall().url).toBe(BASE + 'CalculatedMetricExists');
	expect(lastCall().config.params).toEqual({ k: 5, v: 8 });
});

it('CalculatedMetricExists ante un error lo registra y resuelve sin valor', async () => {
	const browser = setup();
	axios.respond('get', new Error('boom'));
	let result = 'pendiente';
	await captureConsoleAsync(async function () {
		result = await makeActive().CalculatedMetricExists(8);
	});
	expect(result).toBe(undefined);
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});

describe('ActiveDataset: multinivel');

it('GetMultilevelDatasets devuelve los otros datasets con la misma matriz no nula', () => {
	const work = makeWork();
	const dataset = makeActive({ Id: 5, MultilevelMatrix: 2 }, work);
	const same = makeActive({ Id: 6, MultilevelMatrix: 2 }, work);
	const other = makeActive({ Id: 7, MultilevelMatrix: 3 }, work);
	const none = makeActive({ Id: 8, MultilevelMatrix: null }, work);
	work.Datasets = [dataset, same, other, none];
	expect(dataset.GetMultilevelDatasets()).toEqual([same]);
	const alone = makeActive({ Id: 9, MultilevelMatrix: null }, work);
	work.Datasets = [alone, none];
	expect(alone.GetMultilevelDatasets()).toEqual([]);
});

it('CalculateMultilevelMatrix lista los demás datasets indicando cuáles están vinculados', () => {
	const work = makeWork();
	const dataset = makeActive({ Id: 5, Caption: 'A', MultilevelMatrix: 2 }, work);
	const linked = makeActive({ Id: 6, Caption: 'B', MultilevelMatrix: 2 }, work);
	const free = makeActive({ Id: 7, Caption: 'C', MultilevelMatrix: null }, work);
	work.Datasets = [dataset, linked, free];
	dataset.CalculateMultilevelMatrix();
	expect(dataset.MultilevelMatrix.map(function (item) { return [item.Id, item.Caption, item.Bounded]; })).toEqual([
		[6, 'B', true], [7, 'C', false],
	]);
});

it('CalculateMultilevelMatrix no marca como vinculados a los que no tienen matriz aunque el propio tampoco', () => {
	const work = makeWork();
	const dataset = makeActive({ Id: 5, MultilevelMatrix: null }, work);
	const free = makeActive({ Id: 7, MultilevelMatrix: null }, work);
	work.Datasets = [dataset, free];
	dataset.CalculateMultilevelMatrix();
	expect(dataset.MultilevelMatrix[0].Bounded).toBeFalsy();
});

it('AcquireMultilevelMatrix toma el número siguiente al mayor en uso por los otros datasets', () => {
	const work = makeWork();
	const dataset = makeActive({ Id: 5 }, work);
	work.Datasets = [dataset, makeActive({ Id: 6, MultilevelMatrix: 3 }, work), makeActive({ Id: 7, MultilevelMatrix: null }, work)];
	dataset.AcquireMultilevelMatrix();
	expect(dataset.properties.MultilevelMatrix).toBe(4);
});

it('AcquireMultilevelMatrix empieza en 1 si ningún otro dataset usa una matriz', () => {
	const work = makeWork();
	const dataset = makeActive({ Id: 5 }, work);
	work.Datasets = [dataset];
	dataset.AcquireMultilevelMatrix();
	expect(dataset.properties.MultilevelMatrix).toBe(1);
});

it('UpdateMultilevelMatrix envía las matrices de ambos datasets y 0 si no tienen', async () => {
	setup();
	const work = makeWork();
	await makeActive({}, work).UpdateMultilevelMatrix(5, 2, 6, null);
	expect(lastCall().url).toBe(BASE + 'UpdateMultilevelMatrix');
	expect(lastCall().config.params).toEqual({ d1: 5, m1: 2, d2: 6, m2: 0 });
	expect(work.changed).toBe(1);
});

describe('ActiveDataset: edición de contenido');

it('las escrituras de atributos envían el dataset y marcan el cambio', async () => {
	setup();
	const work = makeWork();
	const dataset = makeActive({ Caption: 'Mi dataset' }, work);
	await dataset.Update();
	expect(lastCall().url).toBe(BASE + 'UpdateDataset');
	expect(JSON.parse(parseBody(lastCall()).d).Caption).toBe('Mi dataset');
	await dataset.UpdateRegen();
	expect(lastCall().url).toBe(BASE + 'UpdateDatasetRegenData');
	expect(work.changed).toBe(2);
});

it('UpdateRowValues, SkipAllRows, SkipRows y DeleteRows descartan las escalas cacheadas', async () => {
	setup();
	const dataset = makeActive();
	const cases = [
		[function () { return dataset.UpdateRowValues(10, { a: 1 }); }, 'UpdateRowValues'],
		[function () { return dataset.SkipAllRows(); }, 'OmmitDatasetAllRows'],
		[function () { return dataset.SkipRows([1, 2]); }, 'OmmitDatasetRows'],
		[function () { return dataset.DeleteRows([1, 2]); }, 'DeleteDatasetRows'],
	];
	for (const [call, service] of cases) {
		dataset.ScaleGenerator.InfoCache.clave = {};
		const data = await call();
		expect(data).toBe('ok');
		expect(lastCall().url).toBe(BASE + service);
		expect(Object.keys(dataset.ScaleGenerator.InfoCache)).toHaveLength(0);
	}
});

it('UpdateRowValues envía el identificador de fila y los valores', async () => {
	setup();
	await makeActive().UpdateRowValues(10, { a: 1 });
	const body = parseBody(lastCall());
	expect(body.k).toBe('5');
	expect(body.id).toBe('10');
	expect(JSON.parse(body.v)).toEqual({ a: 1 });
});

it('CreateRow devuelve el identificador de la fila creada', async () => {
	setup();
	axios.respond('get', { data: { Id: 55 } });
	expect(await makeActive().CreateRow()).toBe(55);
	expect(lastCall().url).toBe(BASE + 'CreateDatasetRow');
});

it('AutoRecodeValues y UpdateLabels envían la columna y las listas', async () => {
	setup();
	const dataset = makeActive();
	await dataset.AutoRecodeValues({ Id: 3 }, ['a', 'b'], 'nueva', 'Nueva etiqueta');
	let body = parseBody(lastCall());
	expect(lastCall().url).toBe(BASE + 'AutoRecodeValues');
	expect(JSON.parse(body.i)).toEqual(['a', 'b']);
	expect(body.c).toBe('3');
	expect(body.l).toBe('Nueva etiqueta');
	expect(body.n).toBe('nueva');
	await dataset.UpdateLabels({ Id: 3 }, [{ Value: 1 }], [2]);
	body = parseBody(lastCall());
	expect(lastCall().url).toBe(BASE + 'UpdateLabels');
	expect(JSON.parse(body.d)).toEqual([2]);
});

it('CalculateColumn envía la columna, la operación y los operandos, y descarta las escalas cacheadas', async () => {
	setup();
	const dataset = makeActive();
	dataset.ScaleGenerator.InfoCache.clave = {};
	const operands = [{ t: 'C', v: 3 }, { t: 'V', v: 2 }];
	expect(await dataset.CalculateColumn({ Id: 7 }, 'add', operands)).toBe('ok');
	const body = parseBody(lastCall());
	expect(lastCall().url).toBe(BASE + 'UpdateColumnValues');
	expect(body.c).toBe('7');
	expect(body.o).toBe('add');
	expect(JSON.parse(body.a)).toEqual(operands);
	expect(Object.keys(dataset.ScaleGenerator.InfoCache)).toHaveLength(0);
});

it('SaveColumn envía la variable y DeleteColumns las columnas a quitar', async () => {
	setup();
	const dataset = makeActive();
	await dataset.SaveColumn({ Id: 3, Variable: 'edad' });
	expect(JSON.parse(parseBody(lastCall()).c)).toEqual({ Id: 3, Variable: 'edad' });
	await dataset.DeleteColumns([3, 4]);
	expect(lastCall().url).toBe(BASE + 'DeleteDatasetColumns');
	expect(lastCall().config.params).toEqual({ k: 5, ids: '[3,4]' });
});

it('GetDistinctColumnValues consulta los valores únicos de la columna', async () => {
	setup();
	axios.respond('get', { data: ['a', 'b'] });
	expect(await makeActive().GetDistinctColumnValues(3)).toEqual(['a', 'b']);
	expect(lastCall().url).toBe(BASE + 'GetColumnUniqueValues');
	expect(lastCall().config.params).toEqual({ k: 5, c: 3 });
});

describe('ActiveDataset: SetColumnOrder');

it('pide el nuevo orden, avisa el éxito y devuelve la función de cancelación', async () => {
	setup();
	const cancel = installCancelToken(axios);
	const work = makeWork();
	let succeeded = 0;
	const returned = makeActive({}, work).SetColumnOrder([3, 1, 2], function () { succeeded++; }, function () {});
	await flushPromises();
	expect(lastCall().url).toBe(BASE + 'SetColumnOrder');
	expect(lastCall().config.params).toEqual({ k: 5, cols: [3, 1, 2] });
	expect(returned === cancel).toBeTruthy();
	expect(succeeded).toBe(1);
	expect(work.changed).toBe(1);
});

it('ante un error informa su mensaje al callback de error y muestra el diálogo', async () => {
	const browser = setup();
	installCancelToken(axios);
	axios.respond('get', new Error('sin red'));
	let message = null;
	await captureConsoleAsync(async function () {
		makeActive().SetColumnOrder([1], function () {}, function (text) { message = text; });
		await flushPromises();
	});
	expect(message).toBe('sin red');
	expect(browser.alerts).toHaveLength(1);
});

describe('ActiveDataset: carga de columnas');

const LOAD_URLS = {
	[BASE + 'GetDatasetColumns']: { data: [makeColumn(1, 'edad', 5)] },
	[BASE + 'GetDatasetColumnsLabels']: { data: { 1: [{ Value: 1, Caption: 'Uno' }] } },
	[BASE + 'GetDatasetMetricVersionLevels']: { data: [{ Id: 20 }] },
};

it('Selected carga columnas, etiquetas e indicadores en paralelo y arma la matriz multinivel', async () => {
	setup();
	axios.respondByUrl('get', LOAD_URLS);
	const work = makeWork();
	const dataset = makeActive({}, work);
	work.Datasets = [dataset, makeActive({ Id: 6 }, work)];
	const promise = dataset.Selected();
	expect(dataset.GettingColumns).toBeTruthy();
	await promise;
	expect(axios.calls).toHaveLength(3);
	expect(dataset.Columns[0].Variable).toBe('edad');
	expect(dataset.Labels[1][0].Caption).toBe('Uno');
	expect(dataset.MetricVersionLevels).toEqual([{ Id: 20 }]);
	expect(dataset.GettingColumns).toBeFalsy();
	expect(dataset.MultilevelMatrix).toHaveLength(1);
});

it('Selected mientras ya se está cargando no inicia otra carga y devuelve null', async () => {
	setup();
	axios.respondByUrl('get', LOAD_URLS);
	const dataset = makeActive();
	dataset.Selected();
	expect(dataset.Selected()).toBeNull();
	expect(axios.calls).toHaveLength(3);
	await flushPromises();
});

it('con columnas y etiquetas ya cargadas no vuelve a consultar al servidor', async () => {
	setup();
	axios.respondByUrl('get', LOAD_URLS);
	const dataset = makeActive();
	await dataset.Selected();
	axios.calls = [];
	await dataset.Selected();
	expect(axios.calls).toHaveLength(0);
});

it('ReloadColumns descarta lo cargado y vuelve a consultar', async () => {
	setup();
	axios.respondByUrl('get', LOAD_URLS);
	const dataset = makeActive();
	await dataset.Selected();
	axios.calls = [];
	await dataset.ReloadColumns();
	expect(axios.calls).toHaveLength(3);
});

it('si la carga falla libera GettingColumns y deja las columnas sin cargar', async () => {
	setup();
	axios.respond('get', new Error('boom'));
	const dataset = makeActive();
	let caught = null;
	await captureConsoleAsync(async function () {
		try {
			await dataset.EnsureColumnsAndExec();
		} catch (e) {
			caught = e;
		}
	});
	expect(caught.message).toBe('boom');
	expect(dataset.GettingColumns).toBeFalsy();
	expect(dataset.Columns).toBeNull();
});

it('ReloadProperties reemplaza los atributos con los del servidor', async () => {
	setup();
	axios.respond('get', { data: { Id: 5, Caption: 'Actualizado' } });
	const dataset = makeActive();
	await dataset.ReloadProperties();
	expect(lastCall().config.params).toEqual({ k: 5 });
	expect(dataset.properties.Caption).toBe('Actualizado');
});

it('GetRelatedDatasets devuelve la respuesta del servidor', async () => {
	setup();
	axios.respond('get', { data: [{ Id: 8 }] });
	expect(await makeActive().GetRelatedDatasets()).toEqual([{ Id: 8 }]);
	expect(lastCall().url).toBe(BASE + 'GetRelatedDatasets');
});

it('LevelMetrics nivela desde el dataset de origen y luego recarga los niveles', async () => {
	setup();
	axios.respondByUrl('get', {
		[BASE + 'LevelDatasetMetrics']: { data: 'nivelado' },
		[BASE + 'GetDatasetMetricVersionLevels']: { data: [{ Id: 77 }] },
	});
	const dataset = makeActive();
	const levels = await dataset.LevelMetrics(9);
	expect(axios.calls[0].config.params).toEqual({ sk: 9, tk: 5 });
	expect(levels).toEqual([{ Id: 77 }]);
	expect(dataset.MetricVersionLevels).toEqual([{ Id: 77 }]);
});

describe('ActiveDataset: direcciones');

it('arma las URL de datos, errores y georreferenciación múltiple', () => {
	setup();
	const dataset = makeActive();
	expect(dataset.GetDataUrl()).toBe(BASE + 'GetDatasetDataPaged?k=5');
	expect(dataset.GetErrorsUrl()).toBe(BASE + 'GetDatasetErrors?k=5');
	expect(dataset.GetMultiGeoreferenceByLatLongUrl()).toBe(BASE + 'CreateMultiGeoreferenceByLatLong');
	expect(dataset.GetMultiGeoreferenceByCodesUrl()).toBe(BASE + 'CreateMultiGeoreferenceByCodes');
	expect(dataset.GetMultiGeoreferenceByShapesUrl()).toBe(BASE + 'CreateMultiGeoreferenceByShapes');
	expect(dataset.GetStepMultiGeoreferenceUrl()).toBe(BASE + 'StepMultiGeoreference');
});
