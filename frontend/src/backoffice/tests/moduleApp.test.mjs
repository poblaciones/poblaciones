import { describe, it, expect } from './_harness.mjs';
import Cookies from './_stubs/js-cookie.mjs';
import app from '@/backoffice/classes/moduleApp';

function makeState() {
	return { sidebar: { opened: true, withoutAnimation: true }, device: 'desktop' };
}

describe('moduleApp: estado inicial');

it('arranca con la barra lateral abierta, con animación y en modo escritorio', () => {
	expect(app.state.sidebar).toEqual({ opened: true, withoutAnimation: false });
	expect(app.state.device).toBe('desktop');
});

describe('moduleApp: mutaciones');

it('TOGGLE_SIDEBAR invierte el estado, restablece la animación y guarda la cookie del estado previo', () => {
	Cookies.reset();
	const state = makeState();
	app.mutations.TOGGLE_SIDEBAR(state);
	expect(state.sidebar).toEqual({ opened: false, withoutAnimation: false });
	app.mutations.TOGGLE_SIDEBAR(state);
	expect(state.sidebar.opened).toBeTruthy();
	expect(Cookies.written).toEqual([
		{ name: 'sidebarStatus', value: 1 },
		{ name: 'sidebarStatus', value: 0 },
	]);
});

it('CLOSE_SIDEBAR cierra la barra, conserva el indicador de animación recibido y guarda la cookie', () => {
	Cookies.reset();
	const state = makeState();
	app.mutations.CLOSE_SIDEBAR(state, true);
	expect(state.sidebar).toEqual({ opened: false, withoutAnimation: true });
	expect(Cookies.written).toEqual([{ name: 'sidebarStatus', value: 1 }]);
});

it('TOGGLE_DEVICE reemplaza el dispositivo', () => {
	const state = makeState();
	app.mutations.TOGGLE_DEVICE(state, 'mobile');
	expect(state.device).toBe('mobile');
});

describe('moduleApp: acciones');

it('cada acción confirma la mutación correspondiente con sus argumentos', () => {
	const commits = [];
	const commit = function (name, payload) {
		commits.push({ name: name, payload: payload });
	};
	app.actions.ToggleSideBar({ commit: commit });
	app.actions.CloseSideBar({ commit: commit }, { withoutAnimation: true });
	app.actions.ToggleDevice({ commit: commit }, 'mobile');
	expect(commits).toEqual([
		{ name: 'TOGGLE_SIDEBAR', payload: undefined },
		{ name: 'CLOSE_SIDEBAR', payload: true },
		{ name: 'TOGGLE_DEVICE', payload: 'mobile' },
	]);
});
