import { describe, it, expect } from './_harness.mjs';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';
import c from '@/common/framework/color';
import Boundaries from '@/packs/views/Boundaries/Boundaries.vue';
import BoundaryPopup from '@/packs/views/Boundaries/BoundaryPopup.vue';
import BoundaryVersionPopup from '@/packs/views/Boundaries/BoundaryVersionPopup.vue';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup.vue';
import {
	setupGlobals, mountLite, callHook, triggerWatch, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, preload,
} from './fixtures.mjs';

const GET_BOUNDARIES = 'GET /services/packs/GetBoundaries';
const GROUP_A = { Id: 1, Caption: 'Grupo A' };
const GROUP_B = { Id: 2, Caption: 'Grupo B' };

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const editVersionPopup = makePopup();
	const editMetadataPopup = makePopup();
	const vm = mountLite(Boundaries, { refs: { invoker, editPopup, editVersionPopup, editMetadataPopup } });
	return { env, vm, invoker, editPopup, editVersionPopup, editMetadataPopup };
}

function boundary(overrides) {
	return Object.assign({
		Id: 1, Level: 0, Caption: 'Radios', Order: 1, Group: GROUP_A, Geography: null, IsPrivate: false, IsSuggestion: true,
		Metadata: null,
	}, overrides || {});
}

function version(overrides) {
	return Object.assign({
		Id: 11, Level: 1, Caption: '2022', Boundary: { Id: 1, Caption: 'Radios' }, MetadataId: null,
		ClippingRegions: [], ClippingRegionsSummary: 'Provincias',
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

describe('Boundaries: datos y permisos');

it('parte con la lista y los grupos vacíos', () => {
	const { vm } = setup();
	expect(vm.list).toEqual([]);
	expect(vm.groups).toEqual([]);
	expect(vm.uniqueMetadatas).toEqual([]);
});

it('solo el administrador general puede editar', () => {
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('Boundaries.mounted / reloadList');

it('mounted pide las delimitaciones y carga los grupos desde el catálogo', async () => {
	const { env, vm, invoker } = setup();
	preload(env.context.BoundaryGroups, [GROUP_A, GROUP_B]);
	serve({ [GET_BOUNDARIES]: [boundary({ Id: 1 })] });
	callHook(Boundaries, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo delimitaciones...');
	await settle();
	expect(idsOf(vm.list)).toEqual([1]);
	expect(vm.groups).toEqual([GROUP_A, GROUP_B]);
});

it('reloadList reemplaza la lista y recuerda cada metadato distinto en orden de aparición', async () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 99 }));
	serve({ [GET_BOUNDARIES]: [
		boundary({ Id: 1 }),
		version({ Id: 11, MetadataId: 7 }),
		version({ Id: 12, MetadataId: null, ClippingRegions: [{ MetadataId: 9 }] }),
		version({ Id: 13, MetadataId: 7 }),
	] });
	vm.reloadList();
	await settle();
	expect(idsOf(vm.list)).toEqual([1, 11, 12, 13]);
	expect(vm.uniqueMetadatas).toEqual([7, 9]);
});

describe('Boundaries.resolveVersionMetadataId / resolveColor');

it('resolveVersionMetadataId usa el metadato propio o, si no hay, el de la primera región asociada', () => {
	const { vm } = setup();
	expect(vm.resolveVersionMetadataId(version({ MetadataId: 7 }))).toBe(7);
	expect(vm.resolveVersionMetadataId(version({ ClippingRegions: [{ MetadataId: 9 }, { MetadataId: 10 }] }))).toBe(9);
	expect(vm.resolveVersionMetadataId(version({ ClippingRegions: [{ MetadataId: null }] }))).toBeNull();
	expect(vm.resolveVersionMetadataId(version({ ClippingRegions: [] }))).toBeNull();
	expect(vm.resolveVersionMetadataId(boundary())).toBeNull();
});

it('resolveColor es gris con metadato propio, vacío sin metadato y de la paleta si viene de una región', () => {
	const { vm } = setup();
	const palete = c.GetColorPalete();
	vm.uniqueMetadatas = [9, 10];
	expect(vm.resolveColor(version({ MetadataId: 7 }))).toBe('9e9e9e');
	expect(vm.resolveColor(version())).toBe('');
	expect(vm.resolveColor(version({ ClippingRegions: [{ MetadataId: 9 }] }))).toBe(palete[0]);
	expect(vm.resolveColor(version({ ClippingRegions: [{ MetadataId: 10 }] }))).toBe(palete[1 % palete.length]);
});

describe('Boundaries.treeList');

it('agrupa las delimitaciones por grupo y anida cada versión bajo su delimitación', () => {
	const { vm } = setup();
	vm.list.push(
		boundary({ Id: 1, Group: GROUP_A }), version({ Id: 11 }),
		boundary({ Id: 2, Group: GROUP_B }),
		boundary({ Id: 3, Group: GROUP_A }),
	);
	const tree = vm.treeList;
	expect(tree.map(function (g) { return g.Id; })).toEqual(['group-1', 'group-2']);
	expect(tree.map(function (g) { return g.Caption; })).toEqual(['Grupo A', 'Grupo B']);
	expect(idsOf(tree[0].Items)).toEqual([1, 3]);
	expect(idsOf(tree[0].Items[0].Items)).toEqual([11]);
	expect(idsOf(tree[1].Items)).toEqual([2]);
});

it('los nodos de grupo usan un nivel artificial que no se confunde con delimitación ni versión', () => {
	const { vm } = setup();
	const groups = vm.groupByBoundaryGroup([boundary({ Id: 1 })]);
	expect(groups[0].Level).toBe(-1);
	expect(vm.isItemDeleteEnabled(groups[0])).toBe(false);
	expect(vm.isItemDeleteEnabled(boundary())).toBe(true);
	expect(vm.isItemDeleteEnabled(version())).toBe(true);
});

describe('Boundaries.gridColumns');

it('define las columnas esperadas y ninguna es ordenable', () => {
	const { vm } = setup();
	expect(vm.gridColumns.map(function (col) { return col.caption; })).toEqual([
		'Nombre', 'Orden', 'Geografía', 'Contenido', 'Público', 'Recomendado',
	]);
	expect(vm.gridColumns.every(function (col) { return col.sortable === false; })).toBe(true);
});

it('el tooltip del nombre muestra el título de los metadatos', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Nombre').tooltip(boundary({ Metadata: { Title: 'Fuente' } }))).toBe('Fuente');
	expect(columnBy(vm, 'Nombre').tooltip(boundary())).toBeNull();
});

it('Orden, Público y Recomendado solo se muestran en las delimitaciones; Contenido solo en las versiones', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Orden').value(boundary({ Order: 3 }))).toBe(3);
	expect(columnBy(vm, 'Orden').value(version())).toBe('');
	expect(columnBy(vm, 'Público').value(boundary({ IsPrivate: false }))).toBe('Sí');
	expect(columnBy(vm, 'Público').value(boundary({ IsPrivate: true }))).toBe('-');
	expect(columnBy(vm, 'Público').value(version())).toBe('');
	expect(columnBy(vm, 'Público').sortValue(boundary({ IsPrivate: true }))).toBe(false);
	expect(columnBy(vm, 'Recomendado').value(boundary({ IsSuggestion: true }))).toBe('Sí');
	expect(columnBy(vm, 'Recomendado').value(version())).toBe('');
	expect(columnBy(vm, 'Contenido').value(version({ ClippingRegionsSummary: 'A, B' }))).toBe('A, B');
	expect(columnBy(vm, 'Contenido').value(boundary())).toBe('');
});

it('la columna Geografía incluye la revisión si la tiene', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Geografía');
	expect(column.value(boundary({ Geography: null }))).toBe('');
	expect(column.value(boundary({ Geography: { Caption: 'Radios', Revision: null } }))).toBe('Radios');
	expect(column.value(boundary({ Geography: { Caption: 'Radios', Revision: '2010' } }))).toBe('Radios (2010)');
});

describe('Boundaries.gridActions: habilitación');

it('el administrador ve Modificar y los demás perfiles ven Ver', () => {
	const admin = setup('A').vm;
	expect(actionBy(admin, 'Modificar delimitación').icon).toBe('edit');
	expect(actionBy(admin, 'Modificar versión').icon).toBe('edit_calendar');
	const reader = setup('L').vm;
	expect(actionBy(reader, 'Ver delimitación').icon).toBe('visibility');
	expect(actionBy(reader, 'Ver versión').icon).toBe('visibility');
});

it('las acciones de delimitación y de versión se habilitan según el nivel de la fila', () => {
	const { vm } = setup();
	expect(actionBy(vm, 'Modificar delimitación').isEnabled(boundary())).toBe(true);
	expect(actionBy(vm, 'Modificar delimitación').isEnabled(version())).toBe(false);
	expect(actionBy(vm, 'Modificar versión').isEnabled(version())).toBe(true);
	expect(actionBy(vm, 'Modificar versión').isEnabled(boundary())).toBe(false);
});

it('Nueva versión, Subir y Bajar requieren permiso de edición', () => {
	const reader = setup('L').vm;
	reader.list.push(boundary({ Id: 1 }), boundary({ Id: 2 }), boundary({ Id: 3 }));
	expect(actionBy(reader, 'Nueva versión').isEnabled(boundary({ Id: 2 }))).toBe(false);
	expect(actionBy(reader, 'Subir').isEnabled(boundary({ Id: 2 }))).toBe(false);
	expect(actionBy(reader, 'Bajar').isEnabled(boundary({ Id: 2 }))).toBe(false);
	const admin = setup('A').vm;
	admin.list.push(boundary({ Id: 1 }), boundary({ Id: 2 }), boundary({ Id: 3 }));
	expect(actionBy(admin, 'Nueva versión').isEnabled(boundary({ Id: 2 }))).toBe(true);
	expect(actionBy(admin, 'Nueva versión').isEnabled(version())).toBe(false);
});

it('Subir no se habilita para la primera delimitación de su grupo ni Bajar para la última', () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 1 }), boundary({ Id: 2 }), boundary({ Id: 3 }));
	expect(actionBy(vm, 'Subir').isEnabled(boundary({ Id: 1 }))).toBe(false);
	expect(actionBy(vm, 'Subir').isEnabled(boundary({ Id: 2 }))).toBe(true);
	expect(actionBy(vm, 'Bajar').isEnabled(boundary({ Id: 3 }))).toBe(false);
	expect(actionBy(vm, 'Bajar').isEnabled(boundary({ Id: 2 }))).toBe(true);
});

it('Metadatos solo se habilita en versiones con un metadato resoluble y muestra el id si es el de una región', () => {
	const { vm } = setup();
	vm.uniqueMetadatas = [9];
	const action = actionBy(vm, 'Metadatos');
	expect(action.isEnabled(version({ MetadataId: 7 }))).toBe(true);
	expect(action.isEnabled(version({ ClippingRegions: [{ MetadataId: 9 }] }))).toBe(true);
	expect(action.isEnabled(version())).toBe(false);
	expect(action.isEnabled(boundary({ MetadataId: 7 }))).toBe(false);
	expect(action.badge(version({ MetadataId: 7 }))).toBeNull();
	expect(action.badge(version({ ClippingRegions: [{ MetadataId: 9 }] }))).toBe(9);
	expect(action.iconStyle(version({ MetadataId: 7 }))).toBe('color: #9e9e9e');
});

describe('Boundaries.gridActions: acciones');

it('cada acción invoca el método correspondiente de la vista', () => {
	const { vm } = setup();
	const called = [];
	['openEdition', 'openNewVersion', 'moveBoundary', 'openMetadata'].forEach(function (name) {
		vm[name] = function (...args) { called.push([name].concat(args)); };
	});
	const b = boundary();
	const v = version({ MetadataId: 7 });
	actionBy(vm, 'Modificar delimitación').onClick(null, b);
	actionBy(vm, 'Modificar versión').onClick(null, v);
	actionBy(vm, 'Nueva versión').onClick(null, b);
	actionBy(vm, 'Subir').onClick(null, b);
	actionBy(vm, 'Bajar').onClick(null, b);
	actionBy(vm, 'Metadatos').onClick(null, v);
	expect(called).toEqual([
		['openEdition', b], ['openEdition', v], ['openNewVersion', b],
		['moveBoundary', b, true], ['moveBoundary', b, false], ['openMetadata', { Id: 7 }],
	]);
});

describe('Boundaries: hermanos y orden');

it('getSiblings devuelve solo las delimitaciones del mismo grupo', () => {
	const { vm } = setup();
	vm.list.push(
		boundary({ Id: 1, Group: GROUP_A }), version({ Id: 11 }), boundary({ Id: 2, Group: GROUP_B }), boundary({ Id: 3, Group: GROUP_A }),
	);
	expect(idsOf(vm.getSiblings(boundary({ Id: 1, Group: GROUP_A })))).toEqual([1, 3]);
	expect(idsOf(vm.getSiblings(boundary({ Id: 2, Group: GROUP_B })))).toEqual([2]);
});

it('isFirstInGroup e isLastInGroup consideran solo a los hermanos de su grupo', () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 1, Group: GROUP_A }), boundary({ Id: 2, Group: GROUP_B }), boundary({ Id: 3, Group: GROUP_A }));
	expect(vm.isFirstInGroup(vm.list[0])).toBe(true);
	expect(vm.isLastInGroup(vm.list[0])).toBe(false);
	expect(vm.isFirstInGroup(vm.list[1])).toBe(true);
	expect(vm.isLastInGroup(vm.list[1])).toBe(true);
	expect(vm.isLastInGroup(vm.list[2])).toBe(true);
});

it('moveBoundary hacia arriba o abajo guarda en el servidor y recarga la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/MoveBoundaryUp': {}, 'POST /services/packs/MoveBoundaryDown': {}, [GET_BOUNDARIES]: [boundary({ Id: 1 })] });
	vm.moveBoundary(boundary({ Id: 5 }), true);
	await settle();
	vm.moveBoundary(boundary({ Id: 6 }), false);
	await settle();
	expect(axios.calls.map(function (call) { return call.url.split('/').pop(); })).toEqual([
		'MoveBoundaryUp', 'GetBoundaries', 'MoveBoundaryDown', 'GetBoundaries',
	]);
	expect(bodyOf(axios.calls[0])).toEqual({ b: '5' });
	expect(bodyOf(axios.calls[2])).toEqual({ b: '6' });
});

describe('Boundaries: apertura de popups');

it('openEdition abre el popup de delimitación con los grupos, o el de versión con su delimitación', () => {
	const { vm, editPopup, editVersionPopup } = setup();
	vm.groups.push(GROUP_A);
	const b = boundary();
	const v = version();
	vm.openEdition(b);
	vm.openEdition(v);
	expect(editPopup.shown).toEqual([[b, vm.groups]]);
	expect(editVersionPopup.shown).toEqual([[v, v.Boundary]]);
});

it('onRowClick ignora las filas de grupo y abre la edición de las demás', () => {
	const { vm, editPopup } = setup();
	vm.onRowClick(null, { Id: 'group-1', Level: -1 });
	expect(editPopup.shown).toEqual([]);
	const b = boundary();
	vm.onRowClick(null, b);
	expect(editPopup.shown).toHaveLength(1);
});

it('createNewBoundary abre la edición con una copia en blanco de la fábrica y los grupos', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Caption: '' };
	preload(env.context.Factory, { Boundary: blank });
	vm.groups.push(GROUP_A);
	vm.createNewBoundary();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
	expect(editPopup.shown[0][1]).toBe(vm.groups);
});

it('openNewVersion abre una versión en blanco con una referencia liviana a la delimitación (sin Items)', () => {
	const { env, vm, editVersionPopup } = setup();
	preload(env.context.Factory, { BoundaryVersion: { Id: null, Caption: '' } });
	vm.openNewVersion(boundary({ Id: 4, Caption: 'Radios', Items: [version()] }));
	expect(editVersionPopup.shown[0][0]).toEqual({ Id: null, Caption: '' });
	expect(editVersionPopup.shown[0][1]).toEqual({ Id: 4, Caption: 'Radios' });
});

it('openMetadata carga los metadatos y abre el popup con un ActiveMetadata', async () => {
	const { vm, editMetadataPopup } = setup();
	serve({ 'GET /services/packs/GetMetadata': { Metadata: { Id: 7 }, Files: [], Sources: [], Institutions: [] } });
	vm.openMetadata({ Id: 7 });
	await settle();
	expect(axios.calls[0].config.params).toEqual({ m: 7 });
	expect(editMetadataPopup.shown[0][0] instanceof ActiveMetadata).toBe(true);
});

describe('Boundaries: guardado desde los popups');

it('popupSaved de una delimitación nueva recarga la lista del servidor', async () => {
	const { vm } = setup();
	serve({ [GET_BOUNDARIES]: [boundary({ Id: 1 }), boundary({ Id: 2 })] });
	vm.popupSaved(boundary({ Id: null }));
	await settle();
	expect(idsOf(vm.list)).toEqual([1, 2]);
});

it('popupSaved de una delimitación existente la reemplaza en su lugar con nivel 0 y no consulta', async () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 1, Caption: 'Vieja' }), version({ Id: 11 }));
	vm.popupSaved(boundary({ Id: 1, Caption: 'Nueva', Level: undefined }));
	await settle();
	expect(axios.calls).toHaveLength(0);
	expect(vm.list[0].Caption).toBe('Nueva');
	expect(vm.list[0].Level).toBe(0);
	expect(idsOf(vm.list)).toEqual([1, 11]);
});

it('versionSaved de una versión sin Id recarga la lista del servidor', async () => {
	const { vm } = setup();
	serve({ [GET_BOUNDARIES]: [boundary({ Id: 1 })] });
	vm.versionSaved(version({ Id: null }));
	await settle();
	expect(axios.calls).toHaveLength(1);
});

it('versionSaved de una versión existente la reemplaza en su lugar con nivel 1', () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 1 }), version({ Id: 11, Caption: '2010' }));
	vm.versionSaved(version({ Id: 11, Caption: '2011', Level: undefined }));
	expect(vm.list[1].Caption).toBe('2011');
	expect(vm.list[1].Level).toBe(1);
	expect(vm.list).toHaveLength(2);
});

it('versionSaved de una versión nueva la inserta a continuación de las versiones de su delimitación', () => {
	const { vm } = setup();
	vm.list.push(
		boundary({ Id: 1 }), version({ Id: 11, Boundary: { Id: 1 } }), version({ Id: 12, Boundary: { Id: 1 } }),
		boundary({ Id: 2 }), version({ Id: 21, Boundary: { Id: 2 } }),
	);
	vm.versionSaved(version({ Id: 13, Boundary: { Id: 1 } }));
	expect(idsOf(vm.list)).toEqual([1, 11, 12, 13, 2, 21]);
	vm.versionSaved(version({ Id: 22, Boundary: { Id: 2 } }));
	expect(idsOf(vm.list)).toEqual([1, 11, 12, 13, 2, 21, 22]);
});

it('versionSaved de una versión nueva cuya delimitación no está en la lista no la agrega', () => {
	const { vm } = setup();
	vm.list.push(boundary({ Id: 1 }));
	vm.versionSaved(version({ Id: 13, Boundary: { Id: 99 } }));
	expect(idsOf(vm.list)).toEqual([1]);
});

describe('Boundaries: eliminación');

it('el mensaje de confirmación distingue delimitación (con todas sus versiones) de versión', () => {
	const { vm } = setup();
	expect(vm.deleteConfirmMessage(boundary({ Caption: 'Radios' })))
		.toBe("Esta acción no puede deshacerse: se eliminará la delimitación 'Radios' junto con todas sus versiones.");
	expect(vm.deleteConfirmMessage(version({ Caption: '2022' })))
		.toBe("Esta acción no puede deshacerse: se eliminará la versión '2022'.");
});

it('eliminar una delimitación la quita junto con todas sus versiones', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteBoundary': {} });
	vm.list.push(
		boundary({ Id: 1 }), version({ Id: 11, Boundary: { Id: 1 } }), version({ Id: 12, Boundary: { Id: 1 } }),
		boundary({ Id: 2 }), version({ Id: 21, Boundary: { Id: 2 } }),
	);
	vm.onItemDelete(vm.list[0]);
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ b: '1' });
	expect(idsOf(vm.list)).toEqual([2, 21]);
});

it('eliminar una versión quita solo esa versión', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteBoundaryVersion': {} });
	vm.list.push(boundary({ Id: 1 }), version({ Id: 11 }), version({ Id: 12 }));
	vm.onItemDelete(vm.list[1]);
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ v: '11' });
	expect(idsOf(vm.list)).toEqual([1, 12]);
});

describe('Boundaries: utilidades');

it('asHtml reemplaza cada salto de línea por <br> y devuelve vacío sin texto', () => {
	const { vm } = setup();
	expect(vm.asHtml('a\nb')).toBe('a<br>b');
	expect(vm.asHtml('a\nb\nc')).toBe('a<br>b<br>c');
	expect(vm.asHtml('')).toBe('');
	expect(vm.asHtml(null)).toBe('');
});

// ---------------------------------------------------------------------

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(BoundaryPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

describe('BoundaryPopup.sanitizeTag');

it('pasa a minúsculas, quita acentos y reemplaza los caracteres no alfanuméricos por guion bajo', () => {
	const { vm } = setupPopup();
	expect(vm.sanitizeTag('Radios Censales')).toBe('radios_censales');
	expect(vm.sanitizeTag('Delimitación Económica')).toBe('delimitacion_economica');
	expect(vm.sanitizeTag('A  -  B / C')).toBe('a_b_c');
});

it('quita los guiones bajos de los extremos y devuelve vacío sin texto', () => {
	const { vm } = setupPopup();
	expect(vm.sanitizeTag('  ¡Hola!  ')).toBe('hola');
	expect(vm.sanitizeTag('')).toBe('');
	expect(vm.sanitizeTag(null)).toBe('');
});

describe('BoundaryPopup.show y Tag automático');

it('trabaja sobre una copia, toma los grupos, deriva isPublic y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = boundary({ IsPrivate: true });
	vm.show(original, [GROUP_A]);
	expect(vm.boundary).toEqual(original);
	expect(vm.boundary === original).toBe(false);
	expect(vm.groups).toEqual([GROUP_A]);
	expect(vm.isPublic).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('al terminar de mostrar el popup se reactiva la actualización automática del Tag', () => {
	const { vm } = setupPopup();
	vm.show(boundary(), []);
	expect(vm.suppressTagWatch).toBe(false);
});

it('al cambiar el nombre el Tag se actualiza solo si la actualización automática está activa', () => {
	const { vm } = setupPopup();
	vm.boundary = boundary({ Tag: 'viejo' });
	vm.suppressTagWatch = true;
	triggerWatch(BoundaryPopup, vm, 'boundary.Caption', 'Nuevo Nombre');
	expect(vm.boundary.Tag).toBe('viejo');
	vm.suppressTagWatch = false;
	triggerWatch(BoundaryPopup, vm, 'boundary.Caption', 'Nuevo Nombre');
	expect(vm.boundary.Tag).toBe('nuevo_nombre');
});

it('sin delimitación en edición el cambio de nombre no hace nada', () => {
	const { vm } = setupPopup();
	vm.boundary = null;
	triggerWatch(BoundaryPopup, vm, 'boundary.Caption', 'X');
	expect(vm.boundary).toBeNull();
});

describe('BoundaryPopup: permisos y guardado');

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

it('exige Nombre y Grupo', () => {
	const noName = setupPopup();
	noName.vm.boundary = boundary({ Caption: '  ' });
	noName.vm.save();
	expect(noName.env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
	const noGroup = setupPopup();
	noGroup.vm.boundary = boundary({ Group: null });
	noGroup.vm.save();
	expect(noGroup.env.alerts).toEqual(["Debe indicar un valor para 'Grupo'."]);
	expect(axios.calls).toHaveLength(0);
});

it('guarda la delimitación con su privacidad, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateBoundary': {} });
	vm.activateEdit = true;
	vm.boundary = boundary({ Id: 4, IsPrivate: false });
	vm.isPublic = false;
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0]).b.IsPrivate).toBe(true);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.boundary] }]);
});

// ---------------------------------------------------------------------

function setupVersionPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const regionPicker = mountLite(TreePickerPopup);
	const vm = mountLite(BoundaryVersionPopup, { refs: { invoker, inputName, regionPicker } });
	return { env, vm, invoker, inputName, regionPicker };
}

describe('BoundaryVersionPopup: created y título');

it('al crearse carga las geografías agrupadas por árbol', () => {
	const { env, vm } = setupVersionPopup();
	preload(env.context.Geographies, [
		{ Id: 2, ParentId: 1, Caption: 'Dptos', RootCaption: null },
		{ Id: 1, ParentId: null, Caption: 'Provincias', RootCaption: 'Censo' },
	]);
	callHook(BoundaryVersionPopup, vm, 'created');
	expect(idsOf(vm.geographies)).toEqual([1, 2]);
});

it('solo el administrador general edita; dialogTitle nombra la delimitación', () => {
	const { vm } = setupVersionPopup('A');
	expect(vm.cancelCaption).toBe('Cancelar');
	expect(setupVersionPopup('E').vm.cancelCaption).toBe('Cerrar');
	expect(vm.dialogTitle).toBe('Versión de delimitación');
	vm.boundaryVersion = version({ Boundary: { Id: 1, Caption: 'Radios' } });
	expect(vm.dialogTitle).toBe('Versión de Radios');
});

describe('BoundaryVersionPopup.show');

it('trabaja sobre una copia, se abre, carga las regiones y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupVersionPopup();
	const regions = [{ Id: 1 }];
	preload(env.context.ClippingRegions, regions);
	const original = version();
	vm.show(original, { Id: 1, Caption: 'Radios' });
	expect(vm.boundaryVersion).toEqual(Object.assign({}, original, { HasOwnMetadata: false }));
	expect(vm.boundaryVersion === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.allClippingRegions).toBe(regions);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('una versión nueva toma la delimitación recibida y una lista de regiones vacía', () => {
	const { env, vm } = setupVersionPopup();
	preload(env.context.ClippingRegions, []);
	vm.show({ Id: null, Caption: '' }, { Id: 4, Caption: 'Radios' });
	expect(vm.boundaryVersion.Boundary).toEqual({ Id: 4, Caption: 'Radios' });
	expect(vm.boundaryVersion.ClippingRegions).toEqual([]);
});

it('una versión que ya trae delimitación y regiones las conserva', () => {
	const { env, vm } = setupVersionPopup();
	preload(env.context.ClippingRegions, []);
	vm.show(version({ ClippingRegions: [{ Id: 3 }] }), { Id: 99, Caption: 'Otra' });
	expect(vm.boundaryVersion.Boundary.Id).toBe(1);
	expect(vm.boundaryVersion.ClippingRegions).toEqual([{ Id: 3 }]);
});

it('HasOwnMetadata indica si la versión tiene un metadato propio', () => {
	const { env, vm } = setupVersionPopup();
	preload(env.context.ClippingRegions, []);
	vm.show(version({ MetadataId: 7 }), null);
	expect(vm.boundaryVersion.HasOwnMetadata).toBe(true);
	vm.show(version({ MetadataId: null }), null);
	expect(vm.boundaryVersion.HasOwnMetadata).toBe(false);
});

describe('BoundaryVersionPopup: formatos y regiones');

it('formatClippingRegion y formatGeography agregan versión o revisión', () => {
	const { vm } = setupVersionPopup();
	expect(vm.formatClippingRegion({ Caption: 'A' })).toBe('A');
	expect(vm.formatClippingRegion({ Caption: 'A', Version: '2010' })).toBe('A, 2010');
	expect(vm.formatGeography(null)).toBe('');
	expect(vm.formatGeography({ Caption: 'G' })).toBe('G');
	expect(vm.formatGeography({ Caption: 'G', Revision: '2022' })).toBe('G (2022)');
});

it('addRegion abre el selector con todas las regiones y excluye las ya agregadas', () => {
	const { vm, regionPicker } = setupVersionPopup();
	const all = [{ Id: 1, Level: 0, Caption: 'A' }, { Id: 2, Level: 0, Caption: 'B' }];
	vm.allClippingRegions = all;
	vm.boundaryVersion = version({ ClippingRegions: [{ Id: 2 }] });
	vm.addRegion();
	expect(regionPicker.title).toBe('Agregar región');
	expect(regionPicker.flatItems).toBe(all);
	expect(regionPicker.excludeIds).toEqual([2]);
});

it('onRegionSelected agrega solo Id, nombre y versión de la región', () => {
	const { vm } = setupVersionPopup();
	vm.boundaryVersion = version({ ClippingRegions: [] });
	vm.onRegionSelected({ Id: 5, Caption: 'A', Version: '2010', Items: [{ Id: 6 }], Metadata: {} });
	expect(vm.boundaryVersion.ClippingRegions).toEqual([{ Id: 5, Caption: 'A', Version: '2010' }]);
});

it('removeRegion quita la región indicada y no falla con una que no está', () => {
	const { vm } = setupVersionPopup();
	const a = { Id: 1 };
	const b = { Id: 2 };
	vm.boundaryVersion = version({ ClippingRegions: [a, b] });
	vm.removeRegion(a);
	vm.removeRegion({ Id: 9 });
	expect(vm.boundaryVersion.ClippingRegions).toEqual([b]);
});

describe('BoundaryVersionPopup.save');

it('exige Nombre y admite hasta 20 caracteres', () => {
	const empty = setupVersionPopup();
	empty.vm.boundaryVersion = version({ Caption: '  ' });
	empty.vm.save();
	expect(empty.env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
	const long = setupVersionPopup();
	long.vm.boundaryVersion = version({ Caption: 'x'.repeat(21) });
	long.vm.save();
	expect(long.env.alerts).toEqual(["'Nombre' admite hasta 20 caracteres."]);
	expect(axios.calls).toHaveLength(0);
});

it('un nombre de exactamente 20 caracteres es válido', async () => {
	const { env, vm } = setupVersionPopup();
	serve({ 'POST /services/packs/UpdateBoundaryVersion': { ClippingRegionsSummary: 's', MetadataId: 1 } });
	vm.boundaryVersion = version({ Caption: 'x'.repeat(20) });
	vm.save();
	await settle();
	expect(env.alerts).toEqual([]);
	expect(axios.calls).toHaveLength(1);
});

it('guarda la versión y toma del servidor el resumen de regiones y el metadato, y avisa con la copia editada', async () => {
	const { vm, invoker } = setupVersionPopup();
	serve({ 'POST /services/packs/UpdateBoundaryVersion': { ClippingRegionsSummary: 'Provincias, Dptos', MetadataId: 77 } });
	vm.activateEdit = true;
	vm.boundaryVersion = version({ Id: 4 });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0]).v.Id).toBe(4);
	expect(vm.boundaryVersion.ClippingRegionsSummary).toBe('Provincias, Dptos');
	expect(vm.boundaryVersion.MetadataId).toBe(77);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.boundaryVersion] }]);
});
