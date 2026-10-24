import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import GeoreferenceTab from '@/backoffice/views/Dataset/Georeference/GeoreferenceTab.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';
import { makeColumn } from './activeDatasetFixtures.mjs';

const NUMBER = 5;
const STRING = 1;

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	dataset.ScaleGenerator.allRegenerated = 0;
	dataset.ScaleGenerator.RegenAndSaveAllVariables = function () { dataset.ScaleGenerator.allRegenerated++; };
	context.CurrentDataset = dataset;
	context.CurrentWork = { counted: 0, UpdateDatasetGeorreferencedCount() { this.counted++; } };
	context.GetTrackingLevelGeography = function () { return { Id: 3 }; };
	const stepper = {
		started: [], closed: 0, step: 0, error: '', complete: '',
		Start(...args) { this.started.push(args); },
		Close() { this.closed++; },
	};
	const statusPopup = { shown: 0, show() { this.shown++; } };
	const vm = mountLite(GeoreferenceTab, { mocks: { $refs: { stepper: stepper, georeferenceStatusPopup: statusPopup } } });
	return { vm: vm, dataset: dataset, context: context, stepper: stepper, statusPopup: statusPopup };
}

describe('GeoreferenceTab: estado inicial');

it('arranca en la solapa de ubicación, sin selección y con el estado de campos vacío', () => {
	const { vm } = setup();
	expect(vm.activeTab).toBe('location');
	expect(vm.polygon).toBeNull();
	expect(vm.start).toEqual({ latitude: null, longitude: null, codes: null, geographyId: null });
	expect(vm.end).toEqual({ latitude: null, longitude: null, codes: null, geographyId: null });
	expect(vm.forceShow).toBe(false);
});

it('toggleForceShow alterna la vista y formatColumn formatea la columna', () => {
	const { vm, dataset } = setup();
	vm.toggleForceShow();
	expect(vm.forceShow).toBe(true);
	vm.toggleForceShow();
	expect(vm.forceShow).toBe(false);
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
});

it('stepperClosed reenvía el evento', () => {
	const { vm } = setup();
	vm.stepperClosed();
	expect(vm.$emitted).toEqual([['stepperClosed']]);
});

describe('GeoreferenceTab: startDisabled');

it('por ubicación exige latitud y longitud de inicio y, con segmentos, también las de fin', () => {
	const { vm } = setup();
	vm.activeTab = 'location';
	expect(vm.startDisabled).toBe(true);
	vm.start.latitude = 1;
	vm.start.longitude = 2;
	expect(vm.startDisabled).toBe(false);
	vm.mapSegmentsLatLon = true;
	expect(vm.startDisabled).toBe(true);
	vm.end.latitude = 3;
	vm.end.longitude = 4;
	expect(vm.startDisabled).toBe(false);
});

it('por código exige códigos y geografía de inicio y, con segmentos, también los de fin', () => {
	const { vm } = setup();
	vm.activeTab = 'code';
	expect(vm.startDisabled).toBe(true);
	vm.start.codes = 1;
	vm.start.geographyId = 2;
	expect(vm.startDisabled).toBe(false);
	vm.mapSegmentsCodes = true;
	expect(vm.startDisabled).toBe(true);
	vm.end.codes = 3;
	vm.end.geographyId = 4;
	expect(vm.startDisabled).toBe(false);
});

it('por polígono exige la columna del polígono y cualquier otra solapa queda deshabilitada', () => {
	const { vm } = setup();
	vm.activeTab = 'shape';
	expect(vm.startDisabled).toBe(true);
	vm.polygon = 4;
	expect(vm.startDisabled).toBe(false);
	vm.activeTab = 'otra';
	expect(vm.startDisabled).toBe(true);
});

describe('GeoreferenceTab: mensaje de estado');

it('geocodedMessage informa filas georreferenciadas y omitidas, y es vacío sin atributos', () => {
	const { vm, dataset } = setup();
	expect(vm.geocodedMessage()).toBe('');
	dataset.properties.GeoreferenceAttributes = JSON.stringify({ rowCount: 100, ommited: 0 });
	expect(vm.geocodedMessage()).toBe('Filas georreferenciadas: 100. ');
	dataset.properties.GeoreferenceAttributes = JSON.stringify({ rowCount: 100, ommited: 8 });
	expect(vm.geocodedMessage()).toBe('Filas georreferenciadas: 92. Filas omitidas: 8.');
});

describe('GeoreferenceTab: valores por defecto');

it('trySelect busca por nombre sin distinguir mayúsculas, en el orden de preferencia, y devuelve la última coincidencia', () => {
	const { vm } = setup();
	const list = [{ Id: 1, Variable: 'LAT' }, { Id: 2, Variable: 'latitud' }, { Id: 3, Variable: 'lat' }, { Id: 4, Variable: 'x' }];
	expect(vm.trySelect(list, ['latitud', 'lat'])).toBe(2);
	expect(vm.trySelect(list, ['lat', 'latitud'])).toBe(3);
	expect(vm.trySelect(list, ['otra'])).toBeNull();
	const repeated = [{ Id: 1, Variable: 'lat' }, { Id: 5, Variable: 'lat' }];
	expect(vm.trySelect(repeated, ['lat'])).toBe(5);
});

it('setDefaults propone latitud, longitud y polígono según el nombre de las columnas, y pasa a la solapa de polígonos', () => {
	const { vm } = setup();
	vm.setDefaults();
	expect(vm.start.latitude).toBe(1);
	expect(vm.start.longitude).toBe(2);
	expect(vm.polygon).toBe(4);
	expect(vm.activeTab).toBe('shape');
});

it('setDefaults sin columna de polígono mantiene la solapa de ubicación y reinicia los demás campos', () => {
	const { vm, dataset } = setup();
	dataset.Columns[3].Variable = 'otra';
	vm.forceShow = true;
	vm.start.codes = 7;
	vm.end.latitude = 9;
	vm.setDefaults();
	expect(vm.polygon).toBeNull();
	expect(vm.activeTab).toBe('location');
	expect(vm.forceShow).toBe(false);
	expect([vm.start.codes, vm.start.geographyId, vm.end.latitude, vm.end.longitude, vm.end.codes, vm.end.geographyId])
		.toEqual([null, null, null, null, null, null]);
});

it('setDefaults sin dataset no hace nada', () => {
	const { vm, context } = setup();
	context.CurrentDataset = null;
	vm.setDefaults();
	expect(vm.polygon).toBeNull();
});

it('si el dataset acaba de crearse para georreferenciar y hay coordenadas o polígono, inicia el proceso', () => {
	const { vm, dataset } = setup();
	const started = [];
	vm.startGeoreferencing = function (reset) { started.push(reset); };
	dataset.GeoreferenceOnce = true;
	vm.setDefaults();
	expect(started).toEqual([1]);
	expect(dataset.GeoreferenceOnce).toBe(false);
	vm.setDefaults();
	expect(started).toEqual([1]);
});

it('si el dataset acaba de crearse pero no tiene columnas candidatas, no inicia el proceso', () => {
	const { vm, dataset } = setup();
	dataset.Columns = [makeColumn(1, 'a', NUMBER), makeColumn(2, 'b', STRING)];
	const started = [];
	vm.startGeoreferencing = function (reset) { started.push(reset); };
	dataset.GeoreferenceOnce = true;
	vm.setDefaults();
	expect(started).toEqual([]);
	expect(dataset.GeoreferenceOnce).toBe(false);
});

it('al montar y al cambiar el dataset o sus columnas recalcula los valores por defecto', () => {
	const { vm } = setup();
	let calls = 0;
	vm.setDefaults = function () { calls++; };
	GeoreferenceTab.mounted.call(vm);
	GeoreferenceTab.watch.Dataset.call(vm);
	GeoreferenceTab.watch['Dataset.Columns'].call(vm, []);
	expect(calls).toBe(3);
});

describe('GeoreferenceTab: inicio del proceso');

it('resolveStartUrl y resolveStartArgs dependen de la solapa activa', () => {
	const { vm, dataset } = setup();
	vm.start = { latitude: 1, longitude: 2, codes: 3, geographyId: 4 };
	vm.end = { latitude: 5, longitude: 6, codes: 7, geographyId: 8 };
	vm.polygon = 9;
	vm.activeTab = 'location';
	expect(vm.resolveStartUrl()).toBe(dataset.GetMultiGeoreferenceByLatLongUrl());
	expect(vm.resolveStartArgs()).toEqual({ k: 5, a: 3, startLat: 1, startLon: 2, endLat: 5, endLon: 6, s: '0' });
	vm.activeTab = 'code';
	vm.mapSegmentsCodes = true;
	expect(vm.resolveStartUrl()).toBe(dataset.GetMultiGeoreferenceByCodesUrl());
	expect(vm.resolveStartArgs()).toEqual({ k: 5, startA: 4, startC: 3, endA: 8, endC: 7, s: '1' });
	vm.activeTab = 'shape';
	expect(vm.resolveStartUrl()).toBe(dataset.GetMultiGeoreferenceByShapesUrl());
	expect(vm.resolveStartArgs()).toEqual({ k: 5, a: 3, c: 9, p: true });
	vm.activeTab = 'otra';
	expect(vm.resolveStartUrl()).toBe(undefined);
	expect(vm.resolveStartArgs()).toBe(undefined);
});

it('startGeoreferencing configura el avance y lo inicia desde cero, marcando el dataset como no georreferenciado', () => {
	const { vm, dataset, stepper } = setup();
	vm.activeTab = 'shape';
	vm.polygon = 9;
	dataset.properties.Geocoded = true;
	vm.startGeoreferencing(1);
	expect(stepper.startUrl).toBe(dataset.GetMultiGeoreferenceByShapesUrl());
	expect(stepper.stepUrl).toBe(dataset.GetStepMultiGeoreferenceUrl());
	expect(stepper.args).toEqual({ k: 5, a: 3, c: 9, p: true, r: 1 });
	expect(dataset.properties.Geocoded).toBe(false);
	expect(stepper.started).toEqual([[]]);
});

it('startGeoreferencing sin reinicio retoma el proceso con el aviso Reanudando', () => {
	const { vm, stepper } = setup();
	vm.activeTab = 'shape';
	vm.polygon = 9;
	vm.startGeoreferencing(0);
	expect(stepper.args.r).toBe(0);
	expect(stepper.started).toEqual([['Reanudando']]);
});

describe('GeoreferenceTab: fin del proceso');

it('si el avance termina al validar o georreferenciar, lo cierra y muestra el estado', () => {
	const { vm, stepper, statusPopup } = setup();
	stepper.step = 2;
	vm.stepperComplete();
	stepper.step = 3;
	vm.stepperComplete();
	expect(stepper.closed).toBe(2);
	expect(statusPopup.shown).toBe(2);
});

it('si el avance termina al actualizar los datos informa el error', () => {
	const { vm, stepper } = setup();
	stepper.step = 4;
	vm.stepperComplete();
	expect(stepper.error).toBe('Falló en actualización de datos.');
});

it('si el avance termina en un paso desconocido informa el error', () => {
	const { vm, stepper } = setup();
	stepper.step = 99;
	vm.stepperComplete();
	expect(stepper.error).toBe('Paso desconocido.');
});

it('al terminar con éxito deja el dataset georreferenciado con el tipo de la solapa, recuenta y regenera las variables', () => {
	const cases = [
		['location', 'L', 'mapSegmentsLatLon'],
		['code', 'D', 'mapSegmentsCodes'],
		['shape', 'S', null],
	];
	for (const finalStep of [5, 6]) {
		for (const [tab, type, segmentsFlag] of cases) {
			const { vm, dataset, stepper, context } = setup();
			vm.activeTab = tab;
			if (segmentsFlag !== null) {
				vm[segmentsFlag] = true;
			}
			stepper.step = finalStep;
			vm.stepperComplete();
			expect(dataset.properties.Geocoded).toBe(true);
			expect(dataset.properties.Type).toBe(type);
			if (segmentsFlag !== null) {
				expect(dataset.properties.AreSegments).toBe(true);
			}
			expect(context.CurrentWork.counted).toBe(1);
			expect(dataset.ScaleGenerator.allRegenerated).toBe(1);
			expect(stepper.complete).toBe('Georeferenciación exitosa.');
		}
	}
});
