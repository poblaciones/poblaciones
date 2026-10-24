import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import IconPickerPopup from '@/backoffice/components/IconPickerPopup.vue';

function setup(icons) {
	const browser = setupBackoffice('P');
	const work = {
		Icons: icons || [],
		UpdateIcon() {},
		CreateIcon() {},
		DeleteIcon() {},
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: { saved: [], confirmDos: [], result: Promise.resolve({ Id: 55 }), doSave(...args) { this.saved.push(args); return this.result; }, confirmDo(...args) { this.confirmDos.push(args); } },
		customIcon: { selectedId: 3 },
	};
	const vm = mountLite(IconPickerPopup, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs, browser: browser };
}

describe('IconPickerPopup: apertura');

it('customList toma los íconos propios del trabajo', () => {
	const { vm, work } = setup([{ Id: 1 }]);
	expect(vm.customList === work.Icons).toBeTruthy();
});

it('show sin símbolo abre el diálogo en la solapa por defecto', () => {
	const { vm } = setup();
	vm.show(null);
	expect(vm.openPopup).toBe(true);
	expect(vm.currentTab).toBe('mapIcons');
});

it('show con un símbolo elige la solapa según su prefijo', () => {
	const { vm } = setup();
	vm.show('usu-casa');
	expect([vm.currentTab, vm.symbolCustom]).toEqual(['custom', 'usu-casa']);
	vm.show('fa-user');
	expect([vm.currentTab, vm.symbolFa]).toEqual(['fontAwesome', 'fa-user']);
	vm.show('mp-escuela');
	expect([vm.currentTab, vm.symbolMapIcons]).toEqual(['mapIcons', 'mp-escuela']);
});

it('close cierra el diálogo y setTab cambia de solapa', () => {
	const { vm } = setup();
	vm.openPopup = true;
	vm.close();
	expect(vm.openPopup).toBe(false);
	vm.setTab('custom');
	expect(vm.currentTab).toBe('custom');
	vm.onClosed();
});

describe('IconPickerPopup: selección');

it('save exige elegir un ícono', () => {
	const { vm, browser } = setup();
	vm.currentTab = 'fontAwesome';
	vm.save();
	expect(browser.alerts).toEqual(['Debe seleccionar un ícono']);
	expect(vm.$emitted).toHaveLength(0);
});

it('save emite el ícono de la solapa activa y cierra el diálogo', () => {
	const cases = [['mapIcons', 'symbolMapIcons', 'mp-a'], ['fontAwesome', 'symbolFa', 'fa-b'], ['custom', 'symbolCustom', 'usu-c']];
	for (const [tab, property, value] of cases) {
		const { vm } = setup();
		vm.currentTab = tab;
		vm[property] = value;
		vm.openPopup = true;
		vm.save();
		expect(vm.$emitted).toEqual([['input', value], ['iconSelected', value]]);
		expect(vm.openPopup).toBe(false);
	}
});

describe('IconPickerPopup: nombres de íconos propios');

it('sanitize pasa a minúsculas, reemplaza separadores, quita símbolos y usa guion', () => {
	const { vm } = setup();
	expect(vm.sanitize('Casa')).toBe('casa');
	expect(vm.sanitize('Mi Ícono!')).toBe('mi-cono');
	expect(vm.sanitize('hospital-central')).toBe('hospital-central');
});

it('sanitize reemplaza todos los separadores, no solo el primero', () => {
	const { vm } = setup();
	expect(vm.sanitize('mi icono grande')).toBe('mi-icono-grande');
	expect(vm.sanitize('mi-icono_grande final')).toBe('mi-icono-grande-final');
});

it('sanitize limita el nombre a 40 caracteres', () => {
	const { vm } = setup();
	expect(vm.sanitize('a'.repeat(60))).toHaveLength(40);
});

it('getNewName parte del nombre del archivo sin extensión, con prefijo usu-', () => {
	const { vm } = setup();
	expect(vm.getNewName('Hospital Central.png')).toBe('usu-hospital-central');
	expect(vm.getNewName(null)).toBe('usu-');
	expect(vm.getNewName('sin extension')).toBe('usu-sin-extension');
});

it('getNewName agrega un sufijo numérico si el nombre ya existe', () => {
	const { vm } = setup([{ Caption: 'usu-casa' }, { Caption: 'usu-casa_1' }]);
	expect(vm.getNewName('casa.png')).toBe('usu-casa_2');
	expect(vm.icon_exists('usu-casa')).toBe(true);
	expect(vm.icon_exists('usu-otra')).toBe(false);
});

describe('IconPickerPopup: gestión de íconos');

it('createIcon sube el ícono con su nombre nuevo, lo agrega a la lista y lo selecciona', async () => {
	const { vm, work, refs } = setup();
	vm.createIcon('imagen-base64', 'Casa.png');
	expect(refs.invoker.saved[0][0] === work).toBeTruthy();
	expect(refs.invoker.saved[0][1] === work.CreateIcon).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual(['usu-casa', 'imagen-base64']);
	await flushPromises();
	expect(work.Icons).toEqual([{ Id: 55, Caption: 'usu-casa', Image: 'imagen-base64' }]);
	expect(vm.symbolCustom).toBe('usu-casa');
});

it('updateIcon renombra el ícono seleccionado con el prefijo y el nombre normalizado', () => {
	const { vm, work, refs } = setup();
	vm.updateIcon('Mi Casa');
	expect(refs.invoker.saved[0][1] === work.UpdateIcon).toBeTruthy();
	expect(refs.invoker.saved[0].slice(2)).toEqual([3, 'usu-mi-casa']);
});

it('deleteIcon pide confirmar y elimina el ícono seleccionado', () => {
	const { vm, work, refs } = setup();
	vm.deleteIcon();
	expect(refs.invoker.message).toBe('Eliminando...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Eliminar ícono', 'El ícono seleccionada será eliminado']);
	expect(refs.invoker.confirmDos[0][3] === work.DeleteIcon).toBeTruthy();
	expect(refs.invoker.confirmDos[0][4]).toBe(3);
});

describe('IconPickerPopup: edición del nombre');

it('al cambiar el ícono propio actualiza la parte editable del nombre', () => {
	const { vm } = setup();
	vm.symbolCustom = 'usu-casa';
	IconPickerPopup.watch.symbolCustom.call(vm);
	expect(vm.symbolCustomPartial).toBe('casa');
});

it('al editar la parte del nombre se actualiza el ícono propio y su título en la lista', () => {
	const { vm, work } = setup([{ Id: 3, Caption: 'usu-casa' }]);
	vm.symbolCustom = 'usu-casa';
	vm.symbolCustomPartial = 'casona';
	IconPickerPopup.watch.symbolCustomPartial.call(vm);
	expect(vm.symbolCustom).toBe('usu-casona');
	expect(work.Icons[0].Caption).toBe('usu-casona');
});
