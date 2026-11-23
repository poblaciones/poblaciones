import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import Toolbar from '@/map/components/widgets/summary/toolbar.vue';
import AnnotationsLogin from '@/map/components/popups/annotationsLogin.vue';
import authentication from '@/common/js/authentication';

function mount(options) {
	setupWindow();
	const modes = [];
	window.SegMap.SetSelectionMode = function (mode) { modes.push(mode); };
	const popups = { shown: 0 };
	window.Popups = { AnnotationsLogin: { show() { popups.shown++; } } };
	const toolbarStates = { history: { CanUndo: false, CanRedo: false, UndoLabel: 'Deshacer', RedoLabel: 'Rehacer' }, selectionMode: options.selectionMode || 'PAN' };
	const panel = mountLite(Toolbar, {
		props: {
			toolbarStates: toolbarStates,
			config: { UseAnnotations: true },
			user: { Logged: options.logged },
			work: { Current: null },
			frame: { Zoom: 12 },
			metrics: []
		}
	});
	return { panel: panel, modes: modes, popups: popups };
}

describe('toolbar: menú «Anotaciones»');

it('ofrece punto, línea, polígono y comentario, sin la opción pregunta', () => {
	const ctx = mount({ logged: true });
	const items = ctx.panel.annotationItems;
	expect(items.map(function (item) { return item.label; })).toEqual(['Punto', 'Línea', 'Polígono', 'Comentario']);
	expect(items.map(function (item) { return item.key; })).toEqual(['MARKER', 'LINE', 'POLYGON', 'COMMENT']);
	expect(items.every(function (item) { return !!item.icon; })).toBeTruthy();
});

it('las herramientas de dibujo ya no están entre los botones sueltos: queda solo la selección de zona', () => {
	const ctx = mount({ logged: true });
	expect(ctx.panel.selectionModes.map(function (mode) { return mode.Action; })).toEqual(['BUFFER']);
});

it('con una sesión iniciada, elegir una herramienta activa el modo de dibujo', () => {
	const ctx = mount({ logged: true });
	ctx.panel.annotationSelected({ key: 'POLYGON' });
	expect(ctx.modes).toEqual(['POLYGON']);
	expect(ctx.popups.shown).toBe(0);
});

it('sin sesión, elegir una herramienta abre el aviso de inicio de sesión y no activa el dibujo', () => {
	const ctx = mount({ logged: false });
	ctx.panel.annotationSelected({ key: 'MARKER' });
	expect(ctx.popups.shown).toBe(1);
	expect(ctx.modes).toEqual([]);
});

it('con una herramienta activa, el menú ofrece dejar de anotar y el botón figura seleccionado', () => {
	const idle = mount({ logged: true });
	expect(idle.panel.isAnnotationModeActive).toBe(false);
	expect(idle.panel.annotationItems).toHaveLength(4);
	const drawing = mount({ logged: true, selectionMode: 'LINE' });
	expect(drawing.panel.isAnnotationModeActive).toBe(true);
	const last = drawing.panel.annotationItems[drawing.panel.annotationItems.length - 1];
	expect(last.key).toBe('PAN');
	expect(last.label).toBe('Dejar de anotar');
});

describe('annotationsLogin: aviso de inicio de sesión');

it('ingresar y registrarse llevan a la autenticación; cancelar cierra el aviso', () => {
	setupWindow();
	const calls = [];
	authentication.redirectLogin = function () { calls.push('login'); };
	authentication.redirectRegister = function () { calls.push('register'); };
	const popup = mountLite(AnnotationsLogin, {});
	popup.$refs = { dialog: { show() { calls.push('show'); }, close() { calls.push('close'); } } };
	popup.show();
	popup.login();
	popup.register();
	popup.close();
	expect(calls).toEqual(['show', 'login', 'register', 'close']);
});
