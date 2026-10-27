import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import NewDataset from '@/backoffice/views/Dataset/NewDataset.vue';
import FixPolygon from '@/backoffice/components/FixPolygon.vue';
import FixCode from '@/backoffice/components/FixCode.vue';
import InputPopup from '@/backoffice/components/InputPopup.vue';
import ListSelectionPopup from '@/backoffice/components/ListSelectionPopup.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setupNewDataset() {
	const browser = setupBackoffice('P');
	const work = { CreateNewDataset() {} };
	browser.window.Context.CurrentWork = work;
	browser.window.Db.RebindAndFocusLastDataset = function () {};
	const input = { focused: 0, focus() { this.focused++; }, input: { $el: {} } };
	const refs = {
		datasetInput: input,
		invoker: { messages: [], result: Promise.resolve(), doMessage(...args) { this.messages.push(args); return this.result; } },
	};
	const router = { name: 'router' };
	const vm = mountLite(NewDataset, { mocks: { $refs: refs, $router: router } });
	return { vm: vm, work: work, refs: refs, browser: browser, input: input, router: router };
}

describe('NewDataset: alta');

it('al montar enfoca el campo del nombre y permite crear con la tecla Enter', async () => {
	const { vm, input } = setupNewDataset();
	const created = [];
	vm.performNewDataset = function () { created.push(1); };
	NewDataset.mounted.call(vm);
	await Promise.resolve();
	expect(input.focused).toBe(1);
	expect(input.input.$el.onkeydown({ keyCode: 13 })).toBe(false);
	input.input.$el.onkeydown({ keyCode: 65 });
	expect(created).toHaveLength(1);
});

it('performNewDataset exige un nombre y vuelve a enfocar el campo', async () => {
	const { vm, browser, refs, input } = setupNewDataset();
	vm.newDatasetName = '   ';
	vm.performNewDataset();
	expect(browser.alerts).toEqual(['Debe indicar un nombre.']);
	expect(refs.invoker.messages).toHaveLength(0);
	await Promise.resolve();
	expect(input.focused).toBe(1);
});

it('performNewDataset crea el dataset con el nombre sin espacios sobrantes y luego enlaza el último', async () => {
	const { vm, refs, work, browser, router } = setupNewDataset();
	vm.newDatasetName = '  Escuelas  ';
	vm.performNewDataset();
	expect(refs.invoker.messages[0][0]).toBe('Creando dataset');
	expect(refs.invoker.messages[0][2] === work.CreateNewDataset).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe('Escuelas');
	await flushPromises();
	expect(refs.invoker.messages[1][0]).toBe('Obteniendo dataset');
	expect(refs.invoker.messages[1][2] === browser.window.Db.RebindAndFocusLastDataset).toBeTruthy();
	expect(refs.invoker.messages[1][3] === router).toBeTruthy();
});

describe('Fix de polígono y de código');

it('show abre el diálogo con el valor actual y enfoca el campo, y save avisa que se corrigió', async () => {
	for (const [Component, refName] of [[FixPolygon, 'datasetInput'], [FixCode, 'input']]) {
		const browser = setupBackoffice('P');
		const focused = [];
		const vm = mountLite(Component, { mocks: { $refs: { [refName]: { focus() { focused.push(1); } } } } });
		vm.show('valor actual');
		expect(vm.openPopup).toBe(true);
		expect(vm.newValue).toBe('valor actual');
		await waitTimers(130);
		expect(focused).toHaveLength(1);
		vm.save();
		expect(vm.openPopup).toBe(false);
		expect(vm.$emitted).toEqual([['fixed']]);
		expect(browser).toBeTruthy();
	}
});

describe('InputPopup: texto');

function setupInput() {
	const browser = setupBackoffice('P');
	const focused = [];
	const vm = mountLite(InputPopup, { mocks: { $refs: { inputName: { focus() { focused.push(1); } } } } });
	return { vm: vm, focused: focused, browser: browser };
}

it('show recibe el título, el texto, la etiqueta, la ayuda, el valor y el máximo, y enfoca el campo', async () => {
	const { vm, focused } = setupInput();
	vm.show('Importar', 'Indique un nombre', 'Nombre', 'Ej. Escuelas', 'archivo', 100);
	expect([vm.title, vm.text, vm.label, vm.helper, vm.result, vm.maxlength]).toEqual(['Importar', 'Indique un nombre', 'Nombre', 'Ej. Escuelas', 'archivo', 100]);
	expect(vm.openDialog).toBe(true);
	await waitTimers(160);
	expect(focused).toHaveLength(1);
});

it('save no hace nada con un valor vacío', () => {
	const { vm } = setupInput();
	vm.result = '   ';
	vm.openDialog = true;
	vm.save();
	expect(vm.openDialog).toBe(true);
	expect(vm.$emitted).toHaveLength(0);
});

it('save cierra el diálogo e informa el valor elegido', () => {
	const { vm } = setupInput();
	vm.result = 'Escuelas';
	vm.openDialog = true;
	vm.save();
	expect(vm.openDialog).toBe(false);
	expect(vm.$emitted).toEqual([['selected', 'Escuelas']]);
});

describe('ListSelectionPopup: elección de un ítem');

it('show conserva la lista recibida, o antepone la opción TODOS si se pide', () => {
	const browser = setupBackoffice('P');
	const vm = mountLite(ListSelectionPopup, {});
	const list = [{ Id: 1, Caption: 'Hoja 1' }];
	vm.show('Título', 'Texto', null, list, false);
	expect(vm.listValues === list).toBeTruthy();
	expect(vm.openDialog).toBe(true);
	vm.show('Título', 'Texto', null, list, true);
	expect(vm.listValues).toEqual([{ Id: -1, Caption: '[ TODOS ]' }, { Id: 1, Caption: 'Hoja 1' }]);
	expect(vm.listValues === list).toBe(false);
	expect(browser).toBeTruthy();
});

it('save cierra el diálogo e informa el ítem elegido', () => {
	const browser = setupBackoffice('P');
	const vm = mountLite(ListSelectionPopup, {});
	const item = { Id: 1, Caption: 'Hoja 1' };
	vm.openDialog = true;
	vm.save(item);
	expect(vm.openDialog).toBe(false);
	expect(vm.result === item).toBeTruthy();
	expect(vm.$emitted[0][0]).toBe('selected');
	expect(vm.$emitted[0][1] === item).toBeTruthy();
	expect(browser).toBeTruthy();
});
