import { describe, it, expect } from './_harness.mjs';
import MetricProviders from '@/packs/views/MetricProviders/MetricProviders.vue';
import MetricProviderPopup from '@/packs/views/MetricProviders/MetricProviderPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, preload,
} from './fixtures.mjs';

const GET_PROVIDERS = 'GET /services/packs/GetMetricProviders';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editProviderPopup = makePopup();
	const vm = mountLite(MetricProviders, { refs: { invoker, editProviderPopup } });
	return { env, vm, invoker, editProviderPopup };
}

function provider(overrides) {
	return Object.assign({ Id: 1, Caption: 'INDEC', Order: 1 }, overrides || {});
}

describe('MetricProviders: datos y permisos');

it('parte con la lista vacía y solo el administrador general puede editar', () => {
	expect(setup('A').vm.providers).toEqual([]);
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
	expect(setup('L').vm.canEdit).toBe(false);
});

describe('MetricProviders.mounted');

it('pide los orígenes con mensaje de espera y los agrega a la lista', async () => {
	const { vm, invoker } = setup();
	serve({ [GET_PROVIDERS]: [provider({ Id: 1 }), provider({ Id: 2 })] });
	callHook(MetricProviders, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo orígenes...');
	await settle();
	expect(vm.providers.map(function (p) { return p.Id; })).toEqual([1, 2]);
});

describe('MetricProviders: grilla');

it('define las columnas Nombre y Orden', () => {
	const columns = setup().vm.providerColumns;
	expect(columns.map(function (c) { return [c.property, c.caption]; })).toEqual([
		['Caption', 'Nombre'], ['Order', 'Orden'],
	]);
	expect(columns[1].sortType).toBe('number');
});

it('el administrador ve Modificar y los demás perfiles ven Ver', () => {
	const admin = setup('A').vm.providerActions;
	expect([admin[0].icon, admin[0].caption]).toEqual(['edit', 'Modificar']);
	const reader = setup('L').vm.providerActions;
	expect([reader[0].icon, reader[0].caption]).toEqual(['visibility', 'Ver']);
});

it('la acción abre la edición de la fila', () => {
	const { vm, editProviderPopup } = setup();
	const item = provider();
	vm.providerActions[0].onClick(null, item);
	expect(editProviderPopup.shown).toEqual([[item]]);
});

describe('MetricProviders: edición');

it('createNewProvider abre la edición con una copia en blanco tomada de la fábrica', () => {
	const { env, vm, editProviderPopup } = setup();
	const blank = { Id: null, Caption: '', Order: 0 };
	preload(env.context.Factory, { MetricProvider: blank });
	vm.createNewProvider();
	expect(editProviderPopup.shown).toHaveLength(1);
	expect(editProviderPopup.shown[0][0]).toEqual(blank);
	expect(editProviderPopup.shown[0][0] === blank).toBe(false);
});

it('openProviderEdition y onProviderRowClick abren el popup con la fila', () => {
	const { vm, editProviderPopup } = setup();
	const item = provider();
	vm.openProviderEdition(item);
	vm.onProviderRowClick(null, item);
	expect(editProviderPopup.shown).toEqual([[item], [item]]);
});

it('providerSaved reemplaza el origen existente o agrega uno nuevo', () => {
	const { vm } = setup();
	vm.providers.push(provider({ Id: 1, Caption: 'A' }), provider({ Id: 2 }));
	vm.providerSaved(provider({ Id: 1, Caption: 'Nuevo' }));
	expect(vm.providers).toHaveLength(2);
	expect(vm.providers[0].Caption).toBe('Nuevo');
	vm.providerSaved(provider({ Id: 3 }));
	expect(vm.providers.map(function (p) { return p.Id; })).toEqual([1, 2, 3]);
});

describe('MetricProviders: eliminación');

it('el mensaje de confirmación nombra el origen', () => {
	expect(setup().vm.providerDeleteConfirmMessage({ Caption: 'INDEC' }))
		.toBe("Esta acción no puede deshacerse: se eliminará el origen 'INDEC'.");
});

it('onProviderDelete elimina en el servidor y quita el origen de la lista', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/packs/DeleteMetricProvider': {} });
	const a = provider({ Id: 1 });
	const b = provider({ Id: 2 });
	vm.providers.push(a, b);
	vm.onProviderDelete(a);
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ p: '1' });
	expect(vm.providers).toEqual([b]);
});

it('onProviderDelete de un origen que no está en la lista no altera la lista', async () => {
	const { vm } = setup();
	serve({ 'POST /services/packs/DeleteMetricProvider': {} });
	const b = provider({ Id: 2 });
	vm.providers.push(b);
	vm.onProviderDelete(provider({ Id: 9 }));
	await settle();
	expect(vm.providers).toEqual([b]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(MetricProviderPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

describe('MetricProviderPopup: permisos');

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.canEdit).toBe(false);
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

describe('MetricProviderPopup.show');

it('trabaja sobre una copia del origen y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = provider();
	vm.show(original);
	expect(vm.metricProvider).toEqual(original);
	expect(vm.metricProvider === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

describe('MetricProviderPopup.save');

it('con el nombre vacío o de espacios avisa y no guarda', () => {
	for (const caption of ['', '   ']) {
		const { env, vm } = setupPopup();
		vm.metricProvider = provider({ Caption: caption });
		vm.save();
		expect(env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
		expect(axios.calls).toHaveLength(0);
	}
});

it('guarda el origen, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateMetricProvider': {} });
	vm.activateEdit = true;
	vm.metricProvider = provider({ Caption: 'CEPAL' });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ p: provider({ Caption: 'CEPAL' }) });
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.metricProvider] }]);
});
