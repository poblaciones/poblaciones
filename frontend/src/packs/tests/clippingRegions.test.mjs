import { describe, it, expect } from './_harness.mjs';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';
import c from '@/common/framework/color';
import ClippingRegions from '@/packs/views/ClippingRegions/ClippingRegions.vue';
import ClippingRegionPopup from '@/packs/views/ClippingRegions/ClippingRegionPopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, makeStepper, makeGeoPackage, preload,
} from './fixtures.mjs';

const GET_REGIONS = 'GET /services/packs/GetClippingRegions';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const editGeographyPopup = makePopup();
	const editMetadataPopup = makePopup();
	const itemsPopup = mountLite(ItemsListPopup);
	const vm = mountLite(ClippingRegions, { refs: { invoker, editPopup, editGeographyPopup, editMetadataPopup, itemsPopup } });
	return { env, vm, invoker, editPopup, editGeographyPopup, editMetadataPopup, itemsPopup };
}

function region(overrides) {
	return Object.assign({
		Id: 1, Caption: 'Provincias', Version: null, Level: 0, LabelsMinZoom: 3, LabelsMaxZoom: 9, Color: 'ff0000',
		Symbol: 'fa-map', ChildCount: 24, Priority: 1, NoAutocomplete: false, IsCrawlerIndexer: false,
		IndexCode: false, FieldCodeName: 'cod', MetadataId: null, Metadata: null,
	}, overrides || {});
}

function columnBy(vm, caption) {
	return vm.gridColumns.filter(function (col) { return col.caption === caption; })[0];
}

function actionBy(vm, caption) {
	return vm.gridActions.filter(function (a) { return a.caption === caption; })[0];
}

function idsOf(list) {
	const ret = [];
	for (const item of list) {
		ret.push(item.Id);
	}
	return ret;
}

describe('ClippingRegions: datos y permisos');

it('parte con la lista vacía y sin colores de metadatos compartidos', () => {
	const { vm } = setup();
	expect(vm.list).toEqual([]);
	expect(vm.sharedMetadataColors).toEqual({});
});

it('solo el administrador general puede editar', () => {
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('ClippingRegions.reloadList / mounted');

it('mounted pide las regiones con mensaje de espera y reemplaza la lista', async () => {
	const { vm, invoker } = setup();
	const list = vm.list;
	serve({ [GET_REGIONS]: [region({ Id: 1 }), region({ Id: 2 })] });
	callHook(ClippingRegions, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo regiones...');
	await settle();
	expect(vm.list).toBe(list);
	expect(idsOf(vm.list)).toEqual([1, 2]);
});

it('reloadList descarta el contenido anterior y recalcula los colores de metadatos compartidos', async () => {
	const { vm } = setup();
	vm.list.push(region({ Id: 99 }));
	serve({ [GET_REGIONS]: [region({ Id: 1, MetadataId: 5 }), region({ Id: 2, MetadataId: 5 })] });
	await vm.reloadList();
	expect(idsOf(vm.list)).toEqual([1, 2]);
	expect(vm.sharedMetadataColors).toEqual({ 5: c.GetColorPalete()[0] });
});

describe('ClippingRegions.treeList');

it('arma el árbol a partir del nivel de cada ítem de la lista plana', () => {
	const { vm } = setup();
	vm.list.push(region({ Id: 1, Level: 0 }), region({ Id: 2, Level: 1 }), region({ Id: 3, Level: 0 }));
	const tree = vm.treeList;
	expect(idsOf(tree)).toEqual([1, 3]);
	expect(idsOf(tree[0].Items)).toEqual([2]);
});

describe('ClippingRegions.calculateSharedMetadataColors');

it('solo colorea los metadatos que aparecen en más de una región', () => {
	const { vm } = setup();
	vm.list.push(
		region({ Id: 1, MetadataId: 5 }), region({ Id: 2, MetadataId: 5 }),
		region({ Id: 3, MetadataId: 8 }), region({ Id: 4, MetadataId: null }),
	);
	vm.calculateSharedMetadataColors();
	expect(vm.sharedMetadataColors).toEqual({ 5: c.GetColorPalete()[0] });
});

it('asigna colores por id de metadato ascendente y los repite al agotar la paleta', () => {
	const { vm } = setup();
	const palete = c.GetColorPalete();
	for (let n = 0; n <= palete.length; n++) {
		vm.list.push(region({ Id: n * 2 + 1, MetadataId: 100 + n }), region({ Id: n * 2 + 2, MetadataId: 100 + n }));
	}
	vm.calculateSharedMetadataColors();
	expect(vm.sharedMetadataColors[100]).toBe(palete[0]);
	expect(vm.sharedMetadataColors[101]).toBe(palete[1 % palete.length]);
	expect(vm.sharedMetadataColors[100 + palete.length]).toBe(palete[0]);
});

it('resolveMetadataColor devuelve vacío sin metadato o si no está compartido', () => {
	const { vm } = setup();
	vm.sharedMetadataColors = { 5: 'abcdef' };
	expect(vm.resolveMetadataColor(region({ MetadataId: null }))).toBe('');
	expect(vm.resolveMetadataColor(region({ MetadataId: 9 }))).toBe('');
	expect(vm.resolveMetadataColor(region({ MetadataId: 5 }))).toBe('abcdef');
});

describe('ClippingRegions.gridColumns');

it('define las columnas esperadas', () => {
	expect(setup().vm.gridColumns.map(function (col) { return col.caption; })).toEqual([
		'Nombre', 'Color', 'Ícono', 'Ítems', 'Prioridad', 'Buscador', 'Segmenta', 'Indexa', 'Códigos',
	]);
});

it('el nombre incluye la versión si la tiene y el rango de zoom de las etiquetas', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Nombre');
	expect(column.value(region({ Version: null }))).toBe('Provincias (3-9)');
	expect(column.value(region({ Version: '2022' }))).toBe('Provincias, 2022 (3-9)');
	expect(column.tooltip(region({ Metadata: { Title: 'Fuente' } }))).toBe('Fuente');
	expect(column.tooltip(region())).toBeNull();
});

it('Buscador, Segmenta e Indexa se muestran como Sí o "-"', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Buscador').value(region({ NoAutocomplete: false }))).toBe('Sí');
	expect(columnBy(vm, 'Buscador').value(region({ NoAutocomplete: true }))).toBe('-');
	expect(columnBy(vm, 'Buscador').sortValue(region({ NoAutocomplete: true }))).toBe(false);
	expect(columnBy(vm, 'Segmenta').value(region({ IsCrawlerIndexer: true }))).toBe('Sí');
	expect(columnBy(vm, 'Indexa').value(region({ IndexCode: 0 }))).toBe('-');
});

it('la columna Color se dibuja en HTML y no es ordenable', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Color');
	expect(column.html).toBe(true);
	expect(column.sortable).toBe(false);
	expect(column.value(region({ Color: 'ff0000' })).includes('background-color:#ff0000')).toBe(true);
});

describe('ClippingRegions: formatos');

it('formatColor usa el color con "#" (sin duplicarlo) o un gris por defecto', () => {
	const { vm } = setup();
	expect(vm.formatColor('ff0000').includes('background-color:#ff0000')).toBe(true);
	expect(vm.formatColor('#00ff00').includes('background-color:#00ff00')).toBe(true);
	expect(vm.formatColor('#00ff00').includes('##')).toBe(false);
	expect(vm.formatColor(null).includes('background-color:#e0e0e0')).toBe(true);
});

it('formatIcon devuelve null sin símbolo y agrega "fas " si falta el prefijo', () => {
	const { vm } = setup();
	expect(vm.formatIcon(null)).toBeNull();
	expect(vm.formatIcon('fas fa-map')).toBe('fas fa-map');
	expect(vm.formatIcon('fa fa-map')).toBe('fa fa-map');
	expect(vm.formatIcon('fa-map')).toBe('fas fa-map');
	expect(columnBy(vm, 'Ícono').icon(region({ Symbol: 'fa-map' }))).toBe('fas fa-map');
});

it('formatBool devuelve Sí para valores verdaderos y "-" para el resto', () => {
	const { vm } = setup();
	expect(vm.formatBool(true)).toBe('Sí');
	expect(vm.formatBool(0)).toBe('-');
});

describe('ClippingRegions.gridActions');

it('el administrador ve Modificar y los demás perfiles ven Ver', () => {
	expect(actionBy(setup('A').vm, 'Modificar').icon).toBe('edit');
	expect(actionBy(setup('L').vm, 'Ver').icon).toBe('visibility');
});

it('las acciones de consulta abren el popup de edición y el de geografías asociadas', () => {
	const { vm, editPopup, editGeographyPopup } = setup('L');
	const item = region();
	actionBy(vm, 'Ver').onClick(null, item);
	actionBy(vm, 'Geografías asociadas').onClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
	expect(editGeographyPopup.shown).toEqual([[item]]);
});

it('Ver ítems abre el listado de la región y pide los ítems por lotes', async () => {
	const { vm, itemsPopup } = setup();
	serve({ 'GET /services/packs/GetClippingRegionItems': { Items: [], Total: 0 } });
	actionBy(vm, 'Ver ítems').onClick(null, region({ Id: 4, Caption: 'Provincias' }));
	expect(itemsPopup.title).toBe('Ítems de Provincias');
	expect(itemsPopup.columns.map(function (col) { return col.property; })).toEqual(['Caption', 'Code', 'Id']);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ r: 4, o: 0, l: 500 });
});

it('Metadatos solo se habilita con metadatos y muestra color e id solo si están compartidos', () => {
	const { vm } = setup();
	vm.sharedMetadataColors = { 5: 'abcdef' };
	const action = actionBy(vm, 'Metadatos');
	expect(action.isEnabled(region({ MetadataId: 5 }))).toBe(true);
	expect(action.isEnabled(region({ MetadataId: null }))).toBe(false);
	expect(action.iconStyle(region({ MetadataId: 5 }))).toBe('color: #abcdef');
	expect(action.badge(region({ MetadataId: 5 }))).toBe(5);
	expect(action.iconStyle(region({ MetadataId: 6 }))).toBe('');
	expect(action.badge(region({ MetadataId: 6 }))).toBeNull();
});

it('Metadatos carga los metadatos de la región y abre el popup con un ActiveMetadata', async () => {
	const { vm, editMetadataPopup } = setup();
	serve({ 'GET /services/packs/GetMetadata': { Metadata: { Id: 7 }, Files: [], Sources: [], Institutions: [] } });
	actionBy(vm, 'Metadatos').onClick(null, region({ MetadataId: 7 }));
	await settle();
	expect(axios.calls[0].config.params).toEqual({ m: 7 });
	expect(editMetadataPopup.shown[0][0] instanceof ActiveMetadata).toBe(true);
});

describe('ClippingRegions: edición');

it('createNewClippingRegion abre la edición con una copia en blanco de la fábrica', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Caption: '' };
	preload(env.context.Factory, { ClippingRegion: blank });
	vm.createNewClippingRegion();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

it('onRowClick abre la edición de la fila', () => {
	const { vm, editPopup } = setup();
	const item = region();
	vm.onRowClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
});

describe('ClippingRegions.popupSaved');

it('una región nueva no se agrega a mano: invalida el catálogo y recarga la lista del servidor', async () => {
	const { env, vm } = setup();
	preload(env.context.ClippingRegions, [region()]);
	serve({ [GET_REGIONS]: [region({ Id: 1 }), region({ Id: 2 })] });
	vm.popupSaved(region({ Id: 2 }));
	expect(env.context.ClippingRegions.hasData).toBe(false);
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(idsOf(vm.list)).toEqual([1, 2]);
});

it('una región existente se reemplaza en la lista, sin consultar al servidor, y recalcula los colores', async () => {
	const { env, vm } = setup();
	vm.list.push(region({ Id: 1, Caption: 'Vieja', MetadataId: 5 }), region({ Id: 2, MetadataId: 5 }));
	vm.popupSaved(region({ Id: 1, Caption: 'Nueva', MetadataId: 5 }));
	await settle();
	expect(axios.calls).toHaveLength(0);
	expect(vm.list[0].Caption).toBe('Nueva');
	expect(vm.sharedMetadataColors).toEqual({ 5: c.GetColorPalete()[0] });
	expect(env.context.ClippingRegions.hasData).toBe(false);
});

it('una región existente sin nivel lo toma del padre o queda en 0', () => {
	const { vm } = setup();
	vm.list.push(region({ Id: 1 }), region({ Id: 2 }));
	vm.popupSaved(region({ Id: 1, Level: null, Parent: { Id: 9, Level: 2 } }));
	expect(vm.list[0].Level).toBe(3);
	vm.popupSaved(region({ Id: 2, Level: undefined }));
	expect(vm.list[1].Level).toBe(0);
});

describe('ClippingRegions: eliminación');

it('el mensaje de confirmación advierte que se eliminan subregiones e ítems', () => {
	expect(setup().vm.deleteConfirmMessage({ Caption: 'Provincias' }))
		.toBe("Esta acción no puede deshacerse: se eliminará la región 'Provincias' junto con sus subregiones e ítems.");
});

it('onItemDelete elimina en el servidor, quita la región con sus descendientes e invalida el catálogo', async () => {
	const { env, vm } = setup();
	preload(env.context.ClippingRegions, []);
	serve({ 'POST /services/packs/DeleteClippingRegion': {} });
	vm.list.push(region({ Id: 1, Level: 0 }), region({ Id: 2, Level: 1 }), region({ Id: 3, Level: 2 }), region({ Id: 4, Level: 0 }));
	const tree = vm.treeList;
	vm.onItemDelete(tree[0]);
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ r: '1' });
	expect(idsOf(vm.list)).toEqual([4]);
	expect(env.context.ClippingRegions.hasData).toBe(false);
});

it('collectDescendantIds reúne los ids de todos los niveles inferiores', () => {
	const { vm } = setup();
	expect(vm.collectDescendantIds({ Id: 1, Items: [{ Id: 2, Items: [{ Id: 3 }] }, { Id: 4 }] })).toEqual([2, 3, 4]);
	expect(vm.collectDescendantIds({ Id: 9 })).toEqual([]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges, fields) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const stepper = makeStepper();
	const parentPicker = mountLite(TreePickerPopup);
	const metadataSharePicker = mountLite(TreePickerPopup);
	const geoPackage = makeGeoPackage({ fields: fields || [] });
	const vm = mountLite(ClippingRegionPopup, { refs: { invoker, inputName, stepper, parentPicker, metadataSharePicker, geoPackage } });
	return { env, vm, invoker, inputName, stepper, parentPicker, metadataSharePicker, geoPackage };
}

describe('ClippingRegionPopup: datos y permisos');

it('parte cerrado y con metadatos propios', () => {
	const { vm } = setupPopup();
	expect(vm.activateEdit).toBe(false);
	expect(vm.hasOwnMetadata).toBe(true);
	expect(vm.originalHasOwnMetadata).toBe(true);
	expect(vm.sharedWithRegion).toBeNull();
	expect(vm.allRegionsFlat).toEqual([]);
});

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

describe('ClippingRegionPopup.show');

it('trabaja sobre una copia, se abre y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = region();
	vm.show(original);
	expect(vm.clippingRegion).toEqual(original);
	expect(vm.clippingRegion === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('una región sin color recibe uno de la paleta; si ya tiene color lo conserva', () => {
	const { vm } = setupPopup();
	vm.show(region({ Color: null }));
	expect(c.GetColorPalete().includes(vm.clippingRegion.Color)).toBe(true);
	vm.show(region({ Color: 'abcdef' }));
	expect(vm.clippingRegion.Color).toBe('abcdef');
});

it('useInSearch es lo contrario de NoAutocomplete', () => {
	const { vm } = setupPopup();
	vm.show(region({ NoAutocomplete: false }));
	expect(vm.useInSearch).toBe(true);
	vm.show(region({ NoAutocomplete: true }));
	expect(vm.useInSearch).toBe(false);
});

describe('ClippingRegionPopup.resolveMetadataSharing');

it('una región nueva o sin metadatos arranca con metadatos propios, sin consultar el catálogo', () => {
	const { env, vm } = setupPopup();
	env.context.ClippingRegions.GetAll = function () { throw new Error('no debería consultarse'); };
	vm.show(region({ Id: null, MetadataId: 5 }));
	expect(vm.hasOwnMetadata).toBe(true);
	vm.show(region({ Id: 3, MetadataId: null }));
	expect(vm.hasOwnMetadata).toBe(true);
	expect(vm.originalHasOwnMetadata).toBe(true);
});

it('si otra región usa el mismo metadato, los metadatos son compartidos y queda el ancla', () => {
	const { env, vm } = setupPopup();
	const all = [region({ Id: 1, MetadataId: 5 }), region({ Id: 2, Caption: 'Otra', Version: '2010', MetadataId: 5 })];
	preload(env.context.ClippingRegions, all);
	vm.show(region({ Id: 1, MetadataId: 5 }));
	expect(vm.allRegionsFlat).toBe(all);
	expect(vm.hasOwnMetadata).toBe(false);
	expect(vm.originalHasOwnMetadata).toBe(false);
	expect(vm.sharedWithRegion).toEqual({ Id: 2, Caption: 'Otra', Version: '2010', MetadataId: 5 });
});

it('si ninguna otra región usa ese metadato, los metadatos son propios', () => {
	const { env, vm } = setupPopup();
	preload(env.context.ClippingRegions, [region({ Id: 1, MetadataId: 5 }), region({ Id: 2, MetadataId: 6 })]);
	vm.show(region({ Id: 1, MetadataId: 5 }));
	expect(vm.hasOwnMetadata).toBe(true);
	expect(vm.sharedWithRegion).toBeNull();
	expect(vm.originalHasOwnMetadata).toBe(true);
});

describe('ClippingRegionPopup: metadatos compartidos');

it('sharedMetadataCaption es "Ninguna" sin ancla', () => {
	expect(setupPopup().vm.sharedMetadataCaption).toBe('Ninguna');
});

it('sharedMetadataCaption lista todas las otras regiones que comparten el metadato', () => {
	const { vm } = setupPopup();
	vm.clippingRegion = region({ Id: 1, MetadataId: 5 });
	vm.sharedWithRegion = { Id: 2, MetadataId: 5 };
	vm.allRegionsFlat = [
		region({ Id: 1, MetadataId: 5 }),
		region({ Id: 2, Caption: 'A', Version: '2010', MetadataId: 5 }),
		region({ Id: 3, Caption: 'B', MetadataId: 5 }),
		region({ Id: 4, Caption: 'C', MetadataId: 6 }),
	];
	expect(vm.sharedMetadataCaption).toBe('A (2010), B');
});

it('sharedMetadataCaption usa el ancla mientras el listado no la contenga', () => {
	const { vm } = setupPopup();
	vm.clippingRegion = region({ Id: 1 });
	vm.sharedWithRegion = { Id: 9, Caption: 'Elegida', Version: '2020', MetadataId: 8 };
	vm.allRegionsFlat = [];
	expect(vm.sharedMetadataCaption).toBe('Elegida (2020)');
});

it('pickSharedMetadataRegion abre el selector con todas las regiones excluyendo a la propia', () => {
	const { env, vm, metadataSharePicker } = setupPopup();
	const all = [region({ Id: 1 }), region({ Id: 2 })];
	preload(env.context.ClippingRegions, all);
	vm.clippingRegion = region({ Id: 1 });
	vm.pickSharedMetadataRegion();
	expect(vm.allRegionsFlat).toBe(all);
	expect(metadataSharePicker.title).toBe('Elegir con qué región comparte los metadatos');
	expect(metadataSharePicker.flatItems).toBe(all);
	expect(metadataSharePicker.excludeIds).toEqual([1]);
});

it('onSharedMetadataRegionSelected guarda solo los datos necesarios del ancla', () => {
	const { vm } = setupPopup();
	vm.onSharedMetadataRegionSelected({ Id: 2, Caption: 'A', Version: '2010', MetadataId: 5, Items: [{}], Level: 1 });
	expect(vm.sharedWithRegion).toEqual({ Id: 2, Caption: 'A', Version: '2010', MetadataId: 5 });
});

it('formatRegionCaption agrega la versión entre paréntesis', () => {
	const { vm } = setupPopup();
	expect(vm.formatRegionCaption({ Caption: 'A' })).toBe('A');
	expect(vm.formatRegionCaption({ Caption: 'A', Version: '2010' })).toBe('A (2010)');
});

describe('ClippingRegionPopup: padre e importación');

it('parentCaption muestra el padre o "Ninguna" e isNew depende del Id', () => {
	const { vm } = setupPopup();
	vm.clippingRegion = region({ Id: null });
	expect(vm.isNew).toBe(true);
	expect(vm.parentCaption).toBe('Ninguna');
	vm.clippingRegion = region({ Id: 4, Parent: { Id: 1, Caption: 'Países' } });
	expect(vm.isNew).toBe(false);
	expect(vm.parentCaption).toBe('Países');
});

it('importFields pide el código del padre solo si la región tiene padre', () => {
	const { vm } = setupPopup();
	vm.clippingRegion = region({ Parent: null });
	expect(vm.importFields).toEqual([
		{ key: 'code', label: 'Código', required: true },
		{ key: 'caption', label: 'Nombre', required: false },
	]);
	vm.clippingRegion = region({ Parent: { Id: 1 } });
	expect(vm.importFields[2]).toEqual({ key: 'parentCode', label: 'Código del padre', required: true });
});

it('pickParent abre el selector con todas las regiones excluyendo a la propia (o ninguna en un alta)', () => {
	const { env, vm, parentPicker } = setupPopup();
	const all = [region({ Id: 1 }), region({ Id: 2 })];
	preload(env.context.ClippingRegions, all);
	vm.clippingRegion = region({ Id: 2 });
	vm.pickParent();
	expect(parentPicker.title).toBe('Elegir categoría padre');
	expect(parentPicker.flatItems).toBe(all);
	expect(parentPicker.excludeIds).toEqual([2]);
	vm.clippingRegion = region({ Id: null });
	vm.pickParent();
	expect(parentPicker.excludeIds).toEqual([]);
});

it('onParentSelected guarda solo Id, nombre y versión del padre', () => {
	const { vm } = setupPopup();
	vm.clippingRegion = region();
	vm.onParentSelected({ Id: 9, Caption: 'Países', Version: '2020', Items: [{ Id: 1 }], Metadata: {} });
	expect(vm.clippingRegion.Parent).toEqual({ Id: 9, Caption: 'Países', Version: '2020' });
});

describe('ClippingRegionPopup.save: validaciones');

it('exige Nombre', () => {
	const { env, vm } = setupPopup();
	vm.clippingRegion = region({ Caption: '  ' });
	vm.save();
	expect(env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
	expect(axios.calls).toHaveLength(0);
});

it('una región existente con metadatos compartidos exige elegir con cuál', () => {
	const { env, vm } = setupPopup();
	vm.clippingRegion = region({ Id: 4 });
	vm.hasOwnMetadata = false;
	vm.sharedWithRegion = null;
	vm.save();
	expect(env.alerts).toEqual(['Debe elegir con qué región comparte los metadatos.']);
	expect(axios.calls).toHaveLength(0);
});

describe('ClippingRegionPopup.save: edición');

it('guarda con metadatos propios sin cambios: no toca Metadata y refleja el MetadataId del servidor', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateClippingRegion': { MetadataId: 77 } });
	vm.activateEdit = true;
	vm.clippingRegion = region({ Id: 4, Metadata: { Id: 3, Title: 'T' } });
	vm.useInSearch = false;
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	const sent = bodyOf(axios.calls[0]).r;
	expect(sent.NoAutocomplete).toBe(true);
	expect(sent.Metadata).toEqual({ Id: 3, Title: 'T' });
	expect(vm.clippingRegion.MetadataId).toBe(77);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.clippingRegion] }]);
});

it('al compartir metadatos referencia solo el Id del metadato de la otra región', async () => {
	const { vm } = setupPopup();
	serve({ 'POST /services/packs/UpdateClippingRegion': { MetadataId: 5 } });
	vm.clippingRegion = region({ Id: 4, Metadata: { Id: 3 } });
	vm.hasOwnMetadata = false;
	vm.originalHasOwnMetadata = true;
	vm.sharedWithRegion = { Id: 2, MetadataId: 5 };
	vm.save();
	await settle();
	expect(bodyOf(axios.calls[0]).r.Metadata).toEqual({ Id: 5 });
});

it('al pasar de compartidos a propios envía Metadata nulo para que el servidor genere uno en blanco', async () => {
	const { vm } = setupPopup();
	serve({ 'POST /services/packs/UpdateClippingRegion': { MetadataId: 9 } });
	vm.clippingRegion = region({ Id: 4, Metadata: { Id: 5 } });
	vm.hasOwnMetadata = true;
	vm.originalHasOwnMetadata = false;
	vm.save();
	await settle();
	expect(bodyOf(axios.calls[0]).r.Metadata).toBeNull();
});

describe('ClippingRegionPopup.save: alta desde un archivo');

it('si el archivo no está listo avisa y no inicia la importación', () => {
	const { env, vm, stepper } = setupPopup();
	vm.clippingRegion = region({ Id: null });
	vm.save();
	expect(env.alerts).toEqual(['Debe completar el archivo GeoPackage y el mapeo de columnas antes de continuar.']);
	expect(stepper.startUrl).toBe('');
});

it('con el archivo y el mapeo completos inicia la importación con región, bucket y mapeo', async () => {
	const fields = [{ key: 'code', label: 'Código', required: true }];
	const { vm, stepper, geoPackage } = setupPopup('A', fields);
	serve({ 'GET /services/packs/StartImportClippingRegion': { done: true, stepperResult: { Id: 60 } } });
	geoPackage.hasFile = true;
	geoPackage.mapping = { code: 'COD' };
	vm.clippingRegion = region({ Id: null });
	vm.useInSearch = false;
	vm.save();
	expect(vm.clippingRegion.NoAutocomplete).toBe(true);
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartImportClippingRegion');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepImportClippingRegion');
	expect(stepper.args).toEqual({
		c: JSON.stringify(vm.clippingRegion), b: geoPackage.bucketId, m: JSON.stringify({ code: 'COD' }),
	});
	await settle();
	expect(stepper.result).toEqual({ Id: 60 });
});

it('importCompleted guarda el resultado sin cerrar y stepperClosed cierra solo si hubo éxito', () => {
	const { vm, stepper } = setupPopup();
	vm.activateEdit = true;
	stepper.result = { Id: 60 };
	vm.importCompleted();
	expect(vm.importResult).toEqual({ Id: 60 });
	vm.stepperClosed(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.$emitted).toEqual([]);
	vm.stepperClosed(true);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [{ Id: 60 }] }]);
});
