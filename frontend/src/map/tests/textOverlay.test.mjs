import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import TextOverlay from '@/map/overlays/TextOverlay';

function makeOverlay(type, clickId) {
	setupWindow();
	var overlay = new TextOverlay(null, null, { Lat: -32.9, Lon: -60.6 }, 'Rosario', 'label', 1, null, type, false);
	overlay.clickId = clickId;
	return overlay;
}

describe('TextOverlay.resolveOnClick: el onclick de una etiqueta del mapa');

it('no llama a stopPropagation, para que el clic llegue a document (v-on-clickaway)', () => {
	var overlay = makeOverlay('F', 42);
	expect(overlay.resolveOnClick().indexOf('stopPropagation')).toBe(-1);
});

it('despacha SelectId con el type, el id, la coordenada y ctrlKey', () => {
	var overlay = makeOverlay('B', 7);
	var onClick = overlay.resolveOnClick();
	expect(onClick).toBe("onClick=\"event.isSelf = true; window.SegMap.SelectId('B', '7', -32.9, -60.6, event.ctrlKey);\"");
});

it('con un array de un solo id, lo desarma y usa ese id directamente', () => {
	var overlay = makeOverlay('C', [5]);
	var onClick = overlay.resolveOnClick();
	expect(onClick.indexOf("'5'") !== -1).toBeTruthy();
});
