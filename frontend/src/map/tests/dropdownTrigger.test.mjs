import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import Drop from '@/map/components/controls/mpDropdownMenu.vue';

// El disparador se decora con clases de la paleta (mp-btn, mp-icon-btn). Si
// triggerClass devolviera vacío el botón queda sin ninguna, y se ve como texto
// suelto: pasó al quedar el computed dentro de un segundo bloque `computed`
// que pisaba al primero.

function mount(props) {
	setupWindow();
	return mountLite(Drop, { props: props });
}

describe('mpDropdownMenu: clases del disparador');

it('sin texto usa el glifo suave de cabecera', () => {
	expect(mount({ icon: 'fas fa-ellipsis-v' }).triggerClass).toBe('mp-icon-btn mp-icon-btn--sm mp-icon-btn--ghost');
});

it('con label usa la variante con texto', () => {
	expect(mount({ icon: 'fas fa-caret-down', label: 'Radios' }).triggerClass)
		.toBe('mp-icon-btn mp-icon-btn--sm mp-icon-btn--label');
});

it('con slot trigger también usa la variante con texto', () => {
	const drop = mount({ icon: 'fas fa-caret-down' });
	drop.$slots.trigger = [{}];
	expect(drop.triggerClass).toBe('mp-icon-btn mp-icon-btn--sm mp-icon-btn--label');
});

it('variant float: botón de 40 px sobre el mapa', () => {
	expect(mount({ icon: 'x', variant: 'float' }).triggerClass).toBe('mp-btn mp-btn--float');
});

it('variant icon: botón circular de 32 px', () => {
	expect(mount({ icon: 'x', variant: 'icon' }).triggerClass).toBe('mp-icon-btn triggerSpaced');
});

it('variant pill: texto con fondo al pasar el mouse', () => {
	expect(mount({ icon: 'x', label: 'Total', variant: 'pill' }).triggerClass).toBe('mp-btn mp-btn--soft');
});

it('la variante tiene prioridad sobre el label', () => {
	expect(mount({ icon: 'x', label: 'Total', variant: 'float' }).triggerClass).toBe('mp-btn mp-btn--float');
});

it('nunca devuelve vacío', () => {
	expect(mount({}).triggerClass.length > 0).toBeTruthy();
});
