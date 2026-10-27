import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import Vue from './_stubs/vue.mjs';
import { splitCalls } from './_stubs/split.mjs';
import authentication from '@/common/js/authentication';
import err from '@/common/framework/err';
import Layout from '@/backoffice/views/Layout/Layout.vue';
import App from '@/backoffice/App.vue';
import DataTab from '@/backoffice/views/Dataset/DataTab.vue';
import CustomizePopup from '@/backoffice/views/Customize/CustomizePopup.vue';
import TitleBar from '@/backoffice/views/Layout/TitleBar.vue';
import MpDropdownButton from '@/backoffice/components/MpDropdownButton.vue';

function setupLayout(path, params, datasets) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.CurrentWork = { Datasets: datasets };
	browser.window.Db.bound = [];
	browser.window.Db.boundDatasets = [];
	browser.window.Db.BindWork = function (id) { browser.window.Db.bound.push(id); return Promise.resolve(); };
	browser.window.Db.BindDataset = function (id) { browser.window.Db.boundDatasets.push(id); };
	const replaced = [];
	const router = { replace(route) { replaced.push(route); } };
	const dispatched = [];
	const store = { state: { app: { sidebar: { opened: true, withoutAnimation: false }, device: 'desktop' } }, dispatch(...args) { dispatched.push(args); } };
	const refs = { invoker: { messages: [], doMessage(...args) { this.messages.push(args); } } };
	const vm = mountLite(Layout, { mocks: { $refs: refs, $route: { path: path, params: params }, $router: router, $store: store } });
	return { vm: vm, browser: browser, replaced: replaced, dispatched: dispatched, store: store, refs: refs };
}

function makeDataset(id) {
	return { properties: { Id: id } };
}

describe('Layout: propiedades calculadas');

it('classObj combina el estado de la barra lateral y el dispositivo', () => {
	const { vm, store } = setupLayout('/cartographies/5', { workId: '5' }, []);
	expect(vm.classObj).toEqual({ hideSidebar: false, withoutAnimation: false, mobile: false });
	store.state.app.sidebar.opened = false;
	store.state.app.sidebar.withoutAnimation = true;
	store.state.app.device = 'mobile';
	expect(vm.classObj).toEqual({ hideSidebar: true, withoutAnimation: true, mobile: true });
});

it('handleClickOutside cierra la barra lateral con animación y onCollapse recuerda el estado', () => {
	const { vm, dispatched } = setupLayout('/cartographies/5', { workId: '5' }, []);
	vm.handleClickOutside();
	expect(dispatched).toEqual([['CloseSideBar', { withoutAnimation: false }]]);
	vm.onCollapse(true);
	expect(vm.collapsed).toBe(true);
});

describe('Layout: apertura de una cartografía');

it('al montar enlaza la cartografía de la ruta, la pide con un mensaje y divide el panel', async () => {
	const { vm, browser, refs } = setupLayout('/cartographies/5/metadata', { workId: '5' }, []);
	Layout.mounted.call(vm);
	expect(browser.window.Db.bound).toEqual(['5']);
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo cartografía');
	expect(refs.invoker.messages[0][3]).toBe('5');
	const call = splitCalls()[splitCalls().length - 1];
	expect(call.panels).toEqual(['#panMain', '#panRight']);
	expect(call.options).toEqual({ sizes: [25, 75], minSize: 150, gutterSize: 4 });
	await flushPromises();
});

it('al abrir la raíz de la cartografía va al primer dataset', async () => {
	const { vm, replaced } = setupLayout('/cartographies/5', { workId: '5' }, [makeDataset(11), makeDataset(12)]);
	Layout.mounted.call(vm);
	await flushPromises();
	expect(replaced).toEqual(['/cartographies/5/datasets/11/data']);
});

it('al abrir la raíz de una cartografía sin datasets va a crear uno nuevo', async () => {
	const { vm, replaced } = setupLayout('/cartographies/5', { workId: '5' }, []);
	Layout.mounted.call(vm);
	await flushPromises();
	expect(replaced).toEqual(['/cartographies/5/newDataset']);
});

it('si la ruta ya indica un dataset o una solapa no redirige', async () => {
	const withDataset = setupLayout('/cartographies/5', { workId: '5', datasetId: '11' }, [makeDataset(11)]);
	Layout.mounted.call(withDataset.vm);
	await flushPromises();
	expect(withDataset.replaced).toEqual([]);
	const withTab = setupLayout('/cartographies/5/metadata', { workId: '5' }, [makeDataset(11)]);
	Layout.mounted.call(withTab.vm);
	await flushPromises();
	expect(withTab.replaced).toEqual([]);
});

describe('Layout: cambios de ruta');

it('al cambiar de cartografía la enlaza y va a su primer dataset o a crear uno', async () => {
	const withDatasets = setupLayout('/cartographies/6', { workId: '6' }, [makeDataset(21)]);
	Layout.watch['$route.params.workId'].call(withDatasets.vm, '6');
	await flushPromises();
	expect(withDatasets.browser.window.Db.bound).toEqual(['6']);
	expect(withDatasets.replaced).toEqual(['/cartographies/6/datasets/21/data']);
	const empty = setupLayout('/cartographies/6', { workId: '6' }, null);
	Layout.watch['$route.params.workId'].call(empty.vm, '6');
	await flushPromises();
	expect(empty.replaced).toEqual(['/cartographies/6/newDataset']);
});

it('al cambiar de dataset lo enlaza', () => {
	const { vm, browser } = setupLayout('/cartographies/5/datasets/12/data', { workId: '5', datasetId: '12' }, []);
	Layout.watch['$route.params.datasetId'].call(vm, '12');
	expect(browser.window.Db.boundDatasets).toEqual(['12']);
});

function setupApp() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.loaded = 0;
	context.LoadStaticLists = function () { context.loaded++; };
	browser.window.Db.Works = [{ Id: 1 }];
	browser.window.Db.LoadWorks = function () {};
	const refs = { invoker: { messages: [], result: Promise.resolve(), doMessage(...args) { this.messages.push(args); return this.result; } } };
	const vm = mountLite(App, { mocks: { $refs: refs } });
	return { vm: vm, context: context, refs: refs, browser: browser };
}

describe('App: inicio de la aplicación');

it('arranca con el menú de cartografías, sin usuario ni trabajos, y el contexto global', () => {
	const { vm, context } = setupApp();
	expect(vm.menu).toEqual([{ caption: 'Cartografías', link: 'cartographies' }]);
	expect(vm.user).toBeNull();
	expect(vm.works).toBeNull();
	expect(vm.context === context).toBeTruthy();
});

it('LoadData deja al usuario y la configuración en el contexto, carga los trabajos y las listas estáticas', async () => {
	const { vm, context, refs, browser } = setupApp();
	const data = { User: { Email: 'ana@x.org' }, UseGap: true };
	vm.LoadData(data);
	expect(vm.user === data.User).toBeTruthy();
	expect(context.User === data.User).toBeTruthy();
	expect(context.Configuration === data).toBeTruthy();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo cartografías');
	expect(refs.invoker.messages[0][2] === browser.window.Db.LoadWorks).toBeTruthy();
	expect(context.loaded).toBe(1);
	await flushPromises();
	expect(vm.works).toEqual([{ Id: 1 }]);
});

it('RegisterErrorHandler instala el manejador de errores en Vue y en la ventana', () => {
	const { vm, browser } = setupApp();
	vm.RegisterErrorHandler();
	expect(Vue.config.errorHandler === err.HandleError).toBeTruthy();
	expect(browser.window.onerror === err.HandleError).toBeTruthy();
});

it('al montar registra el manejador de errores y pide la barra de autenticación', () => {
	const { vm } = setupApp();
	const original = authentication.loadHeaderBar;
	const requested = [];
	authentication.loadHeaderBar = function (callback) { requested.push(callback); };
	App.mounted.call(vm);
	authentication.loadHeaderBar = original;
	expect(requested).toHaveLength(1);
	expect(requested[0] === vm.LoadData).toBeTruthy();
});

describe('Pantallas mínimas');

it('DataTab limpia la selección de la grilla si existe', () => {
	setupBackoffice('P');
	let cleared = 0;
	const vm = mountLite(DataTab, { mocks: { $refs: { grid: { clearSelection() { cleared++; } } } } });
	vm.clearGridSelection();
	expect(cleared).toBe(1);
	vm.$refs = {};
	vm.clearGridSelection();
	expect(cleared).toBe(1);
});

it('CustomizePopup arranca cerrado, se abre con show y toma la cartografía actual', () => {
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = { Id: 3 };
	const vm = mountLite(CustomizePopup, {});
	expect(vm.open).toBe(false);
	vm.show();
	expect(vm.open).toBe(true);
	expect(vm.Work.Id).toBe(3);
});

it('MpDropdownButton y TitleBar definen sus propiedades por defecto', () => {
	setupBackoffice('P');
	const button = mountLite(MpDropdownButton, {});
	expect([button.label, button.icon, button.disabled, button.size]).toEqual(['', null, false, 'small']);
	const bar = mountLite(TitleBar, { propsData: { title: 'Datos', help: 'ayuda' } });
	expect([bar.title, bar.help]).toEqual(['Datos', 'ayuda']);
});
