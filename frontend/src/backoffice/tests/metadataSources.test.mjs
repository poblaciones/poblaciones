import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import PickSource from '@/backoffice/views/Metadata/PickSource.vue';
import Sources from '@/backoffice/views/Metadata/Sources.vue';

function makeSource(id, overrides) {
	return Object.assign({ Id: id, Caption: 'Fuente ' + id, Institution: null, IsGlobal: false }, overrides);
}

function makeMetadata(sources, publicData) {
	return {
		Sources: sources,
		Work: { IsPublicData() { return publicData; } },
		ContainsSource(item) {
			return this.Sources.some(function (source) { return source.Id === item.Id; });
		},
		AddSource() {},
		RemoveSource() {},
		MoveSourceUp() {},
		MoveSourceDown() {},
	};
}

function makeInvoker() {
	return {
		saved: [],
		confirmDos: [],
		confirms: [],
		doSave(...args) { this.saved.push(args); return Promise.resolve(); },
		confirmDo(...args) { this.confirmDos.push(args); },
		confirm(title, message, callback) { this.confirms.push({ title: title, message: message, callback: callback }); },
	};
}

function setupPick(sources, publicData) {
	const browser = setupBackoffice('P');
	const metadata = makeMetadata(sources || [], publicData === true);
	browser.window.Context.Sources = { GetAll(callback) { callback([makeSource(1), makeSource(2)]); } };
	browser.window.Context.Factory = { GetCopy(type, callback) { callback({ Type: type, Id: null }); } };
	const refs = { invoker: makeInvoker(), SourcePopup: { shown: [], show(...args) { this.shown.push(args); } } };
	const vm = mountLite(PickSource, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs, browser: browser };
}

function setupSources(sources, publicData) {
	const browser = setupBackoffice('P');
	const metadata = makeMetadata(sources || [], publicData === true);
	browser.window.Context.CanEditStaticLists = function () { return true; };
	const refs = { invoker: makeInvoker(), SourcePopup: { shown: [], show(...args) { this.shown.push(args); } }, PickSource: { shown: 0, show() { this.shown++; } } };
	const vm = mountLite(Sources, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs };
}

describe('PickSource: presentación');

it('SecondaryLabel dice "secundarias" salvo en datos públicos', () => {
	expect(setupPick([], false).vm.SecondaryLabel).toBe(' secundarias');
	expect(setupPick([], true).vm.SecondaryLabel).toBe('');
});

it('getInstitutionCaption devuelve el nombre de la institución, o vacío', () => {
	const { vm } = setupPick();
	expect(vm.getInstitutionCaption(makeSource(1))).toBe('');
	expect(vm.getInstitutionCaption(makeSource(1, { Institution: { Caption: 'INDEC' } }))).toBe('INDEC');
});

it('la grilla muestra nombre, edición e institución', () => {
	const { vm } = setupPick();
	const columns = vm.gridColumns;
	expect(columns.map(function (column) { return column.caption; })).toEqual(['Nombre', 'Edición', 'Institución']);
	expect(columns[2].value(makeSource(1, { Institution: { Caption: 'INDEC' } }))).toBe('INDEC');
});

describe('PickSource: selección');

it('show trae las fuentes del contexto y abre el selector', () => {
	const { vm } = setupPick();
	vm.show();
	expect(vm.sources.map(function (source) { return source.Id; })).toEqual([1, 2]);
	expect(vm.openSources).toBe(true);
});

it('save sin fuente elegida avisa', () => {
	const { vm, browser, refs } = setupPick();
	vm.save();
	expect(browser.alerts).toEqual(['No ha seleccionado ninguna fuente.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save de una fuente que ya está en la lista avisa', () => {
	const { vm, browser, refs } = setupPick([makeSource(1)]);
	vm.selected = makeSource(1);
	vm.save();
	expect(browser.alerts).toEqual(['Se ha seleccionada una fuente que ya es parte de la lista.']);
	expect(refs.invoker.saved).toHaveLength(0);
});

it('save agrega la fuente a los metadatos y cierra el selector', async () => {
	const { vm, refs, metadata } = setupPick([makeSource(1)]);
	vm.selected = makeSource(2);
	vm.openSources = true;
	vm.save();
	expect(refs.invoker.saved[0][1] === metadata.AddSource).toBeTruthy();
	await flushPromises();
	expect(vm.openSources).toBe(false);
});

it('onRowClick selecciona la fila y la guarda', () => {
	const { vm, refs } = setupPick();
	const item = makeSource(3);
	vm.onRowClick({}, item);
	expect(vm.selected === item).toBeTruthy();
	expect(refs.invoker.saved).toHaveLength(1);
});

describe('PickSource: alta de fuentes');

it('CreateNewSource toma una fuente nueva del catálogo, editable por el usuario, y abre su edición', () => {
	const { vm, refs } = setupPick();
	vm.CreateNewSource();
	const [data, callback] = refs.SourcePopup.shown[0];
	expect(data).toEqual({ Type: 'Source', Id: null, IsEditableByCurrentUser: true });
	vm.openSources = true;
	callback();
	expect(vm.openSources).toBe(false);
});

describe('Sources: listado');

it('al montar toma las fuentes de los metadatos', () => {
	const { vm, metadata } = setupSources([makeSource(1)]);
	Sources.mounted.call(vm);
	expect(vm.sources === metadata.Sources).toBeTruthy();
});

it('SecondaryLabel y CanEditStaticLists reflejan el tipo de trabajo y los permisos', () => {
	expect(setupSources([], false).vm.SecondaryLabel).toBe(' secundarias');
	expect(setupSources([], true).vm.SecondaryLabel).toBe('');
	expect(setupSources([]).vm.CanEditStaticLists).toBe(true);
});

it('isFirst e isLast identifican la posición de la fuente', () => {
	const sources = [makeSource(1), makeSource(2), makeSource(3)];
	const { vm } = setupSources(sources);
	expect(vm.isFirst(sources[0])).toBe(true);
	expect(vm.isFirst(sources[1])).toBe(false);
	expect(vm.isLast(sources[2])).toBe(true);
	expect(vm.isLast(sources[0])).toBe(false);
});

it('getInstitutionCaption devuelve el nombre de la institución, o vacío', () => {
	const { vm } = setupSources();
	expect(vm.getInstitutionCaption(makeSource(1))).toBe('');
	expect(vm.getInstitutionCaption(makeSource(1, { Institution: { Caption: 'INDEC' } }))).toBe('INDEC');
});

describe('Sources: acciones');

it('onDelete pide confirmar y quita la fuente de los metadatos', () => {
	const { vm, refs, metadata } = setupSources();
	const item = makeSource(1);
	vm.onDelete(item);
	expect(refs.invoker.message).toBe('Quitando fuente...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Quitar fuente', 'La fuente será removida de la lista']);
	expect(refs.invoker.confirmDos[0][2] === metadata).toBeTruthy();
	expect(refs.invoker.confirmDos[0][3] === metadata.RemoveSource).toBeTruthy();
	expect(refs.invoker.confirmDos[0][4] === item).toBeTruthy();
});

it('addSource abre el selector, y up y down graban el movimiento', () => {
	const { vm, refs, metadata } = setupSources();
	const item = makeSource(1);
	vm.addSource();
	vm.up(item);
	vm.down(item);
	expect(refs.PickSource.shown).toBe(1);
	expect(refs.invoker.saved[0][1] === metadata.MoveSourceUp).toBeTruthy();
	expect(refs.invoker.saved[1][1] === metadata.MoveSourceDown).toBeTruthy();
});

it('openEdition abre el popup con una copia de la fuente', () => {
	const { vm, refs } = setupSources();
	const item = makeSource(1);
	vm.openEdition(item);
	expect(refs.SourcePopup.shown[0][0]).toEqual(item);
	expect(refs.SourcePopup.shown[0][0] === item).toBe(false);
});

it('editar una fuente global pide confirmar que afectará a otras cartografías', () => {
	const { vm, refs } = setupSources();
	const item = makeSource(1, { IsGlobal: true });
	vm.openEditionWarning(item);
	expect(refs.invoker.confirms[0].title).toBe('Editar fuente');
	expect(refs.SourcePopup.shown).toHaveLength(0);
	refs.invoker.confirms[0].callback();
	expect(refs.SourcePopup.shown).toHaveLength(1);
});

it('editar una fuente propia la abre directamente', () => {
	const { vm, refs } = setupSources();
	vm.openEditionWarning(makeSource(1));
	expect(refs.invoker.confirms).toHaveLength(0);
	expect(refs.SourcePopup.shown).toHaveLength(1);
});
