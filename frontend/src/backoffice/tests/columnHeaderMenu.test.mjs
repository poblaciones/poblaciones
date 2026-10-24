import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import ColumnHeaderMenu from '@/backoffice/components/ColumnHeaderMenu.vue';

function setup() {
	const browser = setupBackoffice('P');
	browser.window.innerWidth = 1000;
	browser.window.Context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	const vm = mountLite(ColumnHeaderMenu, {});
	return { vm: vm, browser: browser };
}

describe('ColumnHeaderMenu: propiedades calculadas');

it('canEdit refleja el permiso del trabajo y es falso sin trabajo', () => {
	const { vm, browser } = setup();
	expect(vm.canEdit).toBe(true);
	browser.window.Context.CurrentWork.canEdit = false;
	expect(vm.canEdit).toBe(false);
	browser.window.Context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
});

it('menuStyle arma la posición y el ancho fijo del menú', () => {
	const { vm } = setup();
	vm.left = 120;
	vm.top = 45;
	expect(vm.menuStyle).toBe('left: 120px; top: 45px; width: 230px;');
});

it('hasSort es verdadero solo con un orden definido', () => {
	const { vm } = setup();
	expect(vm.hasSort).toBe(false);
	vm.sortDirection = undefined;
	expect(vm.hasSort).toBe(false);
	vm.sortDirection = 'asc';
	expect(vm.hasSort).toBe(true);
});

it('canAutoRecode exige una columna de texto y canCategories cualquier columna', () => {
	const { vm } = setup();
	expect(vm.canAutoRecode).toBe(false);
	expect(vm.canCategories).toBe(false);
	vm.column = { Format: 1 };
	expect(vm.canAutoRecode).toBe(true);
	expect(vm.canCategories).toBe(true);
	vm.column = { Format: 5 };
	expect(vm.canAutoRecode).toBe(false);
	expect(vm.canCategories).toBe(true);
});

describe('ColumnHeaderMenu: posición');

it('show alinea el borde derecho del menú con el del botón y lo deja justo debajo', () => {
	const { vm } = setup();
	const column = { Id: 1 };
	vm.show(column, { right: 600, bottom: 80 }, 'asc');
	expect(vm.column === column).toBeTruthy();
	expect(vm.sortDirection).toBe('asc');
	expect(vm.left).toBe(370);
	expect(vm.top).toBe(82);
	expect(vm.visible).toBe(true);
});

it('show corrige la posición si el menú se saldría de la ventana', () => {
	const { vm } = setup();
	vm.show({ Id: 1 }, { right: 100, bottom: 10 });
	expect(vm.left).toBe(4);
	vm.show({ Id: 1 }, { right: 1200, bottom: 10 });
	expect(vm.left).toBe(1000 - 230 - 4);
});

it('show redondea la posición y toma null como orden si no se informa', () => {
	const { vm } = setup();
	vm.show({ Id: 1 }, { right: 500.4, bottom: 20.6 });
	expect(vm.left).toBe(270);
	expect(vm.top).toBe(23);
	expect(vm.sortDirection).toBeNull();
});

describe('ColumnHeaderMenu: cierre');

it('close oculta el menú', () => {
	const { vm } = setup();
	vm.visible = true;
	vm.close();
	expect(vm.visible).toBe(false);
});

it('un clic fuera del menú lo cierra y uno dentro lo deja abierto', () => {
	const { vm } = setup();
	vm.$el = { contains(target) { return target === 'dentro'; } };
	vm.visible = true;
	vm.onDocumentClick({ target: 'dentro' });
	expect(vm.visible).toBe(true);
	vm.onDocumentClick({ target: 'fuera' });
	expect(vm.visible).toBe(false);
});

it('un clic con el menú oculto no hace nada', () => {
	const { vm } = setup();
	vm.$el = { contains() { return false; } };
	vm.onDocumentClick({ target: 'fuera' });
	expect(vm.visible).toBe(false);
});

it('la tecla Escape cierra el menú visible y otras teclas no', () => {
	const { vm } = setup();
	vm.visible = true;
	vm.onKeyDown({ keyCode: 13 });
	expect(vm.visible).toBe(true);
	vm.onKeyDown({ keyCode: 27 });
	expect(vm.visible).toBe(false);
	vm.onKeyDown({ keyCode: 27 });
});

it('emitAndClose cierra el menú y emite la acción con la columna', () => {
	const { vm } = setup();
	const column = { Id: 3 };
	vm.column = column;
	vm.visible = true;
	vm.emitAndClose('delete');
	expect(vm.visible).toBe(false);
	expect(vm.$emitted).toHaveLength(1);
	expect(vm.$emitted[0][0]).toBe('delete');
	expect(vm.$emitted[0][1] === column).toBeTruthy();
});
