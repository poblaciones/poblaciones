// Contratos compartidos por varios popups.
import { describe, it, expect } from './_harness.mjs';
import { setupGlobals, mountLite, callHook, triggerWatch } from './fixtures.mjs';

function setupEscape(component) {
	const env = setupGlobals({ privileges: 'A' });
	return { env, vm: mountLite(component) };
}

function escapeEvent(key) {
	const event = { key, prevented: 0, stopped: 0 };
	event.preventDefault = function () { event.prevented++; };
	event.stopPropagation = function () { event.stopped++; };
	return event;
}

// Contrato común de los popups que se abren sobre otro popup activo: mientras están abiertos interceptan
// ESC en fase de captura para cerrarse a sí mismos.
export function describeEscapeHandling(component, name, flag) {
	describe(name + ': tecla ESC');

	it('al abrirse escucha keydown en captura y al cerrarse deja de escucharlo', () => {
		const { env, vm } = setupEscape(component);
		triggerWatch(component, vm, flag, true);
		triggerWatch(component, vm, flag, false);
		expect(env.documentListeners).toEqual([
			{ action: 'add', name: 'keydown', fn: vm.handleEscCapture, capture: true },
			{ action: 'remove', name: 'keydown', fn: vm.handleEscCapture, capture: true },
		]);
	});

	it('al destruirse deja de escuchar keydown', () => {
		const { env, vm } = setupEscape(component);
		callHook(component, vm, 'beforeDestroy');
		expect(env.documentListeners).toEqual([
			{ action: 'remove', name: 'keydown', fn: vm.handleEscCapture, capture: true },
		]);
	});

	it('Escape cierra el popup y frena el evento para que no cierre el popup de abajo', () => {
		const { vm } = setupEscape(component);
		vm[flag] = true;
		const event = escapeEvent('Escape');
		vm.handleEscCapture(event);
		expect(vm[flag]).toBe(false);
		expect(event.prevented).toBe(1);
		expect(event.stopped).toBe(1);
	});

	it('cualquier otra tecla se ignora', () => {
		const { vm } = setupEscape(component);
		vm[flag] = true;
		const event = escapeEvent('Enter');
		vm.handleEscCapture(event);
		expect(vm[flag]).toBe(true);
		expect(event.prevented).toBe(0);
		expect(event.stopped).toBe(0);
	});
}

