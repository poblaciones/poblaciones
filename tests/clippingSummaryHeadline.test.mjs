import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import Clipping from '@/map/components/widgets/summary/clipping.vue';

// clipping.vue: la fila de Habitantes es el título del resumen solo cuando no hay región ni círculo seleccionados.

function mountWithFrame(frameClipping) {
	const segMap = setupWindow();
	segMap.Clipping.FrameHasNoClipping = function () {
		return frameClipping.ClippingCircle === null && frameClipping.ClippingRegionIds === null;
	};
	return mountLite(Clipping, { props: { clipping: { Region: { Summary: null } }, frame: {} } });
}

describe('clipping: hasNoSelection');

it('sin región ni círculo, Habitantes pasa a ser el título', () => {
	const panel = mountWithFrame({ ClippingCircle: null, ClippingRegionIds: null });
	expect(panel.hasNoSelection).toBeTruthy();
});

it('con una región seleccionada, Habitantes queda como fila', () => {
	const panel = mountWithFrame({ ClippingCircle: null, ClippingRegionIds: [10] });
	expect(panel.hasNoSelection).toBeFalsy();
});

it('con un círculo dibujado, Habitantes queda como fila', () => {
	const panel = mountWithFrame({ ClippingCircle: { Center: { Lat: 0, Lon: 0 }, Radius: 100 }, ClippingRegionIds: null });
	expect(panel.hasNoSelection).toBeFalsy();
});
