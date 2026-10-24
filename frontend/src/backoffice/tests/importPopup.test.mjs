import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import ImportPopup from '@/backoffice/views/Dataset/ImportPopup.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setup() {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.GetCreateFileUrl = function (bucket) { return 'create-url-' + bucket; };
	const dataset = makeGridDataset();
	dataset.properties.Id = 5;
	dataset.reloaded = 0;
	dataset.ReloadProperties = function () { dataset.reloaded++; };
	context.CurrentDataset = dataset;
	const work = {
		changed: 0,
		verifyCalls: [],
		verifyResult: Promise.resolve({ Sheets: [], CanGeoreference: 0 }),
		created: [],
		WorkChanged() { this.changed++; },
		VerifyDatasetsImportFile(bucket, extension) { this.verifyCalls.push([bucket, extension]); return this.verifyResult; },
		GetDatasetFileImportUrl(keepLabels) { return 'import-start-' + keepLabels; },
		GetStepDatasetFileImportUrl() { return 'import-step'; },
		CreateNewDataset(name) { this.created.push(name); return Promise.resolve({ Id: 77 }); },
	};
	context.CurrentWork = work;
	browser.window.Db.RebindAndFocusLastDataset = function () {};
	browser.window.Db.RebindAndGeorreferenceLastDataset = function () {};
	const refs = {
		myVueDropzone: { removed: 0, added: [], removeAllFiles() { this.removed++; }, addFile(file) { this.added.push(file); } },
		datasetSelectionDialog: { shown: [], show(...args) { this.shown.push(args); } },
		datasetDialog: { shown: [], show(...args) { this.shown.push(args); } },
		stepper: { closed: 0, startPromise: Promise.resolve(), Start() { return this.startPromise; }, Close() { this.closed++; } },
		invoker: {
			messages: [],
			result: Promise.resolve({ Id: 77 }),
			doMessage(...args) { this.messages.push(args); return this.result; },
		},
	};
	const vm = mountLite(ImportPopup, { mocks: { $refs: refs, $router: { name: 'router' } } });
	return { vm: vm, dataset: dataset, work: work, refs: refs, context: context, browser: browser };
}

describe('ImportPopup: estado inicial');

it('arranca cerrado, con las etiquetas conservadas y las extensiones aceptadas configuradas', () => {
	const { vm } = setup();
	expect(vm.openImport).toBe(false);
	expect(vm.keepLabels).toBe(true);
	expect(vm.georeference).toBe(0);
	expect(vm.dropzoneOptions.acceptedFiles).toBe('.csv,.txt,.sav,.gpkg,.kml,.kmz,.xls,.xlsx,.zip');
	expect(vm.dropzoneOptions.maxFiles).toBe(1);
	expect(vm.dropzoneOptions.chunking).toBe(true);
	expect(vm.dropzoneOptions.chunkSize).toBe(500000);
});

it('la dirección de subida usa el identificador de la carga actual', () => {
	const { vm } = setup();
	vm.bucketId = 123;
	expect(vm.dropzoneOptions.url()).toBe('create-url-123');
	expect(vm.getBucketId()).toBe(123);
});

it('Dataset es el dataset actual, o null cuando se fuerza uno nuevo', () => {
	const { vm, dataset } = setup();
	expect(vm.Dataset === dataset).toBeTruthy();
	vm.forceCreateNewDataset = true;
	expect(vm.Dataset).toBeNull();
});

describe('ImportPopup: show y carga del archivo');

it('show reinicia el estado de la carga, genera una carga nueva y abre el diálogo', () => {
	const { vm } = setup();
	vm.extension = 'csv';
	vm.sending = true;
	vm.hasFiles = true;
	vm.georeference = 1;
	vm.createdDataset = { Id: 1 };
	vm.show(true);
	expect(vm.extension).toBe('');
	expect(vm.sending).toBe(false);
	expect(vm.hasFiles).toBe(false);
	expect(vm.georeference).toBe(0);
	expect(vm.createdDataset).toBeNull();
	expect(vm.forceCreateNewDataset).toBe(true);
	expect(vm.openImport).toBe(true);
	expect(vm.bucketId > 0).toBe(true);
});

it('generateBucketId produce un identificador numérico creciente en el tiempo', () => {
	const { vm } = setup();
	vm.generateBucketId();
	const first = vm.bucketId;
	expect(typeof first).toBe('number');
	expect(first % 10000).toBe(0);
});

it('beforeSending recuerda la extensión y el nombre del archivo y reinicia lo anterior', () => {
	const { vm } = setup();
	vm.createdDataset = { Id: 1 };
	vm.selectedSheet = { Id: 2 };
	vm.beforeSending({ name: 'Escuelas.XLSX' });
	expect(vm.extension).toBe('xlsx');
	expect(vm.filename).toBe('Escuelas');
	expect(vm.createdDataset).toBeNull();
	expect(vm.selectedSheet).toBeNull();
	expect(vm.datasets).toBeNull();
	expect(vm.sending).toBe(true);
});

it('maxfilesexceeded reemplaza el archivo anterior por el nuevo', () => {
	const { vm, refs } = setup();
	const file = { name: 'nuevo.csv' };
	vm.maxfilesexceeded(file);
	expect(refs.myVueDropzone.removed).toBe(1);
	expect(refs.myVueDropzone.added).toEqual([file]);
});

it('clear descarta los archivos, genera una carga nueva y limpia la selección', () => {
	const { vm, refs } = setup();
	vm.bucketId = 1;
	vm.hasFiles = true;
	vm.verifying = true;
	vm.selectedSheet = { Id: 1 };
	vm.clear();
	expect(refs.myVueDropzone.removed).toBe(1);
	expect(vm.bucketId === 1).toBe(false);
	expect(vm.hasFiles).toBe(false);
	expect(vm.verifying).toBe(false);
	expect(vm.selectedSheet).toBeNull();
});

it('afterComplete termina el envío', () => {
	const { vm } = setup();
	vm.sending = true;
	vm.afterComplete({});
	expect(vm.sending).toBe(false);
});

describe('ImportPopup: verificación de datasets del archivo');

it('afterSuccess verifica el contenido de los archivos con varias hojas o capas y no el de los planos', () => {
	for (const extension of ['kml', 'kmz', 'xlsx', 'xls', 'zip']) {
		const { vm, work } = setup();
		vm.bucketId = 9;
		vm.extension = extension;
		vm.sending = true;
		vm.afterSuccess({}, {});
		expect(vm.sending).toBe(false);
		expect(vm.hasFiles).toBe(true);
		expect(work.verifyCalls).toEqual([[9, extension]]);
	}
	for (const extension of ['csv', 'txt', 'sav', 'gpkg']) {
		const { vm, work } = setup();
		vm.extension = extension;
		vm.afterSuccess({}, {});
		expect(work.verifyCalls).toHaveLength(0);
	}
});

it('hasAllItemOnSheets es verdadero solo para KML y KMZ', () => {
	const { vm } = setup();
	for (const extension of ['kml', 'kmz']) {
		vm.extension = extension;
		expect(vm.hasAllItemOnSheets()).toBe(true);
	}
	vm.extension = 'xlsx';
	expect(vm.hasAllItemOnSheets()).toBe(false);
});

it('con varias hojas pide elegir una y recuerda si se puede georreferenciar', async () => {
	const { vm, work, refs } = setup();
	work.verifyResult = Promise.resolve({ Sheets: [{ Id: 1 }, { Id: 2 }], CanGeoreference: 1 });
	vm.bucketId = 9;
	vm.extension = 'xlsx';
	vm.verifyDatasets(9, 'xlsx');
	expect(vm.verifying).toBe(true);
	await flushPromises();
	expect(vm.datasets).toEqual([{ Id: 1 }, { Id: 2 }]);
	expect(refs.datasetSelectionDialog.shown).toHaveLength(1);
	expect(vm.georeference).toBe(1);
	expect(vm.verifying).toBe(false);
});

it('con una sola hoja la elige y sin hojas deja la selección vacía', async () => {
	const { vm, work } = setup();
	work.verifyResult = Promise.resolve({ Sheets: [{ Id: 1 }], CanGeoreference: 0 });
	vm.bucketId = 9;
	vm.verifyDatasets(9, 'xlsx');
	await flushPromises();
	expect(vm.selectedSheet).toEqual({ Id: 1 });
	work.verifyResult = Promise.resolve({ Sheets: [], CanGeoreference: 0 });
	vm.verifyDatasets(9, 'xlsx');
	await flushPromises();
	expect(vm.selectedSheet).toBeNull();
});

it('ignora la respuesta si mientras tanto se cambió de archivo o se canceló la verificación', async () => {
	const { vm, work } = setup();
	work.verifyResult = Promise.resolve({ Sheets: [{ Id: 1 }], CanGeoreference: 1 });
	vm.bucketId = 9;
	vm.verifyDatasets(9, 'xlsx');
	vm.bucketId = 10;
	await flushPromises();
	expect(vm.selectedSheet).toBeNull();
	expect(vm.georeference).toBe(0);
	vm.bucketId = 9;
	vm.verifyDatasets(9, 'xlsx');
	vm.verifying = false;
	await flushPromises();
	expect(vm.selectedSheet).toBeNull();
});

it('RequestDatasetSelection invita a elegir y, en KML y KMZ, ofrece la opción TODOS', () => {
	const { vm, refs } = setup();
	vm.datasets = [{ Id: 1 }];
	vm.selectedSheet = null;
	vm.extension = 'xlsx';
	vm.RequestDatasetSelection();
	expect(refs.datasetSelectionDialog.shown[0]).toEqual([
		'Selección de dataset', 'Seleccione uno de los datasets dentro del archivo a importar', null, [{ Id: 1 }], false,
	]);
	vm.extension = 'kml';
	vm.RequestDatasetSelection();
	expect(refs.datasetSelectionDialog.shown[1][1]).toBe(
		"Seleccione uno de los datasets dentro del archivo a importar, o elija la opción 'TODOS' para incorporar la totalidad de los contenidos del archivo");
	expect(refs.datasetSelectionDialog.shown[1][4]).toBe(true);
});

it('SaveDatasetSelected recuerda la hoja elegida y reinicia la carga si no se eligió ninguna', () => {
	const { vm, refs } = setup();
	vm.SaveDatasetSelected({ Id: 2, Caption: 'Hoja 2' });
	expect(vm.selectedSheet).toEqual({ Id: 2, Caption: 'Hoja 2' });
	expect(refs.myVueDropzone.removed).toBe(0);
	vm.SaveDatasetSelected({ Id: 3, Caption: '' });
	expect(refs.myVueDropzone.removed).toBe(1);
	vm.SaveDatasetSelected(null);
	expect(refs.myVueDropzone.removed).toBe(2);
});

describe('ImportPopup: importación');

it('save rechaza una extensión no admitida', () => {
	const { vm, browser, refs } = setup();
	vm.extension = 'doc';
	vm.save();
	expect(browser.alerts).toEqual(['La extensión del archivo debe ser CSV, TXT, XLS, XLSX, SAV, KML, KMZ, GPKG o ZIP.']);
	expect(refs.stepper.startUrl).toBe('import-start-true');
});

it('save sin dataset actual ni creado pide el nombre del dataset nuevo', () => {
	const { vm, refs } = setup();
	vm.forceCreateNewDataset = true;
	vm.extension = 'csv';
	vm.filename = 'escuelas';
	const requested = [];
	const original = vm.RequestDataset;
	vm.RequestDataset = function () { requested.push(1); return original(); };
	vm.save();
	expect(requested).toHaveLength(1);
	expect(refs.datasetDialog.shown).toHaveLength(1);
	expect(refs.stepper.args).toBe(undefined);
});

it('RequestDataset sugiere el nombre de la hoja, salvo los nombres genéricos', () => {
	const { vm, refs } = setup();
	vm.filename = 'archivo';
	vm.RequestDataset();
	expect(refs.datasetDialog.shown[0]).toEqual(['Importar', 'Indique un nombre para el dataset', '', 'Ej. Escuelas primarias.', 'archivo', 100]);
	vm.selectedSheet = { Caption: 'Colegios' };
	vm.RequestDataset();
	expect(refs.datasetDialog.shown[1][4]).toBe('Colegios');
	for (const generic of ['Sheet1', 'Hoja1', '[ TODOS ]', '']) {
		vm.selectedSheet = { Caption: generic };
		vm.RequestDataset();
		expect(refs.datasetDialog.shown[refs.datasetDialog.shown.length - 1][4]).toBe('archivo');
	}
});

it('CreateDataset crea el dataset con el nombre sin espacios sobrantes y continúa con el guardado', async () => {
	const { vm, refs, work } = setup();
	const saves = [];
	vm.save = function () { saves.push(1); };
	vm.CreateDataset('  Escuelas  ');
	expect(refs.invoker.messages[0][0]).toBe('Creando dataset');
	expect(refs.invoker.messages[0][1] === work).toBeTruthy();
	expect(refs.invoker.messages[0][2] === work.CreateNewDataset).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe('Escuelas');
	await flushPromises();
	expect(vm.createdDataset).toEqual({ Id: 77 });
	expect(saves).toHaveLength(1);
});

it('save sobre un dataset existente inicia la importación y, al terminar, marca el cambio y recarga propiedades y columnas', async () => {
	const { vm, refs, work, dataset } = setup();
	vm.extension = 'csv';
	vm.bucketId = 9;
	vm.keepLabels = false;
	vm.selectedSheet = { Id: 4 };
	vm.save();
	expect(refs.stepper.startUrl).toBe('import-start-false');
	expect(refs.stepper.stepUrl).toBe('import-step');
	expect(refs.stepper.args).toEqual({ b: 9, d: 5, fe: 'csv', s: 4 });
	await flushPromises();
	expect(work.changed).toBe(1);
	expect(dataset.reloaded).toBe(1);
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información del dataset');
	expect(refs.invoker.messages[0][1] === dataset).toBeTruthy();
});

it('save sin hoja elegida envía null como hoja', () => {
	const { vm, refs } = setup();
	vm.extension = 'csv';
	vm.bucketId = 9;
	vm.save();
	expect(refs.stepper.args.s).toBeNull();
});

it('save de un dataset nuevo sin georreferenciación enlaza el último dataset', async () => {
	const { vm, refs, browser } = setup();
	vm.forceCreateNewDataset = true;
	vm.createdDataset = { Id: 77 };
	vm.extension = 'csv';
	vm.georeference = 0;
	vm.save();
	expect(refs.stepper.args.d).toBe(77);
	await flushPromises();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo dataset');
	expect(refs.invoker.messages[0][2] === browser.window.Db.RebindAndFocusLastDataset).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toEqual({ name: 'router' });
	expect(refs.stepper.closed).toBe(0);
});

it('save de un dataset nuevo georreferenciable lo enlaza para georreferenciar y cierra el avance', async () => {
	const { vm, refs, browser } = setup();
	vm.forceCreateNewDataset = true;
	vm.createdDataset = { Id: 77 };
	vm.extension = 'csv';
	vm.georeference = 1;
	vm.save();
	await flushPromises();
	expect(refs.invoker.messages[0][2] === browser.window.Db.RebindAndGeorreferenceLastDataset).toBeTruthy();
	await flushPromises();
	expect(refs.stepper.closed).toBe(1);
});

it('onCloseStepper cierra el diálogo solo si el proceso terminó bien', () => {
	const { vm } = setup();
	vm.openImport = true;
	vm.onCloseStepper(false);
	expect(vm.openImport).toBe(true);
	vm.onCloseStepper(true);
	expect(vm.openImport).toBe(false);
});
