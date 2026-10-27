import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import LevelPopup from '@/backoffice/views/Dataset/LevelPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function makeRelated(id, workId, geography) {
	return { Id: id, Caption: 'Dataset ' + id, Geography: geography, Work: { Id: workId, Metadata: { Title: 'Obra ' + workId } } };
}

function setup(ownGeography) {
	const browser = setupBackoffice('P');
	const dataset = makeGridDataset();
	dataset.properties.Geography = ownGeography;
	if (ownGeography === undefined) {
		dataset.properties.Geography = { Caption: 'Departamentos' };
	}
	dataset.LevelMetrics = function () {};
	browser.window.Context.CurrentDataset = dataset;
	const refs = { invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } } };
	const vm = mountLite(LevelPopup, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, refs: refs, browser: browser };
}

const DEPARTMENTS = { Caption: 'Departamentos' };
const PROVINCES = { Caption: 'Provincias' };

function sampleRelated() {
	return [
		makeRelated(1, 10, PROVINCES),
		makeRelated(2, 10, DEPARTMENTS),
		makeRelated(3, 20, PROVINCES),
		makeRelated(4, 20, null),
	];
}

describe('LevelPopup: listas calculadas');

it('relatedWorks devuelve cada obra una sola vez, en el orden en que aparece', () => {
	const { vm } = setup();
	vm.allRelatedDatasets = sampleRelated();
	expect(vm.relatedWorks.map(function (work) { return work.Id; })).toEqual([10, 20]);
});

it('relatedDatasets filtra los datasets de la obra de origen elegida', () => {
	const { vm } = setup();
	vm.allRelatedDatasets = sampleRelated();
	expect(vm.relatedDatasets).toEqual([]);
	vm.sourceWork = { Id: 20 };
	expect(vm.relatedDatasets.map(function (dataset) { return dataset.Id; })).toEqual([3, 4]);
});

describe('LevelPopup: coincidencia de geografía');

it('geographyMatches exige geografía en ambos datasets y que tengan el mismo nombre', () => {
	const { vm, dataset } = setup();
	expect(vm.geographyMatches(makeRelated(1, 10, DEPARTMENTS))).toBe(true);
	expect(vm.geographyMatches(makeRelated(1, 10, PROVINCES))).toBe(false);
	expect(vm.geographyMatches(makeRelated(1, 10, null))).toBe(false);
	dataset.properties.Geography = null;
	expect(vm.geographyMatches(makeRelated(1, 10, DEPARTMENTS))).toBe(false);
});

it('formatDataset marca con asterisco los datasets de igual geografía y formatWork muestra el título de la obra', () => {
	const { vm } = setup();
	expect(vm.formatDataset(makeRelated(2, 10, DEPARTMENTS))).toBe('Dataset 2*');
	expect(vm.formatDataset(makeRelated(1, 10, PROVINCES))).toBe('Dataset 1');
	expect(vm.formatWork({ Metadata: { Title: 'Mi obra' } })).toBe('Mi obra');
});

describe('LevelPopup: selección por defecto');

it('selectedDefaultWork elige la obra del primer dataset de igual geografía, o ninguna', () => {
	const { vm } = setup();
	vm.allRelatedDatasets = sampleRelated();
	vm.selectedDefaultWork();
	expect(vm.sourceWork.Id).toBe(10);
	vm.allRelatedDatasets = [makeRelated(1, 10, PROVINCES)];
	vm.selectedDefaultWork();
	expect(vm.sourceWork).toBeNull();
});

it('selectedDefaultDataset elige el dataset de igual geografía dentro de la obra elegida, o ninguno', () => {
	const { vm } = setup();
	vm.allRelatedDatasets = sampleRelated();
	vm.sourceWork = { Id: 10 };
	vm.selectedDefaultDataset();
	expect(vm.sourceDataset.Id).toBe(2);
	vm.sourceWork = { Id: 20 };
	vm.selectedDefaultDataset();
	expect(vm.sourceDataset).toBeNull();
	vm.sourceWork = null;
	vm.selectedDefaultDataset();
	expect(vm.sourceDataset).toBeNull();
});

it('al cambiar la obra de origen recalcula el dataset por defecto', () => {
	const { vm } = setup();
	vm.allRelatedDatasets = sampleRelated();
	vm.sourceWork = { Id: 10 };
	LevelPopup.watch.sourceWork.call(vm);
	expect(vm.sourceDataset.Id).toBe(2);
});

describe('LevelPopup: apertura y guardado');

it('show recibe los datasets relacionados, propone la obra por defecto y abre el diálogo', () => {
	const { vm } = setup();
	const related = sampleRelated();
	vm.show(related);
	expect(vm.allRelatedDatasets === related).toBeTruthy();
	expect(vm.sourceWork.Id).toBe(10);
	expect(vm.openDialog).toBe(true);
});

it('save exige elegir un dataset', () => {
	const { vm, browser, refs } = setup();
	vm.save();
	expect(browser.alerts).toEqual(['Debe seleccionar un dataset.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save nivela las métricas desde el dataset elegido y cierra el diálogo al terminar', async () => {
	const { vm, refs, dataset } = setup();
	vm.sourceDataset = { Id: 2 };
	vm.openDialog = true;
	vm.save();
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.LevelMetrics).toBeTruthy();
	expect(refs.invoker.saved[0][2]).toBe(2);
	await flushPromises();
	expect(vm.openDialog).toBe(false);
});
