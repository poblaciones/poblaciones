import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import DatasetView from '@/backoffice/views/Dataset/Dataset.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setup(routePath) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	dataset.properties.Caption = 'Escuelas';
	dataset.EnsureColumnsAndExec = function () {};
	dataset.CloneDataset = function () {};
	dataset.DeleteDataset = function () {};
	dataset.Update = function () {};
	context.CurrentDataset = dataset;
	context.CurrentWork = { properties: { Id: 3 } };
	context.Configuration = { Help: { Seccion: 'ayuda' } };
	context.HelpLinkSection = function (item) { return '[' + item + ']'; };
	browser.window.Db.bound = [];
	browser.window.Db.loaded = 0;
	browser.window.Db.BindDataset = function (id) { browser.window.Db.bound.push(id); };
	browser.window.Db.LoadWorks = function () { browser.window.Db.loaded++; };
	browser.window.Db.RebindAndFocusLastDataset = function () {};
	browser.window.Db.RebindAndFocusMetadataContent = function () {};
	const refs = {
		tabs: { activeTab: null },
		invoker: {
			messages: [],
			saved: [],
			confirms: [],
			doMessage(...args) { this.messages.push(args); return Promise.resolve(); },
			doSave(...args) { this.saved.push(args); return Promise.resolve({ Id: 9 }); },
			confirm(title, message, callback) { this.confirms.push({ title: title, message: message, callback: callback }); },
		},
		importPopup: { shown: 0, show() { this.shown++; } },
	};
	const router = { name: 'router' };
	const vm = mountLite(DatasetView, { mocks: { $refs: refs, $route: { path: routePath || '/cartographies/3/datasets/5/data', params: { datasetId: '5' } }, $router: router } });
	return { vm: vm, dataset: dataset, context: context, refs: refs, browser: browser, router: router };
}

describe('Dataset: apertura');

it('al montar enlaza el dataset de la ruta', () => {
	const { vm, browser } = setup();
	DatasetView.mounted.call(vm);
	expect(browser.window.Db.bound).toEqual(['5']);
});

it('al cambiar si está georreferenciado recarga el listado de trabajos', () => {
	const { vm, browser } = setup();
	DatasetView.watch['Dataset.properties.Geocoded'].call(vm);
	expect(browser.window.Db.loaded).toBe(1);
});

describe('Dataset: rutas y solapas');

it('makePath arma la ruta del dataset dentro de la cartografía, y es vacía sin trabajo o dataset', () => {
	const { vm, context } = setup();
	expect(vm.makePath('data')).toBe('/cartographies/3/datasets/5/data');
	expect(vm.makePath('')).toBe('/cartographies/3/datasets/5');
	context.CurrentDataset = null;
	expect(vm.makePath('data')).toBe('');
});

it('isPath compara con la ruta actual', () => {
	const { vm } = setup('/cartographies/3/datasets/5/data');
	expect(vm.isPath('/cartographies/3/datasets/5/data')).toBe(true);
	expect(vm.isPath('/cartographies/3/datasets/5/identity')).toBe(false);
});

it('isPath activa la solapa que corresponde al final de la ruta, enviando Variables a Datos', () => {
	const cases = {
		'/cartographies/3/datasets/5/variables': 'data',
		'/cartographies/3/datasets/5/georeference': 'georeference',
		'/cartographies/3/datasets/5/multilevel': 'multilevel',
		'/cartographies/3/datasets/5/data': 'data',
		'/cartographies/3/datasets/5/identity': 'identity',
		'/cartographies/3/datasets/5/metrics': 'metrics',
		'/cartographies/3/datasets/5': 'metrics',
	};
	for (const path of Object.keys(cases)) {
		const { vm, refs } = setup(path);
		vm.isPath(path);
		expect(refs.tabs.activeTab).toBe(cases[path]);
	}
});

it('isPath sin componente de solapas solo compara la ruta', () => {
	const { vm } = setup();
	vm.$refs = {};
	expect(vm.isPath('/cartographies/3/datasets/5/data')).toBe(true);
});

it('extraHelp devuelve el vínculo de ayuda de la sección', () => {
	const { vm } = setup();
	expect(vm.extraHelp('Seccion')).toBe('[ayuda]');
});

describe('Dataset: acciones');

it('EnsureColumns pide las columnas con un mensaje solo si hay dataset', () => {
	const { vm, refs, dataset, context } = setup();
	vm.EnsureColumns();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información del dataset');
	expect(refs.invoker.messages[0][1] === dataset).toBeTruthy();
	expect(refs.invoker.messages[0][2] === dataset.EnsureColumnsAndExec).toBeTruthy();
	context.CurrentDataset = null;
	vm.EnsureColumns();
	expect(refs.invoker.messages).toHaveLength(1);
});

it('upload abre el diálogo de importación y Update graba el dataset', () => {
	const { vm, refs, dataset } = setup();
	vm.upload();
	expect(refs.importPopup.shown).toBe(1);
	vm.Update();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.Update).toBeTruthy();
});

it('beginCloneDataset propone el nombre de la copia y abre el diálogo', () => {
	const { vm } = setup();
	vm.beginCloneDataset();
	expect(vm.newDatasetName).toBe('Copia de Escuelas');
	expect(vm.activateSaveAs).toBe(true);
});

it('performSaveAsDataset exige un nombre y vuelve a abrir el diálogo', async () => {
	const { vm, browser, refs } = setup();
	vm.newDatasetName = '   ';
	vm.activateSaveAs = false;
	vm.performSaveAsDataset();
	expect(browser.alerts).toEqual(['Debe indicar un nombre.']);
	expect(refs.invoker.saved).toHaveLength(0);
	await Promise.resolve();
	expect(vm.activateSaveAs).toBe(true);
});

it('performSaveAsDataset clona con el nombre sin espacios sobrantes y luego enlaza el último dataset', async () => {
	const { vm, refs, dataset, browser, router } = setup();
	vm.newDatasetName = '  Copia  ';
	vm.performSaveAsDataset();
	expect(refs.invoker.saved[0][1] === dataset.CloneDataset).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([3, 'Copia']);
	await Promise.resolve();
	await Promise.resolve();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo dataset');
	expect(refs.invoker.messages[0][2] === browser.window.Db.RebindAndFocusLastDataset).toBeTruthy();
	expect(refs.invoker.messages[0][3] === router).toBeTruthy();
});

it('deleteDataset pide confirmar y, al aceptar, elimina el dataset y vuelve a los metadatos de la cartografía', async () => {
	const { vm, refs, dataset, browser, router } = setup();
	vm.deleteDataset();
	expect(refs.invoker.confirms[0].title).toBe('Eliminar dataset');
	expect(refs.invoker.messages).toHaveLength(0);
	refs.invoker.confirms[0].callback();
	expect(refs.invoker.messages[0][0]).toBe('Eliminando');
	expect(refs.invoker.messages[0][2] === dataset.DeleteDataset).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe(3);
	await Promise.resolve();
	await Promise.resolve();
	expect(refs.invoker.messages[1][0]).toBe('Obteniendo cartografía');
	expect(refs.invoker.messages[1][2] === browser.window.Db.RebindAndFocusMetadataContent).toBeTruthy();
	expect(refs.invoker.messages[1][3] === router).toBeTruthy();
});
