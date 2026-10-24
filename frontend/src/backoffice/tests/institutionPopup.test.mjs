import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import InstitutionPopup from '@/backoffice/views/Metadata/InstitutionPopup.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeInstitution(overrides) {
	return Object.assign({ Id: 4, Caption: 'INDEC', Country: 'Argentina', PrimaryColor: null, Watermark: null }, overrides);
}

function setup() {
	const browser = setupBackoffice('P');
	const metadata = {
		properties: { Id: 3 },
		UpdateInstitution() {},
		GetInstitutionWatermark() {},
	};
	const container = { Institution: { Id: 4 } };
	const refs = {
		invoker: { messages: [], saved: [], messageResult: Promise.resolve('data:image/png;base64,xx'), saveResult: Promise.resolve({ Id: 9, Watermark: { Id: 7 } }),
			doMessage(...args) { this.messages.push(args); return this.messageResult; },
			doSave(...args) { this.saved.push(args); return this.saveResult; } },
		datasetInput: { focused: 0, focus() { this.focused++; } },
	};
	const vm = mountLite(InstitutionPopup, { propsData: { container: container, canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, container: container, refs: refs, browser: browser };
}

describe('InstitutionPopup: propiedades calculadas');

it('metadata expone las propiedades de los metadatos', () => {
	const { vm, metadata } = setup();
	expect(vm.metadata === metadata.properties).toBeTruthy();
});

it('institutionSelected devuelve el identificador de la institución del ítem o -1', () => {
	const { vm } = setup();
	expect(vm.institutionSelected).toBe(-1);
	vm.item = { Institution: null };
	expect(vm.institutionSelected).toBe(-1);
	vm.item = { Institution: { Id: 12 } };
	expect(vm.institutionSelected).toBe(12);
});

describe('InstitutionPopup: apertura');

it('show trabaja sobre una copia, toma el color propio o el predeterminado y abre el diálogo', async () => {
	const { vm, refs } = setup();
	const item = makeInstitution({ PrimaryColor: 'FF0000' });
	vm.show(item, null);
	expect(vm.item === item).toBe(false);
	expect(vm.item).toEqual(item);
	expect(vm.currentColor).toBe('FF0000');
	expect(vm.openEditableInstitution).toBe(true);
	expect(vm.closeParentCallback).toBeNull();
	await waitTimers(130);
	expect(refs.datasetInput.focused).toBe(1);
	vm.show(makeInstitution(), null);
	expect(vm.currentColor).toBe('00A0D2');
});

it('show recuerda el callback que cierra al padre', () => {
	const { vm } = setup();
	const callback = function () {};
	vm.show(makeInstitution(), callback);
	expect(vm.closeParentCallback === callback).toBeTruthy();
});

it('show de una institución con imagen de marca la pide al servidor y la muestra', async () => {
	const { vm, refs, metadata } = setup();
	vm.show(makeInstitution({ Watermark: { Id: 7 } }), null);
	await waitTimers(130);
	await flushPromises();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo imagen');
	expect(refs.invoker.messages[0][1] === metadata).toBeTruthy();
	expect(refs.invoker.messages[0][2] === metadata.GetInstitutionWatermark).toBeTruthy();
	expect(vm.watermarkPreviewImage).toBe('data:image/png;base64,xx');
});

it('clearImage quita la imagen de marca del ítem', () => {
	const { vm } = setup();
	vm.item = makeInstitution({ Watermark: { Id: 7 } });
	vm.clearImage();
	expect(vm.item.Watermark).toBeNull();
});

describe('InstitutionPopup: guardado');

it('save exige un nombre y un país', () => {
	const { vm, browser, refs } = setup();
	vm.item = makeInstitution({ Caption: '  ' });
	vm.save();
	vm.item = makeInstitution({ Caption: null });
	vm.save();
	vm.item = makeInstitution({ Country: ' ' });
	vm.save();
	vm.item = makeInstitution({ Country: null });
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar un nombre.', 'Debe indicar un nombre.', 'Debe indicar el país.', 'Debe indicar el país.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save descarta el color si es el predeterminado y lo conserva si es otro', () => {
	const { vm } = setup();
	vm.item = makeInstitution();
	vm.currentColor = vm.defaultColor;
	vm.save();
	expect(vm.item.PrimaryColor).toBeNull();
	vm.currentColor = 'FF0000';
	vm.save();
	expect(vm.item.PrimaryColor).toBe('FF0000');
});

it('save graba la institución con su contenedor y la imagen, y al terminar actualiza el ítem, avisa y cierra', async () => {
	const { vm, refs, metadata, container } = setup();
	vm.item = makeInstitution();
	vm.imageToSend = 'imagen';
	vm.currentColor = vm.defaultColor;
	vm.openEditableInstitution = true;
	const callbacks = [];
	vm.closeParentCallback = function () { callbacks.push(1); };
	vm.save();
	expect(refs.invoker.saved[0][1] === metadata.UpdateInstitution).toBeTruthy();
	expect(refs.invoker.saved[0][3] === container).toBeTruthy();
	expect(refs.invoker.saved[0][4]).toBe('imagen');
	await flushPromises();
	expect(vm.openEditableInstitution).toBe(false);
	expect(vm.item.Id).toBe(9);
	expect(vm.item.Watermark).toEqual({ Id: 7 });
	expect(vm.$emitted[0][0]).toBe('onSelected');
	expect(vm.$emitted[0][1] === container.Institution).toBeTruthy();
	expect(callbacks).toEqual([1]);
});

it('save sin callback del padre no falla al terminar', async () => {
	const { vm } = setup();
	vm.item = makeInstitution();
	vm.currentColor = vm.defaultColor;
	vm.closeParentCallback = null;
	vm.save();
	await flushPromises();
	expect(vm.$emitted).toHaveLength(1);
});
