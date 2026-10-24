import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import MetadataView from '@/backoffice/views/Metadata/Metadata.vue';

function makeMetadata(overrides) {
	return Object.assign({
		properties: { Id: 8, Title: 'Escuelas' },
		Work: { properties: { Id: 3 }, CanEdit() { return true; }, ReadOnlyCausedByIndexing() { return false; } },
		saved: 0,
		UpdateMetadata() {},
	}, overrides);
}

function setup(currentWork, propsData) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.CurrentWork = currentWork || null;
	context.Configuration = { Help: { MetadataContentSection: 'ayuda-contenido' } };
	// bajo el navegador window.Context es accesible como el identificador global Context
	globalThis.Context = context;
	const refs = { invoker: { saved: [], doSave(...args) { this.saved.push(args); } }, tabs: { activeTab: null } };
	const vm = mountLite(MetadataView, { propsData: propsData, mocks: { $refs: refs, $route: { path: '/cartographies/3/metadata/institutions' } } });
	return { vm: vm, context: context, refs: refs, browser: browser };
}

describe('Metadata: origen de los datos');

it('created con un trabajo actual toma sus metadatos y su permiso de edición', () => {
	const metadata = makeMetadata();
	const work = { Metadata: metadata };
	metadata.Work.CanEdit = function () { return false; };
	const { vm } = setup(work, {});
	MetadataView.created.call(vm);
	expect(vm.Metadata === metadata).toBeTruthy();
	expect(vm.canEdit).toBe(false);
});

it('created sin trabajo actual toma los metadatos y el permiso recibidos como propiedades', () => {
	const metadata = makeMetadata();
	const { vm } = setup(null, { metadataProperty: metadata, canEditProperty: true });
	MetadataView.created.call(vm);
	expect(vm.Metadata === metadata).toBeTruthy();
	expect(vm.canEdit).toBe(true);
});

it('start fija los metadatos y el permiso de edición', () => {
	const { vm } = setup();
	const metadata = makeMetadata();
	vm.start(metadata, true);
	expect(vm.Metadata === metadata).toBeTruthy();
	expect(vm.canEdit).toBe(true);
});

describe('Metadata: propiedades calculadas');

it('hasCurrentWork y resolveTitle distinguen la edición dentro de una cartografía de la administración', () => {
	const withWork = setup({ Metadata: makeMetadata() });
	expect(withWork.vm.hasCurrentWork).toBe(true);
	expect(withWork.vm.resolveTitle).toBe('Metadatos');
	const withoutWork = setup(null);
	withoutWork.vm.Metadata = makeMetadata();
	expect(withoutWork.vm.hasCurrentWork).toBe(false);
	expect(withoutWork.vm.resolveTitle).toBe('Escuelas. Id: 8');
});

it('secondaryLabel agrega "secundarias" salvo que el resumen sea complejo', () => {
	const { vm } = setup();
	expect(vm.secondaryLabel()).toBe(' secundarias');
	vm.useComplexAbstract = true;
	expect(vm.secondaryLabel()).toBe('');
});

describe('Metadata: solapas y ayuda');

it('define las seis solapas de metadatos en orden', () => {
	const { vm } = setup();
	expect(vm.stepDefinitions.map(function (step) { return step.Id; })).toEqual(['content', 'attribution', 'institutions', 'abstract', 'sources', 'attachments']);
	expect(vm.currentTab).toBe('institutions');
});

it('la ayuda de fuentes nombra a las fuentes secundarias', () => {
	const { vm } = setup();
	const sources = vm.stepDefinitions.find(function (step) { return step.Id === 'sources'; });
	expect(sources.Helper.includes('La sección de fuentes secundarias permite ofrecer')).toBe(true);
	expect(sources.Helper.includes('undefined')).toBe(false);
});

it('extraHelp agrega el vínculo de ayuda de la sección si el contexto lo ofrece y cadena vacía si no', () => {
	const { vm, context } = setup();
	expect(vm.extraHelp('MetadataContentSection')).toBe('');
	context.HelpLinkSection = function (item) { return '[' + item + ']'; };
	expect(vm.extraHelp('MetadataContentSection')).toBe('[ayuda-contenido]');
});

it('setTab dentro de una cartografía no cambia de solapa, y fuera de ella la activa en el componente de solapas', () => {
	const inWork = setup({ Metadata: makeMetadata() });
	inWork.vm.setTab({ Id: 'sources' });
	expect(inWork.vm.currentTab).toBe('institutions');
	const outside = setup(null);
	outside.vm.setTab({ Id: 'sources' });
	expect(outside.vm.currentTab).toBe('sources');
	expect(outside.refs.tabs.activeTab).toBe('sources');
});

describe('Metadata: rutas');

it('makePath arma la ruta de la solapa dentro de la cartografía, o vacío sin trabajo', () => {
	const { vm } = setup();
	vm.Metadata = makeMetadata();
	expect(vm.makePath('content')).toBe('/cartographies/3/metadata/content');
	expect(vm.makePath('')).toBe('/cartographies/3/metadata');
	vm.Metadata = null;
	expect(vm.makePath('content')).toBe('');
});

it('isPath compara con la ruta actual y activa la solapa que corresponde a su final', () => {
	const { vm, refs } = setup();
	expect(vm.isPath('/cartographies/3/metadata/institutions')).toBe(true);
	expect(vm.isPath('/cartographies/3/metadata/content')).toBe(false);
	expect(refs.tabs.activeTab).toBe('institutions');
});

it('readOnlyCausedByIndexing consulta al trabajo de los metadatos y es falso sin él', () => {
	const { vm } = setup();
	expect(vm.readOnlyCausedByIndexing()).toBe(false);
	vm.Metadata = makeMetadata();
	vm.Metadata.Work.ReadOnlyCausedByIndexing = function () { return true; };
	expect(vm.readOnlyCausedByIndexing()).toBe(true);
});

it('Update graba los metadatos', () => {
	const { vm, refs } = setup();
	vm.Metadata = makeMetadata();
	vm.Update();
	expect(refs.invoker.saved[0][0] === vm.Metadata).toBeTruthy();
	expect(refs.invoker.saved[0][1] === vm.Metadata.UpdateMetadata).toBeTruthy();
});
