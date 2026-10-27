import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import InstitutionWidget from '@/backoffice/views/Metadata/InstitutionWidget.vue';
import SearchPanel from '@/backoffice/components/SearchPanel.vue';
import SearchPopup from '@/backoffice/components/SearchPopup.vue';
import HomeTopbar from '@/backoffice/components/HomeTopbar.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setupWidget(institution) {
	const browser = setupBackoffice('P');
	browser.window.Context.CanEditStaticLists = function () { return true; };
	const container = { Institution: institution };
	const refs = {
		invoker: { confirms: [], confirm(title, message, callback) { this.confirms.push({ title: title, message: message, callback: callback }); } },
		InstitutionPopup: { shown: [], show(item) { this.shown.push(item); } },
		PickInstitution: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(InstitutionWidget, { propsData: { container: container, canEdit: true, Metadata: {} }, mocks: { $refs: refs } });
	return { vm: vm, container: container, refs: refs };
}

describe('InstitutionWidget: institución');

it('item y getInstitutionCaption muestran la institución del contenedor, o vacío si no tiene', () => {
	const withInstitution = setupWidget({ Id: 1, Caption: 'INDEC' }).vm;
	expect(withInstitution.item.Id).toBe(1);
	expect(withInstitution.getInstitutionCaption).toBe('INDEC');
	expect(withInstitution.CanEditStaticLists).toBe(true);
	expect(setupWidget(null).vm.getInstitutionCaption).toBe('');
});

it('selected guarda la institución en el contenedor y la informa', () => {
	const { vm, container } = setupWidget(null);
	const item = { Id: 2 };
	vm.selected(item);
	expect(container.Institution === item).toBeTruthy();
	expect(vm.$emitted[0][0]).toBe('onSelected');
	expect(vm.$emitted[0][1] === item).toBeTruthy();
});

it('editar una institución global pide confirmar, y una propia abre la edición directamente', () => {
	const { vm, refs } = setupWidget(null);
	vm.openEditionWarning({ Id: 1, IsGlobal: false });
	expect(refs.InstitutionPopup.shown).toHaveLength(1);
	vm.openEditionWarning({ Id: 2, IsGlobal: true });
	expect(refs.invoker.confirms[0].title).toBe('Editar institución');
	expect(refs.InstitutionPopup.shown).toHaveLength(1);
	refs.invoker.confirms[0].callback();
	expect(refs.InstitutionPopup.shown).toHaveLength(2);
});

it('onOpenSelect abre el selector de instituciones', () => {
	const { vm, refs } = setupWidget(null);
	vm.onOpenSelect();
	expect(refs.PickInstitution.shown).toBe(1);
});

function setupPanel() {
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = { Startup: { LookupSignature: 'firma' } };
	const focused = [];
	const refs = {
		inputName: { $el: { focus() { focused.push(1); } } },
		invoker: { messages: [], doMessage(...args) { this.messages.push(args); } },
	};
	const vm = mountLite(SearchPanel, { propsData: { searchType: 'm' }, mocks: { $refs: refs } });
	return { vm: vm, refs: refs, focused: focused };
}

describe('SearchPanel: búsqueda');

it('getDraftMetrics es verdadero por defecto y prepare reinicia el filtro y la lista', () => {
	const { vm } = setupPanel();
	expect(vm.getDraftMetrics).toBe(true);
	vm.filter = 'x';
	vm.autolist = [1];
	SearchPanel.mounted.call(vm);
	expect(vm.filter).toBe('');
	expect(vm.autolist).toEqual([]);
	expect(vm.search !== undefined).toBe(true);
});

it('select informa el resultado solo si tiene identificador', () => {
	const { vm } = setupPanel();
	vm.select({ Caption: 'sin id' });
	expect(vm.$emitted).toHaveLength(0);
	const item = { Id: 5, Caption: 'Con id' };
	vm.select(item);
	expect(vm.$emitted[0][0]).toBe('selected');
	expect(vm.$emitted[0][1] === item).toBeTruthy();
});

it('doSearch busca con textos de más de dos caracteres y vacía la lista con los más cortos', () => {
	const { vm, refs } = setupPanel();
	SearchPanel.mounted.call(vm);
	vm.autolist = [1, 2];
	vm.filter = 'ab';
	vm.doSearch();
	expect(refs.invoker.messages).toHaveLength(0);
	expect(vm.autolist).toEqual([]);
	vm.filter = 'pobl';
	vm.doSearch();
	expect(refs.invoker.messages[0][0]).toBe('Buscando');
	expect(refs.invoker.messages[0][3]).toBe('pobl');
});

it('focus enfoca el campo de búsqueda tras una pausa', async () => {
	const { vm, focused } = setupPanel();
	vm.focus();
	await waitTimers(160);
	expect(focused).toHaveLength(1);
});

describe('SearchPopup: tipo de búsqueda');

function setupSearchPopup(searchType) {
	setupBackoffice('P');
	const calls = [];
	const refs = { searchPanel: { prepare() { calls.push('prepare'); }, focus() { calls.push('focus'); } } };
	const vm = mountLite(SearchPopup, { propsData: { searchType: searchType }, mocks: { $refs: refs } });
	return { vm: vm, calls: calls };
}

it('typeCaption nombra el tipo de búsqueda y falla con uno inválido', () => {
	expect(setupSearchPopup('r').vm.typeCaption).toBe('región');
	expect(setupSearchPopup('m').vm.typeCaption).toBe('indicador');
	let message = null;
	try {
		setupSearchPopup('x').vm.typeCaption;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Tipo de búsqueda inválido.');
});

it('show abre el diálogo y luego prepara y enfoca el buscador', async () => {
	const { vm, calls } = setupSearchPopup('r');
	vm.show();
	expect(vm.openDialog).toBe(true);
	await waitTimers(160);
	expect(calls).toEqual(['prepare', 'focus']);
});

it('selected cierra el diálogo e informa el resultado', () => {
	const { vm } = setupSearchPopup('r');
	vm.openDialog = true;
	vm.selected({ Id: 4 });
	expect(vm.openDialog).toBe(false);
	expect(vm.$emitted).toEqual([['selected', { Id: 4 }]]);
});

function setupHome(user) {
	const browser = setupBackoffice('A');
	browser.window.Context.User = user;
	const pushed = [];
	const router = { resolve(route) { return { href: '/#' + route.path }; }, push(route) { pushed.push(route); } };
	const vm = mountLite(HomeTopbar, { mocks: { $router: router } });
	HomeTopbar.created.call(vm);
	const searches = [];
	let cancels = 0;
	vm.workSearch = {
		result: { results: [{ route: { path: '/a' } }], truncatedKinds: ['dataset'], failed: false },
		Search(text) { searches.push(text); return Promise.resolve(this.result); },
		Cancel() { cancels++; },
	};
	return { vm: vm, searches: searches, pushed: pushed, cancels: function () { return cancels; } };
}

describe('HomeTopbar: búsqueda');

it('showAdminButton exige un usuario que pueda acceder a la administración', () => {
	expect(setupHome({ Privileges: 'A' }).vm.showAdminButton).toBeTruthy();
	expect(setupHome({ Privileges: 'P' }).vm.showAdminButton).toBeFalsy();
	expect(setupHome(null).vm.showAdminButton).toBeFalsy();
});

it('al crearse prepara la búsqueda y sin temporizador pendiente', () => {
	const browser = setupBackoffice('A');
	const vm = mountLite(HomeTopbar, {});
	HomeTopbar.created.call(vm);
	expect(vm.workSearch !== undefined).toBe(true);
	expect(vm.searchTimer).toBeNull();
	expect(browser).toBeTruthy();
});

it('onSearch con menos de dos caracteres reinicia la búsqueda', () => {
	const { vm, cancels } = setupHome({ Privileges: 'A' });
	vm.results = [{}];
	vm.loading = true;
	vm.onSearch(' a ');
	expect(vm.results).toBeNull();
	expect(vm.truncatedKinds).toEqual([]);
	expect(vm.loading).toBe(false);
	expect(cancels()).toBe(1);
});

it('onSearch con texto suficiente espera una pausa antes de buscar y solo busca el último texto', async () => {
	const { vm, searches } = setupHome({ Privileges: 'A' });
	vm.onSearch('po');
	vm.onSearch('pobl');
	expect(vm.loading).toBe(true);
	expect(searches).toHaveLength(0);
	await waitTimers(320);
	expect(searches).toEqual(['pobl']);
});

it('runSearch guarda los resultados con su enlace y deja de mostrar la carga', async () => {
	const { vm } = setupHome({ Privileges: 'A' });
	vm.loading = true;
	vm.runSearch('pobl');
	await flushPromises();
	expect(vm.results[0].href).toBe('/#/a');
	expect(vm.truncatedKinds).toEqual(['dataset']);
	expect(vm.failed).toBe(false);
	expect(vm.loading).toBe(false);
});

it('runSearch ignora una respuesta superada por otra consulta', async () => {
	const { vm } = setupHome({ Privileges: 'A' });
	vm.workSearch.result = null;
	vm.loading = true;
	vm.runSearch('pobl');
	await flushPromises();
	expect(vm.results).toBeNull();
	expect(vm.loading).toBe(true);
});

it('addLinks tolera la ausencia de resultados y onSelect navega a la ruta del resultado', () => {
	const { vm, pushed } = setupHome({ Privileges: 'A' });
	vm.addLinks(null);
	vm.onSelect({ route: { path: '/cartographies/3' } });
	expect(pushed).toEqual([{ path: '/cartographies/3' }]);
});

it('al destruirse cancela el temporizador y la búsqueda en curso', () => {
	const { vm, cancels } = setupHome({ Privileges: 'A' });
	HomeTopbar.beforeDestroy.call(vm);
	expect(cancels()).toBe(1);
});
