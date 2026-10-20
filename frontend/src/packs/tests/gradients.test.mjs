import { describe, it, expect } from './_harness.mjs';
import Gradients from '@/packs/views/Gradients/Gradients.vue';
import GradientPopup from '@/packs/views/Gradients/GradientPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makePopup, makeFocusable, makeStepper, makeGeoPackage, preload,
} from './fixtures.mjs';

const GET_GRADIENTS = 'GET /services/packs/GetGradients';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const vm = mountLite(Gradients, { refs: { invoker, editPopup } });
	return { env, vm, invoker, editPopup };
}

function gradient(overrides) {
	return Object.assign({ Id: 1, Caption: 'Densidad', ImageType: 'image/png', MaxZoomLevel: 10 }, overrides || {});
}

describe('Gradients: datos y permisos');

it('parte con la lista vacía y solo el administrador general puede editar', () => {
	expect(setup('A').vm.list).toEqual([]);
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('Gradients.mounted');

it('pide los gradientes con mensaje de espera y los agrega a la lista', async () => {
	const { vm, invoker } = setup();
	serve({ [GET_GRADIENTS]: [gradient({ Id: 1 }), gradient({ Id: 2 })] });
	callHook(Gradients, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo gradientes...');
	await settle();
	expect(vm.list.map(function (g) { return g.Id; })).toEqual([1, 2]);
});

describe('Gradients: grilla');

it('define las columnas Nombre, Tipo de imagen y Zoom máximo', () => {
	const columns = setup().vm.gridColumns;
	expect(columns.map(function (c) { return [c.property, c.caption]; })).toEqual([
		['Caption', 'Nombre'], ['ImageType', 'Tipo de imagen'], ['MaxZoomLevel', 'Zoom máximo'],
	]);
	expect(columns[2].sortType).toBe('number');
});

it('el tipo de imagen se muestra como JPG para image/jpeg y como PNG en cualquier otro caso', () => {
	const column = setup().vm.gridColumns[1];
	expect(column.value(gradient({ ImageType: 'image/jpeg' }))).toBe('JPG');
	expect(column.value(gradient({ ImageType: 'image/png' }))).toBe('PNG');
	expect(column.value(gradient({ ImageType: null }))).toBe('PNG');
});

it('el administrador ve Modificar y los demás perfiles ven Ver; la acción abre la fila', () => {
	const admin = setup('A');
	expect([admin.vm.gridActions[0].icon, admin.vm.gridActions[0].caption]).toEqual(['edit', 'Modificar']);
	const item = gradient();
	admin.vm.gridActions[0].onClick(null, item);
	expect(admin.editPopup.shown).toEqual([[item]]);
	const reader = setup('L').vm.gridActions;
	expect([reader[0].icon, reader[0].caption]).toEqual(['visibility', 'Ver']);
});

describe('Gradients: edición y eliminación');

it('createNewGradient abre la edición con una copia en blanco tomada de la fábrica', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Caption: '', ImageType: '' };
	preload(env.context.Factory, { Gradient: blank });
	vm.createNewGradient();
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

it('onRowClick abre la edición y popupSaved reemplaza o agrega', () => {
	const { vm, editPopup } = setup();
	const item = gradient();
	vm.onRowClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
	vm.list.push(gradient({ Id: 1, Caption: 'A' }));
	vm.popupSaved(gradient({ Id: 1, Caption: 'Nuevo' }));
	vm.popupSaved(gradient({ Id: 2 }));
	expect(vm.list.map(function (g) { return g.Caption; })).toEqual(['Nuevo', 'Densidad']);
});

it('el mensaje de confirmación nombra el gradiente', () => {
	expect(setup().vm.deleteConfirmMessage({ Caption: 'Densidad' }))
		.toBe("Esta acción no puede deshacerse: se eliminará el gradiente 'Densidad'.");
});

it('onItemDelete elimina en el servidor y quita el gradiente de la lista', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/packs/DeleteGradient': {} });
	const a = gradient({ Id: 1 });
	const b = gradient({ Id: 2 });
	vm.list.push(a, b);
	vm.onItemDelete(a);
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ g: '1' });
	expect(vm.list).toEqual([b]);
});

// ---------------------------------------------------------------------

function setupPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const stepper = makeStepper();
	const geoPackage = makeGeoPackage({ fields: [], verifyMethod: undefined });
	const vm = mountLite(GradientPopup, { refs: { invoker, inputName, stepper, geoPackage } });
	return { env, vm, invoker, inputName, stepper, geoPackage };
}

describe('GradientPopup: permisos y datos');

it('solo el administrador general edita; los demás cierran con "Cerrar"', () => {
	expect(setupPopup('A').vm.cancelCaption).toBe('Cancelar');
	expect(setupPopup('E').vm.cancelCaption).toBe('Cerrar');
});

it('parte cerrado y sin resultado de importación', () => {
	const { vm } = setupPopup();
	expect(vm.activateEdit).toBe(false);
	expect(vm.gradient).toBeNull();
	expect(vm.importResult).toBeNull();
});

describe('GradientPopup.show');

it('trabaja sobre una copia y enfoca el nombre a los 100 ms', () => {
	const { env, vm, inputName } = setupPopup();
	const original = gradient();
	vm.show(original);
	expect(vm.gradient).toEqual(original);
	expect(vm.gradient === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

it('si el gradiente no trae tipo de imagen usa image/png; si lo trae lo conserva', () => {
	const { vm } = setupPopup();
	vm.show(gradient({ ImageType: '' }));
	expect(vm.gradient.ImageType).toBe('image/png');
	vm.show(gradient({ ImageType: 'image/jpeg' }));
	expect(vm.gradient.ImageType).toBe('image/jpeg');
});

it('isNew es verdadero solo cuando no tiene Id', () => {
	const { vm } = setupPopup();
	vm.show(gradient({ Id: null }));
	expect(vm.isNew).toBe(true);
	vm.show(gradient({ Id: 4 }));
	expect(vm.isNew).toBe(false);
});

it('verifyMethod analiza el archivo de gradiente en el servidor con el bucket indicado', async () => {
	const { vm } = setupPopup();
	serve({ 'GET /services/packs/VerifyGradientPackage': { MaxZoomLevel: 12 } });
	const data = await vm.verifyMethod('bk9');
	expect(data).toEqual({ MaxZoomLevel: 12 });
	expect(axios.calls[0].config.params).toEqual({ b: 'bk9' });
});

describe('GradientPopup.save');

it('con el nombre vacío o de espacios avisa y no guarda', () => {
	for (const caption of ['', '   ']) {
		const { env, vm } = setupPopup();
		vm.gradient = gradient({ Caption: caption });
		vm.save();
		expect(env.alerts).toEqual(["Debe indicar un valor para 'Nombre'."]);
		expect(axios.calls).toHaveLength(0);
	}
});

it('un gradiente existente se guarda, cierra la edición y avisa con la copia editada', async () => {
	const { vm, invoker } = setupPopup();
	serve({ 'POST /services/packs/UpdateGradient': {} });
	vm.activateEdit = true;
	vm.gradient = gradient({ Id: 4, Caption: 'Nuevo nombre' });
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ g: gradient({ Id: 4, Caption: 'Nuevo nombre' }) });
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [vm.gradient] }]);
});

describe('GradientPopup: alta desde un archivo');

it('si el archivo no está listo avisa y no inicia la importación', () => {
	const { env, vm, stepper } = setupPopup();
	vm.gradient = gradient({ Id: null });
	vm.save();
	expect(env.alerts).toEqual(['Debe completar el archivo GeoPackage antes de continuar.']);
	expect(stepper.startUrl).toBe('');
	expect(axios.calls).toHaveLength(0);
});

it('con el archivo listo inicia la importación con las URLs, el gradiente y el bucket', async () => {
	const { vm, stepper, geoPackage } = setupPopup();
	serve({ 'GET /services/packs/StartImportGradient': { done: true, stepperResult: { Id: 33 } } });
	geoPackage.hasFile = true;
	vm.gradient = gradient({ Id: null, Caption: 'Nuevo' });
	vm.save();
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartImportGradient');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepImportGradient');
	expect(stepper.args).toEqual({ g: JSON.stringify(vm.gradient), b: geoPackage.bucketId });
	await settle();
	expect(axios.calls[0].config.params).toEqual(stepper.args);
	expect(stepper.result).toEqual({ Id: 33 });
});

it('importCompleted guarda el resultado del proceso sin cerrar el popup', () => {
	const { vm, stepper } = setupPopup();
	vm.activateEdit = true;
	stepper.result = { Id: 33 };
	vm.importCompleted();
	expect(vm.importResult).toEqual({ Id: 33 });
	expect(vm.activateEdit).toBe(true);
});

it('al cerrar el diálogo del proceso con éxito se cierra el popup y se avisa con el resultado', () => {
	const { vm } = setupPopup();
	vm.activateEdit = true;
	vm.importResult = { Id: 33 };
	vm.stepperClosed(true);
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [{ Id: 33 }] }]);
});

it('al cerrar el diálogo del proceso sin éxito el popup sigue abierto', () => {
	const { vm } = setupPopup();
	vm.activateEdit = true;
	vm.stepperClosed(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.$emitted).toEqual([]);
});
