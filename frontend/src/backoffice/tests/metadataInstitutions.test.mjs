import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import Institutions from '@/backoffice/views/Metadata/Institutions.vue';

function makeInstitution(id, overrides) {
	return Object.assign({ Id: id, Caption: 'Institución ' + id, IsGlobal: false }, overrides);
}

function setup(institutions, saved) {
	const browser = setupBackoffice('P');
	browser.window.Context.CanEditStaticLists = function () { return true; };
	const metadata = {
		Institutions: institutions || [],
		UpdateMetadataInstitution() {},
		RemoveInstitution() {},
		MoveInstitutionUp() {},
		MoveInstitutionDown() {},
	};
	const refs = {
		invoker: {
			saved: [],
			confirmDos: [],
			confirms: [],
			saveResult: Promise.resolve(saved),
			doSave(...args) { this.saved.push(args); return this.saveResult; },
			confirmDo(...args) { this.confirmDos.push(args); },
			confirm(title, message, callback) { this.confirms.push({ title: title, message: message, callback: callback }); },
		},
		InstitutionPopup: { shown: [], show(...args) { this.shown.push(args); } },
		PickInstitution: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(Institutions, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs };
}

describe('Instituciones: listado');

it('al montar toma las instituciones de los metadatos y expone el permiso de listas', () => {
	const { vm, metadata } = setup([makeInstitution(1)]);
	Institutions.mounted.call(vm);
	expect(vm.institutions === metadata.Institutions).toBeTruthy();
	expect(vm.CanEditStaticLists).toBe(true);
	expect(vm.container).toEqual({});
});

it('isFirst e isLast identifican la posición de la institución', () => {
	const items = [makeInstitution(1), makeInstitution(2), makeInstitution(3)];
	const { vm } = setup(items);
	expect(vm.isFirst(items[0])).toBe(true);
	expect(vm.isFirst(items[1])).toBe(false);
	expect(vm.isLast(items[2])).toBe(true);
	expect(vm.isLast(items[0])).toBe(false);
});

describe('Instituciones: selección');

it('selected guarda la institución elegida en el contenedor y la graba', () => {
	const item = makeInstitution(5);
	const { vm, refs, metadata } = setup([], item);
	vm.selected(null, item);
	expect(vm.container.Institution === item).toBeTruthy();
	expect(refs.invoker.saved[0][1] === metadata.UpdateMetadataInstitution).toBeTruthy();
	expect(refs.invoker.saved[0][2] === item).toBeTruthy();
});

it('selected reemplaza la institución guardada que ya estaba en la lista', async () => {
	const saved = makeInstitution(5, { Caption: 'Editada' });
	const { vm, metadata } = setup([makeInstitution(4), makeInstitution(5)], saved);
	vm.selected(null, makeInstitution(5));
	await flushPromises();
	expect(metadata.Institutions).toHaveLength(2);
	expect(metadata.Institutions[1].Caption).toBe('Editada');
});

it('selected agrega a la lista una institución nueva', async () => {
	const saved = makeInstitution(9);
	const { vm, metadata } = setup([makeInstitution(4)], saved);
	vm.selected(null, makeInstitution(0));
	await flushPromises();
	expect(metadata.Institutions.map(function (item) { return item.Id; })).toEqual([4, 9]);
});

describe('Instituciones: acciones');

it('onDelete pide confirmar y quita la institución de los metadatos', () => {
	const { vm, refs, metadata } = setup();
	const item = makeInstitution(1);
	vm.onDelete(item);
	expect(refs.invoker.message).toBe('Quitando institución...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Quitar institución', 'La institución será removida de la lista']);
	expect(refs.invoker.confirmDos[0][3] === metadata.RemoveInstitution).toBeTruthy();
	expect(refs.invoker.confirmDos[0][4] === item).toBeTruthy();
});

it('addInstitution abre el selector, y up y down graban el movimiento', () => {
	const { vm, refs, metadata } = setup();
	const item = makeInstitution(1);
	vm.addInstitution();
	vm.up(item);
	vm.down(item);
	expect(refs.PickInstitution.shown).toBe(1);
	expect(refs.invoker.saved[0][1] === metadata.MoveInstitutionUp).toBeTruthy();
	expect(refs.invoker.saved[1][1] === metadata.MoveInstitutionDown).toBeTruthy();
});

it('openEdition abre el popup con una copia de la institución', () => {
	const { vm, refs } = setup();
	const item = makeInstitution(1);
	vm.openEdition(item);
	expect(refs.InstitutionPopup.shown[0][0]).toEqual(item);
	expect(refs.InstitutionPopup.shown[0][0] === item).toBe(false);
});

it('editar una institución global pide confirmar que afectará a otras cartografías', () => {
	const { vm, refs } = setup();
	vm.openEditionWarning(makeInstitution(1, { IsGlobal: true }));
	expect(refs.invoker.confirms[0].title).toBe('Editar institución');
	expect(refs.InstitutionPopup.shown).toHaveLength(0);
	refs.invoker.confirms[0].callback();
	expect(refs.InstitutionPopup.shown).toHaveLength(1);
});

it('editar una institución propia la abre directamente', () => {
	const { vm, refs } = setup();
	vm.openEditionWarning(makeInstitution(1));
	expect(refs.invoker.confirms).toHaveLength(0);
	expect(refs.InstitutionPopup.shown).toHaveLength(1);
});
