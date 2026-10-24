import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import AttachmentPopup from '@/backoffice/views/Metadata/AttachmentPopup.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function makeItem(overrides) {
	return Object.assign({ Id: 1, Caption: 'Informe', File: { Id: 10, Name: 'a.pdf', Type: 'application/pdf' } }, overrides);
}

function setup(files) {
	const browser = setupBackoffice('P');
	browser.window.Context.GetCreateFileUrl = function (bucket) { return 'create-url-' + bucket; };
	const metadata = {
		properties: { Id: 3 },
		Files: files || [],
		UpdateFile() {},
	};
	const refs = {
		invoker: { saved: [], saveResult: Promise.resolve(), doSave(...args) { this.saved.push(args); return this.saveResult; } },
		myVueDropzone: { removed: 0, added: [], removeAllFiles() { this.removed++; }, addFile(file) { this.added.push(file); } },
		inputName: { focused: 0, focus() { this.focused++; } },
	};
	const vm = mountLite(AttachmentPopup, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs, browser: browser };
}

describe('AttachmentPopup: estado inicial');

it('define el visor de archivos para PDF de hasta 50 MB subidos en partes', () => {
	const { vm } = setup();
	expect(vm.dropzoneOptions.acceptedFiles).toBe('application/pdf');
	expect(vm.dropzoneOptions.maxFiles).toBe(1);
	expect(vm.dropzoneOptions.maxFilesize).toBe(50);
	expect(vm.dropzoneOptions.chunking).toBe(true);
	expect(vm.openEditableAttach).toBe(false);
	vm.bucketId = 5;
	expect(vm.dropzoneOptions.url()).toBe('create-url-5');
});

it('metadata expone las propiedades de los metadatos', () => {
	const { vm, metadata } = setup();
	expect(vm.metadata === metadata.properties).toBeTruthy();
});

describe('AttachmentPopup: apertura');

it('isNew es verdadero sin ítem, sin archivo o sin identificador de archivo', () => {
	const { vm } = setup();
	expect(vm.isNew).toBe(true);
	vm.item = { File: null };
	expect(vm.isNew).toBe(true);
	vm.item = { File: { Id: null } };
	expect(vm.isNew).toBe(true);
	vm.item = makeItem();
	expect(vm.isNew).toBe(false);
});

it('show de un adjunto nuevo abre el diálogo con su descripción y una carga nueva, sin enfocar el nombre', async () => {
	const { vm, refs } = setup();
	vm.show({ Id: null, Caption: '', File: { Id: null } });
	expect(vm.openEditableAttach).toBe(true);
	expect(vm.localCaption).toBe('');
	expect(vm.sending).toBe(false);
	expect(vm.hasFiles).toBe(false);
	expect(vm.bucketId > 0).toBe(true);
	await waitTimers(130);
	expect(refs.inputName.focused).toBe(0);
});

it('show de un adjunto existente toma su descripción y enfoca el nombre', async () => {
	const { vm, refs } = setup();
	vm.show(makeItem());
	expect(vm.localCaption).toBe('Informe');
	await waitTimers(130);
	expect(refs.inputName.focused).toBe(1);
});

it('getBucketId devuelve la carga actual y formatFile formatea el tamaño y las páginas', () => {
	const { vm } = setup();
	vm.bucketId = 9;
	expect(vm.getBucketId()).toBe(9);
	expect(vm.formatFile('PDF', 2048)).toBe('PDF (2 kb)');
});

describe('AttachmentPopup: nombres repetidos');

it('IsNotUniqueName detecta otra descripción igual y no cuenta el propio adjunto', () => {
	const { vm } = setup([makeItem({ Id: 1, Caption: 'Informe' }), makeItem({ Id: 2, Caption: 'Anexo' })]);
	vm.item = makeItem({ Id: 1, Caption: 'Informe' });
	vm.localCaption = 'Informe';
	expect(vm.IsNotUniqueName()).toBe(false);
	vm.localCaption = 'Anexo';
	expect(vm.IsNotUniqueName()).toBe(true);
	vm.localCaption = 'Otro';
	expect(vm.IsNotUniqueName()).toBe(false);
});

describe('AttachmentPopup: guardado');

it('save exige una descripción', () => {
	const { vm, browser, refs } = setup();
	vm.item = makeItem({ Caption: 'Informe' });
	vm.localCaption = '';
	vm.save();
	expect(browser.alerts).toEqual(['Debe indicar una descripción para el adjunto.']);
	expect(refs.invoker.saved).toHaveLength(0);
	vm.localCaption = null;
	vm.save();
	expect(browser.alerts).toHaveLength(2);
});

it('save de un adjunto nuevo con la descripción tomada del archivo no se bloquea por la descripción inicial vacía', () => {
	const { vm, refs } = setup();
	vm.item = makeItem({ Id: null, Caption: '', File: { Id: null } });
	vm.localCaption = 'Del archivo';
	vm.hasFiles = true;
	vm.bucketId = 5;
	vm.save();
	expect(refs.invoker.saved).toHaveLength(1);
});

it('save rechaza una descripción repetida', () => {
	const { vm, browser, refs } = setup([makeItem({ Id: 2, Caption: 'Anexo' })]);
	vm.item = makeItem({ Id: 1 });
	vm.localCaption = 'Anexo';
	vm.save();
	expect(browser.alerts).toEqual(['Ya existe un adjunto con esa descripción.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save con una carga en curso queda pendiente hasta que termine', () => {
	const { vm, refs } = setup();
	vm.item = makeItem();
	vm.localCaption = 'Nueva';
	vm.sending = true;
	vm.save();
	expect(vm.saveRequested).toBe(true);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save envía una copia del adjunto con la descripción editada y la carga si hay archivo, y cierra al terminar', async () => {
	const { vm, refs, metadata } = setup();
	const item = makeItem();
	vm.item = item;
	vm.localCaption = 'Informe 2';
	vm.hasFiles = true;
	vm.bucketId = 77;
	vm.saveRequested = true;
	vm.openEditableAttach = true;
	vm.save();
	const call = refs.invoker.saved[0];
	expect(call[0] === metadata).toBeTruthy();
	expect(call[1] === metadata.UpdateFile).toBeTruthy();
	expect(call[2].Caption).toBe('Informe 2');
	expect(call[2] === item).toBe(false);
	expect(item.Caption).toBe('Informe');
	expect(call[3]).toBe(77);
	expect(vm.saveRequested).toBe(false);
	await flushPromises();
	expect(vm.openEditableAttach).toBe(false);
	expect(vm.bucketId).toBe('');
});

it('save sin archivo nuevo no envía carga', () => {
	const { vm, refs } = setup();
	vm.item = makeItem();
	vm.localCaption = 'Informe';
	vm.hasFiles = false;
	vm.save();
	expect(refs.invoker.saved[0][3]).toBeNull();
});

describe('AttachmentPopup: carga del archivo');

it('beforeSending registra el nombre y tipo del archivo, propone la descripción y marca el envío', () => {
	const { vm } = setup();
	vm.item = { Caption: '', File: { Id: null } };
	vm.localCaption = '';
	vm.beforeSending({ name: 'Informe final.pdf' });
	expect(vm.item.File.Name).toBe('Informe final.pdf');
	expect(vm.item.File.Type).toBe('application/pdf');
	expect(vm.localCaption).toBe('Informe final');
	expect(vm.sending).toBe(true);
});

it('beforeSending conserva una descripción ya escrita', () => {
	const { vm } = setup();
	vm.item = { Caption: '', File: { Id: null } };
	vm.localCaption = 'Mi descripción';
	vm.beforeSending({ name: 'otro.pdf' });
	expect(vm.localCaption).toBe('Mi descripción');
});

it('afterComplete y afterSuccess terminan el envío y registran que hay archivo', () => {
	const { vm } = setup();
	vm.sending = true;
	vm.afterComplete({}, {});
	expect([vm.sending, vm.hasFiles]).toEqual([false, true]);
	vm.sending = true;
	vm.hasFiles = false;
	vm.afterSuccess({}, {});
	expect([vm.sending, vm.hasFiles]).toEqual([false, true]);
});

it('maxfilesexceeded reemplaza el archivo y clear descarta los archivos', () => {
	const { vm, refs } = setup();
	const file = { name: 'nuevo.pdf' };
	vm.maxfilesexceeded(file);
	expect(refs.myVueDropzone.removed).toBe(1);
	expect(refs.myVueDropzone.added).toEqual([file]);
	vm.hasFiles = true;
	vm.clear();
	expect(refs.myVueDropzone.removed).toBe(2);
	expect(vm.hasFiles).toBe(false);
});
