import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import PickInstitution from '@/backoffice/views/Metadata/PickInstitution.vue';
import SourcePopup from '@/backoffice/views/Metadata/SourcePopup.vue';
import { flushPromises } from './fixtures.mjs';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setupPick() {
	const browser = setupBackoffice('P');
	browser.window.Context.Institutions = { GetAll(callback) { callback([{ Id: 1, Caption: 'INDEC' }]); } };
	browser.window.Context.Factory = { GetCopy(type, callback) { callback({ Type: type, Id: null }); } };
	const refs = { InstitutionPopup: { shown: [], show(...args) { this.shown.push(args); } } };
	const vm = mountLite(PickInstitution, { propsData: { container: {}, canEdit: true, Metadata: {} }, mocks: { $refs: refs } });
	return { vm: vm, refs: refs, browser: browser };
}

describe('PickInstitution: selección');

it('la grilla muestra nombre y país', () => {
	const { vm } = setupPick();
	expect(vm.gridColumns.map(function (column) { return column.caption; })).toEqual(['Nombre', 'País']);
});

it('show trae las instituciones del contexto y abre el selector', () => {
	const { vm } = setupPick();
	vm.show();
	expect(vm.institutions).toEqual([{ Id: 1, Caption: 'INDEC' }]);
	expect(vm.openInstitutions).toBe(true);
});

it('save sin institución elegida avisa', () => {
	const { vm, browser } = setupPick();
	vm.save();
	expect(browser.alerts).toEqual(['No ha seleccionado ninguna institución.']);
	expect(vm.$emitted).toHaveLength(0);
});

it('onRowClick selecciona la institución, la informa y cierra el selector', () => {
	const { vm } = setupPick();
	const item = { Id: 1, Caption: 'INDEC' };
	vm.openInstitutions = true;
	vm.onRowClick({}, item);
	expect(vm.selected === item).toBeTruthy();
	expect(vm.$emitted).toHaveLength(1);
	expect(vm.$emitted[0][0]).toBe('onSelected');
	expect(vm.$emitted[0][1] === item).toBeTruthy();
	expect(vm.$emitted[0][2] === item).toBeTruthy();
	expect(vm.openInstitutions).toBe(false);
});

it('CreateNewInstitution toma una institución nueva del catálogo, editable por el usuario, y abre su edición', () => {
	const { vm, refs } = setupPick();
	vm.CreateNewInstitution();
	const [data, callback] = refs.InstitutionPopup.shown[0];
	expect(data).toEqual({ Type: 'Institution', Id: null, IsEditableByCurrentUser: true });
	vm.openInstitutions = true;
	callback();
	expect(vm.openInstitutions).toBe(false);
});

function setupSource(itemOverrides) {
	const browser = setupBackoffice('P');
	const metadata = { UpdateSource() {} };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); return Promise.resolve(); } },
		datasetInput: { focused: 0, focus() { this.focused++; } },
	};
	const vm = mountLite(SourcePopup, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	vm.item = Object.assign({ Caption: 'Censo', Version: '2022', Institution: null }, itemOverrides);
	return { vm: vm, metadata: metadata, refs: refs, browser: browser };
}

describe('SourcePopup: apertura');

it('institutionSelected devuelve el identificador de la institución o -1', () => {
	const { vm } = setupSource();
	expect(vm.institutionSelected).toBe(-1);
	vm.item.Institution = { Id: 12 };
	expect(vm.institutionSelected).toBe(12);
	vm.item = null;
	expect(vm.institutionSelected).toBe(-1);
});

it('show abre la edición, recuerda el callback del padre y enfoca el nombre', async () => {
	const { vm, refs } = setupSource();
	const item = { Caption: 'Nueva' };
	const callback = function () {};
	vm.show(item, callback);
	expect(vm.item === item).toBeTruthy();
	expect(vm.closeParentCallback === callback).toBeTruthy();
	expect(vm.openEditableSource).toBe(true);
	await waitTimers(130);
	expect(refs.datasetInput.focused).toBe(1);
	vm.show(item);
	expect(vm.closeParentCallback).toBeNull();
});

describe('SourcePopup: guardado');

it('save exige un nombre y una edición', () => {
	const { vm, browser, refs } = setupSource();
	vm.item.Caption = '  ';
	vm.save();
	vm.item.Caption = null;
	vm.save();
	vm.item.Caption = 'Censo';
	vm.item.Version = ' ';
	vm.save();
	vm.item.Version = null;
	vm.save();
	expect(browser.alerts).toEqual([
		"Debe indicar un valor para 'Nombre' de la fuente.", "Debe indicar un valor para 'Nombre' de la fuente.",
		"Debe indicar un valor para 'Edición' de la fuente.", "Debe indicar un valor para 'Edición' de la fuente.",
	]);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save graba la fuente, cierra la edición y avisa al padre', async () => {
	const { vm, refs, metadata } = setupSource();
	const calls = [];
	vm.closeParentCallback = function () { calls.push(1); };
	vm.openEditableSource = true;
	vm.save();
	expect(refs.invoker.saved[0][1] === metadata.UpdateSource).toBeTruthy();
	expect(refs.invoker.saved[0][2] === vm.item).toBeTruthy();
	await flushPromises();
	expect(vm.openEditableSource).toBe(false);
	expect(calls).toEqual([1]);
});

it('save sin callback del padre solo cierra la edición', async () => {
	const { vm } = setupSource();
	vm.closeParentCallback = null;
	vm.openEditableSource = true;
	vm.save();
	await flushPromises();
	expect(vm.openEditableSource).toBe(false);
});
