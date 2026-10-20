import { describe, it, expect } from './_harness.mjs';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';
import c from '@/common/framework/color';
import GeographyTuples from '@/packs/views/GeographyTuples/GeographyTuples.vue';
import GeographyTuplePopup from '@/packs/views/GeographyTuples/GeographyTuplePopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeStepper, preload,
} from './fixtures.mjs';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const editMetadataPopup = makePopup();
	const stepper = makeStepper();
	const itemsPopup = mountLite(ItemsListPopup);
	const vm = mountLite(GeographyTuples, { refs: { invoker, editPopup, editMetadataPopup, stepper, itemsPopup } });
	return { env, vm, invoker, editPopup, editMetadataPopup, stepper, itemsPopup };
}

function geography(id, caption, revision) {
	return { Id: id, Caption: caption, Revision: revision || null };
}

function tuple(overrides) {
	return Object.assign({
		Id: 1, Geography: geography(10, 'Departamentos', '2022'), PreviousGeography: geography(20, 'Departamentos', '2010'),
		ChildCount: 5, MetadataId: null, Metadata: null,
	}, overrides || {});
}

function parentNode(geographyValue) {
	return { Id: 'geo-' + geographyValue.Id, Level: -1, Geography: geographyValue, Items: [] };
}

function columnBy(vm, caption) {
	return vm.gridColumns.filter(function (col) { return col.caption === caption; })[0];
}

function actionBy(vm, caption) {
	return vm.gridActions.filter(function (a) { return a.caption === caption; })[0];
}

describe('GeographyTuples: datos y permisos');

it('parte vacío y solo el administrador general puede editar', () => {
	const { vm } = setup('A');
	expect(vm.list).toEqual([]);
	expect(vm.calculatingItem).toBeNull();
	expect(vm.uniqueMetadatas).toEqual([]);
	expect(vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('GeographyTuples.mounted');

it('pide las equivalencias, las agrega y recuerda cada metadato distinto', async () => {
	const { vm, invoker } = setup();
	serve({ 'GET /services/packs/GetGeographyTuples': [
		tuple({ Id: 1, MetadataId: 7 }), tuple({ Id: 2, MetadataId: null }),
		tuple({ Id: 3, MetadataId: 7 }), tuple({ Id: 4, MetadataId: 9 }),
	] });
	callHook(GeographyTuples, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo equivalencias...');
	await settle();
	expect(vm.list).toHaveLength(4);
	expect(vm.uniqueMetadatas).toEqual([7, 9]);
});

describe('GeographyTuples.treeList');

it('agrupa las equivalencias por geografía actual, en el orden en que aparecen', () => {
	const { vm } = setup();
	const a1 = tuple({ Id: 1, Geography: geography(10, 'A') });
	const b = tuple({ Id: 2, Geography: geography(20, 'B') });
	const a2 = tuple({ Id: 3, Geography: geography(10, 'A') });
	vm.list.push(a1, b, a2);
	const tree = vm.treeList;
	expect(tree.map(function (n) { return n.Id; })).toEqual(['geo-10', 'geo-20']);
	expect(tree[0].Level).toBe(-1);
	expect(tree[0].Geography).toBe(a1.Geography);
	expect(tree[0].Items).toEqual([a1, a2]);
	expect(tree[1].Items).toEqual([b]);
});

describe('GeographyTuples.formatGeography');

it('devuelve vacío sin geografía y agrega la revisión entre paréntesis si la tiene', () => {
	const { vm } = setup();
	expect(vm.formatGeography(null)).toBe('');
	expect(vm.formatGeography(geography(1, 'Provincias'))).toBe('Provincias');
	expect(vm.formatGeography(geography(1, 'Provincias', '2022'))).toBe('Provincias (2022)');
});

describe('GeographyTuples.gridColumns');

it('la columna Geografía muestra la actual en el grupo y la anterior en cada equivalencia', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Geografía');
	expect(column.value(parentNode(geography(10, 'Departamentos', '2022')))).toBe('Departamentos (2022)');
	expect(column.value(tuple())).toBe('Departamentos (2010)');
});

it('el tooltip del grupo es nulo y el de la equivalencia es el título de sus metadatos', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Geografía');
	expect(column.tooltip(parentNode(geography(10, 'A')))).toBeNull();
	expect(column.tooltip(tuple({ Metadata: { Title: 'Fuente INDEC' } }))).toBe('Fuente INDEC');
	expect(column.tooltip(tuple({ Metadata: null }))).toBeNull();
});

it('la columna de ítems calculados queda vacía en el grupo y muestra la cantidad en la equivalencia', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Ítems calculados');
	expect(column.sortType).toBe('number');
	expect(column.value(parentNode(geography(10, 'A')))).toBe('');
	expect(column.value(tuple({ ChildCount: 12 }))).toBe(12);
});

describe('GeographyTuples.gridActions');

it('Nueva equivalencia solo en grupos y con permiso de edición', () => {
	const group = parentNode(geography(10, 'A'));
	const admin = actionBy(setup('A').vm, 'Nueva equivalencia');
	expect(admin.isEnabled(group)).toBe(true);
	expect(admin.isEnabled(tuple())).toBe(false);
	expect(actionBy(setup('L').vm, 'Nueva equivalencia').isEnabled(group)).toBe(false);
});

it('Calcular solo en equivalencias y con permiso de edición', () => {
	const group = parentNode(geography(10, 'A'));
	const admin = actionBy(setup('A').vm, 'Calcular');
	expect(admin.isEnabled(tuple())).toBe(true);
	expect(admin.isEnabled(group)).toBe(false);
	expect(actionBy(setup('L').vm, 'Calcular').isEnabled(tuple())).toBe(false);
});

it('Ver ítems es una consulta pura: disponible en equivalencias para cualquier perfil', () => {
	const action = actionBy(setup('L').vm, 'Ver ítems');
	expect(action.isEnabled(tuple())).toBe(true);
	expect(action.isEnabled(parentNode(geography(10, 'A')))).toBe(false);
});

it('Metadatos solo está disponible en equivalencias que tienen metadatos', () => {
	const action = actionBy(setup('L').vm, 'Metadatos');
	expect(action.isEnabled(tuple({ MetadataId: 7 }))).toBe(true);
	expect(action.isEnabled(tuple({ MetadataId: null }))).toBe(false);
	expect(action.isEnabled(parentNode(geography(10, 'A')))).toBe(false);
	expect(action.badge(tuple({ MetadataId: 7 }))).toBe(7);
});

it('el ícono de Metadatos toma el color que corresponde a su metadato', () => {
	const { vm } = setup();
	vm.uniqueMetadatas.push(7);
	expect(actionBy(vm, 'Metadatos').iconStyle(tuple({ MetadataId: 7 }))).toBe('color: #' + c.GetColorPalete()[0]);
});

it('cada acción invoca el método correspondiente de la vista', () => {
	const { vm } = setup();
	const called = [];
	['createNewTupleFor', 'calculate', 'openItems', 'openMetadata'].forEach(function (name) {
		vm[name] = function (arg) { called.push([name, arg]); };
	});
	const group = parentNode(geography(10, 'A'));
	const item = tuple({ MetadataId: 7 });
	actionBy(vm, 'Nueva equivalencia').onClick(null, group);
	actionBy(vm, 'Calcular').onClick(null, item);
	actionBy(vm, 'Ver ítems').onClick(null, item);
	actionBy(vm, 'Metadatos').onClick(null, item);
	expect(called).toEqual([
		['createNewTupleFor', group.Geography], ['calculate', item], ['openItems', item], ['openMetadata', { Id: 7 }],
	]);
});

describe('GeographyTuples.resolveColor');

it('sin metadato devuelve vacío', () => {
	expect(setup().vm.resolveColor(tuple({ MetadataId: null }))).toBe('');
});

it('asigna colores de la paleta por orden de aparición del metadato, repitiéndolos cíclicamente', () => {
	const { vm } = setup();
	const palete = c.GetColorPalete();
	const ids = [];
	for (let n = 0; n < palete.length + 1; n++) {
		ids.push(100 + n);
		vm.uniqueMetadatas.push(100 + n);
	}
	expect(vm.resolveColor(tuple({ MetadataId: ids[0] }))).toBe(palete[0]);
	expect(vm.resolveColor(tuple({ MetadataId: ids[1] }))).toBe(palete[1 % palete.length]);
	expect(vm.resolveColor(tuple({ MetadataId: ids[palete.length] }))).toBe(palete[0]);
});

describe('GeographyTuples: alta, metadatos y edición');

it('createNewTuple abre la edición con una copia en blanco de la fábrica', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Geography: null, PreviousGeography: null };
	preload(env.context.Factory, { GeographyTuple: blank });
	vm.createNewTuple();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

it('createNewTupleFor abre la edición con la geografía actual ya elegida', () => {
	const { env, vm, editPopup } = setup();
	preload(env.context.Factory, { GeographyTuple: { Id: null, Geography: null, PreviousGeography: null } });
	const geo = geography(10, 'Departamentos', '2022');
	vm.createNewTupleFor(geo);
	expect(editPopup.shown[0][0].Geography).toBe(geo);
	expect(editPopup.shown[0][0].PreviousGeography).toBeNull();
});

it('openMetadata carga los metadatos y abre el popup con un ActiveMetadata', async () => {
	const { vm, editMetadataPopup } = setup();
	serve({ 'GET /services/packs/GetMetadata': { Metadata: { Id: 7 }, Files: [], Sources: [], Institutions: [] } });
	vm.openMetadata({ Id: 7 });
	await settle();
	expect(axios.calls[0].config.params).toEqual({ m: 7 });
	expect(editMetadataPopup.shown).toHaveLength(1);
	expect(editMetadataPopup.shown[0][0] instanceof ActiveMetadata).toBe(true);
});

it('popupSaved reemplaza o agrega la equivalencia', () => {
	const { vm } = setup();
	vm.list.push(tuple({ Id: 1, ChildCount: 1 }));
	vm.popupSaved(tuple({ Id: 1, ChildCount: 9 }));
	vm.popupSaved(tuple({ Id: 2 }));
	expect(vm.list.map(function (t) { return t.ChildCount; })).toEqual([9, 5]);
});

describe('GeographyTuples.calculate');

it('inicia el proceso de cálculo para la equivalencia, con sus URLs y su id', async () => {
	const { vm, stepper } = setup();
	serve({ 'GET /services/packs/StartCalculateGeographyTuple': { done: true, stepperResult: { ChildCount: 12 } } });
	const item = tuple({ Id: 4 });
	vm.calculate(item);
	expect(vm.calculatingItem).toBe(item);
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartCalculateGeographyTuple');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepCalculateGeographyTuple');
	expect(stepper.args).toEqual({ t: 4 });
	await settle();
	expect(axios.calls[0].config.params).toEqual({ t: 4 });
	expect(stepper.$emitted.map(function (e) { return e.name; })).toEqual(['completed']);
});

it('calculationCompleted actualiza la cantidad de ítems con el resultado del proceso', () => {
	const { vm, stepper } = setup();
	const item = tuple({ ChildCount: 5 });
	vm.calculatingItem = item;
	stepper.result = { ChildCount: 12 };
	vm.calculationCompleted();
	expect(item.ChildCount).toBe(12);
});

it('calculationCompleted no cambia nada si el resultado no trae cantidad', () => {
	const { vm, stepper } = setup();
	const item = tuple({ ChildCount: 5 });
	vm.calculatingItem = item;
	stepper.result = null;
	vm.calculationCompleted();
	stepper.result = {};
	vm.calculationCompleted();
	expect(item.ChildCount).toBe(5);
});

describe('GeographyTuples.openItems');

it('abre el listado con el título de la geografía anterior y pide los ítems por lotes', async () => {
	const { vm, itemsPopup } = setup();
	serve({ 'GET /services/packs/GetGeographyTupleCalculatedItems': { Items: [{ Id: 1 }], Total: 1 } });
	vm.openItems(tuple({ Id: 4 }));
	expect(itemsPopup.title).toBe('Ítems de Departamentos (2010)');
	expect(itemsPopup.columns.map(function (col) { return col.property; })).toEqual([
		'Caption', 'Code', 'PreviousCaption', 'PreviousCode', 'IsPartial', 'Id',
	]);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ t: 4, o: 0, l: 500 });
	expect(itemsPopup.items).toEqual([{ Id: 1 }]);
});

describe('GeographyTuples: eliminación');

it('isItemDeleteEnabled solo permite eliminar equivalencias, no grupos', () => {
	const { vm } = setup();
	expect(vm.isItemDeleteEnabled(tuple())).toBe(true);
	expect(vm.isItemDeleteEnabled(parentNode(geography(10, 'A')))).toBe(false);
});

it('el mensaje de confirmación nombra las dos geografías', () => {
	expect(setup().vm.deleteConfirmMessage(tuple()))
		.toBe("Esta acción no puede deshacerse: se eliminará la equivalencia entre 'Departamentos (2022)' y 'Departamentos (2010)'.");
});

it('onItemDelete elimina en el servidor y quita la equivalencia de la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteGeographyTuple': {} });
	const a = tuple({ Id: 1 });
	const b = tuple({ Id: 2 });
	vm.list.push(a, b);
	vm.onItemDelete(a);
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ t: '1' });
	expect(vm.list).toEqual([b]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const vm = mountLite(GeographyTuplePopup, { refs: { invoker } });
	return { env, vm, invoker };
}

describe('GeographyTuplePopup: datos y created');

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

it('al crearse carga las geografías agrupadas por árbol una sola vez', () => {
	const { env, vm } = setupPopup();
	preload(env.context.Geographies, [
		{ Id: 2, ParentId: 1, Caption: 'Dptos', RootCaption: null },
		{ Id: 1, ParentId: null, Caption: 'Provincias', RootCaption: 'Censo' },
	]);
	callHook(GeographyTuplePopup, vm, 'created');
	expect(vm.geographies.map(function (g) { return g.Id; })).toEqual([1, 2]);
	expect(vm.geographies[1].RootCaption).toBe('Censo');
});

describe('GeographyTuplePopup: edición');

it('show trabaja sobre una copia y se abre; isNew depende del Id', () => {
	const { vm } = setupPopup();
	const original = tuple({ Id: null });
	vm.show(original);
	expect(vm.geographyTuple).toEqual(original);
	expect(vm.geographyTuple === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.isNew).toBe(true);
	vm.show(tuple({ Id: 5 }));
	expect(vm.isNew).toBe(false);
});

it('formatGeography indica "[Sin elegir]" cuando no hay geografía', () => {
	const { vm } = setupPopup();
	expect(vm.formatGeography(null)).toBe('[Sin elegir]');
	expect(vm.formatGeography(geography(1, 'Provincias'))).toBe('Provincias');
	expect(vm.formatGeography(geography(1, 'Provincias', '2022'))).toBe('Provincias (2022)');
});

it('save exige la geografía y su equivalente anterior', () => {
	const cases = [
		tuple({ Geography: null }),
		tuple({ PreviousGeography: null }),
	];
	cases.forEach(function (item) {
		const { env, vm } = setupPopup();
		vm.geographyTuple = item;
		vm.save();
		expect(env.alerts).toEqual(['Debe indicar la geografía y su equivalente anterior.']);
		expect(axios.calls).toHaveLength(0);
	});
});

it('save guarda la equivalencia, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateGeographyTuple': {} });
	vm.activateEdit = true;
	vm.geographyTuple = tuple({ Id: 3 });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ t: tuple({ Id: 3 }) });
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.geographyTuple] }]);
});
