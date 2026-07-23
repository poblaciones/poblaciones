import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import SideButtons from '@/map/components/widgets/sideToolbar/sideButtons.vue';

function mount(sidebarPosition) {
	setupWindow();
	return mountLite(SideButtons, { props: { activePanel: null, sidebarPosition: sidebarPosition || 'middle' } });
}

describe('sideButtons: arrastre (mousedown -> mousemove -> mouseup)');

it('startDrag activa el modo arrastre, con hoverZone en la posición actual', () => {
	const panel = mount('middle');
	panel.startDrag({ preventDefault() {} });
	expect(panel.dragging).toBeTruthy();
	expect(panel.hoverZone).toBe('middle');
});

it('onDragMove ubica la zona según el tercio de pantalla (innerHeight=800)', () => {
	const panel = mount('middle');
	panel.startDrag({ preventDefault() {} });
	panel.onDragMove({ clientY: 50 }); // < 800/3 ≈ 266
	expect(panel.hoverZone).toBe('top');
	panel.onDragMove({ clientY: 400 }); // entre 266 y 533
	expect(panel.hoverZone).toBe('middle');
	panel.onDragMove({ clientY: 700 }); // > 533
	expect(panel.hoverZone).toBe('bottom');
});

it('onDragEnd emite update:sidebarPosition solo si la zona cambió', () => {
	const panel = mount('middle');
	panel.startDrag({ preventDefault() {} });
	panel.onDragMove({ clientY: 700 }); // bottom
	panel.onDragEnd();
	expect(panel.dragging).toBeFalsy();
	expect(panel.$emitted).toHaveLength(1);
	expect(panel.$emitted[0].event).toBe('update:sidebarPosition');
	expect(panel.$emitted[0].args[0]).toBe('bottom');
});

it('si se suelta en la misma zona, no emite nada', () => {
	const panel = mount('middle');
	panel.startDrag({ preventDefault() {} });
	panel.onDragMove({ clientY: 400 }); // sigue siendo middle
	panel.onDragEnd();
	expect(panel.$emitted).toHaveLength(0);
});

it('onDragMove con evento touch usa touches[0].clientY', () => {
	const panel = mount('middle');
	panel.startDrag({ preventDefault() {} });
	panel.onDragMove({ preventDefault() {}, touches: [{ clientY: 50 }] });
	expect(panel.hoverZone).toBe('top');
});

describe('sideButtons: reordenamiento del botón de indicadores (solo abajo a la izquierda)');

it('togglePanel sigue funcionando igual, sin relación con la posición', () => {
	const panel = mount('bottom');
	panel.togglePanel('indicators');
	expect(panel.$emitted[0]).toEqual({ event: 'panel-toggle', args: ['indicators'] });
	panel.$emitted.length = 0;
});
