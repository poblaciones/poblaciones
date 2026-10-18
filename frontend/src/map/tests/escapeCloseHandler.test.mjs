import { describe, it, expect } from './_harness.mjs';
import EscapeCloseHandler from '@/map/classes/EscapeCloseHandler';

// Stub de window que captura el listener de 'keydown' y de 'popstate'
// registrados, y cuenta pushState/back, para poder disparar todo a mano
// (sin simular eventos reales del navegador, como en el resto de la
// batería).
function stubWindow() {
	let keydownHandler = null;
	let popstateHandler = null;
	let pushCount = 0;
	let backCount = 0;
	globalThis.window = {
		addEventListener(type, fn) {
			if (type === 'keydown') {
				keydownHandler = fn;
			} else if (type === 'popstate') {
				popstateHandler = fn;
			}
		},
		removeEventListener(type, fn) {
			if (type === 'keydown' && fn === keydownHandler) {
				keydownHandler = null;
			} else if (type === 'popstate' && fn === popstateHandler) {
				popstateHandler = null;
			}
		},
		history: {
			pushState() { pushCount++; },
			back() {
				backCount++;
				// El navegador real dispara popstate de forma asíncrona; acá
				// alcanza con que el test lo dispare explícitamente cuando lo
				// necesite (ver 'back() dispara luego el popstate real').
			},
		},
	};
	return {
		fireKey(key) { keydownHandler({ key }); },
		firePopState() { popstateHandler(); },
		isListeningKeydown() { return keydownHandler !== null; },
		isListeningPopState() { return popstateHandler !== null; },
		get pushCount() { return pushCount; },
		get backCount() { return backCount; },
	};
}

describe('EscapeCloseHandler: comportamiento por defecto (sin historial)');

it('Open registra el listener de ESC pero no toca el historial', () => {
	const w = stubWindow();
	new EscapeCloseHandler(() => {}).Open();
	expect(w.isListeningKeydown()).toBeTruthy();
	expect(w.isListeningPopState()).toBeFalsy();
	expect(w.pushCount).toBe(0);
});

it('dispara closeFn con Escape, y no con otras teclas', () => {
	const w = stubWindow();
	let calls = 0;
	const handler = new EscapeCloseHandler(() => { calls++; });
	handler.Open();
	w.fireKey('Enter');
	expect(calls).toBe(0);
	w.fireKey('Escape');
	expect(calls).toBe(1);
});

it('Open es idempotente: llamarlo dos veces no duplica el listener', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => {});
	handler.Open();
	handler.Open();
	expect(w.isListeningKeydown()).toBeTruthy();
});

it('Close quita el listener de ESC sin llamar a history.back()', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => {});
	handler.Open();
	handler.Close();
	expect(w.isListeningKeydown()).toBeFalsy();
	expect(w.backCount).toBe(0);
});

it('Close es idempotente: llamarlo sin haber abierto no hace nada', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => {});
	handler.Close();
	expect(w.backCount).toBe(0);
});

describe('EscapeCloseHandler: con { useHistory: true }');

it('Open agrega también el listener de popstate y la entrada de historial', () => {
	const w = stubWindow();
	new EscapeCloseHandler(() => {}, { useHistory: true }).Open();
	expect(w.isListeningPopState()).toBeTruthy();
	expect(w.pushCount).toBe(1);
});

it('Open es idempotente: llamarlo dos veces no duplica el pushState', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => {}, { useHistory: true });
	handler.Open();
	handler.Open();
	expect(w.pushCount).toBe(1);
});

it('Close quita los listeners y consume la entrada de historial con back()', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => {}, { useHistory: true });
	handler.Open();
	handler.Close();
	expect(w.isListeningPopState()).toBeFalsy();
	expect(w.backCount).toBe(1);
});

it('un popstate dispara closeFn, y el Close() que sigue no vuelve a consumir historial', () => {
	const w = stubWindow();
	let calls = 0;
	const handler = new EscapeCloseHandler(() => {
		calls++;
		// Simula al componente cerrándose en respuesta (como haría el watcher
		// de Vue al ver la propiedad de apertura cambiar).
		handler.Close();
	}, { useHistory: true });
	handler.Open();
	w.firePopState();
	expect(calls).toBe(1);
	// El pushState original ya fue consumido por el propio botón atrás del
	// navegador: este handler no debe pedir un back() adicional.
	expect(w.backCount).toBe(0);
});

it('cerrar por otra vía (no popstate) sí consume la entrada con back()', () => {
	const w = stubWindow();
	const handler = new EscapeCloseHandler(() => { handler.Close(); }, { useHistory: true });
	handler.Open();
	w.fireKey('Escape');
	expect(w.backCount).toBe(1);
});
