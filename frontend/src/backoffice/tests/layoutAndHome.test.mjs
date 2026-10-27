import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import Topbar from '@/backoffice/views/Layout/Topbar.vue';
import Home from '@/backoffice/views/Home.vue';
import TopbarWorkActions from '@/backoffice/components/TopbarWorkActions.vue';
import NoticeChangesV5 from '@/backoffice/views/Layout/NoticeChangesV5.vue';
import MpLargeDataItem from '@/backoffice/components/MpLargeDataItem.vue';
import BackofficeLinks from '@/backoffice/components/BackofficeLinks.vue';
import ErrorsPopup from '@/backoffice/views/Dataset/Georeference/ErrorsPopup.vue';
import LatLongSelection from '@/backoffice/views/Dataset/Georeference/LatLongSelection.vue';
import Attribution from '@/backoffice/views/Metadata/Attribution.vue';
import Abstract from '@/backoffice/views/Metadata/Abstract.vue';
import ContactForm from '@/backoffice/views/Metadata/ContactForm.vue';
import HitsTable from '@/backoffice/views/Statistics/HitsTable.vue';
import date from '@/common/framework/date';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setupTopbar(type) {
	const browser = setupBackoffice('P');
	const metadata = { UpdateMetadata() {} };
	const work = {
		properties: { Id: 3, Type: type, Metadata: { Title: 'Escuelas' } },
		Metadata: metadata,
		GetStartWorkTestUrl() { return 'test-start'; },
		GetStepWorkTestUrl() { return 'test-step'; },
	};
	browser.window.Context.CurrentWork = work;
	browser.window.Db.renamed = [];
	browser.window.Db.RenameWork = function (id, title) { browser.window.Db.renamed.push([id, title]); };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } },
		TestStepper: { started: 0, Start() { this.started++; } },
	};
	const vm = mountLite(Topbar, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs, browser: browser, metadata: metadata };
}

describe('Topbar: barra superior de la cartografía');

it('getBackRoute vuelve a la lista de datos públicos o de cartografías según el tipo, y falla con otro', () => {
	expect(setupTopbar('P').vm.getBackRoute).toBe('/public');
	expect(setupTopbar('R').vm.getBackRoute).toBe('/');
	let message = null;
	try {
		setupTopbar('X').vm.getBackRoute;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Tipo de obra no reconocida para getBackRoute.');
});

it('handleResize ajusta el ancho de la barra al de su contenedor', () => {
	const { vm } = setupTopbar('R');
	const bar = { style: {} };
	globalThis.document.getElementById = function (id) {
		if (id === 'topBarContainer') {
			return { offsetWidth: 840 };
		}
		return bar;
	};
	vm.handleResize();
	expect(bar.style.width).toBe('840px');
});

it('al montar y al destruir enlaza y desenlaza el ajuste de tamaño', () => {
	const { vm, browser } = setupTopbar('R');
	const events = [];
	browser.window.addEventListener = function (name) { events.push('+' + name); };
	browser.window.removeEventListener = function (name) { events.push('-' + name); };
	globalThis.document.getElementById = function () { return { offsetWidth: 100, style: {} }; };
	Topbar.mounted.call(vm);
	Topbar.beforeDestroy.call(vm);
	expect(events).toEqual(['+resize', '-resize']);
});

it('UpdateTitle graba los metadatos y renombra la cartografía en el listado', async () => {
	const { vm, refs, metadata, browser } = setupTopbar('R');
	expect(vm.UpdateTitle()).toBe(true);
	expect(refs.invoker.saved[0][0] === metadata).toBeTruthy();
	expect(refs.invoker.saved[0][1] === metadata.UpdateMetadata).toBeTruthy();
	await flushPromises();
	expect(browser.window.Db.renamed).toEqual([[3, 'Escuelas']]);
});

it('beginTest configura y abre el avance de la prueba', () => {
	const { vm, refs } = setupTopbar('R');
	vm.beginTest();
	expect(refs.TestStepper.startUrl).toBe('test-start');
	expect(refs.TestStepper.stepUrl).toBe('test-step');
	expect(refs.TestStepper.started).toBe(1);
});

function setupHome(path, privileges, cartographies) {
	const browser = setupBackoffice(privileges);
	const context = browser.window.Context;
	context.Cartographies = cartographies;
	context.CurrentWork = { Id: 1 };
	context.CurrentDataset = { Id: 2 };
	context.CanViewPublicData = function () { return true; };
	context.Configuration = { Help: { Inicio: 'ayuda' } };
	context.HelpLinkSection = function (item) { return '[' + item + ']'; };
	const vm = mountLite(Home, { mocks: { $route: { path: path } } });
	return { vm: vm, context: context };
}

describe('Home: listado de cartografías');

it('al montar titula la página y deja sin cartografía ni dataset actuales', () => {
	const { vm, context } = setupHome('/', 'P', []);
	Home.mounted.call(vm);
	expect(globalThis.document.title).toBe('Poblaciones');
	expect(context.CurrentWork).toBeNull();
	expect(context.CurrentDataset).toBeNull();
});

it('filter es P en la ruta de datos públicos y R en el resto', () => {
	expect(setupHome('/public', 'P', []).vm.filter).toBe('P');
	expect(setupHome('/', 'P', []).vm.filter).toBe('R');
});

it('isPath compara con la ruta actual y extraHelp devuelve el vínculo de ayuda', () => {
	const { vm } = setupHome('/public', 'P', []);
	expect(vm.isPath('/public')).toBe(true);
	expect(vm.isPath('/')).toBe(false);
	expect(vm.extraHelp('Inicio')).toBe('[ayuda]');
});

it('isAdmin, showTabs y showPublic dependen del usuario y de las cartografías cargadas', () => {
	expect(setupHome('/', 'A', []).vm.isAdmin).toBe(true);
	expect(setupHome('/', 'P', []).vm.isAdmin).toBe(false);
	expect(setupHome('/', 'P', []).vm.showTabs).toBeTruthy();
	expect(setupHome('/', 'P', null).vm.showTabs).toBeFalsy();
	expect(setupHome('/', 'P', []).vm.showPublic).toBe(true);
	expect(setupHome('/', 'P', null).vm.showPublic).toBeFalsy();
});

describe('TopbarWorkActions: acciones');

it('abre los diálogos de personalización, estadísticas y compartir', () => {
	const browser = setupBackoffice('P');
	const shown = [];
	const refs = {
		customizePopup: { show() { shown.push('customize'); } },
		statisticsPopup: { show() { shown.push('stats'); } },
		sharePopup: { show() { shown.push('share'); } },
	};
	const pushed = [];
	browser.window.Context.CurrentWork = { properties: { Id: 3 } };
	const vm = mountLite(TopbarWorkActions, { mocks: { $refs: refs, $router: { push(route) { pushed.push(route); } } } });
	vm.openCustomize();
	vm.openStats();
	vm.openShare();
	vm.openMetadata();
	expect(shown).toEqual(['customize', 'stats', 'share']);
	expect(pushed).toEqual([{ path: '/cartographies/3/metadata' }]);
});

describe('NoticeChangesV5: aviso de cambios');

it('define cinco pasos con imagen, alineación y contenido', () => {
	setupBackoffice('P');
	const vm = mountLite(NoticeChangesV5, {});
	expect(vm.steps).toHaveLength(5);
	expect(vm.steps.map(function (step) { return step.Id; })).toEqual([1, 2, 3, 4, 5]);
	expect(vm.steps.map(function (step) { return step.Alignment; })).toEqual(['L', 'R', 'L', 'R', 'L']);
	expect(vm.steps[0].previewImage).toBe('/static/img/notice-changes-v5/step1-changes.png');
});

it('al montar le pide al asistente que decida si se abre', () => {
	setupBackoffice('P');
	let checked = 0;
	const vm = mountLite(NoticeChangesV5, { mocks: { $refs: { wizard: { checkOpen() { checked++; } } } } });
	NoticeChangesV5.mounted.call(vm);
	expect(checked).toBe(1);
});

it('isJustCreatedWork compara la cartografía actual con la recién creada guardada en la sesión', () => {
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = { properties: { Id: 3 } };
	const stored = { value: null };
	browser.window.sessionStorage = { getItem() { return stored.value; } };
	const vm = mountLite(NoticeChangesV5, {});
	expect(vm.isJustCreatedWork()).toBe(false);
	stored.value = '3';
	expect(vm.isJustCreatedWork()).toBe(true);
	stored.value = '4';
	expect(vm.isJustCreatedWork()).toBe(false);
});

describe('MpLargeDataItem: tarjeta de cartografía');

function setupLargeItem(itemOverrides) {
	const browser = setupBackoffice('P');
	browser.window.Db.previewRequests = [];
	browser.window.Db.GetWorkPreview = function (id) { browser.window.Db.previewRequests.push(id); return Promise.resolve({ DataUrl: 'data:image/png;base64,zz' }); };
	const item = Object.assign({ Id: 7, Caption: 'Escuelas', AccessLink: null, MetadataLastOnline: null, PreviewId: null }, itemOverrides);
	const vm = mountLite(MpLargeDataItem, { propsData: { item: item } });
	return { vm: vm, item: item, browser: browser };
}

it('frameUrl arma la dirección del mapa embebido, con el enlace de acceso si lo hay', () => {
	expect(setupLargeItem({}).vm.frameUrl).toBe('/map/701/?emb=1&pv=1#/');
	expect(setupLargeItem({ AccessLink: 'privado' }).vm.frameUrl).toBe('/map/701/privado?emb=1&pv=1#/');
});

it('isPublished, icon, text e identificadores derivan del ítem', () => {
	const draft = setupLargeItem({}).vm;
	expect(draft.isPublished).toBe(false);
	expect(draft.icon).toBe('edit');
	expect(draft.text).toBe('Escuelas');
	const published = setupLargeItem({ MetadataLastOnline: '2024-01-01' }).vm;
	expect(published.isPublished).toBe(true);
	expect(published.icon).toBe('public');
	expect(draft.idContainer.endsWith('_container')).toBe(true);
	expect(draft.frameId.endsWith('_frame')).toBe(true);
});

it('onClick informa el ítem seleccionado', () => {
	const { vm, item } = setupLargeItem({});
	vm.onClick({});
	expect(vm.$emitted[0][0]).toBe('click');
	expect(vm.$emitted[0][1] === item).toBeTruthy();
});

it('al montar no pide la vista previa si no tiene, y usa la guardada en el ítem si ya la tiene', () => {
	const none = setupLargeItem({ PreviewId: null });
	MpLargeDataItem.mounted.call(none.vm);
	expect(none.browser.window.Db.previewRequests).toEqual([]);
	const cached = setupLargeItem({ PreviewId: 9, previewData: 'ya cargada' });
	MpLargeDataItem.mounted.call(cached.vm);
	expect(cached.vm.previewData).toBe('ya cargada');
	expect(cached.browser.window.Db.previewRequests).toEqual([]);
});

it('al montar con vista previa pendiente la pide, la muestra y la guarda en el ítem', async () => {
	const { vm, item, browser } = setupLargeItem({ PreviewId: 9 });
	MpLargeDataItem.mounted.call(vm);
	expect(browser.window.Db.previewRequests).toEqual([7]);
	await flushPromises();
	expect(vm.previewData).toBe('data:image/png;base64,zz');
	expect(item.previewData).toBe('data:image/png;base64,zz');
});

it('checkLoaded marca la falla si el mapa embebido muestra la página de atención', () => {
	const { vm } = setupLargeItem({});
	const frame = { contentDocument: { title: 'Poblaciones - Atención' } };
	globalThis.document.getElementById = function () { return frame; };
	vm.checkLoaded();
	expect(vm.failedLoading).toBe(true);
	vm.failedLoading = false;
	frame.contentDocument.title = 'Poblaciones';
	vm.checkLoaded();
	expect(vm.failedLoading).toBe(false);
	globalThis.document.getElementById = function () { return null; };
	vm.checkLoaded();
});

describe('BackofficeLinks: accesos a la publicación');

it('abre el mapa y la tabla en la ventana de vista previa, y publica', () => {
	const browser = setupBackoffice('P');
	const opened = [];
	browser.window.open = function (url, target) { opened.push([url, target]); };
	let published = 0;
	browser.window.openPublish = function () { published++; };
	browser.window.Context.Keys = { k: 1 };
	browser.window.Context.Configuration = { UsePivot: true };
	browser.window.Context.CurrentWork = {
		properties: { Metadata: { LastOnline: null } },
		PublicUrl() { return '/map/abc'; },
		PublicTableUrl() { return '/table/abc'; },
		PreviewTableTarget() { return '_tablePbl3'; },
	};
	const vm = mountLite(BackofficeLinks, {});
	vm.goMap();
	vm.goTable();
	vm.onPublish();
	expect(opened).toEqual([['/map/abc', '_tablePbl3'], ['/table/abc', '_tablePbl3']]);
	expect(published).toBe(1);
	expect(vm.lastOnline).toBe(false);
	expect(vm.usePivot).toBe(true);
	expect(vm.Keys).toEqual({ k: 1 });
});

describe('Pantallas simples de metadatos y georreferenciación');

it('Attribution, Abstract y ContactForm exponen los datos de los metadatos y los graban', () => {
	setupBackoffice('P');
	const metadata = { properties: { Id: 1, Contact: 'contacto@x.org' }, Work: { properties: { Type: 'P' } }, UpdateMetadata() {} };
	const invoker = { background: [], saved: [], doBackground(...args) { this.background.push(args); }, doSave(...args) { this.saved.push(args); } };
	const attribution = mountLite(Attribution, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: { invoker: invoker } } });
	expect(attribution.metadata === metadata.properties).toBeTruthy();
	expect(attribution.Update()).toBe(true);
	const abstract = mountLite(Abstract, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: { invoker: invoker } } });
	expect(abstract.useComplexAbstract).toBe(true);
	expect(abstract.Update()).toBe(true);
	expect(invoker.background).toHaveLength(2);
	const contact = mountLite(ContactForm, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: { invoker: invoker } } });
	expect(contact.contact).toBe('contacto@x.org');
	expect(contact.Update()).toBe(true);
	expect(invoker.saved[0][1] === metadata.UpdateMetadata).toBeTruthy();
});

it('el resumen complejo es solo de los datos públicos y no aplica sin trabajo', () => {
	setupBackoffice('P');
	const regular = mountLite(Abstract, { propsData: { Metadata: { properties: {}, Work: { properties: { Type: 'R' } } } } });
	expect(regular.useComplexAbstract).toBe(false);
	const withoutWork = mountLite(Abstract, { propsData: { Metadata: { properties: {}, Work: null } } });
	expect(withoutWork.useComplexAbstract).toBeFalsy();
});

it('ErrorsPopup abre el diálogo y, al guardar, lo cierra y pide georreferenciar de nuevo', () => {
	setupBackoffice('P');
	const vm = mountLite(ErrorsPopup, {});
	vm.show();
	expect(vm.openPopup).toBe(true);
	vm.save();
	expect(vm.openPopup).toBe(false);
	expect(vm.$emitted).toEqual([['georeferenceRequested']]);
});

it('LatLongSelection formatea las columnas con su variable', () => {
	const browser = setupBackoffice('P');
	const dataset = makeGridDataset();
	browser.window.Context.CurrentDataset = dataset;
	const vm = mountLite(LatLongSelection, { propsData: { value: {} } });
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
	expect(vm.Dataset === dataset).toBeTruthy();
});

it('HitsTable expone el módulo de fechas para formatear los períodos', () => {
	setupBackoffice('P');
	const vm = mountLite(HitsTable, {});
	expect(vm.dateFormatter === date).toBeTruthy();
	expect(vm.showMessageOnEmpty).toBe(true);
	expect(vm.loading).toBe(false);
});
