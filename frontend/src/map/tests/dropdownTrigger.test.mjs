import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import Drop from '@/map/components/controls/mpDropdownMenu.vue';

// El disparador se decora con clases globales (lightButton, close). Si
// triggerClass devolviera vacío el botón queda sin ninguna, y se ve como texto
// suelto: pasó al quedar el computed dentro de un segundo bloque `computed`
// que pisaba al primero.

function mount(props) {
	setupWindow();
	return mountLite(Drop, { props: props });
}

describe('mpDropdownMenu: clases del disparador');

it('sin texto conserva exactamente lo de siempre', () => {
	expect(mount({ icon: 'fas fa-ellipsis-v' }).triggerClass).toBe('lightButton close');
});

it('con label suma labelButton, sin perder las globales', () => {
	expect(mount({ icon: 'fas fa-caret-down', label: 'Radios' }).triggerClass)
		.toBe('lightButton close labelButton');
});

it('con slot trigger también suma labelButton', () => {
	const drop = mount({ icon: 'fas fa-caret-down' });
	drop.$slots.trigger = [{}];
	expect(drop.triggerClass).toBe('lightButton close labelButton');
});

it('styleRounded sigue teniendo prioridad', () => {
	expect(mount({ icon: 'x', styleRounded: true }).triggerClass).toBe('btn btn-default btn-xs');
});

it('nunca devuelve vacío', () => {
	expect(mount({}).triggerClass.length > 0).toBeTruthy();
});
