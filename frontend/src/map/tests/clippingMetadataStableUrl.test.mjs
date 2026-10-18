import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import ClippingMetadata from '@/map/components/popups/clippingMetadata';

describe('clippingMetadata: ruta estable y Ark de una delimitación, construidos dinámicamente a partir de su id');

function mountPopup(shortUrlPattern) {
	const segMap = setupWindow({});
	segMap.Configuration.ShortUrlPattern = shortUrlPattern;
	return mountLite(ClippingMetadata, {});
}

it('resolvePublicUrl arma la ruta con el ShortUrlPattern configurado', () => {
	const popup = mountPopup('https://short.ly/{id}');
	popup.boundaryId = 45;
	expect(popup.resolvePublicUrl()).toBe('https://short.ly/b45');
});

it('resolvePublicUrl cae al path del visor cuando no hay ShortUrlPattern configurado', () => {
	const popup = mountPopup(null);
	popup.boundaryId = 45;
	expect(popup.resolvePublicUrl()).toBe('/map/b45');
});

it('show(metadata, title, boundaryId) guarda el id; sin id (metadata de un work), lo deja en null', () => {
	const popup = mountPopup(null);
	popup.$refs = { showFuente: { show() {} } };
	popup.show({ Name: 'X' }, 'Fuente', 45);
	expect(popup.boundaryId).toBe(45);
	popup.show({ Name: 'X' }, 'Fuente');
	expect(popup.boundaryId).toBeNull();
});

it('resolveMetadataUrl agrega el parámetro b=<boundaryId> solo cuando hay una delimitación', () => {
	const popup = mountPopup(null);
	popup.metadata = { Id: 7 };
	popup.boundaryId = 45;
	expect(popup.resolveMetadataUrl().indexOf('b=45') !== -1).toBeTruthy();
	popup.boundaryId = null;
	expect(popup.resolveMetadataUrl().indexOf('b=') === -1).toBeTruthy();
});
