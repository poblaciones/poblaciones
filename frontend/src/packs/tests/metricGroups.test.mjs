import { describe, it, expect } from './_harness.mjs';
import MetricGroups from '@/packs/views/MetricGroups/MetricGroups.vue';
import MetricGroupPopup from '@/packs/views/MetricGroups/MetricGroupPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, preload,
} from './fixtures.mjs';

const GET_GROUPS = 'GET /services/packs/GetMetricGroups';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editGroupPopup = makePopup();
	const vm = mountLite(MetricGroups, { refs: { invoker, editGroupPopup } });
	return { env, vm, invoker, editGroupPopup };
}

function group(overrides) {
	return Object.assign({ Id: 1, Caption: 'Salud', Icon: 'fa-heart', Order: 1 }, overrides || {});
}

describe('MetricGroups: datos y permisos');

it('parte con la lista vacía y solo el administrador general puede editar', () => {
	expect(setup('A').vm.groups).toEqual([]);
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
	expect(setup('L').vm.canEdit).toBe(false);
});

describe('MetricGroups.mounted');

it('pide las categorías con mensaje de espera y las agrega a la lista', async () => {
	const { vm, invoker } = setup();
	serve({ [GET_GROUPS]: [group({ Id: 1 }), group({ Id: 2 })] });
	callHook(MetricGroups, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo categorías...');
	await settle();
	expect(vm.groups.map(function (g) { return g.Id; })).toEqual([1, 2]);
});

describe('MetricGroups.groupColumns');

it('define las columnas Nombre, Ícono y Orden', () => {
	const { vm } = setup();
	const columns = vm.groupColumns;
	expect(columns.map(function (c) { return [c.property, c.caption]; })).toEqual([
		['Caption', 'Nombre'], ['Icon', 'Ícono'], ['Order', 'Orden'],
	]);
	expect(columns[1].type).toBe('status');
	expect(columns[1].sortable).toBe(false);
	expect(columns[2].sortType).toBe('number');
});

it('la columna Ícono usa el ícono con el prefijo que reconoce la grilla', () => {
	const { vm } = setup();
	expect(vm.groupColumns[1].icon(group({ Icon: 'fa-heart' }))).toBe('fas fa-heart');
	expect(vm.groupColumns[1].icon(group({ Icon: null }))).toBeNull();
});

describe('MetricGroups.formatIcon');

it('devuelve null sin ícono y respeta los prefijos "fas " y "fa "', () => {
	const { vm } = setup();
	expect(vm.formatIcon(null)).toBeNull();
	expect(vm.formatIcon('')).toBeNull();
	expect(vm.formatIcon('fas fa-users')).toBe('fas fa-users');
	expect(vm.formatIcon('fa fa-users')).toBe('fa fa-users');
});

it('agrega el prefijo "fas " a la clase sin prefijo', () => {
	expect(setup().vm.formatIcon('fa-users')).toBe('fas fa-users');
});

describe('MetricGroups.groupActions');

it('el administrador ve Modificar y los demás perfiles ven Ver', () => {
	const admin = setup('A').vm.groupActions;
	expect([admin[0].icon, admin[0].caption]).toEqual(['edit', 'Modificar']);
	const reader = setup('L').vm.groupActions;
	expect([reader[0].icon, reader[0].caption]).toEqual(['visibility', 'Ver']);
});

it('la acción abre la edición de la fila', () => {
	const { vm, editGroupPopup } = setup();
	const item = group();
	vm.groupActions[0].onClick(null, item);
	expect(editGroupPopup.shown).toEqual([[item]]);
});

describe('MetricGroups: edición');

it('createNewGroup abre la edición con una copia en blanco tomada de la fábrica', () => {
	const { env, vm, editGroupPopup } = setup();
	const blank = { Id: null, Caption: '', Icon: '', Order: 0 };
	preload(env.context.Factory, { MetricGroup: blank });
	vm.createNewGroup();
	expect(editGroupPopup.shown).toHaveLength(1);
	expect(editGroupPopup.shown[0][0]).toEqual(blank);
	expect(editGroupPopup.shown[0][0] === blank).toBe(false);
});

it('openGroupEdition y onGroupRowClick abren el popup con la fila', () => {
	const { vm, editGroupPopup } = setup();
	const item = group();
	vm.openGroupEdition(item);
	vm.onGroupRowClick(null, item);
	expect(editGroupPopup.shown).toEqual([[item], [item]]);
});

it('groupSaved reemplaza la categoría existente o agrega una nueva', () => {
	const { vm } = setup();
	vm.groups.push(group({ Id: 1, Caption: 'A' }), group({ Id: 2 }));
	vm.groupSaved(group({ Id: 1, Caption: 'Nueva' }));
	expect(vm.groups).toHaveLength(2);
	expect(vm.groups[0].Caption).toBe('Nueva');
	vm.groupSaved(group({ Id: 3 }));
	expect(vm.groups.map(function (g) { return g.Id; })).toEqual([1, 2, 3]);
});

describe('MetricGroups: eliminación');

it('el mensaje de confirmación nombra la categoría', () => {
	expect(setup().vm.groupDeleteConfirmMessage({ Caption: 'Salud' }))
		.toBe("Esta acción no puede deshacerse: se eliminará la categoría 'Salud'.");
});

it('onGroupDelete elimina en el servidor y quita la categoría de la lista', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/packs/DeleteMetricGroup': {} });
	const a = group({ Id: 1 });
	const b = group({ Id: 2 });
	vm.groups.push(a, b);
	vm.onGroupDelete(a);
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ g: '1' });
	expect(vm.groups).toEqual([b]);
});

it('onGroupDelete de una categoría que no está en la lista no altera la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteMetricGroup': {} });
	const b = group({ Id: 2 });
	vm.groups.push(b);
	vm.onGroupDelete(group({ Id: 9 }));
	await settle();
	expect(vm.groups).toEqual([b]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(MetricGroupPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

describe('MetricGroupPopup: permisos');

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.canEdit).toBe(false);
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

describe('MetricGroupPopup.show');

it('trabaja sobre una copia de la categoría y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = group();
	vm.show(original);
	expect(vm.metricGroup).toEqual(original);
	expect(vm.metricGroup === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

describe('MetricGroupPopup.save');

it('con el nombre vacío o de espacios avisa y no guarda', () => {
	for (const caption of ['', '   ']) {
		const { env, vm } = setupPopup();
		vm.metricGroup = group({ Caption: caption });
		vm.save();
		expect(env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
		expect(axios.calls).toHaveLength(0);
	}
});

it('guarda la categoría, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateMetricGroup': {} });
	vm.activateEdit = true;
	vm.metricGroup = group({ Caption: 'Educación' });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ g: group({ Caption: 'Educación' }) });
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.metricGroup] }]);
});
