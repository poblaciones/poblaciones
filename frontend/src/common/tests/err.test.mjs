import { describe, it, expect } from './_harness.mjs';
import { setupBrowser, captureConsole } from './fixtures.mjs';
import err from '@/common/framework/err';

const SUPPORT_TEXT = '\n\nSi el problema persiste, póngase en contacto con soporte para que podamos solucionar el inconveniente.';

function setupWithContext() {
	const browser = setupBrowser();
	browser.window.Context = { ErrorSignaled: { value: 0 } };
	return browser;
}

function dialogMessage(error, text) {
	const browser = setupWithContext();
	captureConsole(function () {
		err.errDialog('metodo', text, error);
	});
	return browser.alerts[0];
}

describe('err.err: registro de errores sin diálogo');

it('incrementa el contador de errores de Context y registra el error recibido', () => {
	const browser = setupWithContext();
	const logged = captureConsole(function () {
		err.err('metodo', { message: 'boom' });
	});
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
	expect(logged.errors).toHaveLength(1);
});

it('sin objeto de error registra el nombre del método', () => {
	setupWithContext();
	const logged = captureConsole(function () {
		err.err('metodo');
	});
	expect(logged.errors[0]).toEqual(['Error', 'metodo']);
});

it('un error cancelado o sin mensaje cuenta pero no se registra', () => {
	const browser = setupWithContext();
	const logged = captureConsole(function () {
		err.err('metodo', { message: 'cancelled' });
		err.err('metodo', {});
	});
	expect(browser.window.Context.ErrorSignaled.value).toBe(2);
	expect(logged.errors).toHaveLength(0);
});

it('sin window.Context no falla', () => {
	setupBrowser();
	const logged = captureConsole(function () {
		err.err('metodo', { message: 'boom' });
	});
	expect(logged.errors).toHaveLength(1);
});

describe('err.errMessage y err.HandleError');

it('errMessage registra solo mensajes reales (ni vacíos ni "cancelled")', () => {
	const logged = captureConsole(function () {
		err.errMessage('metodo', 'hola');
		err.errMessage('metodo', 'cancelled');
		err.errMessage('metodo', '');
	});
	expect(logged.logs).toHaveLength(1);
	expect(logged.logs[0]).toEqual(['Error', 'metodo', 'hola']);
});

it('HandleError registra la excepción y devuelve false', () => {
	let result = null;
	const logged = captureConsole(function () {
		result = err.HandleError(new Error('x'));
	});
	expect(result).toBeFalsy();
	expect(logged.errors).toHaveLength(1);
});

describe('err.errDialog: mensajes según el estado HTTP');

it('403 avisa que la sesión caducó y redirige al ingreso, sin registrar ni contar el error', () => {
	const browser = setupWithContext();
	const logged = captureConsole(function () {
		err.errDialog('metodo', 'cargar', { response: { status: 403 }, message: 'x' });
	});
	expect(browser.alerts).toEqual(['La sesión ya no se encuentra activa. Deberá volver a identificarse para poder continuar.']);
	expect(browser.document.location.startsWith('https://main.example.org/cr#')).toBeTruthy();
	expect(browser.window.Context.ErrorSignaled.value).toBe(0);
	expect(logged.errors).toHaveLength(0);
});

it('un error cancelado no muestra diálogo ni cuenta como error', () => {
	const browser = setupWithContext();
	captureConsole(function () {
		err.errDialog('metodo', 'cargar', { message: 'cancelled' });
	});
	expect(browser.alerts).toHaveLength(0);
	expect(browser.window.Context.ErrorSignaled.value).toBe(0);
});

it('sin conexión muestra solo el aviso de conexión y cuenta el error', () => {
	const browser = setupWithContext();
	captureConsole(function () {
		err.errDialog('metodo', 'cargar', { message: 'Netproject Error' });
	});
	expect(browser.alerts).toEqual(['No hay una conexión disponible para completar la solicitud.\n\nVerifique su acceso a internet e intente nuevamente.']);
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});

it('500 usa "No ha sido posible" más el intento, terminado en punto', () => {
	const message = dialogMessage({ message: 'Request failed with status code 500' }, 'cargar los datos');
	expect(message).toBe('No ha sido posible cargar los datos.' + SUPPORT_TEXT);
});

it('501, 502 y 503 indican que el servidor no está disponible', () => {
	const expected = 'El servidor no se encuentra disponible. En consecuencia, no fue posible cargar.' + SUPPORT_TEXT;
	expect(dialogMessage({ message: 'Request failed with status code 501' }, 'cargar')).toBe(expected);
	expect(dialogMessage({ message: 'Request failed with status code 502' }, 'cargar')).toBe(expected);
	expect(dialogMessage({ message: 'Request failed with status code 503' }, 'cargar')).toBe(expected);
});

it('401 indica falta de permisos', () => {
	const message = dialogMessage({ message: 'Request failed with status code 401' }, 'editar');
	expect(message).toBe('El usuario actual no posee los permisos suficientes para editar.' + SUPPORT_TEXT);
});

it('404 indica que el sitio está en mantenimiento', () => {
	const message = dialogMessage({ message: 'Request failed with status code 404' }, 'editar');
	expect(message.startsWith('Mientras realizamos tareas de mantenimiento')).toBeTruthy();
	expect(message.endsWith('más tarde para editar.' + SUPPORT_TEXT)).toBeTruthy();
});

it('405 indica un método HTTP no aceptado', () => {
	const message = dialogMessage({ message: 'Request failed with status code 405' }, 'editar');
	expect(message).toBe('Se ha utilizado un método HTTP (post, get, etc) no aceptado por el servidor al editar.' + SUPPORT_TEXT);
});

it('cualquier otro mensaje, o ninguno, usa "No fue posible"', () => {
	expect(dialogMessage({ message: 'boom' }, 'editar')).toBe('No fue posible editar.' + SUPPORT_TEXT);
	expect(dialogMessage({}, 'editar')).toBe('No fue posible editar.' + SUPPORT_TEXT);
});

describe('err.errDialog: detalle que envía el servidor');

it('agrega el texto de una excepción pública ([PE-E]:), con el primer salto de línea como <br>', () => {
	const message = dialogMessage({ message: 'x', response: { data: '  [PE-E]:Nombre repetido\nlinea2 ' } }, 'guardar');
	expect(message).toBe('No fue posible guardar. Nombre repetido<br>linea2.' + SUPPORT_TEXT);
});

it('no duplica el punto final del detalle', () => {
	const message = dialogMessage({ message: 'x', response: { data: '[PE-E]:Listo.' } }, 'guardar');
	expect(message).toBe('No fue posible guardar. Listo.' + SUPPORT_TEXT);
});

it('extrae el mensaje de la página de excepción de desarrollo', () => {
	const html = '<abbr title="minga\\frameproject\\PublicException">E</abbr><p class="message">Falta el dato</p>';
	const message = dialogMessage({ message: 'x', response: { data: html } }, 'guardar');
	expect(message).toBe('No fue posible guardar. Falta el dato.' + SUPPORT_TEXT);
});

it('el header error-header con [PD-E]: agrega el detalle de depuración', () => {
	const headers = { 'error-header': encodeURIComponent('[PD-E]:detalle debug') };
	const message = dialogMessage({ message: 'x', response: { data: 'cuerpo', headers: headers } }, 'guardar');
	expect(message).toBe('No fue posible guardar. [DEBUG] detalle debug.' + SUPPORT_TEXT);
});

it('un cuerpo de respuesta sin marcas conocidas no agrega detalle', () => {
	const message = dialogMessage({ message: 'x', response: { data: 'texto plano' } }, 'guardar');
	expect(message).toBe('No fue posible guardar.' + SUPPORT_TEXT);
});

it('el error se registra y se cuenta una vez por cada diálogo mostrado', () => {
	const browser = setupWithContext();
	const logged = captureConsole(function () {
		err.errDialog('metodo', 'cargar', { message: 'boom' });
	});
	expect(logged.errors).toHaveLength(1);
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});

it('sin objeto de error registra y luego lanza TypeError (comportamiento actual)', () => {
	setupWithContext();
	let thrown = null;
	captureConsole(function () {
		try {
			err.errDialog('metodo', 'cargar');
		} catch (e) {
			thrown = e;
		}
	});
	expect(thrown instanceof TypeError).toBeTruthy();
});
