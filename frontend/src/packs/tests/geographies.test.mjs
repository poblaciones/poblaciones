import { describe, it, expect } from './_harness.mjs';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';
import Geographies from '@/packs/views/Geographies/Geographies.vue';
import GeographyPopup from '@/packs/views/Geographies/GeographyPopup.vue';
import GeographyClippingRegionsPopup from '@/packs/views/Geographies/GeographyClippingRegionsPopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup.vue';
import ClippingRegionSelectionPopup from '@/packs/components/popups/ClippingRegionSelectionPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, makeStepper, makeGeoPackage, preload,
} from './fixtures.mjs';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const editClippingRegionsPopup = makePopup();
	const editMetadataPopup = makePopup();
	const itemsPopup = mountLite(ItemsListPopup);
	const vm = mountLite(Geographies, { refs: { invoker, editPopup, editClippingRegionsPopup, editMetadataPopup, itemsPopup } });
	return { env, vm, invoker, editPopup, editClippingRegionsPopup, editMetadataPopup, itemsPopup };
}

function geo(overrides) {
	return Object.assign({
		Id: 1, Caption: 'Provincias', Revision: '2022', Level: 0, RootCaption: 'Censo', ChildCount: 24,
		MaxZoom: 8, UseForClipping: true, IsTrackingLevel: false, MetadataId: null, Metadata: null,
	}, overrides || {});
}

function columnBy(vm, caption) {
	return vm.gridColumns.filter(function (c) { return c.caption === caption; })[0];
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

describe('Geographies: datos y permisos');

it('parte con la lista vacía y solo el administrador general puede editar', () => {
	expect(setup('A').vm.list).toEqual([]);
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('Geographies.mounted');

it('pide las geografías con mensaje de espera y las agrega a la lista', async () => {
	const { vm, invoker } = setup();
	serve({ 'GET /services/packs/GetGeographies': [geo({ Id: 1 }), geo({ Id: 2 })] });
	callHook(Geographies, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo geografías...');
	await settle();
	expect(idsOf(vm.list)).toEqual([1, 2]);
});

describe('Geographies.treeList');

it('arma el árbol a partir del nivel de cada ítem de la lista plana', () => {
	const { vm } = setup();
	vm.list.push(geo({ Id: 1, Level: 0 }), geo({ Id: 2, Level: 1 }), geo({ Id: 3, Level: 0 }));
	const tree = vm.treeList;
	expect(idsOf(tree)).toEqual([1, 3]);
	expect(idsOf(tree[0].Items)).toEqual([2]);
});

describe('Geographies.gridColumns');

it('define las columnas esperadas', () => {
	const { vm } = setup();
	expect(vm.gridColumns.map(function (c) { return c.caption; })).toEqual([
		'Nombre', 'Relevamiento', 'Ítems', 'Gradiente', 'Zoom máx.', 'Clipping', 'Seguimiento',
	]);
});

it('el nombre incluye la revisión si la tiene y el tooltip muestra el título de los metadatos', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Nombre');
	expect(column.value(geo())).toBe('Provincias (2022)');
	expect(column.value(geo({ Revision: null }))).toBe('Provincias');
	expect(column.tooltip(geo({ Metadata: { Title: 'Censo 2022' } }))).toBe('Censo 2022');
	expect(column.tooltip(geo())).toBeNull();
});

it('Clipping y Seguimiento se muestran como Sí o "-"', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Clipping').value(geo({ UseForClipping: true }))).toBe('Sí');
	expect(columnBy(vm, 'Clipping').value(geo({ UseForClipping: false }))).toBe('-');
	expect(columnBy(vm, 'Seguimiento').value(geo({ IsTrackingLevel: true }))).toBe('Sí');
	expect(columnBy(vm, 'Seguimiento').value(geo({ IsTrackingLevel: 0 }))).toBe('-');
});

it('formatBool devuelve Sí para valores verdaderos y "-" para el resto', () => {
	const { vm } = setup();
	expect(vm.formatBool(true)).toBe('Sí');
	expect(vm.formatBool(1)).toBe('Sí');
	expect(vm.formatBool(null)).toBe('-');
});

describe('Geographies.gridActions');

it('el administrador ve Modificar y los demás perfiles ven Ver', () => {
	const admin = actionBy(setup('A').vm, 'Modificar');
	expect(admin.icon).toBe('edit');
	const reader = actionBy(setup('L').vm, 'Ver');
	expect(reader.icon).toBe('visibility');
});

it('las acciones de consulta están siempre disponibles y abren sus popups', () => {
	const { vm, editPopup, editClippingRegionsPopup } = setup('L');
	const item = geo();
	actionBy(vm, 'Ver').onClick(null, item);
	actionBy(vm, 'Regiones asociadas').onClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
	expect(editClippingRegionsPopup.shown).toEqual([[item]]);
});

it('Metadatos solo se habilita para geografías con metadatos y los abre', async () => {
	const { vm, editMetadataPopup } = setup();
	const action = actionBy(vm, 'Metadatos');
	expect(action.isEnabled(geo({ MetadataId: 7 }))).toBe(true);
	expect(action.isEnabled(geo({ MetadataId: null }))).toBe(false);
	serve({ 'GET /services/packs/GetMetadata': { Metadata: { Id: 7 }, Files: [], Sources: [], Institutions: [] } });
	action.onClick(null, geo({ MetadataId: 7 }));
	await settle();
	expect(axios.calls[0].config.params).toEqual({ m: 7 });
	expect(editMetadataPopup.shown[0][0] instanceof ActiveMetadata).toBe(true);
});

it('Ver ítems abre el listado de la geografía y pide los ítems por lotes', async () => {
	const { vm, itemsPopup } = setup();
	serve({ 'GET /services/packs/GetGeographyItems': { Items: [{ Id: 1 }], Total: 1 } });
	actionBy(vm, 'Ver ítems').onClick(null, geo({ Id: 4, Caption: 'Provincias' }));
	expect(itemsPopup.title).toBe('Ítems de Provincias');
	expect(itemsPopup.columns.map(function (c) { return c.property; })).toEqual(['Caption', 'Code', 'Id']);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ g: 4, o: 0, l: 500 });
});

describe('Geographies: edición');

it('createNewGeography abre la edición con una copia en blanco de la fábrica', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Caption: '', Parent: null };
	preload(env.context.Factory, { Geography: blank });
	vm.createNewGeography();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

it('onRowClick abre la edición de la fila', () => {
	const { vm, editPopup } = setup();
	const item = geo();
	vm.onRowClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
});

describe('Geographies.popupSaved');

it('una geografía nueva sin nivel y sin padre queda en el nivel 0', () => {
	const { vm } = setup();
	vm.popupSaved(geo({ Id: 5, Level: undefined }));
	expect(vm.list[0].Level).toBe(0);
});

it('una geografía nueva con padre queda un nivel debajo de su padre', () => {
	const { vm } = setup();
	vm.popupSaved(geo({ Id: 5, Level: null, Parent: { Id: 1, Level: 2 } }));
	expect(vm.list[0].Level).toBe(3);
});

it('una geografía con nivel lo conserva y reemplaza a la existente con el mismo Id', () => {
	const { vm } = setup();
	vm.list.push(geo({ Id: 1, Caption: 'Vieja', Level: 1 }));
	vm.popupSaved(geo({ Id: 1, Caption: 'Nueva', Level: 1 }));
	expect(vm.list).toHaveLength(1);
	expect(vm.list[0].Caption).toBe('Nueva');
	expect(vm.list[0].Level).toBe(1);
});

describe('Geographies: eliminación');

it('el mensaje de confirmación advierte que se eliminan subniveles e ítems', () => {
	expect(setup().vm.deleteConfirmMessage({ Caption: 'Provincias' }))
		.toBe("Esta acción no puede deshacerse: se eliminará la geografía 'Provincias' junto con sus subniveles e ítems.");
});

it('onItemDelete elimina en el servidor y quita la geografía con todos sus descendientes', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/packs/DeleteGeography': {} });
	vm.list.push(
		geo({ Id: 1, Level: 0 }), geo({ Id: 2, Level: 1 }), geo({ Id: 3, Level: 2 }), geo({ Id: 4, Level: 0 }),
	);
	const tree = vm.treeList;
	vm.onItemDelete(tree[0]);
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ g: '1' });
	expect(idsOf(vm.list)).toEqual([4]);
});

it('eliminar una geografía hoja solo quita esa geografía', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteGeography': {} });
	vm.list.push(geo({ Id: 1, Level: 0 }), geo({ Id: 2, Level: 1 }), geo({ Id: 3, Level: 1 }));
	const tree = vm.treeList;
	vm.onItemDelete(tree[0].Items[0]);
	await settle();
	expect(idsOf(vm.list)).toEqual([1, 3]);
});

it('collectDescendantIds reúne los ids de todos los niveles inferiores', () => {
	const { vm } = setup();
	const tree = { Id: 1, Items: [{ Id: 2, Items: [{ Id: 3 }] }, { Id: 4 }] };
	expect(vm.collectDescendantIds(tree)).toEqual([2, 3, 4]);
	expect(vm.collectDescendantIds({ Id: 9 })).toEqual([]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges, fields) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const stepper = makeStepper();
	const parentPicker = mountLite(TreePickerPopup);
	const geoPackage = makeGeoPackage({ fields: fields || [] });
	const vm = mountLite(GeographyPopup, { refs: { invoker, inputName, stepper, parentPicker, geoPackage } });
	return { env, vm, invoker, inputName, stepper, parentPicker, geoPackage };
}

function editable(overrides) {
	return Object.assign({
		Id: 4, Caption: 'Provincias', CaptionShort: 'Prov', Revision: '2022', RootCaption: 'Censo',
		Parent: null, Gradient: null,
	}, overrides || {});
}

describe('GeographyPopup: created y permisos');

it('al crearse carga los gradientes una sola vez', async () => {
	const { vm } = setupPopup();
	serve({ 'GET /services/packs/GetGradients': [{ Id: 1 }, { Id: 2 }] });
	callHook(GeographyPopup, vm, 'created');
	await settle();
	expect(vm.gradients).toEqual([{ Id: 1 }, { Id: 2 }]);
});

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

describe('GeographyPopup.show y computed');

it('show trabaja sobre una copia, se abre y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = editable();
	vm.show(original);
	expect(vm.geography).toEqual(original);
	expect(vm.geography === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('isNew depende del Id y parentCaption muestra el padre o "Ninguna"', () => {
	const { vm } = setupPopup();
	vm.show(editable({ Id: null }));
	expect(vm.isNew).toBe(true);
	expect(vm.parentCaption).toBe('Ninguna');
	vm.show(editable({ Id: 4, Parent: { Id: 1, Caption: 'Países' } }));
	expect(vm.isNew).toBe(false);
	expect(vm.parentCaption).toBe('Países');
});

it('importFields pide el código del padre solo si la geografía tiene padre', () => {
	const { vm } = setupPopup();
	vm.show(editable({ Parent: null }));
	expect(vm.importFields.map(function (f) { return f.key; })).toEqual([
		'code', 'caption', 'population', 'households', 'children', 'urbanity',
	]);
	vm.show(editable({ Parent: { Id: 1 } }));
	const fields = vm.importFields;
	expect(fields[fields.length - 1]).toEqual({ key: 'parentCode', label: 'Código del padre', required: true });
	const required = [];
	for (const field of fields) {
		if (field.required) {
			required.push(field.key);
		}
	}
	expect(required).toEqual(['code', 'population', 'households', 'children', 'parentCode']);
});

describe('GeographyPopup: padre');

it('pickParent pide las geografías y abre el selector excluyendo a la propia geografía', async () => {
	const { vm, invoker, parentPicker } = setupPopup();
	const list = [{ Id: 1, Level: 0, Caption: 'Países' }, { Id: 4, Level: 1, Caption: 'Provincias' }];
	serve({ 'GET /services/packs/GetGeographies': list });
	vm.show(editable({ Id: 4 }));
	vm.pickParent();
	expect(invoker.message).toBe('Obteniendo geografías...');
	await settle();
	expect(parentPicker.title).toBe('Elegir categoría padre');
	expect(parentPicker.flatItems).toEqual(list);
	expect(parentPicker.excludeIds).toEqual([4]);
	expect(parentPicker.activateDialog).toBe(true);
});

it('en un alta el selector no excluye ninguna geografía', async () => {
	const { vm, parentPicker } = setupPopup();
	serve({ 'GET /services/packs/GetGeographies': [] });
	vm.show(editable({ Id: null }));
	vm.pickParent();
	await settle();
	expect(parentPicker.excludeIds).toEqual([]);
});

it('onParentSelected guarda solo Id, nombre y revisión del padre y borra el relevamiento propio', () => {
	const { vm } = setupPopup();
	vm.show(editable({ RootCaption: 'Censo' }));
	vm.onParentSelected({ Id: 1, Caption: 'Países', Revision: '2020', Items: [{ Id: 9 }], Metadata: {} });
	expect(vm.geography.Parent).toEqual({ Id: 1, Caption: 'Países', Revision: '2020' });
	expect(vm.geography.RootCaption).toBeNull();
});

describe('GeographyPopup.save: validaciones');

function expectAlert(change, message) {
	const { env, vm } = setupPopup();
	vm.geography = editable(change);
	vm.save();
	expect(env.alerts).toEqual([message]);
	expect(axios.calls).toHaveLength(0);
}

it('exige Nombre', () => {
	expectAlert({ Caption: '  ' }, "Debe indicar un valor para 'Nombre'.");
});

it('exige Nombre corto', () => {
	expectAlert({ CaptionShort: '' }, "Debe indicar un valor para 'Nombre corto'.");
	expectAlert({ CaptionShort: null }, "Debe indicar un valor para 'Nombre corto'.");
});

it('exige Revisión', () => {
	expectAlert({ Revision: ' ' }, "Debe indicar un valor para 'Revisión'.");
	expectAlert({ Revision: null }, "Debe indicar un valor para 'Revisión'.");
});

it('sin padre exige el nombre del relevamiento', () => {
	expectAlert({ Parent: null, RootCaption: '' }, "Debe indicar un valor para 'Nombre del relevamiento' cuando no hay categoría padre.");
	expectAlert({ Parent: null, RootCaption: null }, "Debe indicar un valor para 'Nombre del relevamiento' cuando no hay categoría padre.");
});

describe('GeographyPopup.save: edición');

it('con gradiente fija la luminosidad en 1 y sin gradiente la deja nula', async () => {
	const withGradient = setupPopup();
	serve({ 'POST /services/packs/UpdateGeography': {} });
	withGradient.vm.geography = editable({ Gradient: { Id: 2 } });
	withGradient.vm.save();
	expect(withGradient.vm.geography.GradientLuminance).toBe(1);
	await settle();
	const without = setupPopup();
	serve({ 'POST /services/packs/UpdateGeography': {} });
	without.vm.geography = editable({ Gradient: null });
	without.vm.save();
	expect(without.vm.geography.GradientLuminance).toBeNull();
	await settle();
});

it('una geografía existente se guarda, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateGeography': {} });
	vm.activateEdit = true;
	vm.geography = editable({ Id: 4, Parent: { Id: 1, Caption: 'Países' } });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0]).g.Id).toBe(4);
	expect(bodyOf(axios.calls[0]).g.GradientLuminance).toBeNull();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.geography] }]);
});

describe('GeographyPopup.save: alta desde un archivo');

it('si el archivo no está listo avisa y no inicia la importación', () => {
	const { env, vm, stepper } = setupPopup();
	vm.geography = editable({ Id: null });
	vm.save();
	expect(env.alerts).toEqual(['Debe completar el archivo GeoPackage y el mapeo de columnas antes de continuar.']);
	expect(stepper.startUrl).toBe('');
});

it('con el archivo y el mapeo completos inicia la importación con geografía, bucket y mapeo', async () => {
	const fields = [{ key: 'code', label: 'Código', required: true }];
	const { vm, stepper, geoPackage } = setupPopup('A', fields);
	serve({ 'GET /services/packs/StartImportGeography': { done: true, stepperResult: { Id: 50 } } });
	geoPackage.hasFile = true;
	geoPackage.mapping = { code: 'COD' };
	vm.geography = editable({ Id: null });
	vm.save();
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartImportGeography');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepImportGeography');
	expect(stepper.args).toEqual({
		g: JSON.stringify(vm.geography), b: geoPackage.bucketId, m: JSON.stringify({ code: 'COD' }),
	});
	await settle();
	expect(stepper.result).toEqual({ Id: 50 });
});

it('importCompleted guarda el resultado sin cerrar y stepperClosed cierra solo si hubo éxito', () => {
	const { vm, stepper } = setupPopup();
	vm.activateEdit = true;
	stepper.result = { Id: 50 };
	vm.importCompleted();
	expect(vm.importResult).toEqual({ Id: 50 });
	expect(vm.activateEdit).toBe(true);
	vm.stepperClosed(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.$emitted).toEqual([]);
	vm.stepperClosed(true);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [{ Id: 50 }] }]);
});

// ---------------------------------------------------------------------

function setupRegionsPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const stepper = makeStepper();
	const selectionPopup = mountLite(ClippingRegionSelectionPopup);
	const itemsPopup = mountLite(ItemsListPopup);
	const vm = mountLite(GeographyClippingRegionsPopup, { refs: { invoker, stepper, selectionPopup, itemsPopup } });
	return { env, vm, invoker, stepper, selectionPopup, itemsPopup };
}

function assoc(id, regionId, caption) {
	return { Id: id, ClippingRegion: { Id: regionId, Caption: caption || 'Región ' + regionId, Version: null } };
}

describe('GeographyClippingRegionsPopup: created y título');

it('al crearse carga el listado completo de regiones', () => {
	const { env, vm } = setupRegionsPopup();
	const regions = [{ Id: 1, Level: 0 }, { Id: 2, Level: 1 }];
	preload(env.context.ClippingRegions, regions);
	callHook(GeographyClippingRegionsPopup, vm, 'created');
	expect(vm.allClippingRegions).toBe(regions);
});

it('dialogTitle nombra la geografía con su revisión, o es genérico sin geografía', () => {
	const { vm } = setupRegionsPopup();
	expect(vm.dialogTitle).toBe('Regiones asociadas');
	vm.geography = { Caption: 'Provincias', Revision: '2022' };
	expect(vm.dialogTitle).toBe('Regiones asociadas a Provincias (2022)');
	vm.geography = { Caption: 'Provincias', Revision: null };
	expect(vm.dialogTitle).toBe('Regiones asociadas a Provincias');
});

describe('GeographyClippingRegionsPopup.sortedAssociated');

it('ordena las asociadas según su posición en el listado completo y toma su nivel', () => {
	const { vm } = setupRegionsPopup();
	vm.allClippingRegions = [{ Id: 10, Level: 0 }, { Id: 20, Level: 1 }, { Id: 30, Level: 2 }];
	vm.associated = [assoc(1, 30), assoc(2, 10), assoc(3, 20)];
	const sorted = vm.sortedAssociated;
	expect(idsOf(sorted)).toEqual([2, 3, 1]);
	expect(sorted.map(function (a) { return a.Level; })).toEqual([0, 1, 2]);
	expect(sorted.map(function (a) { return a.SortOrder; })).toEqual([0, 1, 2]);
});

it('una asociada que no está en el listado va al final con nivel 0', () => {
	const { vm } = setupRegionsPopup();
	vm.allClippingRegions = [{ Id: 10, Level: 1 }];
	vm.associated = [assoc(1, 99), assoc(2, 10)];
	const sorted = vm.sortedAssociated;
	expect(idsOf(sorted)).toEqual([2, 1]);
	expect(sorted[1].Level).toBe(0);
	expect(sorted[1].SortOrder).toBe(1);
});

it('devuelve una lista nueva y no reordena la original', () => {
	const { vm } = setupRegionsPopup();
	vm.allClippingRegions = [{ Id: 10, Level: 0 }, { Id: 20, Level: 0 }];
	vm.associated = [assoc(1, 20), assoc(2, 10)];
	const sorted = vm.sortedAssociated;
	expect(sorted === vm.associated).toBe(false);
	expect(idsOf(vm.associated)).toEqual([1, 2]);
});

describe('GeographyClippingRegionsPopup: carga');

it('show vacía las asociadas anteriores, se abre y pide las de la geografía', async () => {
	const { vm, invoker } = setupRegionsPopup();
	serve({ 'GET /services/packs/GetGeographyClippingRegions': [assoc(1, 10)] });
	vm.associated = [assoc(9, 99)];
	vm.show({ Id: 5, Caption: 'Provincias' });
	expect(vm.associated).toEqual([]);
	expect(vm.activateEdit).toBe(true);
	expect(invoker.message).toBe('Obteniendo regiones asociadas...');
	await settle();
	expect(axios.calls[0].config.params).toEqual({ g: 5 });
	expect(idsOf(vm.associated)).toEqual([1]);
});

it('calculationCompleted vuelve a pedir las asociadas', async () => {
	const { vm } = setupRegionsPopup();
	serve({ 'GET /services/packs/GetGeographyClippingRegions': [assoc(2, 10)] });
	vm.geography = { Id: 5 };
	vm.calculationCompleted();
	await settle();
	expect(idsOf(vm.associated)).toEqual([2]);
});

describe('GeographyClippingRegionsPopup: formato y búsqueda');

it('formatClippingRegion agrega la versión separada por coma', () => {
	const { vm } = setupRegionsPopup();
	expect(vm.formatClippingRegion({ Caption: 'Provincias' })).toBe('Provincias');
	expect(vm.formatClippingRegion({ Caption: 'Provincias', Version: '2022' })).toBe('Provincias, 2022');
});

it('findInAllClippingRegions devuelve la región o null', () => {
	const { vm } = setupRegionsPopup();
	vm.allClippingRegions = [{ Id: 10 }, { Id: 20 }];
	expect(vm.findInAllClippingRegions(20)).toBe(vm.allClippingRegions[1]);
	expect(vm.findInAllClippingRegions(99)).toBeNull();
});

describe('GeographyClippingRegionsPopup: selección y cálculo');

it('openSelection abre el selector con todas las regiones y los ids ya asociados', () => {
	const { vm, selectionPopup } = setupRegionsPopup();
	vm.allClippingRegions = [{ Id: 10 }, { Id: 20 }];
	vm.associated = [assoc(1, 10)];
	vm.openSelection();
	expect(selectionPopup.flatList).toBe(vm.allClippingRegions);
	expect(selectionPopup.associatedIds).toEqual([10]);
	expect(selectionPopup.checkedIds).toEqual({ 10: true });
});

it('onRegionsSelected sin ids no inicia ningún proceso', () => {
	const { vm, stepper } = setupRegionsPopup();
	vm.geography = { Id: 5 };
	vm.onRegionsSelected([]);
	expect(stepper.startUrl).toBe('');
	expect(axios.calls).toHaveLength(0);
});

it('onRegionsSelected inicia el cálculo de intersecciones con la geografía y las regiones elegidas', async () => {
	const { vm, stepper } = setupRegionsPopup();
	serve({ 'GET /services/packs/StartCalculateGeographyClippingRegions': { done: true } });
	vm.geography = { Id: 5 };
	vm.onRegionsSelected([10, 20]);
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartCalculateGeographyClippingRegions');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepCalculateGeographyClippingRegions');
	expect(stepper.args).toEqual({ g: 5, r: '10,20' });
	await settle();
	expect(axios.calls[0].config.params).toEqual({ g: 5, r: '10,20' });
});

it('openItems abre el listado de intersecciones y pide los ítems por lotes', async () => {
	const { vm, itemsPopup } = setupRegionsPopup();
	serve({ 'GET /services/packs/GetClippingRegionGeographyIntersectionItems': { Items: [], Total: 0 } });
	vm.openItems(assoc(6, 10, 'Provincias'));
	expect(itemsPopup.title).toBe('Ítems de Provincias');
	expect(itemsPopup.columns.map(function (c) { return c.property; })).toEqual(['Caption', 'Code', 'IntersectionPercent', 'Id']);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ c: 6, o: 0, l: 500 });
});

describe('GeographyClippingRegionsPopup: quitar asociación');

it('confirmRemoveAssociation pide confirmación y no elimina hasta que se acepta', () => {
	const { vm, invoker } = setupRegionsPopup();
	vm.confirmRemoveAssociation(assoc(1, 10));
	expect(invoker.confirmTitle).toBe('Quitar región');
	expect(invoker.confirmQuestion).toBe('La asociación y las intersecciones ya calculadas para esta región serán eliminadas.');
	expect(axios.calls).toHaveLength(0);
});

it('al aceptar elimina la asociación en el servidor y la quita de la lista', async () => {
	const { vm, invoker } = setupRegionsPopup();
	serve({ 'POST /services/packs/DeleteClippingRegionGeography': {} });
	const a = assoc(1, 10);
	const b = assoc(2, 20);
	vm.associated = [a, b];
	vm.confirmRemoveAssociation(a);
	invoker.confirmed();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ i: '1' });
	expect(vm.associated).toEqual([b]);
});
