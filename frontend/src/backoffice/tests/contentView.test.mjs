import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import ContentView from '@/backoffice/views/Metadata/Content.vue';

function setup(withWork, workOverrides) {
	const browser = setupBackoffice('P');
	browser.window.location = { protocol: 'https:', hostname: 'poblaciones.org', port: '' };
	browser.window.Context.Configuration = { ShortUrlPattern: 'https://poblaciones.org/m/{id}' };
	browser.window.Db.renamed = [];
	browser.window.Db.RenameWork = function (id, title) { browser.window.Db.renamed.push([id, title]); };
	const metadata = {
		properties: { Id: 8, Title: 'Escuelas', Url: '/map/abc', Abstract: 'texto' },
		Work: null,
		UpdateMetadata() {},
	};
	if (withWork) {
		metadata.Work = Object.assign({ properties: { Id: 3, AccessLink: null }, ArkUrl: null }, workOverrides);
	}
	const refs = { invoker: { saved: [], background: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); }, doBackground(...args) { this.background.push(args); } } };
	const vm = mountLite(ContentView, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs, browser: browser };
}

describe('Content: propiedades calculadas');

it('metadata expone las propiedades de los metadatos', () => {
	const { vm, metadata } = setup(false);
	expect(vm.metadata === metadata.properties).toBeTruthy();
});

it('accessLink es el enlace de acceso del trabajo, o null sin trabajo o sin enlace', () => {
	expect(setup(false).vm.accessLink).toBeNull();
	expect(setup(true).vm.accessLink).toBeNull();
	expect(setup(true, { properties: { Id: 3, AccessLink: 'privado' } }).vm.accessLink).toBe('privado');
});

it('arkUrl exige trabajo, dirección pública y dirección ARK', () => {
	expect(setup(false).vm.arkUrl).toBeNull();
	expect(setup(true).vm.arkUrl).toBeNull();
	expect(setup(true, { ArkUrl: 'https://ark/x' }).vm.arkUrl).toBe('https://ark/x');
	const noUrl = setup(true, { ArkUrl: 'https://ark/x' });
	noUrl.metadata.properties.Url = null;
	expect(noUrl.vm.arkUrl).toBeNull();
});

describe('Content: direcciones');

it('resolvePublicUrl arma la dirección corta, o la privada si hay enlace de acceso', () => {
	const { vm } = setup(true);
	expect(vm.resolvePublicUrl()).toBe('https://poblaciones.org/m/abc');
	const withLink = setup(true, { properties: { Id: 3, AccessLink: 'privado' } });
	expect(withLink.vm.resolvePublicUrl()).toBe('https://poblaciones.org/map/abc/privado');
});

it('absoluteMap completa la dirección con el sitio', () => {
	const { vm } = setup(false);
	expect(vm.absoluteMap('/map/abc')).toBe('https://poblaciones.org/map/abc');
});

it('resolveMetadataUrl usa el servicio del trabajo o el de administración', () => {
	expect(setup(true).vm.resolveMetadataUrl()).toBe('https://api.example.org/services/backoffice/GetMetadataPdf?w=3');
	expect(setup(false).vm.resolveMetadataUrl()).toBe('https://api.example.org/services/admin/GetMetadataPdf?m=8');
});

it('appendAccessLink agrega el enlace de acceso del trabajo si lo hay, y no toca la dirección sin trabajo', () => {
	expect(setup(false).vm.appendAccessLink('/map/abc')).toBe('/map/abc');
	expect(setup(true).vm.appendAccessLink('/map/abc')).toBe('/map/abc');
	expect(setup(true, { properties: { Id: 3, AccessLink: 'privado' } }).vm.appendAccessLink('/map/abc')).toBe('/map/abc/privado');
});

it('formatDate usa el formato de fecha del backoffice', () => {
	const { vm } = setup(false);
	expect(vm.formatDate('2020-03-05T12:00:00')).toBe('05/03/2020');
	expect(vm.formatDate(null)).toBe('-');
});

describe('Content: edición');

it('cancelAbstract restaura el resumen anterior', () => {
	const { vm, metadata } = setup(false);
	metadata.properties.Abstract = 'cambiado';
	vm.cancelAbstract('texto original');
	expect(metadata.properties.Abstract).toBe('texto original');
});

it('Update graba en segundo plano y devuelve verdadero', () => {
	const { vm, refs, metadata } = setup(false);
	expect(vm.Update()).toBe(true);
	expect(refs.invoker.background[0][0] === metadata).toBeTruthy();
	expect(refs.invoker.background[0][1] === metadata.UpdateMetadata).toBeTruthy();
});

it('UpdateDropDown graba solo cuando el cambio lo hizo el usuario de forma interactiva', () => {
	const { vm, refs } = setup(false);
	vm.UpdateDropDown();
	expect(refs.invoker.background).toHaveLength(0);
	vm.interactiveSelect = true;
	vm.UpdateDropDown();
	expect(refs.invoker.background).toHaveLength(1);
});

it('UpdateTitle graba y, al terminar, renombra la cartografía en el listado', async () => {
	const { vm, refs, metadata, browser } = setup(true);
	expect(vm.UpdateTitle()).toBe(true);
	expect(refs.invoker.saved[0][0] === metadata).toBeTruthy();
	expect(refs.invoker.saved[0][1] === metadata.UpdateMetadata).toBeTruthy();
	await flushPromises();
	expect(browser.window.Db.renamed).toEqual([[3, 'Escuelas']]);
});
