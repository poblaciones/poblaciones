import { describe, it, expect } from './_harness.mjs';
import BasemapLayers from '@/packs/views/BasemapLayers/BasemapLayers.vue';
import BasemapLayerPopup from '@/packs/views/BasemapLayers/BasemapLayerPopup.vue';
import MetricSearchPopup from '@/packs/views/BasemapLayers/MetricSearchPopup.vue';
import {
	setupGlobals, mountLite, triggerWatch, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, preload,
} from './fixtures.mjs';

const GET_LAYERS = 'GET /services/packs/GetBasemapLayers';
const GET_BOUNDARIES = 'GET /services/packs/GetBoundaries';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const editMetadataPopup = makePopup();
	const vm = mountLite(BasemapLayers, { refs: { invoker, editPopup, editMetadataPopup } });
	return { env, vm, invoker, editPopup, editMetadataPopup };
}

function layer(overrides) {
	return Object.assign({
		Id: 1, Type: 'M', Caption: 'Rutas', Order: 1, Separator: false, Icon: 'fas fa-road',
		RouteTag: 'u', HideOnSatellite: false, ItemIds: '530901', ItemsSummary: 'Rutas nacionales', MetadataId: null,
		RasterUrl: null,
	}, overrides || {});
}

function columnBy(vm, caption) {
	return vm.gridColumns.filter(function (col) { return col.caption === caption; })[0];
}

function actionBy(vm, caption) {
	return vm.gridActions.filter(function (a) { return a.caption === caption; })[0];
}

function idsOf(list) {
	return list.map(function (item) { return item.Id; });
}

describe('BasemapLayers: datos y permisos');

it('parte con la lista vacía', () => {
	const { vm } = setup();
	expect(vm.list).toEqual([]);
});

it('solo el administrador general puede editar', () => {
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

it('mounted pide las capas base y reemplaza la lista', async () => {
	const { vm } = setup();
	serve({ [GET_LAYERS]: [layer({ Id: 1 }), layer({ Id: 2 })] });
	BasemapLayers.mounted.call(vm);
	await settle();
	expect(idsOf(vm.list)).toEqual([1, 2]);
});

describe('BasemapLayers.gridColumns');

it('define las columnas esperadas y ninguna es ordenable', () => {
	const { vm } = setup();
	expect(vm.gridColumns.map(function (col) { return col.caption; })).toEqual([
		'Nombre', 'Ícono', 'Tipo', 'Contenido', 'Letra', 'Oculta en satélite',
	]);
	expect(vm.gridColumns.every(function (col) { return col.sortable === false; })).toBe(true);
});

it('la primera columna se compara por Order para que la grilla respete el orden del panel', () => {
	const { vm } = setup();
	const first = vm.gridColumns[0];
	expect(first.sortType).toBe('number');
	expect(first.sortValue(layer({ Order: 7 }))).toBe(7);
});

it('Ícono es una columna de estado que toma el ícono de la capa', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Ícono');
	expect(column.type).toBe('status');
	expect(column.icon(layer({ Icon: 'fas fa-road' }))).toBe('fas fa-road');
});

it('Tipo muestra el nombre del tipo de capa', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Tipo').value(layer({ Type: 'R' }))).toBe('Raster');
	expect(columnBy(vm, 'Tipo').value(layer({ Type: 'M' }))).toBe('Indicador');
	expect(columnBy(vm, 'Tipo').value(layer({ Type: 'B' }))).toBe('Delimitación');
	expect(columnBy(vm, 'Tipo').value(layer({ Type: 'L' }))).toBe('Etiquetas');
});

it('Contenido muestra la URL del raster, un texto fijo para etiquetas y el resumen en el resto', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Contenido').value(layer({ Type: 'R', RasterUrl: 'http://x/{z}/{x}/{y}' }))).toBe('http://x/{z}/{x}/{y}');
	expect(columnBy(vm, 'Contenido').value(layer({ Type: 'L' }))).toBe('Etiquetas del mapa');
	expect(columnBy(vm, 'Contenido').value(layer({ Type: 'M' }))).toBe('Rutas nacionales');
});

it('Oculta en satélite muestra Sí o guion', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Oculta en satélite').value(layer({ HideOnSatellite: true }))).toBe('Sí');
	expect(columnBy(vm, 'Oculta en satélite').value(layer())).toBe('-');
});

describe('BasemapLayers.gridActions');

it('sin permisos de edición, Modificar pasa a Ver y no hay acciones de orden activas', () => {
	const { vm } = setup('E');
	vm.list.push(layer({ Id: 1 }), layer({ Id: 2 }));
	expect(actionBy(vm, 'Ver capa base')).toBeTruthy();
	expect(actionBy(vm, 'Subir').isEnabled(vm.list[1])).toBe(false);
	expect(actionBy(vm, 'Bajar').isEnabled(vm.list[0])).toBe(false);
});

it('Subir no está disponible en la primera capa ni Bajar en la última', () => {
	const { vm } = setup();
	vm.list.push(layer({ Id: 1 }), layer({ Id: 2 }), layer({ Id: 3 }));
	expect(actionBy(vm, 'Subir').isEnabled(vm.list[0])).toBe(false);
	expect(actionBy(vm, 'Subir').isEnabled(vm.list[1])).toBe(true);
	expect(actionBy(vm, 'Bajar').isEnabled(vm.list[1])).toBe(true);
	expect(actionBy(vm, 'Bajar').isEnabled(vm.list[2])).toBe(false);
});

it('Metadatos está disponible si la capa los tiene, o si es raster o etiquetas y se puede editar', () => {
	const { vm } = setup();
	const action = actionBy(vm, 'Metadatos');
	expect(action.isEnabled(layer({ MetadataId: null }))).toBe(false);
	expect(action.isEnabled(layer({ MetadataId: 8 }))).toBe(true);
	expect(action.isEnabled(layer({ Type: 'R', MetadataId: null }))).toBe(true);
	expect(action.isEnabled(layer({ Type: 'L', MetadataId: null }))).toBe(true);
	expect(action.isEnabled(layer({ Type: 'B', MetadataId: null }))).toBe(false);
});

it('Metadatos de raster o etiquetas sin metadatos todavía los crea y abre su edición', async () => {
	const { vm, editMetadataPopup } = setup();
	const relief = layer({ Id: 2, Type: 'R', MetadataId: null });
	vm.list.push(relief);
	serve({
		'POST /services/packs/UpdateBasemapLayer': { Id: 2, MetadataId: 40 },
		[GET_LAYERS]: [layer({ Id: 2, Type: 'R', MetadataId: 40 })],
		'GET /services/packs/GetMetadata': { Id: 40 },
	});
	actionBy(vm, 'Metadatos').onClick(null, relief);
	await settle();
	const post = axios.calls.filter(function (call) { return call.method === 'post'; })[0];
	expect(bodyOf(post).l.HasOwnMetadata).toBe(true);
	expect(vm.list[0].MetadataId).toBe(40);
});

it('Metadatos de una capa que ya los tiene no vuelve a guardarla', async () => {
	const { vm } = setup();
	serve({ 'GET /services/packs/GetMetadata': { Id: 8 } });
	actionBy(vm, 'Metadatos').onClick(null, layer({ MetadataId: 8 }));
	await settle();
	expect(axios.calls.filter(function (call) { return call.method === 'post'; })).toHaveLength(0);
});

describe('BasemapLayers: acciones');

it('createNewLayer abre la edición con una copia en blanco de la fábrica y la lista actual', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Caption: '', Type: 'M' };
	preload(env.context.Factory, { BasemapLayer: blank });
	vm.createNewLayer();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
	expect(editPopup.shown[0][1]).toBe(vm.list);
});

it('onRowClick abre la edición de la capa', () => {
	const { vm, editPopup } = setup();
	const item = layer();
	vm.onRowClick(null, item);
	expect(editPopup.shown[0][0]).toBe(item);
});

it('moveLayer hacia arriba o abajo guarda en el servidor y recarga la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/MoveBasemapLayerUp': {}, 'POST /services/packs/MoveBasemapLayerDown': {}, [GET_LAYERS]: [layer({ Id: 1 })] });
	vm.moveLayer(layer({ Id: 5 }), true);
	await settle();
	vm.moveLayer(layer({ Id: 6 }), false);
	await settle();
	expect(axios.calls.map(function (call) { return call.url.split('/').pop(); })).toEqual([
		'MoveBasemapLayerUp', 'GetBasemapLayers', 'MoveBasemapLayerDown', 'GetBasemapLayers',
	]);
	expect(bodyOf(axios.calls[0])).toEqual({ l: '5' });
	expect(bodyOf(axios.calls[2])).toEqual({ l: '6' });
});

it('eliminar una capa la quita de la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteBasemapLayer': {} });
	vm.list.push(layer({ Id: 1 }), layer({ Id: 2 }));
	vm.onItemDelete(vm.list[0]);
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ l: '1' });
	expect(idsOf(vm.list)).toEqual([2]);
});

it('el mensaje de borrado nombra la capa y aclara qué pasa con las cartografías', () => {
	const { vm } = setup();
	const message = vm.deleteConfirmMessage(layer({ Caption: 'Rutas' }));
	expect(message.indexOf("'Rutas'") > -1).toBe(true);
	expect(message.indexOf('valor por defecto') > -1).toBe(true);
});

it('popupSaved recarga la lista desde el servidor', async () => {
	const { vm } = setup();
	serve({ [GET_LAYERS]: [layer({ Id: 9 })] });
	vm.popupSaved();
	await settle();
	expect(idsOf(vm.list)).toEqual([9]);
});

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(BasemapLayerPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

describe('BasemapLayerPopup.show');

it('clona la capa, deduce HasOwnMetadata del MetadataId y arma los indicadores elegidos', async () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [{ Id: 1, Level: 0, Caption: 'Provincias' }, { Id: 11, Level: 1, Caption: '2022' }] });
	const original = layer({ ItemIds: '5,6', ItemsSummary: 'Uno; Dos', MetadataId: 3 });
	vm.show(original, []);
	await settle();
	expect(vm.layer === original).toBe(false);
	expect(vm.layer.HasOwnMetadata).toBe(true);
	expect(vm.metricItems).toEqual([{ Id: 5, Caption: 'Uno' }, { Id: 6, Caption: 'Dos' }]);
	expect(vm.boundaries).toEqual([{ Id: 1, Level: 0, Caption: 'Provincias' }]);
	expect(vm.activateEdit).toBe(true);
});

it('en una capa de delimitaciones interpreta ItemIds como la delimitación elegida', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Type: 'B', ItemIds: '4' }), []);
	expect(vm.boundaryId).toBe(4);
	expect(vm.metricItems).toEqual([]);
});

it('en una capa de indicadores no hay delimitación elegida', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ ItemIds: '5' }), []);
	expect(vm.boundaryId).toBeNull();
});

describe('BasemapLayerPopup: tipos y metadatos');

function typeValues(vm) {
	return vm.visibleTypeOptions.map(function (option) { return option.value; });
}

it('si ya existe otra capa de etiquetas, la opción Etiquetas no se ofrece', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Id: 2 }), [layer({ Id: 1, Type: 'L' }), layer({ Id: 2 })]);
	expect(typeValues(vm)).toEqual(['M', 'B', 'R']);
});

it('la propia capa de etiquetas conserva su tipo entre las opciones', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Id: 1, Type: 'L' }), [layer({ Id: 1, Type: 'L' })]);
	expect(typeValues(vm)).toEqual(['M', 'B', 'R', 'L']);
});

it('sin capa de etiquetas existente, todas las opciones están disponibles', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer(), [layer()]);
	expect(typeValues(vm)).toEqual(['M', 'B', 'R', 'L']);
});

it('los indicadores de tipo se reflejan en los indicadores isMetric, isBoundary, isRaster e isLabels', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Type: 'R' }), []);
	expect([vm.isMetric, vm.isBoundary, vm.isRaster, vm.isLabels]).toEqual([false, false, true, false]);
	vm.layer.Type = 'L';
	expect([vm.isMetric, vm.isBoundary, vm.isRaster, vm.isLabels]).toEqual([false, false, false, true]);
});

it('las etiquetas no tienen letra de vínculo', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Type: 'L' }), []);
	expect(vm.hasRouteTag).toBe(false);
	vm.layer.Type = 'M';
	expect(vm.hasRouteTag).toBe(true);
});

describe('BasemapLayerPopup: indicadores');

it('addMetric agrega sin duplicar y removeMetric quita', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ ItemIds: '', ItemsSummary: '' }), []);
	vm.addMetric({ Id: '7', Caption: 'Siete' });
	vm.addMetric({ Id: '7', Caption: 'Siete' });
	expect(vm.metricItems).toEqual([{ Id: 7, Caption: 'Siete' }]);
	vm.removeMetric(vm.metricItems[0]);
	expect(vm.metricItems).toEqual([]);
});

describe('BasemapLayerPopup: abreviaturas');

it('show arma la tabla de abreviaturas desde el JSON', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Aliases: '{"Arroyo":"A°","Río":"R."}' }), []);
	expect(vm.aliasRows).toEqual([{ Text: 'Arroyo', Alias: 'A°' }, { Text: 'Río', Alias: 'R.' }]);
});

it('sin abreviaturas la tabla queda vacía', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Aliases: null }), []);
	expect(vm.aliasRows).toEqual([]);
});

it('addAlias y removeAlias modifican la tabla y buildAliases ignora las filas vacías', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Aliases: null }), []);
	vm.addAlias();
	vm.addAlias();
	vm.aliasRows[0].Text = ' Arroyo ';
	vm.aliasRows[0].Alias = 'A°';
	expect(vm.buildAliases()).toBe('{"Arroyo":"A°"}');
	vm.removeAlias(0);
	expect(vm.aliasRows).toHaveLength(1);
	expect(vm.buildAliases()).toBeNull();
});

it('rechaza una abreviatura incompleta o un texto repetido', () => {
	const { env, vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer(), []);
	vm.aliasRows = [{ Text: 'Arroyo', Alias: '' }];
	expect(vm.validateAliases()).toBe(false);
	vm.aliasRows = [{ Text: 'Arroyo', Alias: 'A' }, { Text: 'Arroyo', Alias: 'B' }];
	expect(vm.validateAliases()).toBe(false);
	vm.aliasRows = [{ Text: 'Arroyo', Alias: 'A' }, { Text: 'Río', Alias: 'R' }];
	expect(vm.validateAliases()).toBe(true);
	expect(env.alerts).toHaveLength(2);
});

describe('BasemapLayerPopup: indicadores y búsqueda');

it('addMetric agrega sin duplicar y removeMetric quita', () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ ItemIds: '', ItemsSummary: '' }), []);
	vm.addMetric({ Id: '7', Caption: 'Siete' });
	vm.addMetric({ Id: '7', Caption: 'Siete' });
	expect(vm.metricItems).toEqual([{ Id: 7, Caption: 'Siete' }]);
	vm.removeMetric(vm.metricItems[0]);
	expect(vm.metricItems).toEqual([]);
});

it('openMetricSearch abre el buscador de indicadores', () => {
	const { vm } = setupPopup();
	const search = makePopup();
	vm.$refs.metricSearch = search;
	vm.openMetricSearch();
	expect(search.shown).toBeTruthy();
});

it('el buscador consulta al servidor con el texto buscado', async () => {
	setupGlobals({ privileges: 'A' });
	const search = mountLite(MetricSearchPopup, {});
	serve({ 'GET /services/packs/SearchBasemapMetrics': [{ Id: 1, Caption: 'Ruta', WorkCaption: 'Vial' }] });
	await search.search('ruta');
	expect(search.results).toEqual([{ Id: 1, Caption: 'Ruta', WorkCaption: 'Vial' }]);
	expect(search.searched).toBe(true);
	expect(axios.calls[axios.calls.length - 1].config.params).toEqual({ q: 'ruta' });
});

it('el buscador no consulta con menos de tres letras y limpia los resultados', () => {
	setupGlobals({ privileges: 'A' });
	const search = mountLite(MetricSearchPopup, {});
	search.results = [{ Id: 1 }];
	search.query = 'ru';
	const callsBefore = axios.calls.length;
	search.doSearch();
	expect(search.results).toEqual([]);
	expect(axios.calls).toHaveLength(callsBefore);
});

it('elegir un resultado cierra el buscador y lo informa', () => {
	setupGlobals({ privileges: 'A' });
	const search = mountLite(MetricSearchPopup, {});
	search.openDialog = true;
	search.select({ Id: 3, Caption: 'Tres' });
	expect(search.openDialog).toBe(false);
	expect(search.$emitted[0].name).toBe('selected');
});

describe('BasemapLayerPopup.save');

it('valida el nombre, la letra, los elementos y la URL antes de guardar', () => {
	const { env, vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Caption: ' ' }), []);
	vm.save();
	vm.layer.Caption = 'Rutas';
	vm.layer.RouteTag = '';
	vm.save();
	vm.layer.RouteTag = 'u';
	vm.metricItems.splice(0, vm.metricItems.length);
	vm.save();
	vm.layer.Type = 'R';
	vm.layer.RasterUrl = '';
	vm.save();
	expect(env.alerts).toEqual([
		"Debe indicar un valor para 'Nombre'.",
		'Debe indicar la letra del vínculo.',
		'Debe agregar al menos un indicador.',
		'Debe indicar la URL de teselas.',
	]);
	expect(axios.calls.filter(function (call) { return call.method === 'post'; })).toHaveLength(0);
});

it('guarda una capa de indicadores con ItemIds armado y números normalizados', async () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [], 'POST /services/packs/UpdateBasemapLayer': { Id: 4, MetadataId: null } });
	vm.show(layer({ ItemIds: '5,6', ItemsSummary: 'Uno; Dos' }), []);
	vm.layer.LineWidth = '';
	vm.layer.RasterOpacity = '50';
	vm.save();
	await settle();
	const post = axios.calls.filter(function (call) { return call.method === 'post'; })[0];
	const sent = bodyOf(post).l;
	expect(sent.ItemIds).toBe('5,6');
	expect(sent.LineWidth).toBeNull();
	expect(sent.RasterOpacity).toBe(50);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted[0].name).toBe('completed');
});

it('guarda una capa de delimitaciones con la delimitación elegida', async () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [], 'POST /services/packs/UpdateBasemapLayer': { Id: 4 } });
	vm.show(layer({ Type: 'B', ItemIds: '1' }), []);
	vm.boundaryId = 4;
	vm.save();
	await settle();
	const post = axios.calls.filter(function (call) { return call.method === 'post'; })[0];
	expect(bodyOf(post).l.ItemIds).toBe('4');
});

it('una capa de delimitaciones exige elegir la delimitación', () => {
	const { env, vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [] });
	vm.show(layer({ Type: 'B', ItemIds: '' }), []);
	vm.save();
	expect(env.alerts).toEqual(['Debe elegir la delimitación.']);
});

it('guarda las abreviaturas de la tabla como JSON y las omite en otros tipos', async () => {
	const { vm } = setupPopup();
	serve({ [GET_BOUNDARIES]: [], 'POST /services/packs/UpdateBasemapLayer': { Id: 4 } });
	vm.show(layer({ ItemIds: '5', ItemsSummary: 'Uno', Aliases: '{"Arroyo":"A°"}' }), []);
	vm.addAlias();
	vm.aliasRows[1].Text = 'Río';
	vm.aliasRows[1].Alias = 'R.';
	vm.save();
	await settle();
	const post = axios.calls.filter(function (call) { return call.method === 'post'; })[0];
	expect(bodyOf(post).l.Aliases).toBe('{"Arroyo":"A°","Río":"R."}');
});
