import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import Invoker from '@/backoffice/components/Invoker.vue';

function mountInvoker() {
	const browser = setupBackoffice();
	const dialog = { shown: 0, show() { this.shown++; } };
	const vm = mountLite(Invoker, { mocks: { $refs: { confirmDialog: dialog } } });
	return { vm: vm, dialog: dialog, browser: browser };
}

// Método que registra el contexto y los argumentos con que se lo llamó y devuelve una promesa a mano.
function makeRecordingMethod() {
	const record = { context: null, args: null };
	record.method = function (...args) {
		record.context = this;
		record.args = args;
		record.promise = new Promise(function (resolve, reject) {
			record.resolve = resolve;
			record.reject = reject;
		});
		return record.promise;
	};
	return record;
}

describe('Invoker: estado inicial');

it('arranca sin diálogos y con el mensaje de espera por defecto', () => {
	const { vm } = mountInvoker();
	expect(vm.showDialog).toBeFalsy();
	expect(vm.message).toBe('Aguarde por favor...');
	expect(vm.confirmCallback).toBeNull();
});

it('ErrorSignaled refleja el contador de errores del contexto y, al cambiar, oculta el diálogo', () => {
	const { vm, browser } = mountInvoker();
	browser.window.Context.ErrorSignaled.value = 3;
	expect(vm.ErrorSignaled).toBe(3);
	vm.showDialog = true;
	Invoker.watch.ErrorSignaled.call(vm, 4);
	expect(vm.showDialog).toBeFalsy();
});

describe('Invoker: confirmación');

it('confirm muestra el diálogo con el título y la pregunta, agregando el punto final si falta', () => {
	const { vm, dialog } = mountInvoker();
	vm.confirm('Eliminar', 'Se perderán los datos', function () {});
	expect(vm.confirmTitle).toBe('Eliminar');
	expect(vm.confirmQuestion).toBe('Se perderán los datos.');
	expect(dialog.shown).toBe(1);
});

it('confirm no duplica el punto final si la pregunta ya lo tiene', () => {
	const { vm } = mountInvoker();
	vm.confirm('Eliminar', 'Se perderán los datos.', function () {});
	expect(vm.confirmQuestion).toBe('Se perderán los datos.');
});

it('confirmed ejecuta la acción confirmada una sola vez', () => {
	const { vm } = mountInvoker();
	let executed = 0;
	vm.confirm('T', 'm', function () { executed++; });
	vm.confirmed();
	vm.confirmed();
	expect(executed).toBe(1);
	expect(vm.confirmCallback).toBeNull();
});

it('confirmed sin acción pendiente no hace nada', () => {
	const { vm } = mountInvoker();
	vm.confirmed();
});

it('confirmDo ejecuta el método con su contexto y argumentos solo al confirmar', () => {
	const { vm, dialog } = mountInvoker();
	const record = makeRecordingMethod();
	const context = { nombre: 'ctx' };
	vm.confirmDo('Borrar', 'Seguro', context, record.method, 7, 'x');
	expect(dialog.shown).toBe(1);
	expect(record.args).toBeNull();
	vm.confirmed();
	expect(record.context === context).toBeTruthy();
	expect(record.args).toEqual([7, 'x']);
	expect(vm.showDialog).toBeTruthy();
});

describe('Invoker: ejecución de métodos');

it('do ejecuta el método con su contexto, muestra el diálogo y lo oculta al resolver, devolviendo el resultado', async () => {
	const { vm } = mountInvoker();
	const record = makeRecordingMethod();
	const context = {};
	const promise = vm.do(context, record.method, 1, 2);
	expect(vm.showDialog).toBeTruthy();
	expect(record.context === context).toBeTruthy();
	expect(record.args).toEqual([1, 2]);
	record.resolve('listo');
	expect(await promise).toBe('listo');
	expect(vm.showDialog).toBeFalsy();
});

it('doBackground ejecuta sin mostrar el diálogo', async () => {
	const { vm } = mountInvoker();
	const record = makeRecordingMethod();
	const promise = vm.doBackground({}, record.method, 'a');
	expect(vm.showDialog).toBeFalsy();
	expect(record.args).toEqual(['a']);
	record.resolve(1);
	await promise;
});

it('doSave muestra el mensaje Guardando...', async () => {
	const { vm } = mountInvoker();
	const record = makeRecordingMethod();
	const promise = vm.doSave({}, record.method, 'a');
	expect(vm.message).toBe('Guardando...');
	expect(vm.showDialog).toBeTruthy();
	record.resolve(1);
	await promise;
});

it('doMessage usa el mensaje indicado, agregando los puntos suspensivos si faltan', async () => {
	const { vm } = mountInvoker();
	const record = makeRecordingMethod();
	const first = vm.doMessage('Archivando cartografía', {}, record.method, 5);
	expect(vm.message).toBe('Archivando cartografía...');
	expect(record.args).toEqual([5]);
	record.resolve(1);
	await first;
	const second = vm.doMessage('Cargando...', {}, record.method);
	expect(vm.message).toBe('Cargando...');
	record.resolve(1);
	await second;
});

it('si el método no devuelve una promesa lanza un error que lo explica', () => {
	const { vm } = mountInvoker();
	const expected = "La llamada no devolvió un objeto 'promise'.";
	for (const returned of [null, undefined, {}]) {
		let message = null;
		try {
			vm.do({}, function () { return returned; });
		} catch (e) {
			message = e.message;
		}
		expect(message.startsWith(expected)).toBeTruthy();
	}
});

it('si la promesa falla propaga el error y deja el diálogo para que lo cierre la señal de error (comportamiento actual)', async () => {
	const { vm } = mountInvoker();
	const record = makeRecordingMethod();
	const promise = vm.do({}, record.method);
	record.reject(new Error('boom'));
	let caught = null;
	try {
		await promise;
	} catch (e) {
		caught = e;
	}
	expect(caught.message).toBe('boom');
	expect(vm.showDialog).toBeTruthy();
});

describe('Invoker: call');

it('call con argumento lo pasa junto con un callback que oculta el diálogo', () => {
	const { vm } = mountInvoker();
	let received = null;
	vm.call(function (args, done) { received = [args, done]; }, 'datos');
	expect(vm.showDialog).toBeTruthy();
	expect(received[0]).toBe('datos');
	received[1]();
	expect(vm.showDialog).toBeFalsy();
});

it('call sin argumento pasa solo el callback', () => {
	const { vm } = mountInvoker();
	let received = null;
	vm.call(function (done) { received = done; });
	received();
	expect(vm.showDialog).toBeFalsy();
	flushPromises();
});
