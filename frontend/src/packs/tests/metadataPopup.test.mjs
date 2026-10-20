import { describe, it, expect } from './_harness.mjs';
import MetadataPopup from '@/packs/views/Metadata/MetadataPopup.vue';
import { setupGlobals, mountLite } from './fixtures.mjs';

function setup(privileges) {
	setupGlobals({ privileges: privileges || 'A' });
	return mountLite(MetadataPopup);
}

describe('MetadataPopup: datos y permisos');

it('parte cerrado y sin metadatos', () => {
	const vm = setup();
	expect(vm.activateEdit).toBe(false);
	expect(vm.metadata).toBeNull();
	expect(vm.useInSearch).toBe(0);
	expect(vm.clippingRegion).toBeNull();
});

it('solo el administrador general puede editar', () => {
	expect(setup('A').canEdit).toBe(true);
	expect(setup('E').canEdit).toBe(false);
});

describe('MetadataPopup.show');

it('toma los metadatos recibidos (sin copiarlos) y se abre', () => {
	const vm = setup();
	const metadata = { properties: { Id: 5 } };
	vm.show(metadata);
	expect(vm.metadata).toBe(metadata);
	expect(vm.activateEdit).toBe(true);
});
