import { describe, it, expect } from './_harness.mjs';
import Users from '@/admins/views/Users/Users.vue';
import {
	setupGlobals, mountLite, axios, serve, settle, makeInvoker, makePopup, preload,
} from './fixtures.mjs';

const GET_USERS = 'GET /services/admin/GetUsers';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const vm = mountLite(Users, { refs: { invoker, editPopup } });
	return { env, vm, invoker, editPopup };
}

function user(overrides) {
	return Object.assign({
		Id: 1, Firstname: 'Ana', Lastname: 'Paz', Email: 'ana@mail.com', Privileges: 'P', IsActive: true,
		Cartographies: 2, PublicData: 1, CartographiesNames: 'Obra 1, Obra 2', LastAccess: '2024-05-03T12:00:00',
	}, overrides || {});
}

describe('Users: datos iniciales');

it('parte con la lista vacía y mostrando solo usuarios activos', () => {
	const { vm } = setup();
	expect(vm.list).toEqual([]);
	expect(vm.showInactive).toBe(false);
});

describe('Users.filteredList');

it('oculta los usuarios inactivos salvo que se pida mostrarlos', () => {
	const { vm } = setup();
	vm.list = [user({ Id: 1 }), user({ Id: 2, IsActive: false }), user({ Id: 3 })];
	expect(vm.filteredList.map(function (u) { return u.Id; })).toEqual([1, 3]);
	vm.showInactive = true;
	expect(vm.filteredList.map(function (u) { return u.Id; })).toEqual([1, 2, 3]);
});

describe('Users.gridColumns');

it('define las columnas con su propiedad, título y tamaño', () => {
	const { vm } = setup();
	expect(vm.gridColumns.map(function (c) { return [c.property, c.caption]; })).toEqual([
		['FullName', 'Nombre'],
		['Email', 'Email'],
		['FormattedRole', 'Rol'],
		['Cartographies', 'Cartografías'],
		['LastAccess', 'Último ingreso'],
	]);
	expect(vm.gridColumns.slice(0, 3).map(function (c) { return c.size; })).toEqual([5, 4, 4]);
});

it('la columna de cartografías suma cartografías y datos públicos y muestra los nombres como tooltip', () => {
	const { vm } = setup();
	const column = vm.gridColumns[3];
	expect(column.sortType).toBe('number');
	expect(column.value(user())).toBe(3);
	expect(column.tooltip(user())).toBe('Obra 1, Obra 2');
});

it('la columna de último ingreso formatea la fecha dd/mm/aaaa', () => {
	const { vm } = setup();
	const column = vm.gridColumns[4];
	expect(column.sortType).toBe('date');
	expect(column.value(user())).toBe('03/05/2024');
	expect(column.value(user({ LastAccess: null }))).toBe('-');
});

describe('Users.gridActions');

it('Modificar abre la edición del usuario', () => {
	const { vm, editPopup } = setup();
	const item = user();
	const action = vm.gridActions[0];
	expect(action.caption).toBe('Modificar');
	action.onClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
});

it('Ingresar como muestra el nombre del usuario y lo ejecuta', async () => {
	const { vm, env } = setup();
	serve({ 'GET /services/admin/LoginAs': {} });
	const action = vm.gridActions[1];
	expect(action.caption(user())).toBe('Ingresar como Ana Paz');
	action.onClick(null, user({ Id: 7 }));
	await settle();
	expect(axios.calls[0].config.params).toEqual({ u: 7 });
	expect(env.opened).toEqual([{ url: '/users', target: '_blank' }]);
});

describe('Users.loadData / Users.reloadData');

it('loadData consulta la lista solo si está vacía', async () => {
	const { vm } = setup();
	serve({ [GET_USERS]: [user()] });
	vm.loadData();
	await settle();
	expect(axios.calls).toHaveLength(1);
	vm.loadData();
	await settle();
	expect(axios.calls).toHaveLength(1);
});

it('reloadData pide la lista con el mensaje de espera y completa rol y nombre de cada usuario', async () => {
	const { vm, invoker } = setup();
	const list = vm.list;
	serve({ [GET_USERS]: [user({ Id: 1, Privileges: 'A' }), user({ Id: 2, Firstname: null, Lastname: 'Gómez', IsActive: false })] });
	vm.reloadData();
	expect(invoker.message).toBe('Obteniendo usuarios...');
	expect(invoker.showDialog).toBe(true);
	await settle();
	expect(invoker.showDialog).toBe(false);
	expect(vm.list).toBe(list);
	expect(vm.list.map(function (u) { return u.FormattedRole; })).toEqual([
		'Administrador general', 'Usuario estándar (Sin activación)',
	]);
	expect(vm.list.map(function (u) { return u.FullName; })).toEqual(['Ana Paz', 'Gómez']);
});

it('reloadData reemplaza el contenido anterior de la lista', async () => {
	const { vm } = setup();
	vm.list.push(user({ Id: 99 }));
	serve({ [GET_USERS]: [user({ Id: 1 })] });
	vm.reloadData();
	await settle();
	expect(vm.list.map(function (u) { return u.Id; })).toEqual([1]);
});

describe('Users.formatRole');

it('traduce cada privilegio a su rol', () => {
	const { vm } = setup();
	const expected = {
		A: 'Administrador general',
		E: 'Administrador de datos',
		L: 'Administrador sólo lectura',
		P: 'Usuario estándar',
		X: 'No reconocido',
	};
	Object.keys(expected).forEach(function (privileges) {
		expect(vm.formatRole({ Privileges: privileges, IsActive: true })).toBe(expected[privileges]);
	});
});

it('agrega la marca de falta de activación a los usuarios inactivos', () => {
	const { vm } = setup();
	expect(vm.formatRole({ Privileges: 'E', IsActive: false })).toBe('Administrador de datos (Sin activación)');
	expect(vm.formatRole({ Privileges: 'X', IsActive: false })).toBe('No reconocido (Sin activación)');
});

describe('Users.formatName');

it('combina nombre y apellido sin espacios sobrantes', () => {
	const { vm } = setup();
	expect(vm.formatName({ Firstname: 'Ana', Lastname: 'Paz' })).toBe('Ana Paz');
	expect(vm.formatName({ Firstname: 'Ana', Lastname: null })).toBe('Ana');
	expect(vm.formatName({ Firstname: null, Lastname: 'Paz' })).toBe('Paz');
	expect(vm.formatName({ Firstname: null, Lastname: null })).toBe('');
});

describe('Users.createNewUser');

it('abre la edición con una copia en blanco tomada de la fábrica', () => {
	const { env, vm, editPopup } = setup();
	const blank = { Id: null, Firstname: '', Lastname: '' };
	preload(env.context.Factory, { User: blank });
	vm.createNewUser();
	expect(editPopup.shown).toHaveLength(1);
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

it('si el catálogo de fábricas todavía no cargó, espera la carga y abre la edición con la copia de User (no con todo el catálogo)', async () => {
	const { vm, editPopup } = setup();
	const blank = { Id: null, Firstname: '', Lastname: '' };
	serve({ 'GET /services/backoffice/GetFactories': { User: blank, Other: { Id: 1 } } });
	vm.createNewUser();
	expect(editPopup.shown).toHaveLength(0);
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(editPopup.shown).toHaveLength(1);
	expect(editPopup.shown[0][0]).toEqual(blank);
	expect(editPopup.shown[0][0] === blank).toBe(false);
});

describe('Users: edición');

it('onRowClick abre la edición del usuario de la fila', () => {
	const { vm, editPopup } = setup();
	const item = user();
	vm.onRowClick(null, item);
	expect(editPopup.shown).toEqual([[item]]);
});

it('popupSaved reemplaza al usuario existente o agrega uno nuevo', () => {
	const { vm } = setup();
	vm.list = [user({ Id: 1, Email: 'a@a.com' }), user({ Id: 2 })];
	vm.popupSaved(user({ Id: 1, Email: 'nuevo@a.com' }));
	expect(vm.list).toHaveLength(2);
	expect(vm.list[0].Email).toBe('nuevo@a.com');
	vm.popupSaved(user({ Id: 3 }));
	expect(vm.list.map(function (u) { return u.Id; })).toEqual([1, 2, 3]);
});

describe('Users: eliminación');

it('el mensaje de confirmación advierte la eliminación', () => {
	expect(setup().vm.deleteConfirmMessage()).toBe('El usuario seleccionado será eliminado');
});

it('onItemDelete elimina al usuario y recarga la lista completa desde el servidor', async () => {
	const { vm } = setup();
	serve({ 'GET /services/admin/DeleteUser': {}, [GET_USERS]: [user({ Id: 2 })] });
	vm.list = [user({ Id: 1 }), user({ Id: 2 })];
	vm.onItemDelete(user({ Id: 1 }));
	await settle();
	expect(axios.calls.map(function (c) { return c.url; })).toEqual([
		'http://server.test/services/admin/DeleteUser',
		'http://server.test/services/admin/GetUsers',
	]);
	expect(axios.calls[0].config.params).toEqual({ u: 1 });
	expect(vm.list.map(function (u) { return u.Id; })).toEqual([2]);
});
