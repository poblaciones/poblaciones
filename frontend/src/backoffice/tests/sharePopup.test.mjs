import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import SharePopup from '@/backoffice/views/Permissions/SharePopup.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup(propertyOverrides) {
	const browser = setupBackoffice('P');
	browser.window.location = { protocol: 'https:', hostname: 'poblaciones.org', port: '' };
	browser.window.Context.Configuration = { ShortUrlPattern: 'https://poblaciones.org/m/{id}' };
	const work = {
		properties: Object.assign({
			IsPrivate: false, AccessLink: null, LastAccessLink: null, Metadata: { Url: '/map/abc', LastOnline: null },
		}, propertyOverrides),
		Permissions: [],
		visibilityCalls: 0,
		visibilityResult: { link: 'nuevo-enlace' },
		AddPermission() {},
		DeletePermission() {},
		UpdateVisibility() {},
		IsLastAdministrator(item) { return item.Permission === 'A' && this.onlyAdmin === true; },
		ThisWorkLabel() { return 'esta cartografía'; },
	};
	browser.window.Context.CurrentWork = work;
	const invoker = {
		saved: [],
		confirmDos: [],
		saveResult: null,
		doSave(...args) {
			this.saved.push(args);
			if (this.saveResult === null) {
				return Promise.resolve(work.visibilityResult);
			}
			return this.saveResult;
		},
		confirmDo(...args) { this.confirmDos.push(args); },
	};
	const focused = [];
	const vm = mountLite(SharePopup, { mocks: { $refs: { invoker: invoker, usuario: { $el: { focus() { focused.push(1); } } } } } });
	globalThis.confirm = function () { return browser.confirmAnswer; };
	browser.confirmAnswer = true;
	return { vm: vm, work: work, invoker: invoker, browser: browser, focused: focused };
}

describe('SharePopup: direcciones');

it('accessLinkUrl usa el enlace de acceso, el último enlace usado o avisa que se puede generar uno', () => {
	const { vm, work } = setup();
	expect(vm.accessLinkUrl).toBe('Seleccione para tener una dirección de acceso privada.');
	work.properties.LastAccessLink = 'anterior';
	expect(vm.accessLinkUrl).toBe('https://poblaciones.org/map/abc/anterior');
	work.properties.AccessLink = 'vigente';
	expect(vm.accessLinkUrl).toBe('https://poblaciones.org/map/abc/vigente');
});

it('antes de publicarse no hay dirección disponible', () => {
	const { vm, work } = setup();
	work.properties.Metadata.Url = null;
	expect(vm.accessLinkUrl).toBe('(disponible al publicarse)');
	expect(vm.stableUrlHref).toBe('(disponible al publicarse)');
	expect(vm.generalLink).toBe('');
});

it('stableUrlHref arma la dirección corta, como enlace solo si ya está en línea', () => {
	const { vm, work } = setup();
	expect(vm.stableUrlHref).toBe('https://poblaciones.org/m/abc');
	work.properties.Metadata.LastOnline = '2024-01-01';
	expect(vm.stableUrlHref).toBe("<a href='https://poblaciones.org/m/abc' target='_blank'>https://poblaciones.org/m/abc</a>");
});

it('accessLinkUrlHref muestra el enlace privado como vínculo si está en línea y el texto del aviso si no hay enlace', () => {
	const { vm, work } = setup();
	expect(vm.accessLinkUrlHref).toBe('Seleccione para tener una dirección de acceso privada.');
	work.properties.AccessLink = 'vigente';
	expect(vm.accessLinkUrlHref).toBe('https://poblaciones.org/map/abc/vigente');
	work.properties.Metadata.LastOnline = '2024-01-01';
	expect(vm.accessLinkUrlHref.startsWith("<a href='https://poblaciones.org/map/abc/vigente'")).toBe(true);
});

it('generalLink usa el enlace privado en el modo 2 y la dirección corta en el resto', () => {
	const { vm, work } = setup({ AccessLink: 'vigente' });
	vm.visibilityMode = 2;
	expect(vm.generalLink).toBe('https://poblaciones.org/map/abc/vigente');
	vm.visibilityMode = 1;
	expect(vm.generalLink).toBe('https://poblaciones.org/m/abc');
	work.properties.AccessLink = null;
	vm.visibilityMode = 2;
	expect(vm.generalLink).toBe('https://poblaciones.org/m/abc');
});

describe('SharePopup: presentación');

it('initials toma las iniciales del nombre y apellido, o del email, o un signo de pregunta', () => {
	const { vm } = setup();
	expect(vm.initials({ Firstname: 'ana', Lastname: 'pérez', Email: 'a@x.org' })).toBe('AP');
	expect(vm.initials({ Firstname: '', Lastname: '', Email: 'beto@x.org' })).toBe('B');
	expect(vm.initials({ Firstname: '  luis ', Lastname: null, Email: 'l@x.org' })).toBe('L');
	expect(vm.initials({ Firstname: '', Lastname: '', Email: '' })).toBe('?');
});

it('formatUser muestra nombre y email, o solo el email si no hay nombre', () => {
	const { vm } = setup();
	expect(vm.formatUser({ Firstname: 'Ana', Lastname: 'Pérez', Email: 'a@x.org' })).toBe('Ana Pérez (a@x.org)');
	expect(vm.formatUser({ Firstname: '', Lastname: '', Email: 'a@x.org' })).toBe('a@x.org');
});

it('formatPermission traduce el nivel de permiso', () => {
	const { vm } = setup();
	expect(vm.formatPermission('V')).toBe('Puede ver');
	expect(vm.formatPermission('E')).toBe('Puede editar');
	expect(vm.formatPermission('A')).toBe('Puede administrar');
	expect(vm.formatPermission('X')).toBe('Indeterminado');
});

describe('SharePopup: apertura y modo de visibilidad');

it('CalculateMode distingue privada (3), con enlace de acceso (2) y pública (1)', () => {
	const { vm, work } = setup();
	vm.CalculateMode();
	expect(vm.visibilityMode).toBe(1);
	work.properties.AccessLink = 'enlace';
	vm.CalculateMode();
	expect(vm.visibilityMode).toBe(2);
	work.properties.IsPrivate = true;
	vm.CalculateMode();
	expect(vm.visibilityMode).toBe(3);
});

it('show reinicia el formulario, calcula el modo, abre el diálogo y enfoca el usuario', async () => {
	const { vm, focused } = setup();
	vm.user = 'x';
	vm.level = 'V';
	vm.sendEmail = false;
	vm.show();
	expect([vm.user, vm.level, vm.sendEmail, vm.open, vm.visibilityMode]).toEqual(['', 'E', true, true, 1]);
	await waitTimers(130);
	expect(focused).toHaveLength(1);
});

it('al cambiar el trabajo recalcula el modo', () => {
	const { vm, work } = setup({ IsPrivate: true });
	SharePopup.watch.Work.call(vm);
	expect(vm.visibilityMode).toBe(3);
	expect(work.properties.IsPrivate).toBe(true);
});

describe('SharePopup: permisos');

it('onAdd ignora un usuario vacío', () => {
	const { vm, invoker } = setup();
	vm.user = '   ';
	vm.onAdd();
	expect(invoker.saved).toHaveLength(0);
});

it('onAdd agrega el permiso y, al terminar, reinicia el formulario', async () => {
	const { vm, invoker, work } = setup();
	vm.user = 'ana@x.org';
	vm.level = 'A';
	vm.sendEmail = false;
	vm.onAdd();
	expect(invoker.saved[0][0] === work).toBeTruthy();
	expect(invoker.saved[0][1] === work.AddPermission).toBeTruthy();
	expect(invoker.saved[0].slice(2)).toEqual(['ana@x.org', 'A', false]);
	await flushPromises();
	expect([vm.user, vm.level]).toEqual(['', 'E']);
});

it('onDelete no permite quitar al último administrador', () => {
	const { vm, invoker, browser, work } = setup();
	work.onlyAdmin = true;
	vm.onDelete({ Permission: 'A' });
	expect(browser.alerts).toEqual(['Debe asignar otro administrador antes de poder remover al último administrador de esta cartografía.']);
	expect(invoker.confirmDos).toHaveLength(0);
});

it('onDelete pide confirmar y quita el permiso', () => {
	const { vm, invoker, work } = setup();
	const item = { Permission: 'E' };
	vm.onDelete(item);
	expect(invoker.message).toBe('Quitando permiso...');
	expect(invoker.confirmDos[0].slice(0, 2)).toEqual(['Quitar permiso', 'El permiso será eliminado']);
	expect(invoker.confirmDos[0][3] === work.DeletePermission).toBeTruthy();
	expect(invoker.confirmDos[0][4] === item).toBeTruthy();
});

describe('SharePopup: enlace de acceso');

it('UpdateLink(false) guarda el enlace vigente como último y lo desactiva', () => {
	const { vm, work, invoker } = setup({ AccessLink: 'vigente' });
	vm.visibilityMode = 1;
	vm.UpdateLink(false);
	expect(work.properties.LastAccessLink).toBe('vigente');
	expect(work.properties.AccessLink).toBeNull();
	expect(invoker.saved[0][1] === work.UpdateVisibility).toBeTruthy();
});

it('UpdateLink(true) recupera el último enlace o pide uno nuevo con ?', () => {
	const { vm, work } = setup({ LastAccessLink: 'anterior' });
	vm.UpdateLink(true);
	expect(work.properties.AccessLink).toBe('anterior');
	expect(work.properties.LastAccessLink).toBeNull();
	work.properties.AccessLink = null;
	vm.UpdateLink(true);
	expect(work.properties.AccessLink).toBe('?');
});

it('doUpdate marca la cartografía como privada solo en el modo 3 y toma el enlace nuevo que devuelve el servidor', async () => {
	const { vm, work } = setup({ AccessLink: '?' });
	vm.visibilityMode = 3;
	vm.doUpdate();
	expect(work.properties.IsPrivate).toBe(true);
	await flushPromises();
	expect(work.properties.AccessLink).toBe('nuevo-enlace');
	work.properties.AccessLink = 'otro';
	vm.visibilityMode = 2;
	vm.doUpdate();
	await flushPromises();
	expect(work.properties.IsPrivate).toBe(false);
	expect(work.properties.AccessLink).toBe('otro');
});

it('setModeInteractive cambia el modo y activa o desactiva el enlace según corresponda', () => {
	const { vm, work } = setup({ LastAccessLink: 'anterior' });
	vm.setModeInteractive(2);
	expect(vm.visibilityMode).toBe(2);
	expect(work.properties.AccessLink).toBe('anterior');
	vm.setModeInteractive(1);
	expect(work.properties.AccessLink).toBeNull();
});

it('RegenLink pide un enlace nuevo solo si el usuario confirma', () => {
	const { vm, work, browser } = setup({ AccessLink: 'viejo', LastAccessLink: 'anterior' });
	browser.confirmAnswer = false;
	vm.RegenLink();
	expect(work.properties.AccessLink).toBe('viejo');
	browser.confirmAnswer = true;
	vm.RegenLink();
	expect(work.properties.AccessLink).toBe('?');
	expect(work.properties.LastAccessLink).toBeNull();
});
